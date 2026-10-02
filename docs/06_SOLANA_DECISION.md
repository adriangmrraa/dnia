# Decisión Solana — agentic-dni (suite O+R+S)

> **Estado:** ESCRITO — pendiente revisión humana (gate de la fase `design`: viabilidad/seguridad revisadas).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Fase: `design` (skill `formosa-sdd-design`)
> Fuentes: `sdd/changes/agentic-dni/spec.md` (7 decisiones OPEN heredadas) · `docs/CANDIDATE_O_agentic-dni.md` §10 · `.agents/skills/solana-dev/SKILL.md` (opinionated stack de Solana Foundation) · `.agents/skills/solana-hackathon/SKILL.md` · docs oficiales SAS `attest.solana.com` + repo `solana-foundation/solana-attestation-service` [S50, verificado 02/10/2026].
> Este archivo registra **las decisiones onchain** y sus tradeoffs. El detalle de componentes/flujos vive en `docs/07_ARCHITECTURE.md`; el artefacto SDD consolidado en `sdd/changes/agentic-dni/design.md`.

## Convenciones

- Cada decisión: opciones → **decisión** → justificación técnica → tradeoff aceptado → qué la invalidaría.
- Cluster: **devnet exclusivamente** (INV-5). Nada de mainnet ni fondos reales.
- Program IDs reales citados sin secretos: SAS `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` (devnet+mainnet), SPL Token `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.

---

## D1 — Framework del programa: **Anchor 1.2.0**

| Opciones | Evaluación |
|---|---|
| **Anchor 1.2.0** (elegido) | Instalado y verificado en WSL (`anchor-cli 1.2.0`, `docs/ENVIRONMENT.md`). IDL automático (lo consumen dashboard + agent CLI + tests), constraints declarativos (`seeds`, `has_one`, `constraint`), `emit!` para el recibo, helpers `anchor_spl::token` para el CPI de transfer. Skill oficial: "Use Anchor unless you have a specific reason not to — hackathons optimizan velocidad de build". |
| Nativo `solana-program` / Pinocchio | Menor binario y CU; sin IDL ni cuentas declarativas — todo parsing manual. Recomendado por la skill solo cuando hay necesidad de CU/footprint; no es el caso (4 instrucciones, txs triviales). Costo de iteración alto para equipo sin programa propio previo. |

**Justificación:** velocidad de construcción + corrección (constraints declarativos reducen bugs de validación de cuentas — justo donde vive el riesgo del gate) + IDL gratis para tres consumidores TS.
**Tradeoff aceptado:** binario más pesado y overhead CU por ix — irrelevante a escala demo (transfer + 2 lecturas + evento ≪ límite).
**Invalidaría:** si `pay` superara límites de CU o el binario no entrase en límite de deploy (no esperado; mitigación = Pinocchio en iteración posterior).

## D2 — Recibo: **event log via `emit!`** (confirmado default del gate)

| Opciones | Evaluación |
|---|---|
| **Event log Anchor `emit!`** (elegido) | El recibo es efecto colateral de `pay`: `emit!(PaymentReceipt{...})` queda en los logs de la tx (`Program data: <b64>`), indexable por `getTransaction`. Costo ~0 (sin cuenta, sin rent). Cumple R-05: 6 campos tipados, legible por el dashboard parseando logs con el IDL. INV-4: ningún programa extra. |
| Cuenta PDA de recibo por pago | Cada pago crea `Receipt` account (~rent 0.002 SOL + cuenta extra en la ix). Ventaja única: **legible por programas** (composición: refund-exige-recibo, acceso-condicionado-a-compra). Ningún flujo del MVP consume recibos on-chain → rent + complejidad sin retorno hoy. |
| Memo program | Hack: datos en log sin tipado, sin discoverability por schema. Peor que `emit!` en todo. |

**Justificación:** MVP exige evidencia *observable off-chain*, no consumible on-chain. El dossier §10 ya lo pre-endosó ("event-log probable, cuenta solo si hay composición entre programas") y ningún requisito nuevo lo contradice.
**Tradeoff aceptado:** los programas no pueden leer eventos → si mañana un programa necesita probar "este pago existió" on-chain, hay que agregar la cuenta PDA (cambio aditivo, no rompe nada).
**Invalidaría:** un requisito real de composición programa↔programa sobre recibos (ej. servicio que exige recibo previo dentro de otra tx). Registrar en roadmap post-demo.

## D3 — Integración x402: **servicio propio estilo-x402 (mock), no facilitator real**

| Opciones | Evaluación |
|---|---|
| **Endpoint mock x402-shaped** (elegido) | `demo/services/service-x`: HTTP `402 Payment Required` → el agente envía la tx `pay` al programa gate → retry con `X-Payment: <signature>` → el servicio verifica la tx on-chain (recibo emitido, payee = su wallet, monto ≥ precio, ref = invoice) → 200 con el recurso. Reproduce la *forma* x402 con settlement en nuestro programa — control total, reproducible, sin dependencia externa. |
| Facilitator real (PayAI/Corbits middleware) | Los facilitators x402 existentes liquidan **SPL transfers pelados** (esquema `exact`); ninguno invoca un programa custom con accounts extras (mandate PDA, attestation SAS) — para eso haría falta un scheme propio registrado en el facilitator, fuera de alcance hackathon. Además es dependencia de tercero en el camino crítico de la demo. |

**Justificación:** honestidad estructural (INV-3): el gate vive del lado del vendedor; el demo necesita demostrar *eso* — un servicio que solo atiende pagos gateados — no integrarse a la infra de nadie. El claim nunca fue "usamos PayAI", es "los facilitators podrían exigir esto" (validación post-demo, condición del gate).
**Tradeoff aceptado:** no se puede decir "integrado con un facilitator real" — se dice "compatible con la forma x402; la integración real es un hook de settle" (el facilitador real llamaría `pay` igual que nuestro servicio verifica).
**Invalidaría:** si un facilitator ofreciera un scheme extensible a programs arbitrarios antes de la demo — se migraría el servicio a ese hook manteniendo el programa intacto.

## D4 — Attestation: **SAS real en devnet vía `sas-lib` + check por lectura de cuenta (sin CPI)**

Verificado 02/10/2026 contra repo oficial + docs [S50]:

- SAS programa `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` **deployado en devnet** (la guía oficial corre su demo ahí).
- `sas-lib@1.0.10` en npm (Solana Foundation), sobre `@solana/kit`. Funciones: `getCreateCredentialInstruction`, `getCreateSchemaInstruction`, `getCreateAttestationInstruction`, `fetchAttestation`, `deriveAttestationPda`, `getCloseAttestationInstruction`, `SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS`.
- **Cuenta `Attestation`** (Borsh, discriminator `2`): `{ nonce: Pubkey, credential: Pubkey, schema: Pubkey, data: Vec<u8>, signer: Pubkey, expiry: i64, token_account: Pubkey }`.
- **PDA seeds** (verificadas en `program/src` y `clients/typescript/src/pdas.ts`): credential = `["credential", authority, name]`; schema = `["schema", credential, name, version]`; attestation = **`["attestation", credential, schema, nonce]`** con `nonce` = wallet asociada (nuestro caso: wallet del agente).
- **Revocación = `CloseAttestation`**: borra la cuenta (no existe flag "revoked"; revocada ≡ cuenta inexistente). `expiry == 0` = sin expiración.

| Opciones | Evaluación |
|---|---|
| **SAS real, check por lectura** (elegido) | El programa recibe la attestation account read-only y valida: (1) `owner == SAS_PROGRAM_ID`; (2) `key == find_program_address(["attestation", config.sas_credential, config.sas_schema, agent.key()], SAS_ID)` — la re-derivación prueba issuer+schema+agente de una vez; (3) deserializa y chequea `expiry == 0 || expiry > now` y `data.level >= min_level`. Cero CPI, ~CU mínimo. |
| SAS real, check por CPI | SAS no expone una ix de "verify" útil para esto — la verificación ya es state-read; un CPI agregaría cuenta `sas_program` + serialización sin ganar nada. Descartado. |
| Schema propio de attestation en nuestro programa | Violaría INV-4 (único programa custom = el gate), reinventaría lo que SAS ya da (credential→schema→attestation, revocación, indexadores) y destruiría el argumento "issuer-agnóstico / estándar existente". Descartado. |

**Justificación:** usar el estándar real es EL argumento del pitch (credencial issuer-agnóstica, sobrevive al emisor, ya legible por programas). La lectura directa de cuenta es el patrón documentado para consumo on-chain.
**Tradeoff aceptado:** dependencia de devnet (SAS program + RPC). Mitigación de tests: `solana program dump` del SAS desde devnet → test-validator local con `--bpf-program` (offline, determinista).
**Invalidaría:** SAS fuera de devnet o breaking change del programa → fallback documentado: mock de la cuenta con mismo layout en test-validator (solo para tests, no para la demo devnet).

## D5 — Token del USDC de prueba: **SPL Token (legacy), no Token-2022**

| Opciones | Evaluación |
|---|---|
| **SPL Token** (elegido) | CPI `token::transfer` trivial vía `anchor_spl`; mint de prueba se crea con `spl-token create-token --decimals 6` en WSL + ATAs estándar. Máxima compatibilidad con explorers/dashboard. |
| Token-2022 | Su valor diferencial son extensiones (transfer hooks, metadata, confidential). **Transfer hooks sería enforcement a nivel token — redundante y contradictorio con nuestro diseño**: el gate vive en el programa de pago (INV-3, lado del vendedor), no en el mint. CPI de Token-2022 exige extra account metas por extensión — complejidad sin beneficio. |

**Justificación:** el enforcement es del programa `pay`, no del token; SPL es el camino más corto y legible. Los jurados conocen SPL transfer en el explorer.
**Tradeoff aceptado:** si en producción se quisiera compliance a nivel token (hooks, freeze), habría que migrar el mint — decisión post-MVP, no bloquea nada de la spec.
**Invalidaría:** un requisito de "el propio USDC no puede moverse sin gate" — contradictorio con INV-3 ya documentada (el agente puede pagar fuera; el servicio cierra la puerta).

## D6 — `cap_diario`: **ventana por día calendario UTC (day_index), no rolling 24h**

Semántica elegida (campos del Mandate PDA):

- `daily_cap: u64`, `spent_today: u64`, `day_index: i64` (= `unix_timestamp / 86400`).
- En `pay`: `let spent = if mandate.day_index == now/86400 { mandate.spent_today } else { 0 };` → check `spent + amount <= daily_cap` → efecto: `day_index = now/86400; spent_today = spent + amount`.

| Opciones | Evaluación |
|---|---|
| **Día calendario UTC** (elegido) | Un campo `i64`, reset implícito, cero ambigüedad, explicable en 5 segundos ("cada día UTC medianoche se reinicia"). |
| Rolling 24h verdadero | Requiere ventana deslizante: historial de spends (ring buffer) o matemática de decaimiento — más campos, más CU, más bugs, menos legible en demo. |

**Justificación:** cumple R-03/CA-10 (monto excede cap restante → revert) con el mínimo estado posible. El dueño entiende el modelo mental al instante.
**Tradeoff aceptado:** borde de día — un agente puede gastar `cap` a las 23:59 UTC y `cap` otra vez a las 00:01 (2×cap en 2 min). Limitación conocida y declarada; aceptable para demo.
**Invalidaría:** si un jurado/piloto exige rolling real → cambio acotado: `window_start` + lista de spends o `spent_window` con reset si `now - window_start >= 86400` (fixed-window desde primer gasto: punto medio, sin ring buffer).

## D7 — Respuesta del servicio en beat 3: **verificación on-chain real + recurso JSON premium**

El servicio `service-x` (endpoint `GET /api/premium`):

1. Sin pago → `402` + requirements `{scheme:"agentic-gate", payee:<wallet X>, price:500000 (0.50 USDC base-6), mint:<USDC-test>, program:<gate id>, invoice:<uuid>}`.
2. El agente construye y envía `pay(amount, invoice_ref)` → confirma → retry con `X-Payment: <signature>`.
3. El servicio hace `getTransaction(sig)`: confirma status ok + que contiene ix a nuestro programa + parsea el evento `PaymentReceipt` → chequea `payee == wallet X`, `amount >= price`, `service_ref == invoice` → **200 con el recurso**.
4. Recurso = payload JSON "premium" determinista (feed de datos de la demo — ej. cotización/señal ficticia) + eco del `receipt` (signature + campos) para que el jurado vea el binding pago↔respuesta.

| Opciones | Evaluación |
|---|---|
| **Verificación real de la tx + recurso JSON** (elegido) | La verificación es real (la tx existe en devnet, el evento se parsea del log) — cierra el loop "pago gateado → servicio entrega" sin simular nada. Recurso JSON = lo más legible posible para 90 seg de demo. |
| Respuesta simulada (no verifica la tx) | La demo mentiría: el servicio respondería aun sin pago válido. Mata CA-3(e). Descartado. |
| Contenido pesado (archivo, streaming) | Complejidad sin valor demo — un JSON visible gana. |

**Justificación:** es la pieza que hace tangible INV-3 (el servicio cierra la puerta): la entrega está *condicionada a* la evidencia on-chain del recibo.
**Invalidaría:** si el verification fuera flaky por RPC devnet en vivo → el servicio hace poll con `confirmed` commitment y reintenta; el resource sigue siendo el mismo.

---

## Resumen de las 7 decisiones

| # | Decisión | Elegido | Clave |
|---|---|---|---|
| D1 | Framework | Anchor 1.2.0 | IDL + constraints; velocidad hackathon |
| D2 | Recibo | `emit!` event log | Sin rent; composición on-chain queda LATER |
| D3 | x402 | Servicio mock x402-shaped | Facilitators reales no invocan programs custom |
| D4 | Attestation | SAS real devnet, lectura de cuenta | PDA `["attestation", credential, schema, agent_wallet]`; revocación = cuenta cerrada |
| D5 | Token | SPL Token | Hooks innecesarios: enforcement está en `pay` |
| D6 | cap_diario | Día calendario UTC | `day_index = ts/86400`; borde documentado |
| D7 | Respuesta servicio | Verify tx real + JSON premium | Cierra el loop sin simular |

## Seguridad / amenazas consideradas

- **Suplantación de attestation:** re-derivación del PDA en-programa impide pasar una attestation de otro issuer/schema/agente (CA-12, CA-11).
- **Mandato cruzado:** seeds del Mandate PDA `[owner, agent]` + check `mandate.agent == signer` — un agente no puede usar mandato ajeno.
- **Replay de recibo / invoice:** el `service_ref` viaja en el evento; el servicio chequea binding payee+monto+invoice. (Protección replay completa — nonce de invoice consumido — queda como mejora documentada, no la exige spec.)
- **Privacidad (INV-1):** schema SAS de la demo = `{level: u8, issued_at: i64}` — jamás nombre/DNI; el vínculo agente→humano lo custodia el mock issuer off-chain (y en el MVP ni eso: es ficticio).
- **Devnet only (INV-5):** ninguna key en repo; keypairs de demo en `demo/keys/` (`.gitignore`); fondeo por `solana airdrop` devnet.
- **Toolchain:** builds/deploys en WSL Ubuntu (host Windows Rust roto — `docs/ENVIRONMENT.md`); posible working-copy en `$HOME` de WSL para esquivar lentitud de `/mnt/c`.

## Próximos pasos (dejan de ser diseño)

→ Fase `tasks`: descomposición en slices verticales (ver `sdd/changes/agentic-dni/design.md` §9 y `07_ARCHITECTURE.md` §repo-layout) + test plan ejecutable.
