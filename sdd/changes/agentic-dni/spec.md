# Spec comportamental — agentic-dni (suite O+R+S)

> Estado: **BORRADOR — contenido completo, pendiente revisión humana** (gate de la fase `spec`: revisión humana de spec).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Fuentes canónicas: `sdd/changes/agentic-dni/proposal.md` · `docs/CANDIDATE_O_agentic-dni.md` §10 (suite aprobada + demo 6 beats + honestidad estructural) · `docs/04_RESEARCH_GATE.md` (alcance cerrado) · `docs/05_PRODUCT_SPEC.md` (baseline) · `docs/DECISIONS.md` · `docs/ENVIRONMENT.md` (toolchain WSL).

## Para quién / problema / outcome

Para un **servicio o facilitator x402 que cobra a agentes IA en Solana** (gate operator — el pagador real del producto) que hoy **no puede distinguir un agente de un humano, no sabe qué humano verificado responde detrás ni bajo qué autorización gasta el agente, y no tiene evidencia consumible de cada pago**, el sistema debe hacer que **cada pago de agente exija — dentro de una única transacción atómica — credencial de humano-verificado (attestation SAS) + mandato vigente del dueño que cubra ese pago + emisión de un recibo; si cualquier chequeo falla, la transacción revierte completa y ningún fondo se mueve**.

Roles cubiertos por el sistema: humano owner (firma y revoca mandatos), agente pagador (invoca `pay`), servicio/payee (cobra), mock issuer (emite/revoca attestations), observador/jurado (dashboard de audit).

## Requisitos MUST (observables y testeables)

> Convención de esta spec: **"revertir"** = la transacción falla con error del programa, **ningún token se mueve** (salvo fee de red) y **no se emite recibo**. Todo requisito es verificable onchain (explorer/dashboard) sin confiar en logs off-chain.

- **R-01 — Programa de pago gateado con `pay` atómica.** Existe UN programa custom desplegado en devnet cuya instrucción `pay` ejecuta, en orden y en la misma transacción: (1) check de attestation SAS del agente pagador; (2) check del mandato PDA; (3) transfer USDC agente→servicio; (4) emisión del recibo. Verificable: el programa existe en devnet y cada tx de la demo muestra los 4 efectos o ninguno.
- **R-02 — Check de attestation (identidad).** `pay` revierte si la wallet pagadora no tiene attestation SAS válida: **inexistente, revocada o expirada** → revert, con motivo de fallo distinguible.
- **R-03 — Check de mandato (autorización).** `pay` revierte si el mandato PDA del owner sobre ese agente no autoriza el pago: **monto > max_por_tx, monto excede el cap_diario restante, payee fuera de whitelist, mandato expirado o mandato revocado** → revert. Además el mandato está **ligado al agente**: un agente distinto no puede pagar con el mandato de otro → revert.
- **R-04 — Transfer USDC.** Con los checks válidos, `pay` mueve el monto exacto en USDC de prueba desde la wallet del agente a la del servicio. Verificable: balances antes/después en explorer. (Token SPL vs Token-2022: decisión OPEN → diseño.)
- **R-05 — Recibo (evidencia).** Toda `pay` exitosa emite un recibo observable que contiene al menos: **pagador (agente), payee (servicio), monto, referencia del servicio/invoice, referencia al mandato usado, timestamp**. El recibo es legible por el dashboard. (Mecanismo — event log vs cuenta — OPEN → diseño.)
- **R-06 — Mandato: creación y revocación por el owner.** El humano owner puede crear el mandato firmando la policy {max_por_tx, cap_diario, whitelist de payees, expiry} y revocarlo en cualquier momento. **Una revocación confirmada mata el `pay` siguiente.** Solo el owner puede alterar o revocar su mandato.
- **R-07 — Mock issuer.** Existe un servicio capaz de (a) emitir attestation SAS "human-verified" sobre la wallet de un agente y (b) revocarla. Sin KYC real. La attestation que emite es la misma que el programa lee en R-02 — no hay atajo ni bypass.
- **R-08 — Dashboard de audit.** Interfaz mínima que muestra, leyendo de devnet: (a) **ledger de pagos del agente** — cada línea verificable onchain (referencia a la tx); (b) **estado del mandato** — policy, contadores de gasto, expiry, vigente/revocado; (c) **estado de la attestation** — vigente/revocada/expirada. El dashboard no escribe nada onchain ni muestra datos del humano.
- **R-09 — Actores y entorno de demo.** El sistema provee las identidades/roles de la demo: humano owner, Agente A (con attestation), Agente B (sin attestation), Servicio X (whitelisted), Servicio Y (no whitelisted) y USDC de prueba en devnet. **Todo el código nuevo vive en `demo/`**; `platform/` y el repo original `This-is-my-harness` NO se tocan.
- **R-10 — Devnet solamente.** Ningún paso usa mainnet ni fondos reales; ninguna key/seed se escribe en el repo ni en los artefactos.

