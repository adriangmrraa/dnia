# Plan de pruebas — agentic-dni

> Estado: **ESCRITO — pendiente aprobación junto con `tasks.md`** (gate de la fase `tasks`: aprobar primer slice).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Cobertura: spec CA-1..CA-12 + INV-1..INV-5.
> Ejecución: `anchor test` SOLO en WSL — `wsl -d Ubuntu -- bash -lc "cd ~/agentic-dni-demo && anchor test"`. Servicios/dashboard: Node 22 (Windows o WSL). Toda evidencia real se registra en `docs/SESSION_LOG.md` (comando + salida resumida, sin secretos).
> RED → GREEN → REFACTOR donde viable: cada CA se escribe como test que falla antes de implementar el check.

## Infraestructura de test (S2)

- **Validator local determinista:** `tests/fixtures/sas.so` = `solana program dump 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG -u devnet` (script `scripts/dump_sas.sh`, idempotente; fixture commiteado). `Anchor.toml` lo carga vía `[[test.genesis]]` (`address` + `program`). Fallback si `test.genesis` no aplica en anchor 1.2.0: `solana-test-validator --bpf-program 22zoJM… tests/fixtures/sas.so` manual + `anchor test --skip-local-validator`.
- **Setup idempotente** en `before()`: keypairs de roles (owner, agenteA, agenteB, agenteC, servicioX, servicioY, issuer), bootstrap SAS en validator (credential + schema `agentic-dni-human-verified` v1 vía `sas-lib`), mint USDC-test 6 dec + ATAs + `mintTo`.
- **Parsing de recibo:** decodificar líneas `Program data:` del log de la tx con el IDL (`PaymentReceipt` event) — mismo mecanismo que usará el dashboard.
- **Helpers de tiempo:** `waitUntil(ts)` = poll de `pay` o `getBlockTime` hasta superar `expiry` (ver §tiempo).

## Nivel 1 — `anchor test` en validator local (programa `agentic_gate`)

Mapa 1:1 CA → caso. Todo revert lleva doble assert: **error distinguible** + **sin efectos parciales** (balances intactos, sin evento — INV-2).

| CA | Test (`tests/agentic-gate.ts`) | Arrange | Assert |
|---|---|---|---|
| CA-1 | `bootstrap SAS emite attestation de A` | issuer crea credential+schema+`attest(agentA, level=1)` en `before()` | `fetchAttestation` la lee en la PDA derivada; `data` decodifica `{level, issued_at}` únicamente — sin PII (INV-1) |
| CA-2 | `init_mandate persiste policy` | owner firma `init_mandate(A, 5e6, cap, [X], expiry=mañana)` | Mandate PDA: campos exactos, `spent_today=total_spent=0`, ligado a (owner,A) |
| CA-3 | `pay feliz $0.50` | A attested + mandato cubre | tx confirma; `ataX` +=500000; evento con 6 campos correctos; `spent_today`+=500000 |
| CA-4 | `agente huérfano revierte` | B sin attestation → `pay(0.5, X)` | `AttestationMissing`; `ataX` sin cambio; sin evento |
| CA-5a | `over-limit revierte` | A → `pay(10, X)` | `OverPerTxLimit`; sin efectos |
| CA-5b | `payee no whitelisted revierte` | A → `pay(0.5, Y)` | `PayeeNotWhitelisted`; sin efectos |
| CA-6 | `revocación mata el siguiente pay` | owner `revoke_mandate` → A → `pay(0.5, X)` | la revocación confirma; el pay revierte `MandateRevoked` |
| CA-7 | `attestation revocada revierte` | issuer `CloseAttestation` de A → `pay` | `AttestationMissing` (cuenta inexistente — hallazgo D4) |
| CA-8 | `attestation expirada revierte` | attestation con `expiry=now+10s`; esperar | `AttestationExpired` |
| CA-9 | `mandato expirado revierte` | `init_mandate` con `expiry=now+10s`; esperar | `MandateExpired` |
| CA-10 | `cap diario revierte el excedente` | `daily_cap=0.75`: `pay(0.5)` OK → `pay(0.5)` | 2do revierte `OverDailyCap`; `spent_today` queda 0.5 |
| CA-11 | `mandato ligado a otro agente` | agenteC firma pasando Mandate PDA de (owner,A) | revert (seeds constraint o `MandateBoundToOtherAgent`); sin efectos |
| CA-12 | `issuer/schema no reconocido` | attestation de A bajo credential2/schema2 alternativos | `IssuerNotRecognized` por fallo de re-derivación PDA |

