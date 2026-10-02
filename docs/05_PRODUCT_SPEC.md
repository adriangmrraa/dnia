# Baseline de producto / negocio (no reemplaza SDD por cambio)

Estado: **BASELINE CONSOLIDADO — 02/10/2026 (post-archive del change `agentic-dni`)**. Refleja el producto **ya construido y verificado en devnet**: los requisitos observables vivieron en `sdd/changes/agentic-dni/spec.md` (R-01..R-10, CA-1..CA-13, INV-1..INV-5 — todos PASS); la evidencia final está en `docs/09_DEMO_SUBMISSION.md` y la continuación en `docs/10_ROADMAP.md`.

ICP y contexto: x402 facilitators y merchants/servicios que cobran a agentes IA en Solana (PayAI, MCPay, Corbits-class). Contexto: la economía de agentes x402 explotó (~39M txs) sin capa de responsabilidad — ningún merchant sabe si hay un humano verificado detrás del agente que paga. Comprador real = el gate operator; usuario secundario = el dueño del agente que paga la credencial como "costo de existir".

Usuario/pagador/decisor: paga el gate operator (facilitator/merchant — fortalece su oferta a merchants con "solo agentes con humano verificado") y el dueño del agente (credencial); decide la adopción el operator; el emisor de verificación es tercero issuer-agnóstico (en MVP: mock issuer). Regulador = horizonte/tailwind, no cliente inicial. [HIPÓTESIS — pull pendiente de validar con ≥1 facilitator post-demo, condición del gate.]

Propuesta de valor y alternativa actual: "pagos de agentes con accountability completa" — identidad (SAS attestation humano-verificado, divulgación selectiva) + mandato (PDA con policy del dueño) + recibo, exigidos atómicamente por la instrucción `pay` del programa gateado. Alternativa actual: Skyfire KYA (cerrado, JWT off-chain, no consumible por programas, muere con la empresa), ERC-8004 (identidad seudónima sin human-binding), o nada (lo más común). Diferenciador: abierto, issuer-agnóstico, program-enforceable — un programa Solana revierte si falta la credencial; un JWT no puede verificarse onchain sin oráculo.

Recorrido central (demo 6 beats, ~90 seg): mock issuer attesta humano→Agente A → humano firma mandato (≤$5/tx, solo Servicio X, expiry) → Agente A paga $0.50 y emite recibo → Agente B sin attestation revierte → over-limit y payee no-whitelisted revierten → dashboard muestra ledger verificable + revocación de mandato en vivo mata el siguiente pago.

MUST / SHOULD / LATER / OUT:
- MUST (todos construidos y verificados): programa de pago gateado con `pay` atómico (check SAS + check mandato PDA + transfer USDC + recibo — programa `D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2` devnet); mandato PDA con policy {max_por_tx, cap_diario, whitelist, expiry, revocable}; schema SAS exposición mínima (nivel/issuer/timestamp/revocación); mock issuer; demo 6 beats; dashboard audit; todo en `demo/`.
- SHOULD (estado real): recibo como event log — **implementado** (`emit!`, 7 campos con `mint` post-fix W1); narrativa AP2-compatible en pitch.
- LATER (backlog en `docs/10_ROADMAP.md` §3): KYC real (Persona/Veriff-class), integración real con facilitators, cuenta-PDA de recibo si hay composición entre programas, `update_mandate`, anti-replay de invoice, rolling-24h cap, multi-issuer, Token-2022 (si piloto lo pide).
- OUT: puente ERC-8004 (solo narrativa), mainnet, de-anonimización judicial implementada, trazabilidad pública, gate-a-nivel-facilitator como producto, modelo de negocio construido.

Métrica/hipótesis y modo de prueba: hipótesis de producto = "los facilitators/merchants x402 gatearían transacciones de agentes a humanos verificados" — falsable con 1-3 conversaciones post-demo (condición del gate, **PENDIENTE** — ver `docs/10_ROADMAP.md` §2). Criterio técnico del MVP = los 6 beats corren en devnet con reverts verificables en dashboard/explorer — **CUMPLIDO** (corrida final con signatures reales en `docs/09_DEMO_SUBMISSION.md` §3; suite 21/21).

Cambios SDD: `sdd/changes/agentic-dni/` — **ARCHIVADO** 02/10/2026 (ciclo completo propose→spec→design→tasks→apply→verify PASS→archive). No hay cambios activos; la próxima iteración abre un change nuevo según `docs/10_ROADMAP.md`.
