/**
 * S6/S8 — ops del owner sobre el gate en devnet (init/revoke/close/status).
 * El owner humano firma: crea el mandato de un agente, lo revoca (beat 6),
 * lo cierra (reparación), o inspecciona su estado.
 *
 * Uso (desde demo/):
 *   npx tsx scripts/owner.ts init-mandate --agent a --max 5 --cap 10 --payees x
 *   npx tsx scripts/owner.ts revoke --agent a
 *   npx tsx scripts/owner.ts close --agent a
 *   npx tsx scripts/owner.ts status --agent a
 *
 * Aliases: agent a|b|<pubkey>, payees x,y|<pubkeys csv>. Unidades USDC (6dec).
 */
import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import {
  connection,
  envOr,
  keypairFromEnv,
  loadEnv,
  requireEnv,
} from "./lib/devnet";
import idlJson from "../target/idl/agentic_gate.json";
import type { AgenticGate } from "../target/types/agentic_gate";

const SAS_PROGRAM_ID = new PublicKey(
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
);
const usdc = (n: number) => new BN(Math.round(n * 1_000_000));

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function resolveActor(v: string | undefined): PublicKey {
  if (!v) throw new Error("falta --agent");
  // envOr devuelve "" cuando no existe — "" no es nullish, hay que
  // convertirlo a undefined para que el fallback `?? v` use el pubkey literal.
  const alias = envOr(`${v.toUpperCase().replace("-", "_")}_WALLET`) || undefined;
  // a→AGENT_A_WALLET, b→AGENT_B_WALLET, x→X? no — servicios usan SERVICE_X_WALLET
  // (undefined = alias no configurado — ej. z antes de correr adopt_service.ts)
  const aliases: Record<string, string | undefined> = {
    a: envOr("AGENT_A_WALLET"),
    b: envOr("AGENT_B_WALLET"),
    x: envOr("SERVICE_X_WALLET"),
    y: envOr("SERVICE_Y_WALLET"),
    z: envOr("SERVICE_Z_WALLET") || undefined,
    owner: envOr("OWNER_WALLET"),
    issuer: envOr("ISSUER_WALLET"),
  };
  return new PublicKey(aliases[v] ?? alias ?? v);
}

async function main() {
  loadEnv();
  const cmd = process.argv[2];
  const conn = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");
  const programId = new PublicKey(requireEnv("AGENTIC_GATE_PROGRAM_ID"));

  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(owner), {
    commitment: "confirmed",
  });
  const program = new Program<AgenticGate>(
    { ...idlJson, address: programId.toBase58() } as any,
    provider
  );

  const agent = resolveActor(flag("--agent"));
  const [mandatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mandate"), owner.publicKey.toBuffer(), agent.toBuffer()],
    programId
  );

  switch (cmd) {
    case "init-mandate": {
      const max = Number(flag("--max") ?? "5");
      const cap = Number(flag("--cap") ?? "10");
      const payeesArg = (flag("--payees") ?? "x")
        .split(",")
        .map((p) => resolveActor(p.trim()));
      const expiry = new BN(flag("--expiry") ?? "0");

      const sig = await program.methods
        .initMandate(agent, usdc(max), usdc(cap), payeesArg, expiry)
        .accountsPartial({
          mandate: mandatePda,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`mandato creado para ${agent.toBase58()}`);
      console.log(`  pda      ${mandatePda.toBase58()}`);
      console.log(`  policy   max=${max} cap=${cap} payees=[${payeesArg.map((p) => p.toBase58().slice(0, 8) + "…")}] expiry=${expiry.toString()}`);
      console.log(`  tx       ${sig}`);
      console.log(`  explorer https://explorer.solana.com/tx/${sig}?cluster=devnet`);
      break;
    }

    case "revoke": {
      const sig = await program.methods
        .revokeMandate()
        .accountsPartial({ mandate: mandatePda, owner: owner.publicKey })
        .rpc();
      console.log(`mandato REVOCADO (${agent.toBase58().slice(0, 8)}…)`);
      console.log(`  tx       ${sig}`);
      console.log(`  explorer https://explorer.solana.com/tx/${sig}?cluster=devnet`);
      break;
    }

    case "close": {
      const sig = await program.methods
        .closeMandate()
        .accountsPartial({ mandate: mandatePda, owner: owner.publicKey })
        .rpc();
      console.log(`mandato cerrado, rent devuelto (${sig})`);
      break;
    }

    case "status": {
      const m = await program.account.mandate.fetchNullable(mandatePda);
      if (!m) {
        console.log(`mandato ${mandatePda.toBase58()} — inexistente`);
        break;
      }
      const attPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("attestation"),
          new PublicKey(requireEnv("SAS_CREDENTIAL")).toBuffer(),
          new PublicKey(requireEnv("SAS_SCHEMA")).toBuffer(),
          agent.toBuffer(),
        ],
        SAS_PROGRAM_ID
      )[0];
      const att = await conn.getAccountInfo(attPda);
      console.log(`mandato  ${mandatePda.toBase58()}`);
      console.log(`  owner        ${m.owner.toBase58()}`);
      console.log(`  agent        ${m.agent.toBase58()}`);
      console.log(`  max_per_tx   ${m.maxPerTx.toString()}`);
      console.log(`  daily_cap    ${m.dailyCap.toString()}`);
      console.log(`  spent_today  ${m.spentToday.toString()} (day ${m.dayIndex.toString()})`);
      console.log(`  total_spent  ${m.totalSpent.toString()}`);
      console.log(`  whitelist    [${m.payeeWhitelist.map((p) => p.toBase58().slice(0, 8) + "…").join(", ")}]`);
      console.log(`  expiry       ${m.expiry.toString()}`);
      console.log(`  revoked      ${m.revoked}`);
      console.log(`attestation ${attPda.toBase58()} — ${att ? "existe" : "INEXISTENTE"}`);
      break;
    }

    default:
      console.error("uso: owner.ts init-mandate|revoke|close|status --agent <a|b|pubkey>");
      process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
