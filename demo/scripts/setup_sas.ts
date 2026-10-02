/**
 * S5 — crea credential + schema SAS REALES en devnet para el mock issuer.
 * Idempotente: si el credential ya existe en la PDA derivada, lo reutiliza.
 * Escribe SAS_CREDENTIAL / SAS_SCHEMA en demo/.env.
 *
 * Uso (WSL): npx tsx scripts/setup_sas.ts
 */
import {
  createKeyPairSignerFromBytes,
  type Address,
} from "@solana/kit";
import {
  deriveCredentialPda,
  deriveSchemaPda,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
} from "sas-lib";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  keypairFromEnv,
  loadEnv,
  upsertEnv,
} from "./lib/devnet";
import { sendKitIxs } from "../tests/helpers/kit_tx";

const CREDENTIAL_NAME = "AGENTIC-DNI-MOCK-ISSUER";
const SCHEMA_NAME = "agentic-dni-human-verified";
const SCHEMA_VERSION = 1;
const SCHEMA_LAYOUT = new Uint8Array([0, 8]); // [u8, i64]
const FIELD_NAMES = ["level", "issued_at"];

async function main() {
  loadEnv();
  const conn = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");
  const issuer = keypairFromEnv("ISSUER_KEYPAIR");

  const payerSigner = await createKeyPairSignerFromBytes(owner.secretKey);
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
  const credential = new PublicKey(credentialAddr);
  const schema = new PublicKey(schemaAddr);

  // Idempotencia: skip si las cuentas ya existen.
  const credInfo = await conn.getAccountInfo(credential);
  if (!credInfo) {
    const sig = await sendKitIxs(
      conn,
      owner,
      [
        getCreateCredentialInstruction({
          payer: payerSigner,
          credential: credentialAddr,
          authority: issuerSigner,
          name: CREDENTIAL_NAME,
          signers: [issuer.publicKey.toBase58() as Address],
        }),
      ],
      [issuer]
    );
    console.log(`credential creado (${sig.slice(0, 24)}…)`);
  } else {
    console.log(`credential ya existe: ${credential.toBase58()}`);
  }

  const schemaInfo = await conn.getAccountInfo(schema);
  if (!schemaInfo) {
    const sig = await sendKitIxs(
      conn,
      owner,
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
      [issuer]
    );
    console.log(`schema creado (${sig.slice(0, 24)}…)`);
  } else {
    console.log(`schema ya existe: ${schema.toBase58()}`);
  }

  upsertEnv("SAS_CREDENTIAL", credential.toBase58());
  upsertEnv("SAS_SCHEMA", schema.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
