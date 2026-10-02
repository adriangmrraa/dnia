/**
 * S6 — Mock issuer (R-07): emite y revoca attestations SAS "human-verified"
 * sobre wallets de agentes, en devnet REAL. La attestation que crea es la
 * misma que el programa gate lee en `pay` — no hay bypass.
 *
 *   POST /attest  {wallet, level?, expiry?}  → crea attestation (idempotente)
 *   POST /revoke  {wallet}                    → CloseAttestation (borra cuenta)
 *   GET  /status/:wallet                      → vigente/expirada/revocada/nunca
 *
 * Corre con `npx tsx services/issuer/src/index.ts` desde demo/ (WSL o Windows;
 * los keypairs .env viven en la copia WSL — INV-5).
 */
import express from "express";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Address,
} from "@solana/kit";
import {
  deriveAttestationPda,
  fetchMaybeAttestation,
  fetchSchema,
  deserializeAttestationData,
  deriveEventAuthorityAddress,
  getCloseAttestationInstruction,
  getCreateAttestationInstruction,
  serializeAttestationData,
  type Schema,
} from "sas-lib";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  DEVNET_RPC,
  keypairFromEnv,
  loadEnv,
  requireEnv,
} from "../../../scripts/lib/devnet";
import { sendKitIxs } from "../../../tests/helpers/kit_tx";

const SAS_PROGRAM_ID = "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";

interface IssuerState {
  conn: ReturnType<typeof connection>;
  rpc: ReturnType<typeof createSolanaRpc>;
  payer: ReturnType<typeof keypairFromEnv>;
  payerSigner: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>;
  issuer: ReturnType<typeof keypairFromEnv>;
  issuerSigner: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>;
  credential: PublicKey;
  schema: PublicKey;
  schemaAccount: Schema;
}

async function attestationPdaOf(
  s: IssuerState,
  wallet: PublicKey
): Promise<PublicKey> {
  const [pda] = await deriveAttestationPda({
    credential: s.credential.toBase58() as Address,
    schema: s.schema.toBase58() as Address,
    nonce: wallet.toBase58() as Address,
  });
  return new PublicKey(pda);
}

const explorer = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

async function main() {
  loadEnv();
  const conn = connection();
  const rpc = createSolanaRpc(DEVNET_RPC);
  const payer = keypairFromEnv("OWNER_KEYPAIR");
  const issuer = keypairFromEnv("ISSUER_KEYPAIR");
  const credential = new PublicKey(requireEnv("SAS_CREDENTIAL"));
  const schema = new PublicKey(requireEnv("SAS_SCHEMA"));
  const schemaAccount = (await fetchSchema(rpc, schema.toBase58() as Address))
    .data;

  const s: IssuerState = {
    conn,
    rpc,
    payer,
    payerSigner: await createKeyPairSignerFromBytes(payer.secretKey),
    issuer,
    issuerSigner: await createKeyPairSignerFromBytes(issuer.secretKey),
    credential,
    schema,
    schemaAccount,
  };

  const app = express();
  app.use(express.json());

  /** Estado observable de la attestation de una wallet. */
  async function statusOf(wallet: PublicKey) {
    const pda = await attestationPdaOf(s, wallet);
    const maybe = await fetchMaybeAttestation(rpc, pda.toBase58() as Address);
    // Historial de la PDA distingue "revocada" (existió y se cerró) de
    // "nunca emitida" — la cuenta cerrada no existe pero dejó huella.
    const history = await conn.getSignaturesForAddress(pda, { limit: 5 });
    if (!maybe.exists) {
      return {
        wallet: wallet.toBase58(),
        pda: pda.toBase58(),
        status: history.length > 0 ? "revocada" : "nunca-emitida",
        exists: false,
      };
    }
    const att = maybe.data;
    const decoded = deserializeAttestationData(
      s.schemaAccount,
      att.data as unknown as Uint8Array
    ) as { level?: number; issued_at?: bigint | number };
    const now = Math.floor(Date.now() / 1000);
    const expiry = Number(att.expiry);
    return {
      wallet: wallet.toBase58(),
      pda: pda.toBase58(),
      status: expiry !== 0 && expiry <= now ? "expirada" : "vigente",
      exists: true,
      level: decoded.level,
      issuedAt: Number(decoded.issued_at ?? 0),
      expiry,
      signer: att.signer,
    };
  }

  app.post("/attest", async (req, res) => {
    try {
      const wallet = new PublicKey(String(req.body?.wallet ?? ""));
      const level = Number(req.body?.level ?? 2);
      const expiry = BigInt(req.body?.expiry ?? 0);
      const pda = await attestationPdaOf(s, wallet);

      const maybe = await fetchMaybeAttestation(
        s.rpc,
        pda.toBase58() as Address
      );
      if (maybe.exists) {
        res.json({ existing: true, attestationPda: pda.toBase58() });
        return;
      }

      const data = serializeAttestationData(s.schemaAccount, {
        level,
        issued_at: BigInt(Math.floor(Date.now() / 1000)),
      });
      const signature = await sendKitIxs(
        s.conn,
        s.payer,
        [
          getCreateAttestationInstruction({
            payer: s.payerSigner,
            authority: s.issuerSigner,
            credential: s.credential.toBase58() as Address,
            schema: s.schema.toBase58() as Address,
            attestation: pda.toBase58() as Address,
            nonce: wallet.toBase58() as Address,
            data,
            expiry,
          }),
        ],
        [s.issuer]
      );
      res.json({
        attestationPda: pda.toBase58(),
        signature,
        explorer: explorer(signature),
      });
    } catch (e: any) {
      res.status(400).json({ error: String(e?.message ?? e) });
    }
  });

  app.post("/revoke", async (req, res) => {
    try {
      const wallet = new PublicKey(String(req.body?.wallet ?? ""));
      const pda = await attestationPdaOf(s, wallet);
      const maybe = await fetchMaybeAttestation(
        s.rpc,
        pda.toBase58() as Address
      );
      if (!maybe.exists) {
        res.status(404).json({ error: "attestation inexistente", pda: pda.toBase58() });
        return;
      }
      const eventAuthority = await deriveEventAuthorityAddress();
      const signature = await sendKitIxs(
        s.conn,
        s.payer,
        [
          getCloseAttestationInstruction({
            payer: s.payerSigner,
            authority: s.issuerSigner,
            credential: s.credential.toBase58() as Address,
            attestation: pda.toBase58() as Address,
            eventAuthority,
            attestationProgram: SAS_PROGRAM_ID as Address,
          }),
        ],
        [s.issuer]
      );
      res.json({
        attestationPda: pda.toBase58(),
        signature,
        explorer: explorer(signature),
      });
    } catch (e: any) {
      res.status(400).json({ error: String(e?.message ?? e) });
    }
  });

  app.get("/status/:wallet", async (req, res) => {
    try {
      res.json(await statusOf(new PublicKey(req.params.wallet)));
    } catch (e: any) {
      res.status(400).json({ error: String(e?.message ?? e) });
    }
  });

  const port = Number(process.env.ISSUER_PORT ?? 3401);
  app.listen(port, () => {
    console.log(`issuer mock escuchando en :${port}`);
    console.log(`credential ${s.credential.toBase58()}`);
    console.log(`schema     ${s.schema.toBase58()}`);
    console.log(`authority  ${s.issuer.publicKey.toBase58()}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
