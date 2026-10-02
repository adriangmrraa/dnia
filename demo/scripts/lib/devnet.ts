/**
 * Infra común de scripts devnet: carga .env, keypairs desde demo/keys/,
 * Connection al RPC configurado, airdrop con reintentos y upsert de .env.
 *
 * Todo corre en WSL (`wsl -d Ubuntu -- bash -lc "npx tsx scripts/<x>.ts"`).
 * .env NO se commitea (INV-5); .env.example documenta las claves.
 */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Convención: los scripts corren desde la raíz de demo/ (`npx tsx scripts/x.ts`).
export const DEMO_DIR = process.cwd();
export const KEYS_DIR = path.join(DEMO_DIR, "keys");
export const ENV_PATH = path.join(DEMO_DIR, ".env");

export const DEVNET_RPC =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

/** Carga demo/.env en process.env (sin pisar lo ya seteado). */
export function loadEnv(): void {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

/** Inserta/actualiza KEY=value en demo/.env (append-only, sin tocar otras). */
export function upsertEnv(key: string, value: string): void {
  loadEnv();
  let lines: string[] = [];
  if (fs.existsSync(ENV_PATH)) {
    lines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  }
  const idx = lines.findIndex((l) => l.match(new RegExp(`^\\s*${key}\\s*=`)));
  const entry = `${key}=${value}`;
  if (idx >= 0) lines[idx] = entry;
  else {
    if (lines.length && lines[lines.length - 1].trim() !== "") lines.push("");
    lines.push(entry);
  }
  const out = lines.join("\n");
  // newline final obligatorio — un append posterior (`echo >>`) no debe
  // fusionarse con la última línea (bug observado en S5).
  fs.writeFileSync(ENV_PATH, out.endsWith("\n") ? out : out + "\n");
  process.env[key] = value;
  console.log(`env ${key}=${value}`);
}

export function envOr(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`falta ${key} en .env — correr los scripts de setup`);
  return v;
}

// ── Keypairs ────────────────────────────────────────────────────────────

/** Lee keys/<name>.json; si no existe lo genera (idempotente). */
export function loadOrCreateKeypair(name: string): Keypair {
  const p = path.join(KEYS_DIR, `${name}.json`);
  if (fs.existsSync(p)) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8")))
    );
  }
  const kp = Keypair.generate();
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(Array.from(kp.secretKey)));
  fs.chmodSync(p, 0o600);
  console.log(`keypair creado ${name}: ${kp.publicKey.toBase58()}`);
  return kp;
}

export function keypairFromEnv(name: string): Keypair {
  const rel = requireEnv(name);
  const p = rel.startsWith("~")
    ? path.join(process.env.HOME ?? "", rel.slice(1))
    : path.join(DEMO_DIR, rel);
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8")))
  );
}

// ── RPC / airdrop ───────────────────────────────────────────────────────

export function connection(): Connection {
  return new Connection(DEVNET_RPC, "confirmed");
}

/** Airdrop con reintentos — devnet rate-limita; espera entre intentos. */
export async function airdrop(
  conn: Connection,
  to: PublicKey,
  sol: number,
  tries = 6
): Promise<void> {
  for (let i = 1; i <= tries; i++) {
    try {
      const sig = await conn.requestAirdrop(
        to,
        Math.round(sol * 1_000_000_000)
      );
      await conn.confirmTransaction(sig, "confirmed");
      console.log(`airdrop ${sol} SOL → ${to.toBase58()} (${sig.slice(0, 20)}…)`);
      return;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      console.warn(
        `airdrop intento ${i}/${tries} falló: ${msg.slice(0, 120)}`
      );
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, 5_000 * i));
    }
  }
}

/** Mínimo de SOL para fees; saltea si ya alcanza (idempotencia). */
export async function ensureSol(
  conn: Connection,
  to: PublicKey,
  minSol: number
): Promise<void> {
  const bal = await conn.getBalance(to);
  if (bal >= minSol * 1_000_000_000) {
    console.log(
      `${to.toBase58().slice(0, 8)}… ya tiene ${(bal / 1e9).toFixed(3)} SOL — skip`
    );
    return;
  }
  await airdrop(conn, to, minSol);
}

export const sleep = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));
