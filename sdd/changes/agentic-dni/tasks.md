# Tasks (vertical slices) — agentic-dni

> Estado: **ESCRITO — pendiente aprobación humana del PRIMER SLICE** (gate de la fase `tasks` según `harness/SDD_PLAYBOOK.md`).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Skill: `formosa-sdd-tasks`.
> Fuentes: `spec.md` (R-01..R-10, CA-1..CA-12, INV-1..INV-5) · `design.md` · `docs/06_SOLANA_DECISION.md` (D1–D7) · `docs/07_ARCHITECTURE.md` (layouts, flujo `pay`, repo layout, estrategia WSL) · `docs/ENVIRONMENT.md` (toolchain real).
> Reglas: todo el código bajo `demo/`; `platform/` intocable. Toolchain Solana SOLO en WSL: `wsl -d Ubuntu -- bash -lc "<cmd>"` (nunca `cargo` en Windows). Commits por slice: Conventional Commits en español, sin atribución IA. Nunca marcar `[x]` sin la aceptación ejecutada y registrada.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas totales | ~1.700–2.300 (programa ~400, tests ~500, servicios ~450, dashboard ~350, scripts ~250) |
| Riesgo de revisión | ALTO en volumen; mitigado por 8 slices chicos, cada uno con aceptación chequeable end-to-end |
| PRs encadenados | **No aplica** — repo local de hackathon, sin flujo PR/reviewer; forecast informativo para el humano |
| Estrategia | slice-by-slice con verificación real por slice; parar y reportar si una aceptación falla |

## Orden y dependencias

`S1 toolchain → S2 SAS-en-validator → S3 pay → S4 reverts → S5 devnet → S6 servicios+agente → S7 dashboard → S8 demo`.
S2 se adelanta a cualquier código de `pay` porque es el mayor riesgo técnico (dump + sas-lib en validator). S7 solo necesita datos on-chain de S5/S6. S8 cierra todo.

**Primer slice recomendado para aprobación: S1.**

## S1 — Scaffold `demo/` + pipeline WSL + GateConfig  ← PRIMER SLICE A APROBAR

Workspace Anchor compilable + cadena build/test en WSL probada de punta a punta (deriva el mayor riesgo de tooling).

- [ ] Crear `demo/`: `Anchor.toml`, `Cargo.toml` (workspace), `package.json` (workspaces TS), `.gitignore` (`keys/`, `.env`, `target/`, `node_modules`), `.env.example`.
- [ ] `programs/agentic-gate/{Cargo.toml,src/lib.rs}`: `initialize_config(admin, sas_credential, sas_schema, min_level)` + `update_config` (solo admin) + cuenta `GateConfig` (PDA `["config"]`) + skeleton `GateError`.
- [ ] `scripts/wsl_sync.sh`: sync `demo/` → `~/agentic-dni-demo` en WSL (sin `target/`) y de vuelta fuentes + `target/idl/*.json` + `target/deploy/*.so`.
- [ ] `tests/agentic-gate.ts` smoke: `initialize_config` persiste los 4 campos; `update_config` con non-admin revierte.
- **Aceptación:** `anchor build` y `anchor test` verdes en WSL; GateConfig legible on-chain con campos exactos.
- **Cubre:** R-09 (estructura repo), R-10/INV-5 (gitignore keys/.env), base de R-01.

## S2 — SAS dumpeado en test-validator + helpers de test

SAS real dentro del validator local = tests deterministas offline. Idempotente.

