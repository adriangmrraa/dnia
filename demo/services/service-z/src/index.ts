/**
 * service-z — UN SERVICIO NUEVO adoptando el gate en vivo (:3405).
 *
 * Este archivo entero ES el beat de adopción: un servicio que nunca vio
 * este proyecto queda gate-protected agregando el `createGate` + el
 * handler 402/verify de abajo (~10 líneas marcadas). Sin cuenta en la
 * plataforma, sin API key, sin permiso: declara su wallet payee y el
 * programId — la chain es la API.
 *
 * Cobrar a un agente específico sigue siendo decisión del OWNER de ese
 * agente (whitelist del mandato) — adoptar el gate es gratis; que te
 * autorice un pagador es la política, no fricción de onboarding.
 *
 * Corre con `PAYEE_WALLET=… PORT=3405 npx tsx services/service-z/src/index.ts`
 * desde demo/ (ver scripts/demo_adoption.sh).
 */
import express from "express";
import { loadEnv, requireEnv, envOr } from "../../../scripts/lib/devnet";
import { createGate } from "../../gate-check";

async function main() {
  loadEnv();

  // ── INTEGRACIÓN (esto es TODO lo que el adoptante agrega) ────────────
  const gate = createGate({
    programId: requireEnv("AGENTIC_GATE_PROGRAM_ID"),
    payee: requireEnv("PAYEE_WALLET"),
    price: envOr("SERVICE_PRICE", "500000"),
    mint: requireEnv("USDC_MINT"),
  });
  // ────────────────────────────────────────────────────────────────────

  const app = express();
  app.use(express.json());

  app.get("/api/premium", async (req, res) => {
    // ── INTEGRACIÓN: 402 + requirements, o verify(X-Payment) ───────────
    const sig = req.header("X-Payment");
    if (!sig) return res.status(402).json(gate.requirements());
    const v = await gate.verify(sig);
    // (`v.ok === false`: sin strictNullChecks, `!v.ok` no narrowea)
    if (v.ok === false) return res.status(v.status).json({ error: v.error });
    // ──────────────────────────────────────────────────────────────────
    res.json({
      data: {
        recurso: "servicio-z",
        contenido:
          "recurso del adoptante nuevo — pago gateado verificado on-chain",
      },
      receipt: v.receipt,
      tx: sig,
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  });

  app.get("/health", (_req, res) =>
    res.json({ ok: true, payee: gate.payee, price: gate.price })
  );

  const port = Number(process.env.PORT ?? envOr("SERVICE_Z_PORT", "3405"));
  app.listen(port, () => {
    console.log(`service-z (adoptante) en :${port}`);
    console.log(`payee     ${gate.payee}`);
    console.log(`programId ${gate.programId}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
