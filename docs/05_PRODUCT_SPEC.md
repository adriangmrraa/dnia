# Baseline de producto / negocio (no reemplaza SDD por cambio)

Estado: BASELINE INICIAL — 02/10/2026. Consolida lo aprobado en el Research Gate para el change `agentic-dni`; los requisitos observables del cambio viven en `sdd/changes/agentic-dni/spec.md` (fase siguiente) y este archivo se re-consolida al archivar.

ICP y contexto: x402 facilitators y merchants/servicios que cobran a agentes IA en Solana (PayAI, MCPay, Corbits-class). Contexto: la economía de agentes x402 explotó (~39M txs) sin capa de responsabilidad — ningún merchant sabe si hay un humano verificado detrás del agente que paga. Comprador real = el gate operator; usuario secundario = el dueño del agente que paga la credencial como "costo de existir".

Usuario/pagador/decisor: paga el gate operator (facilitator/merchant — fortalece su oferta a merchants con "solo agentes con humano verificado") y el dueño del agente (credencial); decide la adopción el operator; el emisor de verificación es tercero issuer-agnóstico (en MVP: mock issuer). Regulador = horizonte/tailwind, no cliente inicial. [HIPÓTESIS — pull pendiente de validar con ≥1 facilitator post-demo, condición del gate.]

Propuesta de valor y alternativa actual: "pagos de agentes con accountability completa" — identidad (SAS attestation humano-verificado, divulgación selectiva) + mandato (PDA con policy del dueño) + recibo, exigidos atómicamente por la instrucción `pay` del programa gateado. Alternativa actual: Skyfire KYA (cerrado, JWT off-chain, no consumible por programas, muere con la empresa), ERC-8004 (identidad seudónima sin human-binding), o nada (lo más común). Diferenciador: abierto, issuer-agnóstico, program-enforceable — un programa Solana revierte si falta la credencial; un JWT no puede verificarse onchain sin oráculo.

Recorrido central (demo 6 beats, ~90 seg): mock issuer attesta humano→Agente A → humano firma mandato (≤$5/tx, solo Servicio X, expiry) → Agente A paga $0.50 y emite recibo → Agente B sin attestation revierte → over-limit y payee no-whitelisted revierten → dashboard muestra ledger verificable + revocación de mandato en vivo mata el siguiente pago.

MUST / SHOULD / LATER / OUT:
- MUST: programa de pago gateado con `pay` atómico (check SAS + check mandato PDA + transfer USDC + recibo); mandato PDA con policy {max_por_tx, cap_diario, whitelist, expiry, revocable}; schema SAS exposición mínima (nivel/issuer/timestamp/revocación); mock issuer; demo 6 beats; dashboard audit; todo en `demo/`.
- SHOULD: recibo como event log (probable MVP); narrativa AP2-compatible en pitch.
- LATER: KYC real (Persona/Veriff-class), integración real con facilitators, cuenta-PDA de recibo si hay composición entre programas.
- OUT: puente ERC-8004, mainnet, de-anonimización judicial implementada, trazabilidad pública, gate-a-nivel-facilitator como producto, modelo de negocio construido.

Métrica/hipótesis y modo de prueba: hipótesis de producto = "los facilitators/merchants x402 gatearían transacciones de agentes a humanos verificados" — falsable con 1-3 conversaciones post-demo (condición del gate). Criterio técnico del MVP = los 6 beats corren en devnet con reverts verificables en dashboard/explorer.

Cambios SDD activos: `sdd/changes/agentic-dni/` — fase propose (propuesta escrita 02/10/2026, pendiente aprobación humana → siguiente: spec).
