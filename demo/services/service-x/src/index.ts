/**
 * S6 — Servicio gateado estilo-x402 (D3/D7): `GET /api/premium`.
 *
 *   sin X-Payment  → 402 + requirements {scheme, payee, price, mint,
 *                    programId, invoice}  (invoice = 16B hex, single-use)
 *   con X-Payment  → getTransaction(sig) → parsea PaymentReceipt → verifica
 *                    payee/monto/invoice → 200 recurso premium + eco recibo
 *
 * La MISMA imagen sirve para Servicio X e Y: se parametriza con
 * `PAYEE_WALLET` + `PORT` por env (run_beats levanta las dos instancias).
 * El servicio NO confía en claims — verifica la tx confirmada on-chain (D7).
 *
 * Corre con `PAYEE_WALLET=… PORT=3402 npx tsx services/service-x/src/index.ts`
 * desde demo/.
 */
import * as anchor from "@anchor-lang/core";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import express from "express";
import { randomBytes } from "crypto";
import {
  connection,
  loadEnv,
  requireEnv,
  envOr,
} from "../../../scripts/lib/devnet";
import idlJson from "../../../target/idl/agentic_gate.json";

const SCHEME = "agentic-gate";
/** Invoices emitidas y aún no cobradas — binding service_ref ↔ recibo (single-use). */
const pendingInvoices = new Set<string>();

function newInvoice(): string {
  return randomBytes(16).toString("hex"); // 16 bytes = service_ref [u8;16]
}

async function main() {
  loadEnv();
  const conn = connection();
  const programId = new PublicKey(requireEnv("AGENTIC_GATE_PROGRAM_ID"));
  const payee = new PublicKey(requireEnv("PAYEE_WALLET"));
  const price = new BN(envOr("SERVICE_PRICE", "500000"));
  const mint = requireEnv("USDC_MINT");
  const port = Number(process.env.PORT ?? envOr("SERVICE_X_PORT", "3402"));

  const parser = new anchor.EventParser(
    programId,
    new anchor.BorshCoder(idlJson as anchor.Idl)
  );

  const app = express();
  app.use(express.json());

  app.get("/api/premium", async (req, res) => {
    const sig = req.header("X-Payment");

    // ── Paso 1: sin evidencia de pago → 402 + requirements ─────────────
    if (!sig) {
      const invoice = newInvoice();
      pendingInvoices.add(invoice);
      res.status(402).json({
        scheme: SCHEME,
        payee: payee.toBase58(),
        price: price.toNumber(),
        mint,
        programId: programId.toBase58(),
        invoice,
        network: "solana-devnet",
        hint: "pagar via programa agentic_gate y reintentar con X-Payment: <signature>",
      });
      return;
    }

    // ── Paso 2: verificar la tx on-chain (D7) ──────────────────────────
    try {
      const tx = await conn.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx || tx.meta?.err) {
        res.status(402).json({ error: "tx inexistente o revertida", sig });
        return;
      }

      let receipt: any = null;
      for (const ev of parser.parseLogs(tx.meta?.logMessages ?? [])) {
        if (ev.name === "paymentReceipt" || ev.name === "PaymentReceipt") {
          receipt = ev.data;
        }
      }
      if (!receipt) {
        res.status(402).json({ error: "tx sin PaymentReceipt del gate", sig });
        return;
      }

      // EventParser decoda el campo con el nombre IDL: `service_ref` (snake).
      const invoiceHex = Buffer.from(
        (receipt.service_ref ?? receipt.serviceRef) as number[]
      ).toString("hex");
      // W1: el recibo declara el mint del pago — exigir el USDC-test del gate
      // además del constraint on-chain (defensa en profundidad del beat 3).
      const receiptMint = receipt.mint?.toBase58?.() ?? "";
      const valid =
        receipt.payee.toBase58() === payee.toBase58() &&
        receiptMint === mint &&
        (receipt.amount as BN).gte(price) &&
        pendingInvoices.has(invoiceHex);

      if (!valid) {
        res.status(402).json({
          error: "recibo no vinculante (payee/mint/monto/invoice)",
          receipt: {
            payee: receipt.payee.toBase58(),
            mint: receiptMint,
            amount: receipt.amount.toString(),
            service_ref: invoiceHex,
          },
        });
        return;
      }

      // Consumo single-use del invoice (anti-replay básico documentado).
      pendingInvoices.delete(invoiceHex);
      res.status(200).json({
        data: {
          recurso: "premium-api",
          contenido: "datos premium del servicio — pago verificado on-chain",
        },
        receipt: {
          payer: receipt.payer.toBase58(),
          payee: receipt.payee.toBase58(),
          amount: receipt.amount.toString(),
          mint: receiptMint,
          service_ref: invoiceHex,
          mandate: receipt.mandate.toBase58(),
          timestamp: Number(receipt.timestamp),
        },
        tx: sig,
        explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      });
    } catch (e: any) {
      res.status(400).json({ error: String(e?.message ?? e) });
    }
  });

  app.get("/health", (_req, res) =>
    res.json({ ok: true, payee: payee.toBase58(), price: price.toString() })
  );

  app.listen(port, () => {
    console.log(`servicio x402 gateado en :${port}`);
    console.log(`payee     ${payee.toBase58()}`);
    console.log(`price     ${price.toString()} (unidades base USDC)`);
    console.log(`programId ${programId.toBase58()}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
