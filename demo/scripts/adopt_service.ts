/**
 * adopt_service.ts — alta "sin permiso" de un servicio adoptante (default `z`):
 * genera su wallet (`keys/service-<alias>.json`), registra
 * `SERVICE_<ALIAS>_WALLET` en .env y le crea el ATA del mint USDC-test
 * (el owner paga el rent — como pagaría cualquier sponsor en producción).
 *
 * No toca el programa ni el mandato: adoptar el gate no requiere
 * autorización de nadie. Lo que sí requiere autorización es COBRAR a un
 * agente concreto — eso es la whitelist del mandato (owner.ts).
 *
 * Uso (WSL, parado en demo/): npx tsx scripts/adopt_service.ts [alias=z]
 */
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  keypairFromEnv,
  loadEnv,
  loadOrCreateKeypair,
  requireEnv,
  upsertEnv,
} from "./lib/devnet";

async function main() {
  loadEnv();
  const alias = (process.argv[2] ?? "z").toLowerCase().trim();
  if (!/^[a-z][a-z0-9-]*$/.test(alias)) {
    console.error("alias inválido (solo letras/números/guiones): " + alias);
    process.exit(2);
  }
  const envKey = `SERVICE_${alias.toUpperCase().replace("-", "_")}_WALLET`;

  const conn = connection();
  const owner = keypairFromEnv("OWNER_KEYPAIR");
  const mint = new PublicKey(requireEnv("USDC_MINT"));

  // 1. Wallet del servicio (solo necesitamos la pubkey — el servicio
  //    cobra, no firma). Si ya existe, se reutiliza.
  const kp = loadOrCreateKeypair(`service-${alias}`);
  const existing = process.env[envKey];
  if (existing && existing !== kp.publicKey.toBase58()) {
    console.warn(
      `${envKey} ya estaba seteado (${existing}) — se conserva el keypair existente`
    );
  } else {
    upsertEnv(envKey, kp.publicKey.toBase58());
  }
  const wallet = new PublicKey(process.env[envKey]!);

  // 2. ATA USDC-test del servicio — sin ella `pay` no puede depositar.
  const ata = await getOrCreateAssociatedTokenAccount(conn, owner, mint, wallet);

  console.log(`service-${alias} listo para adoptar el gate:`);
  console.log(`  wallet  ${wallet.toBase58()}`);
  console.log(`  ata     ${ata.address.toBase58()}`);
  console.log(
    `  próximo paso (del owner): owner.ts init-mandate --agent a --max 5 --cap 10 --payees x,${alias}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