## Criterios de aceptación — mapeo 1:1 con los 6 beats de la demo + edge cases

**CA-1 ↔ Beat 1 — attestation humano → Agente A.**
DADO Agente A sin attestation, CUANDO el mock issuer emite la credencial, ENTONCES existe onchain una attestation SAS ligada a la wallet de A, legible, con {nivel, issuer, timestamp/expiry, revocada=false} y **ningún dato de identidad del humano**. PASS = attestation legible onchain con esos campos; FAIL = no existe, no es legible por el programa, o expone PII.

**CA-2 ↔ Beat 2 — firma del mandato.**
DADO Agente A con attestation vigente, CUANDO el humano firma el mandato {max_por_tx = $5 USDC, whitelist = {Servicio X}, expiry = mañana, revocable}, ENTONCES existe un mandato PDA ligado a (owner, Agente A) con esa policy legible y contadores de gasto en cero. PASS = mandato onchain con los campos exactos; FAIL = policy distinta, mandato no ligado a A, o contadores != 0.

**CA-3 ↔ Beat 3 — pago feliz $0.50.**
DADO Agente A attested + mandato vigente que cubre $0.50 a Servicio X, CUANDO A invoca `pay($0.50, Servicio X)`, ENTONCES: (a) la tx confirma; (b) Servicio X recibe exactamente $0.50 USDC; (c) se emite recibo con los 6 campos de R-05; (d) los contadores del mandato aumentan en $0.50; (e) el servicio entrega la respuesta/recurso de la demo. PASS = los 5 efectos observables; FAIL = cualquier efecto ausente o movimiento parcial de fondos.

**CA-4 ↔ Beat 4 — Agente B huérfano.**
DADO Agente B sin attestation, CUANDO B invoca `pay($0.50, Servicio X)`, ENTONCES la tx revierte por falta de attestation; el balance de Servicio X no cambia; no se emite recibo; el fallo es visible (dashboard/log/explorer). PASS = revert + motivo distinguible; FAIL = pasa, mueve fondos, o emite recibo.

**CA-5 ↔ Beat 5 — policy del mandato.**
DADO Agente A attested con mandato {≤$5/tx, solo Servicio X}: (a) CUANDO A invoca `pay($10, Servicio X)` ENTONCES revierte por over-limit, sin transfer ni recibo; (b) CUANDO A invoca `pay($0.50, Servicio Y)` ENTONCES revierte por payee-no-whitelisted, sin transfer ni recibo. PASS = ambos reverts con motivos distinguibles; FAIL = alguno confirma o el motivo es indistinguible.

**CA-6 ↔ Beat 6 — dashboard + revocación en vivo.**
DADOS los beats 1–5 ya ejecutados, ENTONCES el dashboard lista el pago de CA-3 como línea verificable onchain; CUANDO el humano revoca el mandato, ENTONCES el dashboard refleja el estado "revocado" y el siguiente `pay($0.50, Servicio X)` de A — que en CA-3 confirmaba — **revierte**. PASS = la revocación en vivo mata el pago siguiente sin tocar nada más; FAIL = el pago pasa tras revocar o el dashboard no refleja el cambio.

**Edge cases a cubrir en pruebas** (al menos ejecutables en test suite; no exige beats extra en la demo):

- **CA-7** — Attestation revocada por el issuer → `pay` revierte.
- **CA-8** — Attestation expirada → `pay` revierte.
- **CA-9** — Mandato expirado → `pay` revierte.
- **CA-10** — Monto dentro de max_por_tx pero que excede el cap_diario restante → revierte.
- **CA-11** — Agente distinto intenta usar el mandato ligado a Agente A → revierte.
- **CA-12** — Attestation de un issuer no reconocido / fuera del schema esperado → revierte (forma exacta del check: OPEN → diseño).

