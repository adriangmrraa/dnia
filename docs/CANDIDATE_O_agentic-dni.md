# Candidato O — Capa de verificación humana para agentes ("DNI agéntico")

> **Estado:** **RESEARCH GATE CERRADO — CONSTRUIR** (01/10/2026). Alcance final: **suite de accountability O+R+S** — identidad (SAS) + mandato (PDA) + recibo, exigidos atómicamente por un programa de pago gateado. Mock issuer; puente 8004 fuera del MVP (solo pitch); condición post-demo: validar pull con ≥1 facilitator x402. Build pausado por equipo hasta nueva orden.
> **Fuentes:** docs/SOURCES.md — Copilot [C61]-[C66], [C67]-[C76] (4ta ronda, origen de R y S); web [S38]-[S51].
> **Origen:** idea del usuario (DNI agéntico obligatorio por regulación), reformulada por investigación: de "registro universal que la ley obligue" a **"capa de credencial de humano-verificado que los rails económicos pueden exigir hoy"**.

---

## 1. La idea en una frase

Cada agente de IA puede presentar una **credencial onchain** que prueba "hay un humano verificado detrás de mí" — sin revelar quién es — y los procesadores de pago, servicios y programas onchain pueden **exigirla estructuralmente**: sin credencial, la transacción revierte. El enforcement es económico y programático, no legal.

La versión original del usuario: DNI digital obligatorio para todos los agentes, regulación incluida. La reformulación: **la regulación llega en años; la compuerta económica funciona hoy** — los estados podrán obligarla después, pero el producto se adopta porque resuelve fraude/liability YA.

## 2. Problema que resuelve

- **Agentes huérfanos** [EVIDENCIA]: hoy un agente actúa con las credenciales de su dueño — nada en la request distingue agente de humano, ni dice qué agente es ni quién lo autorizó (IETF draft AIP lo describe literalmente [S44]). Comprometido o malicioso, no hay frontera técnica ni audit trail atribuible.
- **Sin ancla de responsabilidad**: un scammer puede levantar 10.000 agentes. ERC-8004 da identidad seudónima (NFT) — no prueba humano, no ancla liability.
- **Fraud/compliance en la economía de agentes**: x402 explotó (~39M txs Solana). Los facilitators/merchants que procesan pagos de agentes no tienen cómo saber si hay una persona responsable atrás — cuando la regulación llegue (ya se está escribiendo: Filipinas HB 11014 propone exactamente esta credencial [S42]; Brasil PL 974/2026 exige binding a CPF/CNPJ [S41]; draft US AI AGENT Act propone registro de agentes en FTC [S43]), los rails necesitarán esto.
- **El estándar salió sin la capa humana**: ERC-8004 deployó mainnet el 29/01/2026 — identidad + reputación + validación, **cero human-binding** [S38][S39]. Ventana abierta ahora.

## 3. Cliente — quién paga, quién usa, quién verifica

| Rol | Quién | Qué hace | Paga? |
|---|---|---|---|
| **Emisor de verificación** | KYC provider o el propio protocolo con verificadores whitelisted | Attesta wallet-agente ↔ humano-verificado | Cobraría por verificación (~$1-2 costo real KYC) |
| **Dueño del agente** | Builders/devs que operan agentes | Obtiene credencial para que su agente sea aceptado | Sí — es el "costo de existir" del agente |
| **Gate operator** (cliente real) | x402 facilitators (PayAI, MCPay), merchants, programas escrow | Exige la attestation en su endpoint/programa | Sí — modelo probable: licencia SDK/fee por verificación consultada |
| **Regulador/futuro** | Estados | Mandan adopción | No — horizonte, no cliente inicial |

**Quién adopta primero [HIPÓTESIS testeable]:** los x402 facilitators de Solana — su pitch a merchants se fortalece si pueden ofrecer "agentes con humano verificado". Una conversación con PayAI/MCPay valida o mata el wedge.

## 4. Qué existe y qué NO existe (el mapa honesto)

