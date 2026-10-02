/**
 * Helpers SAS (Solana Attestation Service) para tests.
 *
 * sas-lib@1.0.10 construye instrucciones en formato kit (`@solana/kit` v5).
 * En vez de correr el pipeline de envío de kit (rpc + subscriptions), las
 * traducimos a `TransactionInstruction` de web3.js y las enviamos por el
 * Connection del surfnet — un solo stack de firma/envío en todo el repo.
 *
 * Modelo SAS verificado en el paquete:
 * - Credential PDA: seeds ["credential", authority, name] — autoridad del issuer.
 * - Schema PDA: seeds ["schema", credential, name, version] — layout borsh del
 *   payload + fieldNames.
 * - Attestation PDA: seeds ["attestation", credential, schema, nonce]; el nonce
 *   = wallet atestada en nuestro diseño.
 * - Revocación = CloseAttestation: BORRA la cuenta (no hay flag `revoked`).
 *   Attestation inexistente/cerrada ≡ revocada o nunca emitida.
 * - expiry = 0 → sin expiración.
 */
import {
  AccountRole,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Address,
  type Instruction as KitInstruction,
  type TransactionSigner,
} from "@solana/kit";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  deriveAttestationPda,
  deriveCredentialPda,
  deriveEventAuthorityAddress,
  deriveSchemaPda,
  fetchMaybeAttestation,
  fetchSchema,
  getCloseAttestationInstruction,
  getCreateAttestationInstruction,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  serializeAttestationData,
  type Schema,
} from "sas-lib";
import { fundSol, GateHarness } from "./surfnet";

export const SAS_PROGRAM_ID =
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";
export const CREDENTIAL_NAME = "AGENTIC-DNI-MOCK-ISSUER";
export const SCHEMA_NAME = "agentic-dni-human-verified";
export const SCHEMA_VERSION = 1;
/**
 * Schema de la demo (docs/07 §2.3): fields ["level","issued_at"],
 * layout [u8, i64] = compact bytes [0, 8] (SchemaDataType: u8=0, i64=8).
 */
const SCHEMA_LAYOUT = new Uint8Array([0, 8]);
const FIELD_NAMES = ["level", "issued_at"];

export interface SasContext {
  /** Keypair web3 de la autoridad del credential (issuer mock). */
  issuer: Keypair;
  issuerSigner: TransactionSigner;
  payerSigner: TransactionSigner;
  credential: PublicKey;
  schema: PublicKey;
  /** Schema decodificado — necesario para serializar attestation.data. */
  schemaAccount: Schema;
  rpc: ReturnType<typeof createSolanaRpc>;
}

/** kit Instruction → web3 TransactionInstruction (roles bit0=writable bit1=signer). */
export function toWeb3Ix(ix: KitInstruction): TransactionInstruction {
  const writable = (r: number) =>
    r === AccountRole.WRITABLE || r === AccountRole.WRITABLE_SIGNER;
  const signer = (r: number) =>
    r === AccountRole.READONLY_SIGNER || r === AccountRole.WRITABLE_SIGNER;
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys: (ix.accounts ?? []).map((a) => ({
      pubkey: new PublicKey(a.address),
      isSigner: signer(a.role as number),
      isWritable: writable(a.role as number),
    })),
    data: Buffer.from(ix.data ? Array.from(ix.data) : []),
  });
}

/** Firma+envía ixs kit con keypairs web3 (feePayer = primer signer). */
export async function sendKitIxs(
  h: GateHarness,
  ixs: KitInstruction[],
  signers: Keypair[]
): Promise<string> {
  const tx = new Transaction().add(...ixs.map(toWeb3Ix));
  return sendAndConfirmTransaction(h.connection, tx, signers, {
    commitment: "confirmed",
  });
}

/**
 * Bootstrap del issuer mock: credential + schema `agentic-dni-human-verified` v1
 * con un único campo `level: u8`. Retorna el contexto que consume `attest`.
 */
