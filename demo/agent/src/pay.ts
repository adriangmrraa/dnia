/**
 * S6 — CLI del agente pagador (loop x402 real en devnet):
 *
 *   npx tsx agent/src/pay.ts <serviceUrl> <amountUsdc> [--keypair keys/agent-b.json]
 *
 * Flujo: GET url → 402 requirements → construye ix `pay` desde el IDL →
 * tx firmada por la wallet del agente → GET url con X-Payment:<sig> →
 * imprime la respuesta del servicio (200 + recurso o rechazo).
 *
 * Si el `pay` revierte on-chain (attestation faltante, over-limit, payee
 * no whitelisted, mandato revocado…) el CLI imprime el GateError
 * distinguible y sale con código 1 — nunca reintenta con X-Payment.
 *
 * Flag `--skip-preflight` (beats de revert de la demo — W2): la tx se envía
 * aunque la simulación falle, así el revert queda grabado on-chain como tx
 * fallida con signature real (verificable en explorer). Sin el flag, el
 * revert muere en el preflight client-side y no existe signature.
 *
 * Corre desde demo/ (WSL o Windows); keypairs/.env de la demo (INV-5).
 */
import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as path from "path";
import {
  connection,
  DEMO_DIR,
  keypairFromEnv,
  loadEnv,
  requireEnv,
} from "../../scripts/lib/devnet";
import idlJson from "../../target/idl/agentic_gate.json";
import type { AgenticGate } from "../../target/types/agentic_gate";

const SAS_PROGRAM_ID = new PublicKey(
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
);

interface PaymentRequirements {
  scheme: string;
  payee: string;
  price: number;
  mint: string;
  programId: string;
  invoice: string;
}

