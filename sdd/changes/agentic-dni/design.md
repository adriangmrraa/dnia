# Diseño técnico — agentic-dni (suite O+R+S)

> Estado: **ESCRITO — pendiente revisión humana** (gate de la fase `design`: viabilidad/seguridad revisadas).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Skill: `formosa-sdd-design` según `harness/SDD_PLAYBOOK.md`.
> Documentos hermanos (misma fase): `docs/06_SOLANA_DECISION.md` = registro de las 7 decisiones con opciones/tradeoffs/invalidadores · `docs/07_ARCHITECTURE.md` = diagramas, layouts completos, flujos off-chain, repo layout, estrategia WSL.
> Este archivo = artefacto SDD consolidado: qué se construye, cómo satisface la spec, qué se decidió y por qué. **No contiene código** — la fase `apply` implementa.

## 1. Arquitectura en una vista

Un **único programa custom** `agentic_gate` (Anchor 1.2.0, devnet) con instrucción atómica `pay` que exige: (1) attestation SAS real del agente pagador → (2) Mandato PDA del owner que cubra el pago → (3) transfer SPL USDC-test agente→servicio → (4) emisión de `PaymentReceipt` por event log. Complementan: **mock issuer** (servicio TS que emite/revoca attestations SAS vía `sas-lib`), **service-x/-y** (endpoints HTTP estilo-x402 que verifican la tx on-chain antes de entregar el recurso), **agent CLI** (wallets A/B, flujo 402→pay→X-Payment), **dashboard** read-only (Vite+React: ledger por eventos + estado mandato + attestation).

Diagrama completo y trust boundaries: `07_ARCHITECTURE.md` §1.

## 2. Por qué Solana (prueba de extracción aplicada al diseño)

La única capacidad que justifica chain: **un programa puede exigir la credencial dentro de la misma transacción que mueve fondos** — enforcement estructural que un JWT off-chain no puede dar (Skyfire muere ahí). Todo el diseño conserva eso: identidad = attestation SAS leída por el programa (no oráculo, no servidor), autorización = Mandate PDA con policy + contadores que solo el programa muta, evidencia = evento emitido por el programa en la misma ix. Cluster: **devnet únicamente**; RPC público devnet para servicios/dashboard; `maxSupportedTransactionVersion` en todas las lecturas (convención solana-dev skill).

## 3. Las 7 decisiones OPEN — resueltas

Resumen (detalle completo de opciones/tradeoffs/invalidadores en `06_SOLANA_DECISION.md`):

| # | Fork | Decisión | Motivo en una línea |
|---|---|---|---|
| 1 | Framework | **Anchor 1.2.0** | instalado en WSL, IDL gratis para 3 clientes TS, constraints declarativos = menos bugs de validación |
| 2 | Recibo | **Event log `emit!`** | MVP no consume recibos on-chain; cuenta-PDA queda LATER si hay composición |
| 3 | x402 | **Servicio propio x402-shaped** | facilitators reales liquidan SPL pelado, no invocan programs custom; mock da control + reproducibilidad |
| 4 | Attestation | **SAS real devnet, check por lectura de cuenta** | `sas-lib@1.0.10` + programa `22zoJM…` verificados live; re-derivación del PDA `["attestation",credential,schema,agent]` prueba issuer+schema+agente sin CPI |
| 5 | Token | **SPL Token** | transfer hooks (único feature Token-2022 relevante) serían enforcement a nivel token — contradictorio con el gate-en-programa (INV-3) |
| 6 | `cap_diario` | **Día calendario UTC** (`day_index = ts/86400`) | un campo, reset implícito, mental model instantáneo; borde-de-día documentado como limitación conocida |
| 7 | Respuesta beat 3 | **Verificación on-chain real + recurso JSON** | el servicio parsea el `PaymentReceipt` de la tx confirmada (payee/monto/invoice) antes de entregar — cierra el loop sin simular |

**Hallazgo de verificación (D4):** la revocación SAS es `CloseAttestation` — borra la cuenta, no hay flag `revoked`. El check on-chain lo modela como "attestation ausente en la PDA derivada → `AttestationMissing`" y el dashboard distingue revocada/nunca-emitida por el historial de la PDA. `expiry == 0` = sin expiración.

## 4. Estado on-chain y cuentas

- **`GateConfig`** PDA `["config"]`: `{admin, sas_credential, sas_schema, min_level, bump}` — issuer/schema confiables rotatables por admin.
- **`Mandate`** PDA `["mandate", owner, agent]`: `{owner, agent, max_per_tx, daily_cap, spent_today, day_index, total_spent, payee_whitelist<Vec≤8>, expiry, revoked, bump}` — ~426 B (reservar 512). UN mandato por par (owner, agente) — spec.
- **Attestation SAS** (cuenta ajena, programa `22zoJM…`): `{nonce=agentWallet, credential, schema, data={level:u8, issued_at:i64}, signer, expiry, token_account}`. Schema demo `agentic-dni-human-verified` v1 — **solo nivel+timestamp on-chain (INV-1)**.
- **SPL**: mint `USDC-test` (6 dec) + ATAs de agentes y servicios, creados por script.