| Existe | Quién | Limitación estructural |
|---|---|---|
| Identidad de agente onchain | ERC-8004 (mainnet 29/01/2026, 22 chains, autores Google/Consensys) | Seudónima — un NFT no prueba humano. `supportedTrust` no contempla human-binding [S39] |
| KYA humano→agente | Skyfire KYA/KYAPay (live, a16z-backed) | **Cerrado y off-chain**: JWTs firmados por Skyfire, verificables solo contra sus claves. Issuer=verifier. Suscripción paga. Muere con la empresa. **No consumible por programas onchain** sin oráculo [S40] |
| KYA+x402 en Solana | agentid-kya-solana (repo OSS) | Proyecto de hackathon, no producto — identidad + treasury + reputación, pero sin binding a humano verificado real [S45] |
| Gobernanza de gasto de agentes | AgentGate, Agent-Cred, Mandate.md, Regent (Colosseum, 0 premios) | Controlan límites del dueño — no credencial pública de humano |
| Estándar formal | IETF drafts AIP, AIRS | En proceso, identity+policy framework, sin capa de human-verification definida [S44] |
| Marco regulatorio | Filipinas HB 11014 (voluntary Digital Authority Credential), Brasil PL 974/2026, US AI AGENT Act draft | Todos futuro/draft — confirman la dirección, no son demanda hoy [S41][S42][S43] |
| **Credencial de humano-verificado, onchain, consumible por programas, issuer-agnóstica, con divulgación selectiva** | **NADIE** | ← el hueco |

## 5. Por qué Solana es significativo (prueba de extracción)

| Pregunta | Respuesta honesta |
|---|---|
| ¿Un JWT off-chain resuelve la verificación web? | Sí — Skyfire lo hace. Para "un merchant web chequea credencial", Postgres+API alcanza. **Si el producto quedara ahí, Solana sería sticker.** |
| ¿Qué hace Solana que JWT no puede? | **Una credencial onchain es exigible DENTRO de un programa onchain.** Un escrow, un programa de pagos, un vault pueden revertir la transacción si la attestation falta — sin confiar en el servidor de nadie. Skyfire no puede ofrecer eso sin rehacerse onchain. |
| ¿Neutralidad? | Ningún competidor adopta el registry de Skyfire (confiar en las keys de tu competidor). Un registry abierto es bien público — nadie controla la capa. |
| ¿Supervivencia? | La attestation onchain sobrevive al emisor. El JWT de Skyfire muere si Skyfire muere o te deplataforma. |
| ¿Composabilidad? | La misma credencial sirve para x402, escrows, DAOs, reputación — permiso de nadie. |
| **Veredicto** | **Pasa la extracción SOLO si el producto es la compuerta económica onchain** — no si es verificador web. Eso fija el diseño entero. |

## 6. Diseño del producto (MVP)

1. **SAS attestation schema** "human-verified agent": vincula wallet del agente → issuer de verificación. Expone solo: nivel, issuer, timestamp, revocación. **Divulgación selectiva desde el diseño** — probás "hay humano", no "quién es". De-anonimización solo por proceso legal al issuer.
2. **Issuer**: en MVP, verificador mock (legítimo — demostrás la capa, no el KYC). En producción: issuer-agnóstico, múltiples verificadores pueden attestar (anti-lock-in por diseño).
3. **El gate**: servicio x402 (o escrow program) que verifica la attestation **en la misma transacción**. Sin credencial → revert.
4. **Puente 8004** (opcional, una línea de metadata): el registration file del agente en 8004 puede referenciar su attestation SAS. Interop = marketing, no dependencia.
5. **Demo**: dos agentes intentando comprar el mismo recurso — el con credencial pasa y paga; el huérfano rebota. 60 segundos, se explica solo. Lado regulador: un dashboard "audit" mostrando que cada pago de agente tiene humano attestado.

## 7. Integración con los rails (MCPay / facilitators)