## Errores / seguridad / accesibilidad / invariantes

**Invariantes de spec (no negociables — cualquier implementación que los viole = FAIL):**

- **INV-1 — Privacidad / divulgación selectiva.** Onchain y en el dashboard solo se expone {nivel, issuer, timestamp/expiry, flag de revocación}. **NUNCA** nombre, documento, PII ni vínculo público agente→humano. Es invariante de spec, no de diseño.
- **INV-2 — Atomicidad.** `pay` confirma los 4 efectos juntos o ninguno; no existe estado intermedio observable (sin transfer sin checks, sin checks sin recibo, sin recibo sin transfer).
- **INV-3 — Honestidad estructural.** El gate vive en el lado del vendedor: el programa NO impide que el agente gaste por fuera con un SPL transfer pelado — el servicio es quien cierra la puerta. Se documenta así en demo/pitch; no se disimula.
- **INV-4 — Único programa custom.** Solo el gate es programa propio: identidad = SAS vía SDK (sin programa propio), mandato = PDA del gate, recibo = emisión dentro de la misma ix.
- **INV-5 — Devnet + sin secretos.** Solo devnet/USDC de prueba; ninguna key, seed ni credencial en repo, artefactos SDD ni prompts.

**Errores (observables):** cada condición de revert produce un error de programa **distinguible** (attestation missing / revoked / expired, over-limit, payee-not-whitelisted, mandate expired / revoked, mandate-bound-to-other-agent, issuer-not-recognized) — distinguible en el sentido de que dashboard/logs pueden mostrar el motivo sin ambigüedad.

**Seguridad:** solo el owner crea/altera/revoca su mandato; solo el issuer revoca su attestation; el agente no puede escribir contadores ni forjar recibos; el programa verifica que el firmante de `pay` corresponde al agente del mandato.

**Accesibilidad / legibilidad de la demo:** criterio práctico — un jurado puede seguir los 6 beats (~90 seg) y verificar cada línea del ledger contra el explorer sin explicación adicional. No aplica estándar WCAG formal para este MVP técnico.

## No objetivos (OUT of scope — explícito)

- Puente / metadata **ERC-8004** — solo narrativa del pitch ("cross-chain en producción").
- **KYC / verificación humana real** (Persona/Veriff-class) — mock issuer únicamente; integración post-hackathon.
- **Mainnet o fondos reales** — devnet exclusivamente.
- **Agregación multi-mandato** más allá del MVP: UN mandato por par (owner, agente) en la demo; sin delegación compuesta ni combinación de políticas.
- **De-anonimización judicial implementada** — propiedad documental del issuer, no feature.
- **Trazabilidad pública del historial del agente** — versión "DNI público" descartada (veneno del pitch).
- **Gate a nivel facilitator con check-RPC** como producto — el claim "program-enforceable" exige el programa propio.
- **Modelo de negocio implementado** (fees, licencias a facilitators).
- **Integración real con MCPay/PayAI** — condición post-demo, no parte del build.
- Cualquier cambio en `platform/` o el repo original.

## Decisiones ABIERTAS — reservadas para la fase `design` (NO decidir en spec)

1. Anchor vs programa nativo.
2. Recibo: event log vs cuenta PDA.
3. Modo de integración x402 en la demo (middleware/hook del lado del servicio vs llamada directa del agente).
4. SAS real (`sas-lib` / attest.solana.com) vs schema propio — y la forma exacta del check de issuer/schema dentro del programa.
5. SPL vs Token-2022 para el USDC de la demo.
6. cap_diario: ventana de 24h vs día calendario.
7. Cómo el servicio "responde" en beat 3 (endpoint mock que verifica la tx vs respuesta simulada).

## Quién aprobó y cuándo

**PENDIENTE** — gate de la fase `spec`: este documento requiere revisión y aprobación humana explícita. La propuesta quedó aprobada al despacharse esta fase (02/10/2026 — registrado en `docs/SESSION_LOG.md` sesión 11). La spec aprobada habilita `design`; **no habilita código**.
