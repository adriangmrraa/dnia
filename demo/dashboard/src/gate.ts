/**
 * Capa de datos del dashboard — SOLO LECTURA on-chain (devnet).
 * No firma, no escribe, no maneja keypairs (R-08, INV-1/INV-5).
 *
 * Fuentes:
 *  - Mandate PDA: decodificado con el IDL (BorshAccountsCoder).
 *  - Ledger: getSignaturesForAddress(mandatePda) + getTransaction +
 *    EventParser sobre `Program data:` (mismo mecanismo del test-plan).
 *  - Attestation SAS: layout verificado byte a byte contra el binario real
 *    (docs/DECISIONS.md): [0]=disc 2 · [1..33] nonce=wallet · [33..65]
 *    credential · [65..97] schema · [97..101] dataLen u32LE · [101..] data
 *    {level:u8, issued_at:i64} · +32 signer · +8 expiry i64LE · +32 token_acc.
 */
import {
  BorshAccountsCoder,
  BorshCoder,
  EventParser,
  type Idl,
} from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import idl from "../../target/idl/agentic_gate.json";

export const SAS_PROGRAM_ID = new PublicKey(
  "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
);

export interface DemoConfig {
  rpcUrl: string;
  programId: PublicKey;
  owner: PublicKey;
  agents: { label: string; wallet: PublicKey }[];
  sasCredential: PublicKey;
  sasSchema: PublicKey;
  mint: PublicKey;
  serviceX: PublicKey;
  serviceY: PublicKey;
}

function env(k: string, fallback = ""): string {
  return (import.meta as any).env?.[`VITE_${k}`] ?? fallback;
}

export function loadConfig(): DemoConfig {
  const pk = (v: string) => new PublicKey(v);
  return {
    rpcUrl: env("RPC_URL", "https://api.devnet.solana.com"),
    programId: pk(env("PROGRAM_ID")),
    owner: pk(env("OWNER_WALLET")),
    agents: [
      { label: "Agente A", wallet: pk(env("AGENT_A_WALLET")) },
      { label: "Agente B", wallet: pk(env("AGENT_B_WALLET")) },
    ],
    sasCredential: pk(env("SAS_CREDENTIAL")),
    sasSchema: pk(env("SAS_SCHEMA")),
    mint: pk(env("USDC_MINT")),
    serviceX: pk(env("SERVICE_X_WALLET")),
    serviceY: pk(env("SERVICE_Y_WALLET")),
  };
}

export const explorerTx = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddr = (addr: PublicKey | string) =>
  `https://explorer.solana.com/address/${addr.toString()}?cluster=devnet`;

// ── Mandate ────────────────────────────────────────────────────────────

export function mandatePda(
  owner: PublicKey,
  agent: PublicKey,
  programId: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mandate"), owner.toBuffer(), agent.toBuffer()],
    programId
  )[0];
}

export function attestationPda(cfg: DemoConfig, agent: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("attestation"),
      cfg.sasCredential.toBuffer(),
      cfg.sasSchema.toBuffer(),
      agent.toBuffer(),
    ],
    SAS_PROGRAM_ID
  )[0];
}

export interface MandateView {
  pda: PublicKey;
  exists: boolean;
  owner?: string;
  agent?: string;
  maxPerTx?: string;
  dailyCap?: string;
  spentToday?: string;
  dayIndex?: string;
  totalSpent?: string;
  whitelist?: string[];
  expiry?: number;
  revoked?: boolean;
  estado?: "vigente" | "revocado" | "expirado";
}