- **MCPay** (winner 1ro Stablecoins): x402 pay-per-call MCP = la tubería. Nosotros somos la cerradura: su facilitator agrega un check de attestation en el flujo verify → solo agentes verificados cobran/pagan. Integración = un middleware hook, no reescritura.
- **PayAI facilitator**: mismo patrón — `onAfterSettle`/pre-verify hook consultando la attestation SAS.
- **Programas escrow/tesorería**: la attestation como constraint del programa — "este vault solo opera con wallets agente-verificadas".
- **SATI** (feedback x402 onchain): la reputación se acumula SOBRE la identidad verificada — feedback sin humano atrás es farmeable; con credencial, la reputación pesa.

**No competimos con la tubería — la hacemos exigible.** El facilitator es el cliente natural porque su propuesta de valor a merchants se fortalece.

## 8. Diferenciación vs competidores directos

| vs | Su modelo | Nuestro edge | Su contra-movida probable |
|---|---|---|---|
| **Skyfire** | KYA cerrado, JWT off-chain, suscripción | Abierto, onchain, program-enforceable, issuer-agnóstico, credencial sobrevive al issuer | Lanzar soporte Solana — pero su moat es controlar las keys; abrir el registry canibaliza su modelo |
| **ERC-8004** | Estándar de identidad, pseudónimo | Complementar, no competir: somos la human layer que su spec omite; metadata compatible | Agregar human-binding vía ValidationRegistry — mitigación: llegar primero corriendo, y ser la implementación Solana donde vive la economía x402 |
| **Parakletos / Regent / Agent-Cred (Colosseum)** | Identidad/passport sin human-binding verificable por terceros | La credencial como compuerta económica + privacidad por diseño | N/A — 0 premios, ejecución pobre |
| **IETF AIP/AIRS** | Estándar formal en draft | Implementación corriendo antes que el draft cierre | El estándar formal eventual — si gana AIP, nuestro schema se adapta (issuer-agnóstico) |

## 9. Evaluación rigurosa — lo frágil (sin complacencia)

- **Cold-start es EL problema**: credencial que nadie exige no vale nada. Skyfire lo resolvió bundleando pagos. Necesitamos ≥1 facilitator/merchant real gateando. El hackathon da la demo; el piloto depende de una conversación, no de código.
- **KYC real cuesta ~$1-2/verificación** (Persona/Veriff) — dependencia externa no hackathoneable. El MVP usa mock; el negocio necesita convenio.
- **8004 puede comer la capa** vía su ValidationRegistry (validators de terceros). Defensa: Solana es donde está la economía x402; ser abiertos y primero.
- **El argumento regulatorio es especulativo**: los estados probablemente lo obliguen en 3-5 años — inútil para adopción hoy. El producto debe funcionar por fraude/liability AHORA o no funciona.
- **Como empresa**: infra pura monetiza mal y tarde. Destino probable realista: ser absorbido/estandarizado (adquisición por facilitator, o estándar de facto del ecosistema Solana) — no IPO. Para hackathon es suficiente; para empresa es el riesgo a planear.
- **Privacidad**: la versión "DNI público ligado a todo" del pitch original es invendible (surveillance, GDPR). La versión viable expone solo "verificado: sí/no, nivel, issuer" — divulgación selectiva. Diseño sutil, no trivial.

## 10. La suite O+R+S — "la capa de accountability de la economía de agentes"

**[DECISIÓN DEL EQUIPO — 01/10/2026]: expandir O a suite de tres primitivas.** El usuario aprobó integrar los candidatos R (receipts) y S (mandatos) de la 4ta ronda como piezas del mismo producto.

### El concepto unificado

La economía de agentes necesita responder tres preguntas por cada pago: **¿Quién está atrás? ¿Qué autorizó? ¿Qué pasó?** La suite las responde con tres objetos onchain:

