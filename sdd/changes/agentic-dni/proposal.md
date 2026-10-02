# Propuesta — agentic-dni (suite O+R+S)

> Cambio SDD: `agentic-dni` · Fecha: 02/10/2026 · Estado: BORRADOR — pendiente revisión humana
> Fuentes: `docs/CANDIDATE_O_agentic-dni.md` (dossier completo; §10 = diseño de suite aprobado, demo 6 beats, pitch canónico, riesgos) · `docs/04_RESEARCH_GATE.md` (gate cerrado) · `docs/DECISIONS.md` (dos entradas 01/10/2026) · `docs/SOURCES.md` [C61]-[C76], [S38]-[S51]

## Research Gate aprobado (link / fecha / quién)

`docs/04_RESEARCH_GATE.md` — **CERRADO: CONSTRUIR, 01/10/2026**, aprobado por el usuario en sesión (alias pendiente de registrar). Alcance aprobado: Candidato O ampliado a **suite O+R+S** (identidad SAS + mandato PDA + recibo en un programa de pago gateado). Registro append-only en `docs/DECISIONS.md`. Condición asociada aceptada: post-demo, contacto con ≥1 facilitator x402 para validar pull — no bloquea el build, bloquea cualquier claim de demanda real.

## Objetivo

Construir la capa de accountability para pagos de agentes IA en Solana devnet: un **programa de pago gateado** cuya instrucción `pay` exige atómicamente — en UNA transacción — (a) attestation SAS que prueba un humano verificado detrás de la wallet del agente (falta/revocada/expirada → revert); (b) mandato PDA firmado por el dueño (monto over-limit, payee no-whitelisted, expirado/revocado → revert); (c) transfer USDC (SPL/Token-2022) agente→servicio; (d) recibo emitido (event log probable en MVP). Complementan: mock issuer que emite/revoca attestations SAS y dashboard de audit con el libro de pagos verificable.

La suite responde tres preguntas por cada pago de agente: **¿quién está atrás?** (identidad), **¿qué autorizó?** (mandato), **¿qué pasó?** (recibo) — como efecto colateral atómico del pago, lo que ningún sistema off-chain puede hacer (dossier §10).

## Problema / usuario / evidencia

**Problema [EVIDENCIA]:** los agentes IA actúan con las credenciales de sus dueños — nada en la request distingue agente de humano ni dice quién lo autorizó (IETF draft AIP [S44]). ERC-8004 (mainnet 29/01/2026) resolvió identidad seudónima **sin human-binding**; Skyfire productizó KYA pero cerrado y off-chain (JWT no consumible por programas, muere con la empresa). Vacío verificado: ~25 proyectos Colosseum adyacentes, **0 winners** en human-verification exigible económicamente.

**Usuario / pagador (dossier §3, gate §2):**

| Rol | Quién | Paga |
|---|---|---|
| Gate operator (pagador real) | x402 facilitators (PayAI, MCPay, Corbits), merchants/servicios que cobran a agentes | Sí — su pitch a merchants se fortalece [HIPÓTESIS — validación post-demo] |
| Dueño del agente | builders/devs que operan agentes | Sí — la credencial es el "costo de existir" del agente |
| Emisor de verificación | verificadores KYC; en MVP: **mock issuer** | Cobraría por verificación (post-hackathon) |
| Quién verifica | cualquier programa/servicio onchain — attestation pública y legible vía CPI | — |
| Regulador | estados (drafts ya en redacción) | No — horizonte/tailwind, no cliente inicial |

## Outcome y por qué ahora

**Outcome:** demo end-to-end de 6 beats (~90 seg) en devnet donde un agente con humano verificado y mandato vigente paga y emite recibo, mientras agente huérfano, pago over-limit, payee no-whitelisted y mandato revocado **revierten** — todo visible en un dashboard de audit verificable onchain.

**Por qué ahora:** x402 explotó (~39M txs Solana) sin capa de responsabilidad; ERC-8004 salió el 29/01/2026 sin human-binding (ventana abierta); reguladores ya redactan esta credencial (Filipinas HB 11014, Brasil PL 974/2026, US AI AGENT Act — tailwind, no motor); AP2 de Google definió el modelo mandates+receipts off-chain — esta suite es ese mismo modelo **exigible dentro del programa**; los winners vecinos (MCPay 🏆 Stablecoins, Latinum 🏆 AI) prueban que la infra de agentic payments es categoría premiada y le falta esta capa.