**Tests unitarios extra (seguridad, no-CA):** `update_config`/`init_mandate`/`revoke_mandate`/`close_mandate` con firmante ≠ owner/admin → revert; `init_mandate` duplicado en mismo PDA → revert; `init_mandate` con `payees.len()>8` → revert; `pay` con `amount=0` → decisión menor de apply (default recomendado: exigir `amount>0` con error `InvalidAmount`; spec no lo fija).

### Estrategia para casos tiempo-dependientes (CA-8 / CA-9)

- **Default: fixtures de expiración corta + espera.** `expiry = now + ~10s` al crear (SAS exige `expiry==0 || expiry>now` — un expiry futuro cercano es válido); luego `waitUntil` reintenta `pay` cada ~2s hasta revert `AttestationExpired`/`MandateExpired` con timeout de ~60s. Robusta aunque el Clock del validator no avance a ritmo exacto de wall-clock.
- **Alternativa (si SAS rechaza expiries cortos o el Clock no avanza):** run dedicado con `solana-test-validator --warp-slot N`/`[test.validator] warp_slot` para saltar el tiempo al arrancar, en archivo de test separado (el warp invalidaría los fixtures "expiry=mañana" del mismo ledger).
- **No usar** `expiry` en el pasado al crear: SAS probablemente lo rechaza y un mandato "ya vencido al nacer" es un artefacto confuso.

## Nivel 2 — Integración devnet (servicios + agente, S6)

| Caso | Cómo se verifica |
|---|---|
| Issuer `POST /attest` → `GET /status` | attestation visible vía `fetchAttestation` en devnet; `POST /revoke` → cuenta inexistente; `status` refleja ambos estados |
| `service-x` sin `X-Payment` | responde `402` con requirements exactos `{scheme:"agentic-gate", payee, price, mint, programId, invoice}` |
| `service-x` con pago válido | `agent pay <url-x> 0.50` → tx `pay` confirma → retry con `X-Payment` → `200` con recurso JSON + eco del recibo (CA-3e) |
| `service-x` rechaza evidencia inválida | sig de tx ajena / monto < price / `service_ref` ≠ invoice → NO entrega (4xx) |
| `service-y` (no whitelisted) | `agent pay <url-y> 0.50` → la tx `pay` revierte `PayeeNotWhitelisted` on-chain → nunca hay `X-Payment`, nunca 200 |

## Nivel 3 — Smoke devnet / demo end-to-end (S7 + S8)

| Beat | Verificación |
|---|---|
| 1–3 | attestation + mandato + `pay` feliz visibles en explorer y dashboard; servicio entrega recurso |
| 4–5 | reverts de B / over-limit / Y visibles con motivo distinguible en logs/explorer |
| 6 | dashboard lista el pago del beat 3 con link al explorer; `revoke_mandate` → dashboard muestra "revocado" → siguiente `pay` revierte (CA-6 completo) |
| Dashboard | `pnpm dev` read-only: ledger parseado de `Program data:`, estado mandato y attestation correctos; sin PII (INV-1) |

## Invariantes verificadas en la suite

- **INV-1:** asserts de `data=={level,issued_at}` + revisión del dashboard.
- **INV-2:** en TODO revert: balances sin cambio + sin evento `PaymentReceipt` en logs.
- **INV-4:** un solo programa propio en `Anchor.toml`; SAS consumido solo por lectura.
- **INV-5:** `demo/keys/` y `.env` en `.gitignore`; `git status` sin secretos; solo devnet.

## Evidencia

Cada nivel deja registro real: salida resumida de `anchor test` (tests pasados), signatures devnet para niveles 2–3, capturas/links del dashboard. Sin evidencia → slice no se marca `[x]`.