export async function fetchMandate(
  conn: Connection,
  pda: PublicKey
): Promise<MandateView> {
  const info = await conn.getAccountInfo(pda);
  if (!info) return { pda, exists: false };
  const coder = new BorshAccountsCoder(idl as Idl);
  const m: any = coder.decode("Mandate", info.data);
  // El IDL conserva snake_case; los eventos/account decoders NO renombran a camel.
  const f = (k: string) => m[k] ?? m[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())];
  const usdc = (v: BN) => (Number(v.toString()) / 1_000_000).toFixed(2);
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(f("expiry").toString());
  const revoked = Boolean(f("revoked"));
  const estado = revoked
    ? "revocado"
    : expiry !== 0 && expiry <= now
      ? "expirado"
      : "vigente";
  return {
    pda,
    exists: true,
    owner: m.owner.toBase58(),
    agent: m.agent.toBase58(),
    maxPerTx: usdc(f("max_per_tx")),
    dailyCap: usdc(f("daily_cap")),
    spentToday: usdc(f("spent_today")),
    dayIndex: f("day_index").toString(),
    totalSpent: usdc(f("total_spent")),
    whitelist: f("payee_whitelist").map((p: PublicKey) => p.toBase58()),
    expiry,
    revoked,
    estado,
  };
}

// ── Attestation SAS (layout manual — verificado en DECISIONS.md) ────────

export interface AttestationView {
  pda: PublicKey;
  estado: "vigente" | "expirada" | "revocada" | "nunca-emitida" | "error";
  level?: number;
  issuedAt?: number;
  expiry?: number;
  /** la PDA tuvo historia (existió y fue cerrada) → revocada */
  hadHistory?: boolean;
}

export async function fetchAttestation(
  conn: Connection,
  pda: PublicKey
): Promise<AttestationView> {
  const [info, history] = await Promise.all([
    conn.getAccountInfo(pda),
    conn
      .getSignaturesForAddress(pda, { limit: 5 })
      .catch(() => [] as never[]),
  ]);
  if (!info || info.data.length < 101 || info.data[0] !== 2) {
    return {
      pda,
      estado: history.length > 0 ? "revocada" : "nunca-emitida",
      hadHistory: history.length > 0,
    };
  }
  const data = info.data;
  const dataLen = data.readUInt32LE(97);
  if (dataLen < 1 || data.length < 101 + dataLen + 32 + 8) {
    return { pda, estado: "error", hadHistory: history.length > 0 };
  }
  const level = data[101];
  const issuedAt =
    dataLen >= 9 ? Number(data.readBigInt64LE(102)) : undefined;
  const expiryOff = 101 + dataLen + 32;
  const expiry = Number(data.readBigInt64LE(expiryOff));
  const now = Math.floor(Date.now() / 1000);
  return {
    pda,
    estado: expiry !== 0 && expiry <= now ? "expirada" : "vigente",
    level,
    issuedAt,
    expiry,
    hadHistory: history.length > 0,
  };
}

// ── Ledger de pagos (eventos PaymentReceipt de las txs del mandato) ─────

export interface LedgerRow {
  sig: string;
  slot: number;
  time: number | null;
  kind: "pago" | "otra-ix" | "fallida";
  payer?: string;
  payee?: string;
  amount?: string;
  serviceRef?: string;
  err?: string;
}

export async function fetchLedger(
  conn: Connection,
  mandatePdaAddr: PublicKey,
  programId: PublicKey,
  limit = 20
): Promise<LedgerRow[]> {
  const parser = new EventParser(programId, new BorshCoder(idl as Idl));
  const sigs = await conn.getSignaturesForAddress(mandatePdaAddr, { limit });
  const rows: LedgerRow[] = [];
  for (const s of sigs) {
    const row: LedgerRow = {
      sig: s.signature,
      slot: s.slot,
      time: s.blockTime ?? null,
      kind: "otra-ix",
      err: s.err ? JSON.stringify(s.err).slice(0, 120) : undefined,
    };
    try {
      const tx = await conn.getTransaction(s.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx?.meta?.err) row.kind = "fallida";
      for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
        if (ev.name === "paymentReceipt" || ev.name === "PaymentReceipt") {
          const d: any = ev.data;
          row.kind = "pago";
          row.payer = d.payer.toBase58();
          row.payee = d.payee.toBase58();
          row.amount = (Number(d.amount.toString()) / 1_000_000).toFixed(2);
          const ref = d.service_ref ?? d.serviceRef;
          row.serviceRef = Buffer.from(ref as number[]).toString("hex");
        }
      }
    } catch {
      /* tx no legible — se muestra la firma igual */
    }
    rows.push(row);
  }
  return rows;
}
