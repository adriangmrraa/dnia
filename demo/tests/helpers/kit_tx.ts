/**
 * Puente kit→web3.js: sas-lib@1.0.10 emite instrucciones en formato
 * `@solana/kit` (v5). Las traducimos a `TransactionInstruction` de web3.js y
 * las firmamos/enviamos por un `Connection` cualquiera (surfnet o devnet) —
 * un solo stack de firma/envío en todo el repo.
 *
 * kit AccountRole bits: 0=RO, 1=RW, 2=RO+signer, 3=RW+signer.
 */
import {
  AccountRole,
  type Instruction as KitInstruction,
} from "@solana/kit";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export function toWeb3Ix(ix: KitInstruction): TransactionInstruction {
  const writable = (r: number) =>
    r === AccountRole.WRITABLE || r === AccountRole.WRITABLE_SIGNER;
  const signer = (r: number) =>
    r === AccountRole.READONLY_SIGNER || r === AccountRole.WRITABLE_SIGNER;
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys: (ix.accounts ?? []).map((a) => ({
      pubkey: new PublicKey(a.address),
      isSigner: signer(a.role as number),
      isWritable: writable(a.role as number),
    })),
    data: Buffer.from(ix.data ? Array.from(ix.data) : []),
  });
}

/** Firma+envía ixs kit con keypairs web3 (feePayer = primer signer). */
export async function sendKitIxs(
  connection: Connection,
  payer: Keypair,
  ixs: KitInstruction[],
  signers: Keypair[]
): Promise<string> {
  const tx = new Transaction().add(...ixs.map(toWeb3Ix));
  const unique = [
    payer,
    ...signers.filter(
      (s) => s.publicKey.toBase58() !== payer.publicKey.toBase58()
    ),
  ];
  return sendAndConfirmTransaction(connection, tx, unique, {
    commitment: "confirmed",
  });
}