function usage(): never {
  console.error(
    "uso: tsx agent/src/pay.ts <serviceUrl> <amountUsdc> [--keypair keys/agent-b.json] [--skip-preflight]"
  );
  process.exit(2);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Nombre del GateError a partir de logs de una tx (meta.logMessages). */
function gateErrorFromLogs(logs: string[]): string | null {
  const hit = logs.join("\n").match(/Error Code: (\w+)/);
  return hit ? hit[1] : null;
}

/** Extrae el nombre de GateError de un revert anchor/web3. */
function gateErrorName(e: any): string {
  const code = e?.error?.errorCode?.code ?? e?.errorCode?.code;
  if (code) return String(code);
  const logs: string[] = e?.logs ?? e?.transactionLogs ?? [];
  const hit = logs.join("\n").match(/Error Code: (\w+)/);
  if (hit) return hit[1];
  const s = JSON.stringify(e);
  const m = s.match(/(Attestation\w+|IssuerNotRecognized|Mandate\w+|PayeeNotWhitelisted|Over\w+|InvalidAmount|Unauthorized|TooManyPayees|\w+Mismatch)/);
  return m ? m[1] : s.slice(0, 300);
}

async function main() {
  loadEnv();
  const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const [url, amountStr] = positional;
  if (!url || !amountStr) usage();

  const keypairArg = arg("--keypair");
  const agent = keypairArg
    ? (() => {
        const p = keypairArg.startsWith("~")
          ? path.join(process.env.HOME ?? "", keypairArg.slice(1))
          : path.join(DEMO_DIR, keypairArg);
        const secret = Uint8Array.from(
          JSON.parse(require("fs").readFileSync(p, "utf8"))
        );
        return anchor.web3.Keypair.fromSecretKey(secret);
      })()
    : keypairFromEnv("AGENT_A_KEYPAIR");

  const conn = connection();
  const owner = new PublicKey(requireEnv("OWNER_WALLET"));
  const programId = new PublicKey(requireEnv("AGENTIC_GATE_PROGRAM_ID"));
  const sasCred = new PublicKey(requireEnv("SAS_CREDENTIAL"));
  const sasSchema = new PublicKey(requireEnv("SAS_SCHEMA"));

  // ── 1. request inicial → 402 con requirements ────────────────────────
  console.log(`→ GET ${url} (agente ${agent.publicKey.toBase58()})`);
  const first = await fetch(url);
  if (first.status !== 402) {
    console.error(`esperaba 402, recibí ${first.status}`);
    process.exit(1);
  }
  const reqs = (await first.json()) as PaymentRequirements;
  console.log(`← 402 requirements: ${JSON.stringify(reqs)}`);

  const amount = new BN(Math.round(parseFloat(amountStr) * 1_000_000));
  const serviceRef = Array.from(Buffer.from(reqs.invoice, "hex"));
  if (serviceRef.length !== 16) {
    console.error(`invoice inválido (no son 16 bytes hex): ${reqs.invoice}`);
    process.exit(1);
  }

  // ── 2. derivar cuentas del pay ────────────────────────────────────────
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(agent), {
    commitment: "confirmed",
  });
  const program = new Program<AgenticGate>(
    { ...idlJson, address: programId.toBase58() } as any,
    provider
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );
  const [mandatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mandate"), owner.toBuffer(), agent.publicKey.toBuffer()],
    programId
  );
  const [attestationPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      sasCred.toBuffer(),
      sasSchema.toBuffer(),
      agent.publicKey.toBuffer(),
    ],
    SAS_PROGRAM_ID
  );
  const mint = new PublicKey(reqs.mint);
  const payee = new PublicKey(reqs.payee);
  const agentAta = await getAssociatedTokenAddress(mint, agent.publicKey);
  const serviceAta = await getAssociatedTokenAddress(mint, payee);

  // ── 3. pay on-chain (atómico — revierte entero si un check falla) ────
  const skipPreflight = process.argv.includes("--skip-preflight");
  const accounts = {
    agent: agent.publicKey,
    config: configPda,
    attestation: attestationPda,
    mandate: mandatePda,
    service: payee,
    agentAta,
    serviceAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  let sig: string;
  if (skipPreflight) {
    // Envío manual con preflight salteado (W2): aunque el gate revierta, la
    // tx aterriza on-chain y queda una signature real de tx fallida —
    // inspeccionable en explorer (err + Error Code en los logs).
    const tx = await program.methods
      .pay(amount, serviceRef as unknown as number[])
      .accountsPartial(accounts)
      .transaction();
    tx.feePayer = agent.publicKey;
    tx.recentBlockhash = (
      await conn.getLatestBlockhash("confirmed")
    ).blockhash;
    const signed = await provider.wallet.signTransaction(tx);
    sig = await conn.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
    });
    // OJO: confirmTransaction RECHAZA con el err crudo cuando la tx aterriza
    // fallida (no siempre — race entre poll y signatureSubscribe). El
    // resultado autoritativo se lee después con getTransaction.
    let confirmErr: any = null;
    try {
      await conn.confirmTransaction(sig, "confirmed");
    } catch (e) {
      confirmErr = e;
    }

    const landed = await conn.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!landed) {
      console.log(
        `✗ pay enviado con skipPreflight pero no confirmó: ${sig}` +
          (confirmErr ? ` — err: ${JSON.stringify(confirmErr)}` : "")
      );
      process.exit(1);
    }
    if (landed?.meta?.err) {
      const name =
        gateErrorFromLogs(landed.meta.logMessages ?? []) ??
        JSON.stringify(landed.meta.err);
      console.log(`✗ pay REVERTIDO on-chain: ${name}`);
      console.log(`  tx fallida ${sig}`);
      console.log(
        `  https://explorer.solana.com/tx/${sig}?cluster=devnet`
      );
      process.exit(1);
    }
  } else {
    try {
      sig = await program.methods
        .pay(amount, serviceRef as unknown as number[])
        .accountsPartial(accounts)
        .rpc();
    } catch (e: any) {
      // Revert detectado en simulación (preflight): la tx NO queda on-chain.
      console.log(
        `✗ pay REVERTIDO en simulación (preflight): ${gateErrorName(e)} — ` +
          `sin signature (la tx no aterrizó on-chain)`
      );
      process.exit(1);
    }
  }
  console.log(`✓ pay confirmado: ${sig}`);
  console.log(`  https://explorer.solana.com/tx/${sig}?cluster=devnet`);

  // ── 4. retry con evidencia → recurso ─────────────────────────────────
  const second = await fetch(url, { headers: { "X-Payment": sig } });
  const body = await second.text();
  console.log(`← ${second.status} ${body}`);
  process.exit(second.status === 200 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