- [ ] `scripts/dump_sas.sh` (WSL, idempotente): `solana program dump 22zoJM… -u devnet -o tests/fixtures/sas.so` (skip si existe salvo `--force`); fixture commiteado para determinismo.
- [ ] `Anchor.toml`: `[[test.genesis]]` con `address = "22zoJM…"` + `program = "tests/fixtures/sas.so"` (equivale a `--bpf-program`; fallback documentado: validator manual + `anchor test --skip-local-validator`).
- [ ] `tests/helpers/sas.ts`: bootstrap del issuer en validator (create credential + schema `agentic-dni-human-verified` v1) + helpers `attest(wallet, level, expiry)` / `revoke(wallet)` vía `sas-lib` contra `localhost:8899`.
- [ ] `tests/helpers/token.ts` + `keys.ts`: mint USDC-test (6 dec) + ATAs + `mintTo` para A/B/X/Y; keypairs de roles.
- [ ] Smoke en `tests/agentic-gate.ts`: credential→schema→attestation creados en validator y `fetchAttestation` la lee.
- **Aceptación:** `anchor test` levanta validator con SAS cargado y el smoke pasa; mint+ATA funcionan.
- **Cubre:** mitigación D4, base R-07, enabler de todos los tests `pay`. Fallback si el dump falla: mock de cuenta con mismo layout (registrar en `docs/DECISIONS.md`).

## S3 — `init_mandate` + `pay` completo (happy path + huérfano)

El corazón del gate: los 14 pasos del diseño en una ix atómica.

- [ ] `lib.rs`: cuenta `Mandate` (PDA `["mandate", owner, agent]`, reservar 512 B) + `init_mandate(agent, max_per_tx, daily_cap, payees[≤8], expiry)` + `GateError` completo.
- [ ] `lib.rs`: `pay(amount, service_ref[16])` — checks identidad (owner==SAS, re-derivación PDA, deserializa, expiry, `level>=min_level`) → autorización (`agent==signer`, `!revoked`, expiry, whitelist, `max_per_tx`, cap día UTC por `day_index`) → contadores → CPI `token::transfer` (firma agente) → `emit!(PaymentReceipt{payer,payee,amount,service_ref,mandate,timestamp})`.
- [ ] Tests: CA-2 (policy exacta + contadores 0), CA-3 (tx confirma; X recibe 0.50 exacto; evento parseado con los 6 campos; `spent_today` += 0.50), CA-4 (B sin attestation → `AttestationMissing`, balance X sin cambio, sin evento).
- **Aceptación:** `anchor test` verde para CA-2/CA-3/CA-4.
- **Cubre:** R-01..R-05, INV-2, beats 2–4 (parte on-chain).

## S4 — Revocación + matriz de reverts (CA-5..CA-12)

- [ ] `lib.rs`: `revoke_mandate` (solo owner) + `close_mandate` (devuelve rent, permite re-init).
- [ ] Tests: CA-5a `OverPerTxLimit` ($10>$5), CA-5b `PayeeNotWhitelisted` ($0.50 a Y), CA-6-onchain (`revoke_mandate` → siguiente `pay` revierte `MandateRevoked`), CA-7 (issuer cierra attestation → `AttestationMissing`), CA-8 (attestation expiry≈now+10s → `AttestationExpired`), CA-9 (mandato expiry corto → `MandateExpired`), CA-10 (cap 0.75: 2do pago de 0.50 → `OverDailyCap`), CA-11 (agente C firmando con Mandate PDA de A → revert seeds/`MandateBoundToOtherAgent`), CA-12 (attestation de otro credential/schema → `IssuerNotRecognized`). En cada revert: assert sin transfer ni evento.
- **Aceptación:** `anchor test` cubre CA-1..CA-12 (CA-1 lo satisface el bootstrap de S2). Estrategia tiempo-dependiente en `test-plan.md`.
- **Cubre:** R-02/R-03 completo, R-06, beats 5–6 (parte on-chain), seguridad "solo owner muta mandato".

## S5 — Deploy devnet + setup de actores reales

