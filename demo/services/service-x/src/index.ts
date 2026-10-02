/**
 * S6 — Servicio gateado estilo-x402 (D3/D7): `GET /api/premium`.
 *
 *   sin X-Payment  → 402 + requirements {scheme, payee, price, mint,
 *                    programId, invoice}  (invoice = 16B hex, single-use)
 *   con X-Payment  → getTransaction(sig) → parsea PaymentReceipt → verifica
 *                    payee/monto/invoice → 200 recurso premium + eco recibo
 *
 * La verificación vive en `services/gate-check.ts` (createGate): es la
 * integración COMPLETA que un servicio adopta — este archivo es solo el
 * express alrededor. La MISMA imagen sirve para Servicio X e Y: se
 * parametriza con `PAYEE_WALLET` + `PORT` por env (run_beats levanta las
 * dos instancias). El servicio NO confía en claims — verifica la tx
 * confirmada on-chain (D7).
 *
 * Corre con `PAYEE_WALLET=… PORT=3402 npx tsx services/service-x/src/index.ts`
 * desde demo/.
 */
import express from "express";
import {
  loadEnv,
  requireEnv,
  envOr,
} from "../../../scripts/lib/devnet";
import { createGate } from "../../gate-check";

async function main() {
  loadEnv();
  const gate = createGate({
    programId: requireEnv("AGENTIC_GATE_PROGRAM_ID"),
    payee: requireEnv("PAYEE_WALLET"),
    price: envOr("SERVICE_PRICE", "500000"),
    mint: requireEnv("USDC_MINT"),
  });
  const port = Number(process.env.PORT ?? envOr("SERVICE_X_PORT", "3402"));

  const app = express();
  app.use(express.json());

  app.get("/api/premium", async (req, res) => {
    const sig = req.header("X-Payment");

    // ── Paso 1: sin evidencia de pago → 402 + requirements ─────────────
    if (!sig) {
      res.status(402).json(gate.requirements());
      return;
    }

    // ── Paso 2: verificar la tx on-chain (D7) ──────────────────────────
    const v = await gate.verify(sig);
    // ojo: el root tsconfig no usa strict → `!v.ok` no narrowea la union;
    // `v.ok === false` sí (narrowing por igualdad literal).
    if (v.ok === false) {
      res
        .status(v.status)
        .json({ error: v.error, sig, ...(v.receipt ? { receipt: v.receipt } : {}) });
      return;
    }

    res.status(200).json({
      data: {
        recurso: "premium-api",
        contenido: "datos premium del servicio — pago verificado on-chain",
      },
      receipt: v.receipt,
      tx: sig,
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  });

  app.get("/health", (_req, res) =>
    res.json({ ok: true, payee: gate.payee, price: gate.price })
  );

  app.listen(port, () => {
    console.log(`servicio x402 gateado en :${port}`);
    console.log(`payee     ${gate.payee}`);
    console.log(`price     ${gate.price} (unidades base USDC)`);
    console.log(`programId ${gate.programId}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
