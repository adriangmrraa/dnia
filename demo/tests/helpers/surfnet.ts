import { Surfnet } from "@solana/surfpool";
import * as anchor from "@anchor-lang/core";
import { Program, Wallet } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as path from "path";
import idlJson from "../../target/idl/agentic_gate.json";
import { AgenticGate } from "../../target/types/agentic_gate";

/**
 * Harness de tests sobre surfpool embebido (npm `@solana/surfpool`).
 *
 * ¿Por qué no solana-test-validator? El entorno es WSL1: su emulación de
 * sockets no soporta SO_REUSEPORT y el gossip del validator muere en
 * `multi_bind` con EADDRINUSE. Surfpool embebido corre LiteSVM en proceso:
 * mismo runtime real de la SVM, JSON-RPC completo (web3.js funciona tal
 * cual), deploy de .so por ruta y cheatcodes deterministas
 * (fundSol/fundToken/timeTravel) que los CAs necesitan.
 * Ver docs/DECISIONS.md — fallback validado por el test-plan.
 */

const DEPLOY_DIR = path.resolve(__dirname, "..", "..", "target", "deploy");

export interface GateHarness {
  surfnet: Surfnet;
  connection: Connection;
  provider: anchor.AnchorProvider;
  program: Program<AgenticGate>;
  /** Wallet del provider (el payer pre-fondeado del surfnet). */
  payer: Keypair;
}

/**
 * Levanta un surfnet aislado, despliega agentic_gate (+ SAS si hay fixture)
 * y devuelve un AnchorProvider apuntando al RPC dinámico.
 */
export async function bootGate(): Promise<GateHarness> {
  const surfnet = Surfnet.start();

  const payer = Keypair.fromSecretKey(Uint8Array.from(surfnet.payerSecretKey));
  const connection = new Connection(surfnet.rpcUrl, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    new Wallet(payer),
    { commitment: "confirmed" }
  );

  const program = new Program<AgenticGate>(idlJson as any, provider);

  surfnet.deploy({
    programId: program.programId.toBase58(),
    soPath: path.join(DEPLOY_DIR, "agentic_gate.so"),
  });

  return { surfnet, connection, provider, program, payer };
}

/** Fondea un Keypair con lamports sin airdrop tx (cheatcode determinista). */
export function fundSol(
  harness: GateHarness,
  key: PublicKey,
  lamports: number
): void {
  harness.surfnet.fundSol(key.toBase58(), lamports);
}

/**
 * Apaga el harness. web3.js abre un websocket interno (signatureSubscribe en
 * confirmTransaction): si no se cierra, queda reintentando contra el surfnet
 * muerto y el proceso de mocha no termina nunca.
 */
export async function stopGate(h: GateHarness): Promise<void> {
  try {
    await (h.connection as any)._rpcWebSocket.close();
  } catch {
    /* ya cerrado / nunca abierto */
  }
  h.surfnet.stop();
}