- [ ] `scripts/setup_devnet.sh` (WSL, idempotente): keypairs demo → `demo/keys/` (gitignored) → airdrops → mint USDC-test + ATAs + `mintTo` → direcciones a `demo/.env`.
- [ ] `scripts/setup_sas.ts`: credential + schema SAS REALES en devnet → imprime `sas_credential`/`sas_schema` → `demo/.env`.
- [ ] `scripts/build_deploy.sh` (WSL): `anchor build` → `anchor deploy --provider.cluster devnet` → `initialize_config` con los SAS reales; program id a `.env.example`.
- **Aceptación:** programa live en devnet (verificable en explorer), `GateConfig` apuntando a SAS real, actores fondeados con USDC-test.
- **Cubre:** R-09, R-10, INV-5.

## S6 — Issuer + agente CLI + servicio x402 (loop real en devnet)

- [ ] `services/issuer/`: `POST /attest`, `POST /revoke`, `GET /status/:wallet` vía sas-lib (keypair en `.env` local).
- [ ] `services/service-x/`: `GET /api/premium` — sin `X-Payment` → 402 + requirements {scheme, payee, price, mint, programId, invoice}; con `X-Payment:<sig>` → `getTransaction` (maxSupportedTransactionVersion) → parsea `PaymentReceipt` → verifica payee/monto/invoice → 200 JSON premium + eco del recibo. Parametrizable por `PAYEE_WALLET` (instancias X e Y).
- [ ] `agent/` CLI: `agent pay <url> <amount>` — request → parsea 402 → construye ix `pay` desde IDL → tx → retry con `X-Payment` → imprime respuesta. Wallets `keys/agent-{a,b}.json`.
- **Aceptación (integración real devnet):** `agent pay` a X completa 402→pay→200 con recurso; mismo intento a Y revierte `PayeeNotWhitelisted` on-chain; issuer revoca/re-emite attestation y `status` lo refleja.
- **Cubre:** R-07, D3/D7, CA-3(e), CA-4/CA-5b integrados.

## S7 — Dashboard read-only (3 paneles)

- [ ] `dashboard/` (Vite+React, sin wallet, read-only): ledger por `getSignaturesForAddress(mandatePda)` + `getTransaction` + parse `Program data:` con IDL (cada línea linkea al explorer); panel mandato (policy, spent/cap, expiry, revoked); panel attestation (`fetchAttestation`: vigente/expirada/inexistente — historial de la PDA distingue revocada de nunca-emitida).
- **Aceptación:** `pnpm dev` muestra el pago de S6 como línea verificable + estados de mandato/attestation correctos; cero PII (INV-1); el dashboard no firma ni escribe.
- **Cubre:** R-08, CA-6 (parte dashboard), legibilidad del jurado.

## S8 — Orquestación de la demo de 6 beats + docs

- [ ] `scripts/run_beats.sh`: beats 1–6 encadenados (attest A → init_mandate → pay feliz → pay B huérfano → over-limit + payee Y → revoke + pay final revertido) imprimiendo signatures/URLs.
- [ ] `demo/README.md`: guion ~90 seg + checklist de verificación explorer por beat.
- [ ] Ejecución real en devnet de los 6 beats; evidencia (signatures) registrada en `docs/SESSION_LOG.md`.
- **Aceptación:** los 6 beats corren en devnet con el dashboard reflejando la revocación en vivo.
- **Cubre:** CA-1..CA-6 end-to-end, R-08..R-10, cierre del MVP definido en proposal.

## Reglas de ejecución (para `apply`)

- TDD donde viable: test CA primero (RED) → implementar (GREEN) → limpiar (REFACTOR).
- `anchor test` SIEMPRE en WSL contra validator con SAS dumpeado; servicios/dashboard en Windows Node o WSL.
- Parar y reportar si: el dump SAS falla (aplicar fallback mock-cuenta + registrar en `docs/DECISIONS.md`), `sas-lib` drift (pinear `1.0.10`), o devnet flaky bloquea S5+.
- Scope congelado: `update_mandate`, recibo-PDA, multi-issuer quedan LATER (diseño §9) — no agregarlos sin nuevo cambio SDD.
