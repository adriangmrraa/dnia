# agentic-dni — Presentación para jurado / submission

> Documento de presentación. La evidencia operativa completa está en
> `docs/09_DEMO_SUBMISSION.md`; el dossier de investigación en
> `docs/CANDIDATE_O_agentic-dni.md`; el pitch narrativo en §10 de ese archivo.
> Los campos Colosseum (§7) están en inglés porque la submission es en inglés.

## 1. Qué es — en una frase

**Un gate de pagos para agentes de IA donde identidad, autorización y recibo
son exigidos por el programa on-chain — en la misma transacción que mueve la
plata.** No es un registro que alguien consulta: es una cerradura que el
protocolo ejecuta.

Tres primitivas, una instrucción `pay` atómica:

| Primitiva | Pregunta que responde | Implementación |
|---|---|---|
| Identidad | ¿Quién está atrás? | Attestation SAS real: "humano verificado" ligado a la wallet del agente — divulgación selectiva, nunca PII on-chain |
| Mandato | ¿Qué autorizó? | PDA firmado por el dueño: límite por tx, cap diario, payees whitelisted, expiración, revocable |
| Recibo | ¿Qué pasó? | `PaymentReceipt` (7 campos) emitido por el programa en la misma tx |

## 2. Por qué ahora (timing verificable)

- ERC-8004 ("Trustless Agents") deployó mainnet el 29/01/2026 — identidad de
  agente **sin capa humana**. La ventana está abierta.
- Google AP2 definió el modelo (mandates + receipts) **off-chain** — nosotros
  lo implementamos como objetos on-chain exigibles. *"Un JWT no revierte una
  transacción."*
- Regulación ya se redacta (Filipinas HB 11014, Brasil PL 974/2026, US AI
  AGENT Act) — tailwind, no dependencia: el enforcement económico funciona
  hoy porque facilitators/merchants ya tienen el problema de fraude/liability.
- ~25 proyectos Colosseum adyacentes, 0 winners en esta capa. Skyfire hace
  KYA pero cerrado y off-chain: no consumible por programas, muere con la
  empresa. Somos abiertos, issuer-agnósticos, y program-enforceable.

## 3. Qué está listo (devnet, verificable hoy)

- **Programa `agentic_gate`** — `D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2`
  (Anchor 1.2.0, upgradeable). `pay` atómico + `init_mandate`/`revoke_mandate`/
  `close_mandate` + `initialize_config`/`update_config`.
- **Mock issuer** (:3401) — emite/revoca attestations SAS reales vía `sas-lib`
  sobre el programa SAS oficial de devnet.
- **Servicios x402-shaped** (:3402/:3403) — flujo 402 → pay → X-Payment → 200
  con verificación real de la tx (payee/monto/invoice/mint del recibo).
- **Agent CLI** — `agent pay <url> <amount>` con `--skip-preflight` para
  reverts on-chain.
- **Dashboard de audit** (:3404) — read-only, parsea `PaymentReceipt` de los
  logs on-chain + estado del mandato y la attestation. Cero escritura, cero PII.
- **Tests: 21/21** sobre surfpool/LiteSVM con el programa SAS real dumpeado
  de devnet. Verify adversarial independiente: PASS (9/9 sigs confirmadas,
  PDAs decodificados a mano).
- **Las 4 txs fallidas del demo existen en devnet** — `AttestationMissing`,
  `OverPerTxLimit`, `PayeeNotWhitelisted`, `MandateRevoked` verificables en
  explorer (signatures en `docs/09`).

## 4. Cómo se adopta — cero fricción

**Sin cuenta, sin API key, sin permiso — la chain es la API.** Un servicio
se suma declarando su wallet payee y el programId del gate: responde 402
con los requirements, verifica el `PaymentReceipt` on-chain, cobra. Toda
la integración es `createGate({programId, payee, price, mint})` + un
handler de ~10 líneas (`demo/services/gate-check.ts`). El beat en vivo lo
demuestra: `bash scripts/demo_adoption.sh` levanta service-z (:3405), la
chain rebota el primer pago con `PayeeNotWhitelisted`, el owner lo
whitelista y el mismo pago pasa a 200 — adoptar es gratis; que un pagador
te autorice es la política del mandato, no fricción de onboarding. El
dashboard (:3404) tiene una tab "Adopción" con el snippet literal y los
servicios adoptantes respondiendo en vivo. Detalle completo:
`docs/CANDIDATE_O_agentic-dni.md` §12.

## 5. Qué NO está listo (honesto)

- **KYC real**: el issuer es mock — demuestra la capa, no la verificación.
  Producción = integrar un verificador (Persona/Veriff-class, ~$1-2/check).