export async function bootstrapSas(h: GateHarness): Promise<SasContext> {
  const rpc = createSolanaRpc(h.surfnet.rpcUrl);
  const payerSigner = await createKeyPairSignerFromBytes(h.payer.secretKey);

  const issuer = Keypair.generate();
  fundSol(h, issuer.publicKey, LAMPORTS_PER_SOL / 10);
  const issuerSigner = await createKeyPairSignerFromBytes(issuer.secretKey);

  const [credentialAddr] = await deriveCredentialPda({
    authority: issuer.publicKey.toBase58() as Address,
    name: CREDENTIAL_NAME,
  });
  const [schemaAddr] = await deriveSchemaPda({
    credential: credentialAddr,
    name: SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });

  // Tx 1: credential (signers autorizados = [issuer]).
  await sendKitIxs(
    h,
    [
      getCreateCredentialInstruction({
        payer: payerSigner,
        credential: credentialAddr,
        authority: issuerSigner,
        name: CREDENTIAL_NAME,
        signers: [issuer.publicKey.toBase58() as Address],
      }),
    ],
    [h.payer, issuer]
  );

  // Tx 2: schema v1 (level:u8).
  await sendKitIxs(
    h,
    [
      getCreateSchemaInstruction({
        payer: payerSigner,
        authority: issuerSigner,
        credential: credentialAddr,
        schema: schemaAddr,
        name: SCHEMA_NAME,
        description: "Human verification level for agentic-dni gate",
        layout: SCHEMA_LAYOUT,
        fieldNames: FIELD_NAMES,
      }),
    ],
    [h.payer, issuer]
  );

  const schemaAccount = (await fetchSchema(rpc, schemaAddr)).data;

  return {
    issuer,
    issuerSigner,
    payerSigner,
    credential: new PublicKey(credentialAddr),
    schema: new PublicKey(schemaAddr),
    schemaAccount,
    rpc,
  };
}

/** PDA de la attestation de `wallet` bajo el issuer del contexto. */
export async function attestationPda(
  ctx: SasContext,
  wallet: PublicKey
): Promise<PublicKey> {
  const [addr] = await deriveAttestationPda({
    credential: ctx.credential.toBase58() as Address,
    schema: ctx.schema.toBase58() as Address,
    nonce: wallet.toBase58() as Address,
  });
  return new PublicKey(addr);
}

/**
 * Emite attestation para `wallet` con `level` y `expiry` (unix ts; 0 = nunca).
 * Devuelve { pda, signature }.
 */
export async function attest(
  h: GateHarness,
  ctx: SasContext,
  wallet: PublicKey,
  level: number,
  expiry: bigint | number
): Promise<{ pda: PublicKey; signature: string }> {
  const pda = await attestationPda(ctx, wallet);
  const issuedAt = BigInt(Math.floor(Date.now() / 1000));
  const data = serializeAttestationData(ctx.schemaAccount, {
    level,
    issued_at: issuedAt,
  });

  const signature = await sendKitIxs(
    h,
    [
      getCreateAttestationInstruction({
        payer: ctx.payerSigner,
        authority: ctx.issuerSigner,
        credential: ctx.credential.toBase58() as Address,
        schema: ctx.schema.toBase58() as Address,
        attestation: pda.toBase58() as Address,
        nonce: wallet.toBase58() as Address,
        data,
        expiry: BigInt(expiry),
      }),
    ],
    [h.payer, ctx.issuer]
  );
  return { pda, signature };
}

/** Revoca = CloseAttestation (la cuenta desaparece). */
export async function revokeAttestation(
  h: GateHarness,
  ctx: SasContext,
  wallet: PublicKey
): Promise<string> {
  const pda = await attestationPda(ctx, wallet);
  const eventAuthority = await deriveEventAuthorityAddress();
  return sendKitIxs(
    h,
    [
      getCloseAttestationInstruction({
        payer: ctx.payerSigner,
        authority: ctx.issuerSigner,
        credential: ctx.credential.toBase58() as Address,
        attestation: pda.toBase58() as Address,
        eventAuthority,
        attestationProgram: SAS_PROGRAM_ID as Address,
      }),
    ],
    [h.payer, ctx.issuer]
  );
}

/** Lee la attestation (null si no existe / fue revocada-cerrada). */
export async function fetchAttestationData(ctx: SasContext, pda: PublicKey) {
  const maybe = await fetchMaybeAttestation(
    ctx.rpc,
    pda.toBase58() as Address
  );
  return maybe.exists ? maybe.data : null;
}