## Alcance (IN)

1. Programa Solana de pago gateado (devnet) con instrucción `pay` atómica: check attestation SAS → check mandato PDA → transfer USDC → emitir recibo. Es el **único programa custom** del MVP.
2. Mandato PDA: owner firma policy {max_por_tx, cap_diario, whitelist de payees/programas, expiry, revocable} + contadores de gasto; la revocación mata el pago siguiente.
3. Schema SAS "human-verified agent" + integración `sas-lib` (attest.solana.com, verificado live [S50]): onchain expone **solo** nivel/issuer/timestamp/revocación — divulgación selectiva, nunca datos de identidad.
4. Mock issuer service: emite y revoca attestations SAS (sin KYC real — se demuestra la capa, no la verificación).
5. Actores mínimos de la demo: humano owner, Agente A (con attestation), Agente B (sin attestation), Servicio X (whitelisted), Servicio Y (no whitelisted).
6. Dashboard de audit: libro de gastos del agente verificable onchain, estado del mandato y revocación en vivo.
7. Todo el código en `demo/` — **no se toca** `platform/` ni el repo original `This-is-my-harness`.

## OUT of scope (explícito)

- **KYC / verificación humana real** (Persona/Veriff-class) — mock issuer solamente; integración post-hackathon.
- **Puente / metadata ERC-8004** — fuera del MVP; solo narrativa del pitch ("cross-chain en producción").
- **Mainnet o fondos reales** — devnet únicamente.
- **De-anonimización por orden judicial** — propiedad del diseño (el issuer custodia el vínculo agente→humano), no feature implementada.
- **Trazabilidad pública del historial del agente** — veneno descartado; la attestation expone solo "verificado: nivel/issuer".
- **Gate a nivel facilitator con check-RPC** como producto — el claim "program-enforceable" exige el programa propio (dossier §10, honestidad estructural: el gate vive en el lado del vendedor).
- **Modelo de negocio implementado** (fees, licencias a facilitators) — se documenta en spec, no se construye.
- **Integración real con MCPay/PayAI** — condición post-demo, no parte del build.

## MVP (definición de hecho)

El MVP se cumple cuando la **demo de 6 beats corre en devnet**:

1. Mock issuer attesta humano → wallet de Agente A.
2. El humano firma mandato: Agente A ≤ $5/tx, solo Servicio X, expiry mañana.
3. Agente A paga $0.50 → credencial válida + mandato cubre → **recibo emitido** → servicio responde. ✔
4. Agente B (sin attestation) llama → **revert**. ✗
5. Agente A intenta $10 (> límite) → **revert**; intenta Servicio Y (no whitelisted) → **revert**. ✗
6. Dashboard muestra el ledger verificable; el humano revoca el mandato en vivo → el siguiente pago falla instantáneamente.

## Riesgos (dossier §9, §10)

- **Scope creep** (3 primitivas > 1) — mitigado: único programa custom = el gate; identidad = SAS SDK sin programa propio; mandato = PDA con policy + contadores; recibo = evento dentro de la misma ix.
- **Cold-start**: credencial que nadie exige no vale — mitigación: condición post-demo de contacto con ≥1 facilitator; el hackathon exige demo, no adopción.
- **Dependencia SAS** (`sas-lib`, attest.solana.com) — verificado live y legible-por-programas [S50]; detalle de schema y decisión de privacidad exacta quedan para spec/diseño.
- **Narrativa tóxica** ("el estado rastrea todo") — mitigada: divulgación selectiva desde el diseño; accountability judicial-ordered, NO trazabilidad total; regulación como tailwind, no motor (pitch canónico en gate §9).
- **Toolchain** — desbloqueado 01/10 vía WSL (rustc 1.99 + solana-cli 4.3.0 + anchor-cli 1.2.0 + node 22, todo verde); elección Anchor vs nativo y recibo event-log vs cuenta-PDA quedan para diseño.

## Decisión humana

**PENDIENTE** — esta propuesta requiere revisión y aprobación del usuario antes de abrir la fase `spec` (`sdd/changes/agentic-dni/spec.md`). Esta fase no escribe código.
