/**
 * Helpers SPL Token para tests: mint USDC-test (6 decimales), ATAs y mintTo.
 * Van por el Connection del surfnet (JSON-RPC real) — mismo path que devnet.
 */
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { GateHarness } from "./surfnet";

export const USDC_DECIMALS = 6;

/** Crea el mint USDC-test con `h.payer` como mint authority. */
export async function createTestUsdc(h: GateHarness): Promise<PublicKey> {
  return createMint(
    h.connection,
    h.payer,
    h.payer.publicKey,
    null,
    USDC_DECIMALS
  );
}

/** ATA (idempotente) de `owner` para `mint`; paga `h.payer`. */
export async function ata(
  h: GateHarness,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const a = await getOrCreateAssociatedTokenAccount(
    h.connection,
    h.payer,
    mint,
    owner
  );
  return a.address;
}

/** Mintea `amount` unidades base a `dest` (ATA). */
export async function mintUsdc(
  h: GateHarness,
  mint: PublicKey,
  dest: PublicKey,
  amount: number | bigint
): Promise<string> {
  return mintTo(
    h.connection,
    h.payer,
    mint,
    dest,
    h.payer,
    BigInt(amount)
  );
}

/** Balance en unidades base (bigint) de un token account. */
export async function tokenBalance(
  h: GateHarness,
  account: PublicKey
): Promise<bigint> {
  const a = await getAccount(h.connection, account);
  return a.amount;
}

/** Keypair fondeado para un rol (agent A/B, service X/Y...). */
export function fundedKeypair(h: GateHarness, sol = 1): Keypair {
  const kp = Keypair.generate();
  h.surfnet.fundSol(
    kp.publicKey.toBase58(),
    sol * 1_000_000_000
  );
  return kp;
}