| Primitiva | Responde | Implementación | Rol |
|---|---|---|---|
| **Identidad** (O) | Quién está atrás | SAS attestation: agent-wallet ↔ humano-verificado (issuer, nivel, expiry, revocable). Solo expone "hay humano" — divulgación selectiva | Credencial |
| **Mandato** (S) | Qué autorizó | PDA del programa: owner firma policy {max_por_tx, cap_diario, whitelist de payees/programas, expiry, revocable} + contadores de gasto | Autorización exigible |
| **Recibo** (R) | Qué pasó | Attestation/registro emitido por el programa en la misma tx: pagador, payee, monto, ref de servicio, ref de mandato, timestamp | Evidencia |

**El programa de pago gateado es el corazón:** una instrucción `pay` que en UNA transacción atómica: (1) lee la attestation SAS del agente — falta/revocada → revert; (2) lee el mandato PDA — monto fuera de límite, payee no whitelisted, expirado → revert; (3) ejecuta el transfer USDC; (4) emite el recibo. **Identidad + mandato + recibo como efecto colateral atómico del pago** — eso es lo que ningún sistema off-chain puede hacer: la autorización no es un documento que el merchant mira, es una regla que el programa ejecuta.

### Alineación con AP2 (la narrativa gratis)

Google AP2 define el modelo de confianza para pagos de agentes: mandates como VDCs (open = constraints para ejecución autónoma / closed = autorización específica), Checkout Receipt / Payment Receipt, flujos human-present y human-not-present [S51]. Nuestra suite = **ese mismo modelo, pero como objetos onchain que los programas pueden exigir**. Línea de pitch: *"AP2 definió el modelo de confianza; Solana es donde el enforcement puede correr de verdad — un JWT no revierte una transacción."* Compatibilidad de vocabulario gratis; no dependemos de su estándar.

### Honestidad estructural (dónde está el límite del enforcement)

- El gate vive en el **lado del vendedor**: el servicio/facilitator solo atiende pagos gateados. El agente puede gastar en otro lado con un SPL transfer pelado — el programa no "encadena" al agente, le cierra la puerta al servicio. Como en el mundo real: el merchant exige la credencial.
- El mock issuer demuestra la capa; el KYC real es integración externa post-demo.
- El programa gateado necesita existir: decisión de diseño pendiente en spec/diseño (Anchor program propio vs gate a nivel facilitator con check-RPC). El claim "program-enforceable" exige el programa propio — es la diferencia vs Skyfire. Plan: programa chico (check attestation + check mandate PDA + transfer + emitir recibo), toolchain por definir (Solana CLI/Anchor ausentes — instalación con permiso).

### El demo unificado (6 beats, ~90 seg)

1. Mock issuer verifica al humano → attestation SAS sobre wallet de Agente A.
2. El humano firma mandato: Agente A puede pagar ≤$5/tx, solo a Servicio X, hasta mañana.
3. Agente A llama al servicio x402 gateado → paga $0.50 → credencial válida + mandato cubre → **recibo emitido onchain** → servicio responde. ✔
4. Agente B (huérfano, sin credencial) llama → **revert**. ✗
5. Agente A intenta $10 (>límite) → **revert**. Intenta pagar Servicio Y (no whitelisted) → **revert**. ✗
6. Dashboard: libro de gastos del agente, cada línea verificable onchain. El humano revoca el mandato en vivo → siguiente pago falla instantáneamente.

### Precisión sobre el Recibo (R) — objeción del equipo 01/10/2026

"¿Para qué recibo si las txs ya son públicas?" — válido si el recibo solo copiara {pagador, payee, monto} (eso ya está gratis en el explorer). El recibo se justifica solo por lo que la tx NO contiene: (a) **binding semántico** — a qué servicio/invoice corresponde el pago; (b) **vínculo al mandato** — bajo qué autorización se gastó (cierra la disputa "se pasó" vs "lo autorizaste"); (c) **legible por programas** — los programas NO pueden leer historial de txs; solo leen cuentas. Composición futura (acceso-condicionado-a-compra, reputación, refund-exige-recibo) requiere el recibo como cuenta. **Decisión de diseño pendiente:** event log (barato, indexable, solo evidencia) vs cuenta PDA (rent, pero componible). MVP probable: evento + dashboard; cuenta solo si hay composición entre programas.

### Riesgo nuevo de la suite

