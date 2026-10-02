/**
 * gate-check — TODA la integración que un servicio necesita para cobrar
 * a través del programa `agentic_gate` (flujo x402-shaped):
 *
 *   import { createGate } from "../gate-check";
 *
 *   const gate = createGate({ programId, payee, price, mint });
 *
 *   app.get("/recurso", async (req, res) => {
 *     const sig = req.header("X-Payment");
 *     if (!sig) return res.status(402).json(gate.requirements());
 *     const v = await gate.verify(sig);
 *     if (!v.ok) return res.status(v.status).json({ error: v.error });
 *     return res.json({ data: MI_RECURSO, receipt: v.receipt });
 *   });
 *
 * Sin cuenta, sin API key, sin registro, sin permiso: el servicio declara
 * su wallet payee y el programId del gate — la chain es la API. El
 * servicio NO confía en claims (D7): lee la tx confirmada y exige que el
 * recibo `PaymentReceipt` vincule payee + mint + monto + invoice.
 *
 * `createGate` es deliberadamente chico para que la demo pueda mostrarlo
 * entero en el dashboard (tab Adopción) — es el archivo que un adoptante
 * real copiaría a su repo (en producción sería un paquete SDK publicado).
 */
import * as anchor from "@anchor-lang/core";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { randomBytes } from "crypto";
import idlJson from "../target/idl/agentic_gate.json";

const SCHEME = "agentic-gate";

export interface GateOptions {
  /** Program id del gate desplegado (devnet: D8pcKtez…). */
  programId: string;
  /** Wallet payee del servicio — adonde llegan los pagos. */
  payee: string;
  /** Precio en unidades base del mint (USDC 6dec: "500000" = $0.50). */
  price: string;
  /** Mint exigido en el recibo (defensa en profundidad — W1). */
  mint: string;
  /** RPC a usar para verificar txs; default: devnet público. */
  rpcUrl?: string;
}

export interface GateReceipt {
  payer: string;
  payee: string;
  amount: string;
  mint: string;
  service_ref: string;
  mandate: string;
  timestamp: number;
}

export type VerifyResult =
  | { ok: true; receipt: GateReceipt }
  | {
      ok: false;
      /** HTTP sugerido: 402 (falta/falla de pago) o 400 (request ilegible). */
      status: number;
      error: string;
      /** Recibo decodificado cuando el rechazo es por no-vinculante. */
      receipt?: Partial<GateReceipt>;
    };

export interface Gate {
  /** Body del 402 inicial: requirements + invoice single-use nuevo. */
  requirements(): Record<string, unknown>;
  /** Verifica la tx `sig` on-chain contra payee/mint/precio/invoice. */
  verify(sig: string): Promise<VerifyResult>;
  payee: string;
  price: string;
  programId: string;
}

export function createGate(opts: GateOptions): Gate {
  const conn = new Connection(
    opts.rpcUrl ?? "https://api.devnet.solana.com",
    "confirmed"
  );
  const programId = new PublicKey(opts.programId);
  const payee = new PublicKey(opts.payee);
  const price = new BN(opts.price);
  const parser = new anchor.EventParser(
    programId,
    new anchor.BorshCoder(idlJson as anchor.Idl)
  );
  /** Invoices emitidos y aún no cobrados — binding service_ref↔recibo. */
  const pendingInvoices = new Set<string>();

  function requirements(): Record<string, unknown> {
    const invoice = randomBytes(16).toString("hex"); // service_ref [u8;16]
    pendingInvoices.add(invoice);
    return {
      scheme: SCHEME,
      payee: payee.toBase58(),
      price: price.toNumber(),
      mint: opts.mint,
      programId: programId.toBase58(),
      invoice,
      network: "solana-devnet",
      hint: "pagar via programa agentic_gate y reintentar con X-Payment: <signature>",
    };
  }

  async function verify(sig: string): Promise<VerifyResult> {
    let tx;
    try {
      tx = await conn.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
    } catch (e: any) {
      return { ok: false, status: 400, error: String(e?.message ?? e) };
    }
    if (!tx || tx.meta?.err) {
      return {
        ok: false,
        status: 402,
        error: "tx inexistente o revertida",
      };
    }

    let receipt: any = null;
    for (const ev of parser.parseLogs(tx.meta?.logMessages ?? [])) {
      if (ev.name === "paymentReceipt" || ev.name === "PaymentReceipt") {
        receipt = ev.data;
      }
    }
    if (!receipt) {
      return {
        ok: false,
        status: 402,
        error: "tx sin PaymentReceipt del gate",
      };
    }

    // EventParser decoda el campo con el nombre IDL: `service_ref` (snake).
    const invoiceHex = Buffer.from(
      (receipt.service_ref ?? receipt.serviceRef) as number[]
    ).toString("hex");
    const receiptMint = receipt.mint?.toBase58?.() ?? "";
    const valid =
      receipt.payee.toBase58() === payee.toBase58() &&
      receiptMint === opts.mint &&
      (receipt.amount as BN).gte(price) &&
      pendingInvoices.has(invoiceHex);

    if (!valid) {
      return {
        ok: false,
        status: 402,
        error: "recibo no vinculante (payee/mint/monto/invoice)",
        receipt: {
          payee: receipt.payee.toBase58(),
          mint: receiptMint,
          amount: receipt.amount.toString(),
          service_ref: invoiceHex,
        },
      };
    }

    // Consumo single-use del invoice (anti-replay básico documentado).
    pendingInvoices.delete(invoiceHex);
    return {
      ok: true,
      receipt: {
        payer: receipt.payer.toBase58(),
        payee: receipt.payee.toBase58(),
        amount: receipt.amount.toString(),
        mint: receiptMint,
        service_ref: invoiceHex,
        mandate: receipt.mandate.toBase58(),
        timestamp: Number(receipt.timestamp),
      },
    };
  }

  return {
    requirements,
    verify,
    payee: payee.toBase58(),
    price: price.toString(),
    programId: programId.toBase58(),
  };
}