- **Validación de demanda**: falta hablar con ≥1 facilitator x402
  (PayAI/MCPay/Corbits) — condición abierta del Research Gate.
- **Puente ERC-8004**: fuera del MVP por decisión — narrativa de producción.
- **Recibo como cuenta**: hoy es event-log; cuenta-PDA solo si hay
  composición programa-a-programa (roadmap).
- **Limitación estructural (declarada)**: el gate protege al vendedor que lo
  usa — un agente siempre puede hacer transfers libres por fuera. Lo que el
  gate cobra, el gate lo garantiza.

## 6. Cómo correr la demo (devnet, ~5 min)

Todo en WSL Ubuntu (`wsl -d Ubuntu -- bash -lc`), desde `demo/`:

```bash
bash scripts/start_services.sh        # issuer :3401 · service-x :3402 · service-y :3403
bash scripts/sync_dashboard_env.sh    # genera dashboard/.env
cd dashboard && npx vite --port 3404  # dashboard → http://localhost:3404
bash scripts/run_beats.sh             # los 6 beats, con signatures verificables
```

Guion de narración por beat + checklist de explorer: `demo/README.md`.
Beat extra de adopción: `bash scripts/demo_adoption.sh` (service-z se suma
en vivo — ver §4).

## 7. Campos de submission Colosseum (listos para pegar)

**problemStatement:**
> AI agents already move money on-chain, but nothing binds a payment to a
> verified human principal or to what that human authorized. When an agent
> misbehaves or is compromised, there is no attribution and no accountability —
> a legal gray zone regulators are already moving to close. Facilitators and
> merchants serving agents have fraud and liability exposure today, with no
> enforceable way to tell a human-backed agent from an orphan.

**technicalApproach:**
> An Anchor program on Solana devnet whose `pay` instruction is atomic: it
> reads a Solana Attestation Service credential proving a verified human is
> behind the agent wallet (reverting if missing/revoked/expired), checks a
> mandate PDA signed by the owner (per-tx cap, daily cap, payee whitelist,
> expiry, revocable), executes the SPL USDC transfer, and emits a
> `PaymentReceipt` event — all in one transaction. Plus a mock issuer service
> (real SAS attestations via sas-lib), x402-shaped services (402 → pay →
> X-Payment → 200), an agent CLI, and a read-only audit dashboard parsing
> receipts from on-chain logs. Failed payments land on-chain as failed txs,
> inspectable in the explorer. 21/21 tests against LiteSVM with the real SAS
> program dumped from devnet.

**targetAudience:**
> x402 facilitators and services that charge agents on Solana (PayAI,
> MCPay-class), merchants selling paid APIs/MCP tools to autonomous agents,
> and agent owners who need a verifiable, enforceable way to delegate spend.
> Longer horizon: payment processors and rails that will need
> human-accountability checks as agent commerce regulation lands.

**businessModel:**
> Open protocol — the gate and schemas are a public good; nobody trusts a
> credential layer owned by a competitor. Revenue: verification fees at the
> issuer layer (issuer-agnostic, multiple KYC providers can attest) and/or
> licensed integration for facilitators (policy config, analytics). No token.

**competitiveLandscape:**
> ERC-8004 provides pseudonymous agent identity with no human binding — we
> complement it as the human layer, not compete. Skyfire provides KYA+payments
> as a closed, off-chain service (JWTs verifiable only against their keys;
> dies with the company; not consumable by on-chain programs). ~25 adjacent
> Colosseum projects exist (agent passports, spend governance, wallets) with
> zero winners — none made human-verification enforceable inside the payment
> itself. Our differentiator: open, issuer-agnostic, program-enforceable on
> the chain where x402 volume lives.

**futureVision:**
> The accountability layer for the agent economy: when agent-payment
> regulation lands (already drafted in the Philippines, Brazil, and a US
> Senate bill), rails will need exactly this — and the layer that is already
> running, open, and composable becomes the standard. Roadmap: real KYC
> issuers, facilitator integrations (PayAI/MCPay), receipt accounts for
> program-level composability, optional ERC-8004 metadata bridge for
> cross-chain agent identity.

## 8. Pitch (90 seg, versión oral)

> Hoy los agentes mueven plata y nadie responde por ellos. Los facilitators y
> merchants ya tienen el problema — fraude, liability — aunque no haya ley.
> Construimos la capa que hace a un humano verificable responsable de cada
> pago, exigible por el programa — no por un servidor de un tercero — con
> de-anonimización solo por orden judicial. ERC-8004 salió sin la capa humana;
> Skyfire es cerrado y off-chain. Nosotros lo hicimos abierto, en la chain
> donde vive x402, y lo van a ver revertir un pago en vivo. Cuando los estados
> terminen de escribir la regulación que ya están redactando, esta capa es la
> que ya está corriendo.