- **Scope creep**: 3 primitivas > 1. Mitigación: el recibo es efecto colateral barato dentro del programa de pago (una cuenta emitida en la misma ix); el mandato es un PDA con policy + contadores; la identidad es SAS (schema + llamadas SDK, sin programa propio). El único programa custom es el gate — acotado.
- La suite aumenta el cold-start solo si se vende como "3 cosas"; se vende como **una**: "pagos de agentes con accountability completa".

### Narrativa regulatoria para el pitch — precisión del equipo 01/10/2026

El argumento del equipo: "los estados van a regular; hoy la responsabilidad de agentes es un gris legal; esto hace responsable al dueño; la policía podría rastrear con orden judicial; estamos adelantados a nuestro tiempo." Evaluación:

- **Válido como tailwind, NO como motor.** El enforcement económico funciona hoy (fraude/liability) — si el pitch requiere que llegue la ley, es flojo. Orden correcto: "resuelve un problema que los facilitators YA tienen; cuando la regulación llegue — ya se redacta (Filipinas HB 11014, Brasil PL 974/2026, AI AGENT Act US) — la capa que corre es esta."
- **NO decir "el estado rastrea todo".** El diseño deliberadamente no publica historial ligado de acciones (ese era el veneno descartado). Formulación correcta: vínculo criptográfico agente→humano custodiado por el issuer; de-anonimización SOLO con orden judicial; cada pago ligado a su mandato (prueba de autorización). = "accountability demostrable bajo proceso legal", no trazabilidad total.
- **No clamar originalidad absoluta.** Skyfire/AP2/ERC-8004/leyes ya existen. El claim es "abierto + exigible dentro del programa + en la chain donde vive x402", no "nadie lo pensó".
- **Pitch sugerido:** "Hoy los agentes mueven plata y nadie responde por ellos. Facilitators y merchants ya tienen el problema — fraude, liability — aunque no haya ley. Construimos la capa que hace a un humano verificable responsable de cada pago, exigible por el programa, con de-anonimización solo por orden judicial. Cuando los estados terminen de escribir la regulación que ya están redactando, esta capa es la que ya está corriendo."

## 10.1 Veredicto preliminar

**El candidato más fuerte de las tres rondas junto a C** — por razones distintas:
- Timing real y verificable: el estándar de identidad acaba de salir sin capa humana; x402 explota; los reguladores ya redactan esta credencial.
- Vacío verificado: ~25 proyectos adyacentes en Colosseum, 0 winners, ninguno hizo human-binding exigible económicamente.
- Demo dramática y corta: agente verificado pasa, huérfano rebota.
- Pasa la extracción con argumento técnico limpio: programas Solana pueden EXIGIR la credencial — un JWT no.
- Encaja en categoría ganadora: infra de agentic payments ya produjo winners (MCPay, Latinum) — esta es la capa que les falta.

**Condición de éxito (el Research Gate debe exigirla):** ≥1 conversación con un x402 facilitator/merchant que confirme "sí, gatearíamos con esto". Sin ese pull, el proyecto es hermoso e inútil.

## 11. Requisitos pendientes para Research Gate

- [x] ~~Validación de corredor~~ → convertida en **condición post-demo** (aprobado por equipo 01/10): contacto con ≥1 x402 facilitator para validar pull. No bloquea el build.
- [x] ~~MVP scope~~ → aprobado (ampliado a suite O+R+S 01/10): programa de pago gateado (`pay` atómico: attestation SAS + mandato PDA + transfer USDC + recibo) + issuer mock + demo 6 beats + dashboard.
- [x] ~~Mock issuer~~ → aprobado para demo; KYC real = post-hackathon.
- [x] ~~8004-compat~~ → fuera del MVP; solo narrativa de pitch (visión cross-chain de producción).
- [x] ~~Narrativa regulatoria~~ → aprobada con precisión: enforcement económico hoy + regulación como tailwind; accountability judicial-ordered, NO trazabilidad total; pitch canónico en §10.
- [x] ~~Recibo (R)~~ → justificación asentada (binding semántico + vínculo a mandato + legible-por-programas); event-log probable MVP, cuenta-PDA si hay composición.
- [ ] Diseño del attestation schema + decisión de privacidad (qué se expone exactamente) → pasa a spec/diseño SDD.
- [ ] Toolchain del programa: Anchor vs nativo; gate-in-program vs facilitator-check → pasa a diseño SDD (Solana CLI/Anchor ausentes — instalación con permiso).
- [ ] Modelo de negocio: open protocol + fee por verificación / licencia a facilitators → pasa a spec.
- [ ] Roadmap regulatorio como narrativa (no como dependencia) → material del pitch.

