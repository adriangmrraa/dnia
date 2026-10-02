/**
 * S5 — fondeo idempotente de SOL a los actores de la demo (devnet).
 *
 * Lee los keypairs via .env (OWNER/AGENT_A/AGENT_B/ISSUER_KEYPAIR). Las
 * wallets de servicio (SERVICE_X_WALLET/SERVICE_Y_WALLET) no necesitan SOL —
 * solo reciben tokens.
 *
 * Faucet devnet rate-limita agresivamente (429 diario por IP): para issuer y
 * agentes usamos `SystemProgram.transfer` firmada por el OWNER — montos
 * mínimos, determinista, sin depender del faucet. El owner solo intenta
 * airdrop si está por debajo del mínimo para deploy (~1.8 SOL rent + fees).
 *
 * Uso (WSL, desde demo/): npx tsx scripts/fund_actors.ts
 */
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  airdrop,
  connection,
  ensureSol,
  keypairFromEnv,
  loadEnv,
} from "./lib/devnet";

/** SOL mínimo del owner: deploy del programa (~1.75 rent) + PDAs + fees. */
const OWNER_MIN_SOL = 1.8;
/** SOL mínimo del owner que intentamos dejar tras fondear a los demás. */
const OWNER_RESERVE_SOL = 2.0;

/** Transfiere `sol` de owner→to si `to` está por debajo de `minSol`. */
async function fundFromOwner(
  conn: ReturnType<typeof connection>,
  owner: Keypair,
  to: PublicKey,
  minSol: number,
  sendSol: number
): Promise<void> {
  const bal = await conn.getBalance(to);
  if (bal >= minSol * 1_000_000_000) {
    console.log(
      `${to.toBase58().slice(0, 8)}… ya tiene ${(bal / 1e9).toFixed(3)} SOL — skip`
    );
    return;
  }
  const ownerBal = await conn.getBalance(owner.publicKey);
  if (ownerBal < OWNER_RESERVE_SOL * 1_000_000_000) {
    console.warn(
      `owner tiene ${(ownerBal / 1e9).toFixed(3)} SOL < reserva ${OWNER_RESERVE_SOL} — ` +
        `skip fondeo de ${to.toBase58().slice(0, 8)}…`
    );
    return;
  }
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: owner.publicKey,
      toPubkey: to,
      lamports: Math.round(sendSol * 1_000_000_000),
    })
  );
  const sig = await sendAndConfirmTransaction(conn, tx, [owner], {
    commitment: "confirmed",
  });
  console.log(
    `transfer ${sendSol} SOL owner → ${to.toBase58().slice(0, 8)}… (${sig.slice(0, 20)}…)`
  );
}

async function main() {
  loadEnv();
  const conn = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");
  const issuer = keypairFromEnv("ISSUER_KEYPAIR");
  const agentA = keypairFromEnv("AGENT_A_KEYPAIR");
  const agentB = keypairFromEnv("AGENT_B_KEYPAIR");

  // Owner: si no alcanza para deploy+setup, intentar airdrop (puede 429 —
  // en ese caso el error queda claro y hay que fondear por faucet web).
  const ownerBal = await conn.getBalance(owner.publicKey);
  if (ownerBal < OWNER_MIN_SOL * 1_000_000_000) {
    console.warn(
      `owner ${(ownerBal / 1e9).toFixed(3)} SOL < ${OWNER_MIN_SOL} — intentando airdrop`
    );
    await ensureSol(conn, owner.publicKey, OWNER_MIN_SOL + 0.5);
  } else {
    console.log(
      `owner ya tiene ${(ownerBal / 1e9).toFixed(3)} SOL ≥ ${OWNER_MIN_SOL} — skip airdrop`
    );
  }

  // Issuer/agentes: transfer desde owner (sin depender del faucet).
  // Issuer solo firma (el owner es payer en las ixs SAS) → 0.05 sobra.
  // Agentes pagan fee de `pay` → 0.05 ≈ 10k txs.
  await fundFromOwner(conn, owner, issuer.publicKey, 0.05, 0.05);
  await fundFromOwner(conn, owner, agentA.publicKey, 0.05, 0.05);
  await fundFromOwner(conn, owner, agentB.publicKey, 0.05, 0.05);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
