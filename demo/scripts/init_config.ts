/**
 * S5 — `initialize_config` del gate en devnet con las direcciones SAS reales
 * y el mint USDC-test (post-verify W1: `usdc_mint` es campo de GateConfig).
 * Idempotente: si GateConfig ya existe con el layout vigente, solo la muestra.
 * Si existe con un layout viejo (no deserializa → ej. pre-`usdc_mint`), la
 * cierra con `close_config` (reparación documentada: config de demo) y la
 * re-inicializa — el PDA `["config"]` se conserva.
 *
 * Lee del .env: AGENTIC_GATE_PROGRAM_ID, SAS_CREDENTIAL, SAS_SCHEMA,
 * USDC_MINT, OWNER_KEYPAIR (admin + payer).
 *
 * Uso (WSL, desde demo/): npx tsx scripts/init_config.ts
 */
import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import * as path from "path";
import {
  connection,
  DEMO_DIR,
  keypairFromEnv,
  loadEnv,
  requireEnv,
} from "./lib/devnet";
import idlJson from "../target/idl/agentic_gate.json";
import type { AgenticGate } from "../target/types/agentic_gate";

async function main() {
  loadEnv();
  const programId = new PublicKey(requireEnv("AGENTIC_GATE_PROGRAM_ID"));
  const conn: Connection = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");

  const provider = new anchor.AnchorProvider(
    conn,
    new anchor.Wallet(owner),
    { commitment: "confirmed" }
  );
  const program = new Program<AgenticGate>(
    { ...idlJson, address: programId.toBase58() } as any,
    provider
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  const existing = await conn.getAccountInfo(configPda);
  if (existing) {
    try {
      const cfg = await program.account.gateConfig.fetch(configPda);
      console.log("GateConfig ya inicializada:", {
        admin: cfg.admin.toBase58(),
        sas_credential: cfg.sasCredential.toBase58(),
        sas_schema: cfg.sasSchema.toBase58(),
        usdc_mint: cfg.usdcMint.toBase58(),
        min_level: cfg.minLevel,
      });
      return;
    } catch {
      // Layout viejo (ej. sin `usdc_mint`): el fetch no deserializa →
      // cerrar la cuenta con `close_config` y re-inicializar abajo.
      console.log(
        "GateConfig con layout viejo — close_config + re-init (reparación demo)"
      );
      const closeSig = await program.methods
        .closeConfig()
        .accountsPartial({ config: configPda, admin: owner.publicKey })
        .rpc();
      console.log(`  GateConfig anterior cerrada (${closeSig})`);
    }
  }

  const cred = new PublicKey(requireEnv("SAS_CREDENTIAL"));
  const schema = new PublicKey(requireEnv("SAS_SCHEMA"));
  const usdcMint = new PublicKey(requireEnv("USDC_MINT"));

  const sig = await program.methods
    .initializeConfig(owner.publicKey, cred, schema, usdcMint, 1)
    .accountsPartial({
      config: configPda,
      payer: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log(`GateConfig inicializada (${sig})`);
  console.log(`  config     ${configPda.toBase58()}`);
  console.log(`  credential ${cred.toBase58()}`);
  console.log(`  schema     ${schema.toBase58()}`);
  console.log(`  usdc_mint  ${usdcMint.toBase58()}`);
  console.log(
    `  explorer   https://explorer.solana.com/tx/${sig}?cluster=devnet`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