Layouts detallados con tipos y seeds: `07_ARCHITECTURE.md` §2.

## 5. `pay` — flujo y superficie de errores

Orden exacto (todo en una tx — INV-2): **identidad** → `attestation.owner==SAS` (`AttestationMissing`) → re-derivación PDA (`IssuerNotRecognized`, CA-12) → deserializa (`AttestationMissing`) → `expiry` (`AttestationExpired`, CA-8) → `level>=min_level` (`AttestationLevelTooLow`). **Autorización** → `mandate.agent==signer` (`MandateBoundToOtherAgent`, CA-11) → `!revoked` (`MandateRevoked`, beat 6) → `expiry` (`MandateExpired`, CA-9) → whitelist (`PayeeNotWhitelisted`, beat 5b) → `amount<=max_per_tx` (`OverPerTxLimit`, beat 5a) → `spent+amount<=daily_cap` con reset por `day_index` (`OverDailyCap`, CA-10). **Efectos** → contadores del mandato. **Interacción** → CPI `token::transfer` firmado por el agente. **Recibo** → `emit!(PaymentReceipt{payer, payee, amount, service_ref, mandate, timestamp})`.

> **Post-verify W1 (sesión 18):** `GateConfig` gana `usdc_mint` y `Pay` exige `agent_ata.mint == service_ata.mint == config.usdc_mint` → `WrongMint` (constraints de accounts, antes del cuerpo); `PaymentReceipt` pasa a 7 campos incluyendo `mint`; `service-x` verifica `receipt.mint`. Migración del singleton vía ix nueva `close_config` + re-init (mismo PDA).
> **Post-verify W2 (sesión 18):** el agent CLI gana `--skip-preflight` para los pays que revierten (beats 4/5/6) — la tx aterriza fallida on-chain con signature real en lugar de morir en la simulación client-side.

Errores distinguibles por variante de `GateError` → visibles en logs/explorer/dashboard (satisface "motivo distinguible" R-02/R-03).

## 6. Instrucciones y API off-chain

Programa: `initialize_config` (con `usdc_mint` post-W1), `update_config`, `close_config` (migración de layout, post-W1), `init_mandate` (owner firma policy completa incl. whitelist — CA-2), `revoke_mandate` (beat 6), `close_mandate` (re-init post-revoke), `pay`. `update_mandate` (edición de whitelist en runtime) queda **LATER** — ningún beat/CA lo exige.

Off-chain (`07_ARCHITECTURE.md` §5): issuer `POST /attest|/revoke`, `GET /status/:wallet`; service-x `GET /api/premium` (402→verify→200); agent CLI `pay <url> <amount>` (`--skip-preflight` en reverts — ver nota post-verify W2); dashboard lee via `getSignaturesForAddress(mandate)` + parse `Program data:` + `fetchAttestation`. Repo layout completo bajo `demo/` (anchor workspace + `services/` + `dashboard/` + `scripts/`): `07_ARCHITECTURE.md` §6. `platform/` intocable; keypairs en `demo/keys/` gitignored (INV-5).

## 7. Build / test / deploy (toolchain real)

Todo Solana en **WSL Ubuntu** (`wsl -d Ubuntu -- bash -lc`): `anchor build`/`test`/`deploy`, `spl-token`, airdrops — host Windows sin toolchain Rust funcional. Working copy en `$HOME` de WSL (esquivar `/mnt/c`) con sync de fuentes + `target/idl` de vuelta al repo. Tests `anchor test` con test-validator local cargando el SAS program dumpeado de devnet (`solana program dump 22zoJM…`) → tests deterministas offline de los 12 CA. Deploy devnet desde WSL; program id publicado en `demo/.env.example`.

## 8. Amenazas y pruebas

Amenazas: suplantación de attestation (mitigada por re-derivación PDA), mandato cruzado (seeds + `mandate.agent==signer`), replay de invoice (binding `service_ref` en evento — hardening de nonce consumido queda documentado, no exigido), devnet flakiness (setup idempotente + SAS dumpeado para tests). Detalle: `06_SOLANA_DECISION.md` §seguridad.

Pruebas: `anchor test` cubre CA-1..CA-12 1:1 (definidos en `test-plan.md` en la fase tasks); servicios/dashboard se validan contra devnet real en la demo de 6 beats.

## 9. Tradeoffs y ADR links

- ADR de decisiones onchain: **`docs/06_SOLANA_DECISION.md`** (D1–D7, append-only spirit: cambios futuros se agregan, no reescriben).
- Tradeoff mayor aceptado: dependencia SAS+devnet (mitigada por dump en validator); simplicidad del día calendario vs rolling 24h; evento vs cuenta de recibo.
- Registrado como "qué invalidaría" por decisión en `06` — sirve como trigger de revisión en iteraciones futuras.

## 10. Estado y gate

Diseño completo, 7 decisiones resueltas, sin forks genuinos abiertos que requieran humano (todas las opciones tenían una elección técnicamente dominante dentro del scope aprobado). **Próximo paso:** revisión humana de este diseño + `06` + `07` → al aprobar, fase `tasks` (`tasks.md` + `test-plan.md`).
