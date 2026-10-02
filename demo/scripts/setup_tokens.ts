/**
 * S5 — crea el mint USDC-test (6 dec) en devnet, ATAs de los actores y
 * fondeo inicial. Idempotente: reutiliza USDC_MINT del .env si existe.
 *
 * Uso (WSL): npx tsx scripts/setup_tokens.ts
 */
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  keypairFromEnv,
  loadEnv,
  upsertEnv,
} from "./lib/devnet";

async function main() {
  loadEnv();
  const conn = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");
  const agentA = keypairFromEnv("AGENT_A_KEYPAIR");
  const agentB = keypairFromEnv("AGENT_B_KEYPAIR");

  let mint: PublicKey;
  const existing = process.env.USDC_MINT;
  if (existing) {
    mint = new PublicKey(existing);
    console.log(`USDC_MINT existente: ${mint.toBase58()}`);
  } else {
    mint = await createMint(
      conn,
      owner,
      owner.publicKey,
      null,
      6
    );
    upsertEnv("USDC_MINT", mint.toBase58());
  }

  const ata = async (who: PublicKey) =>
    (
      await getOrCreateAssociatedTokenAccount(conn, owner, mint, who)
    ).address;

  const ataA = await ata(agentA.publicKey);
  const ataB = await ata(agentB.publicKey);
  const ataX = await ata(new PublicKey(requireServiceWallet("SERVICE_X_WALLET")));
  const ataY = await ata(new PublicKey(requireServiceWallet("SERVICE_Y_WALLET")));

  // Fondeo: 100 USDC-test a cada agente (sobra para toda la demo).
  for (const [label, dest] of [
    ["agentA", ataA],
    ["agentB", ataB],
  ] as const) {
    const sig = await mintTo(conn, owner, mint, dest, owner, 100_000_000n);
    console.log(`mintTo 100 USDC → ${label} (${sig.slice(0, 20)}…)`);
  }

  console.log(
    JSON.stringify(
      {
        mint: mint.toBase58(),
        ataA: ataA.toBase58(),
        ataB: ataB.toBase58(),
        ataX: ataX.toBase58(),
        ataY: ataY.toBase58(),
      },
      null,
      2
    )
  );
}

function requireServiceWallet(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`falta ${key} en .env (script setup_devnet.sh)`);
  return v;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