## 12. Modelo de adopción — cero fricción

**[EVIDENCIA — implementado en `demo/`]:** la suite se adopta sin cuenta, sin API key y sin permiso. El programa gate y el programa SAS son capa de bien público: **la chain es la API**. Nadie se registra ante nosotros — cada rol interactúa con cuentas públicas.

### Quiénes adoptan y qué hacen

| Adoptante | Qué hace concretamente | Qué NO necesita |
|---|---|---|
| **Servicio / merchant** | Responder 402 con requirements + verificar el `PaymentReceipt` on-chain — en la demo es `createGate({programId, payee, price, mint})` de `demo/services/gate-check.ts` (~140 líneas de helper, ~10 líneas de handler). `service-z` (:3405) queda gateado solo con eso. | Registro, API key, SDK propietario, permiso del gate |
| **Facilitator / router** | El mismo verify como hook de settle en su flujo 402: parsea `Program data:` de la tx y exige payee/mint/monto/invoice propios. | Nada extra — es una lectura RPC cualquiera |
| **Owner del agente** | Una tx `init_mandate` con la policy (máx/tx, cap diario, whitelist de payees, expiry) + `revoke_mandate` cuando quiera. En la demo: `owner.ts init-mandate --agent a --max 5 --cap 10 --payees x`. | Custodia nueva — firma con su wallet actual |
| **Humano (principal)** | Una llamada al issuer: `POST /attest {wallet, level}` — en producción es el flujo KYC del issuer elegido. | PII on-chain (INV-1: solo nivel + timestamp) |

### Por qué no hay cuenta ni permiso

El gate es un programa abierto: cualquiera puede crear mandatos, pagar gateado o verificar recibos sin hablar con nadie. La **autoridad queda donde corresponde**: el issuer decide a quién atesta; el owner decide a qué servicios puede pagar su agente. El adoptante no pide permiso al gate — *exige* que el pago venga por el gate. Es x402 con enforcement on-chain: el middleware no decide, la tx revierte.

### Niveles de adopción

- **Soft check** (lo que hacen service-x/y/z): el servicio publica requirements y verifica el recibo post-pago. Cero costo si nadie paga.
- **Routed-through-gate** (más fuerte): el único camino de cobro es `pay` del gate — mismo código, cambia la exposición del payee (ej. cobros a un ATA cuyo dueño solo cobra via recibo). Producción.

### Fricción honesta que queda

- **Alta del mandato**: hoy es una tx del owner por CLI; producción pide UX wallet (un approve en Phantom). Y el MVP no tiene `update_mandate`: agregar un payee es close + re-init (roadmap).
- **Elección de issuer**: el gate confía en (credential, schema) configurados — decidir qué issuer(s) aceptar es gobernanza real; multi-issuer está en roadmap.
- **Gestión de wallets**: el servicio necesita una wallet payee + ATA del mint — trivial pero no cero (`adopt_service.ts` lo automatiza en la demo).
- **Cold-start de agentes**: attestation + mandato + fondos USDC; nada de eso se resuelve adoptando el verify.

**Beat de adopción en vivo:** `bash scripts/demo_adoption.sh` — levanta service-z, muestra el 402, el revert `PayeeNotWhitelisted` on-chain (la chain decide), la autorización del owner y el pago 200. La tab "Adopción" del dashboard (:3404) muestra el snippet real y los adoptantes online.
