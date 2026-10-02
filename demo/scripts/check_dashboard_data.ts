/**
 * check_dashboard_data.ts — verifica que la capa de datos del dashboard
 * (dashboard/src/gate.ts, la MISMA que usa la UI) lee bien devnet:
 * mandato A + attestation A + ledger con el pago S6.
 * Uso: npx tsx scripts/check_dashboard_data.ts
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  attestationPda,
  fetchAttestation,
  fetchLedger,
  fetchMandate,
  mandatePda,
} from "../dashboard/src/gate";
import { loadEnv } from "./lib/devnet";
loadEnv();

async function main() {
  const conn = new Connection(
    process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed"
  );
  const owner = new PublicKey(process.env.OWNER_WALLET!);
  const agentA = new PublicKey(process.env.AGENT_A_WALLET!);
  const programId = new PublicKey(process.env.AGENTIC_GATE_PROGRAM_ID!);
  const cfg = {
    rpcUrl: "",
    programId,
    owner,
    agents: [],
    sasCredential: new PublicKey(process.env.SAS_CREDENTIAL!),
    sasSchema: new PublicKey(process.env.SAS_SCHEMA!),
    mint: new PublicKey(process.env.USDC_MINT!),
    serviceX: new PublicKey(process.env.SERVICE_X_WALLET!),
    serviceY: new PublicKey(process.env.SERVICE_Y_WALLET!),
  };

  const mPda = mandatePda(owner, agentA, programId);
  const aPda = attestationPda(cfg as any, agentA);
  console.log("mandate PDA:", mPda.toBase58());
  console.log("attestation PDA:", aPda.toBase58());

  const m = await fetchMandate(conn, mPda);
  console.log("\n[1] Mandato A:", JSON.stringify(m, null, 2));

  const a = await fetchAttestation(conn, aPda);
  console.log("\n[2] Attestation A:", JSON.stringify(a, null, 2));

  const l = await fetchLedger(conn, mPda, programId);
  console.log(`\n[3] Ledger (${l.length} txs):`);
  for (const r of l)
    console.log(
      `    ${r.kind} ${r.sig.slice(0, 20)}… amount=${r.amount ?? "-"} ref=${r.serviceRef ?? "-"}`
    );

  const payment = l.find((r) => r.kind === "pago");
  console.log(
    "\n==> pago S6 visible en ledger:",
    payment ? payment.sig : "NO — FALLO"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
