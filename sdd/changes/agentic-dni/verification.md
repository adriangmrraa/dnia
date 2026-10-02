# Verificación agentic-dni

Estado: **EJECUTADA — PASS CON WARNINGS** (02/10/2026, sesión 17 — revisor adversarial fresco; ningún claim se aceptó sin evidencia propia).

Método: (1) spec/design/tasks/test-plan leídos completos; (2) código `demo/` inspeccionado estáticamente; (3) **re-ejecución propia** de la suite en WSL (`npx ts-mocha` → **20 passing (9s)** — mismo resultado que el claim, no copiado); (4) **verificación on-chain independiente** vía `wsl -d Ubuntu` solana-cli 4.3.0 + scripts propios de decodificación (program show, confirm -v, account raw-decode, getSignaturesForAddress, derive PDA con web3.js); (5) chequeos de repo (git log/diff/status/check-ignore, scan de secretos).

Demo usuario real o simulación: **evidencia devnet real re-verificada**; la demo en vivo (beats con servicios levantados) no se re-corrió — los servicios no están corriendo ahora — pero cada artefacto on-chain que la demo dejó fue verificado independientemente.

## Tabla de criterios

| Criterio | Test/comando/observación | Resultado | Evidencia | Bug/limitación |
|---|---|---|---|---|
| R-01 `pay` atómico en programa custom | `solana program show D8pcKtez… -u devnet` + `confirm -v` beat-3 + lectura de `lib.rs` | **PASS** | Programa live (BPFLoaderUpgradeable, authority=F3ij…=owner, slot 506707105, 192280 B). Tx `tkfFin…`: `Instruction: Pay` → CPI `Tokenkeg…` → `Program data:` con PaymentReceipt, Status Ok — los 4 efectos en 1 tx | — |
| R-02 check attestation | Código `pay` (owner==SAS → re-derivación PDA → disc=2 → expiry → level) + tests CA-4/CA-7/CA-8 verdes en mi run | **PASS** | 20/20 tests. Errores distinguibles: `AttestationMissing`/`AttestationExpired`/`IssuerNotRecognized`/`AttestationLevelTooLow` | reverts de la demo no quedan on-chain (ver WARNING-2) |
| R-03 check mandato | Código (agent==signer, !revoked, expiry, whitelist, max_per_tx, cap día UTC) + tests CA-5a/5b/9/10/11 verdes | **PASS** | Las 5 condiciones revert probadas; `MandateBoundToOtherAgent` funciona gracias a seeds derivadas de campos almacenados | — |
| R-04 transfer USDC | Decode raw de las ATAs del tx beat-3 (`verify_ata.cjs` propio) | **PASS** | `agent_ata`/`service_ata` del tx son mint `gmfqCXG6…` (USDC-test, Tokenkeg); service_ata balance=1.500.000 = los 3 pagos de $0.50 | **WARNING-1**: `pay` no exige el mint — ver hallazgo |
| R-05 recibo 6 campos | Decode propio del `Program data:` b64 del tx `tkfFin…` (python, sin depender del IDL del repo) | **PASS** | `{payer:EVtj…(A), payee:9TPf…(X), amount:500000, service_ref:e4fe4b4c6751262641a37e19376789e2, mandate:3S7N…, timestamp:1790963342}` — los 6 campos, invoice matchea el claim | SUGGESTION: el test CA-3 no asserta `service_ref` puntualmente (los otros 5 sí); el binding invoice↔receipt sí se ejerce e2e en service-x |
| R-06 mandato crear/revocar | `initMandate` txs `5Fxx…`(A)/`5gKu…`(B) confirmadas; `t2rE…` = `Instruction: RevokeMandate` Status Ok; estado actual `revoked:true` decodificado por mí | **PASS** | Mandato PDA `3S7N…`: owner=F3ij, agent=EVtj, max=5M, cap=10M, spent=1.5M, whitelist=[X], revoked=true — solo owner puede mutar (`has_one`, test Unauthorized verde) | — |
| R-07 mock issuer | Código `services/issuer` (sas-lib real) + txs SAS `tcRH…`(create)/`4KKd…`(close)/`5nMU…`(re-create) confirmadas con `Program 22zoJM… invoke` | **PASS** | Historial de la attestation PDA A muestra create→close→create; es la MISMA cuenta que `pay` lee (no hay bypass — el check re-deriva esa PDA) | SUGGESTION: `/attest` sin auth (mock documentado, ok demo) |
| R-08 dashboard read-only | Re-ejecuté `scripts/check_dashboard_data.ts` (MISMA `gate.ts` que la UI) contra devnet live | **PASS** | Salida real ahora: mandato `revocado`, totalSpent $1.50, attestation `vigente` level 2, ledger 5 txs con refs de invoice distintos. Código: solo RPCs de lectura, sin keypair/wallet-adapter | — |
| R-09 actores demo + código solo en `demo/` | `.env.example` (pubkeys) + `git diff bd73b9d..HEAD --name-only` + PDAs/ATAs on-chain | **PASS** | owner/A/B/X/Y/issuer/mint existen en devnet; todo archivo nuevo bajo `demo/`; fuera solo docs SDD (PROJECT_STATE/DECISIONS/SESSION_LOG/STATUS/tasks). `platform/` ni siquiera existe en este repo — boundary vacuously cumplida | — |
| R-10 devnet only / sin secretos | `git check-ignore` sobre `keys/*` y `.env`; scan regex de secretos en archivos trackeados; todas las txs en devnet | **PASS** | `git ls-files demo/keys/` = solo `.gitkeep`; `.env` ignorado; `.env.example` solo pubkeys; scan sin matches de keypairs; cero interacción mainnet | — |
| CA-1 attestation A legible sin PII | `solana account pAht9t8U…` decodificado a mano | **PASS** | owner=SAS, disc=2, nonce=A, credential/schema del mock issuer, `data`=9 bytes `{level:2, issued_at:1790962656}`, signer=issuer, expiry=0. Cero PII | — |
| CA-2 mandato con policy exacta | Decode raw del Mandate PDA | **PASS** | max_per_tx=5.000.000, daily_cap=10.000.000, whitelist=[X], owner/agent correctos | SUGGESTION: spec ejemplificaba `expiry=mañana`; el mandato real tiene `expiry=0` (sin expiración) — mecanismo de expiry probado aparte en CA-9 |
| CA-3 pago feliz 5 efectos | `confirm -v tkfFin…` + decode recibo + balances ATA | **PASS** | tx confirma; 500.000 base-units A→X; recibo 6 campos; contadores +0.50 (spent_today=1.5M tras 3 pagos — consistente); servicio entregó 200 (claim + código de verificación real leído) | entrega del recurso (e) verificada por claim+código; el servicio no corre ahora para re-ejecutar |
| CA-4 B huérfano revierte | PDA attestation B = `DHmB6ciG…` derivada por mí → cuenta inexistente, historial 0; mandato B existe (`8SVzx…`, owner=gate); test CA-4 verde | **PASS** | Precondición "nunca-emitida" cierta on-chain; revert `AttestationMissing` probado en suite + claimado en beat-4 | el revert no dejó tx on-chain (preflight) — WARNING-2 |
| CA-5 over-limit + payee-Y | Tests CA-5a/CA-5b verdes en mi run | **PASS** | `OverPerTxLimit` y `PayeeNotWhitelisted` distinguibles; balances inmutables assertados | misma nota de visibilidad on-chain |
| CA-6 revoke mata pay siguiente | `t2rE…` RevokeMandate Ok; mandato ahora `revoked:true`; dashboard-layer muestra "revocado"; pay posterior → MandateRevoked (claim + test CA-6 verde) | **PASS** | Secuencia completa consistente con estado on-chain actual | idem |
| CA-7..CA-12 edge cases | `npx ts-mocha` propio: 20/20 | **PASS** | CA-7 CloseAttestation real→`AttestationMissing`; CA-8/9 `timeTravelToTimestamp` determinista→`AttestationExpired`/`MandateExpired`; CA-10 `OverDailyCap`; CA-11 `MandateBoundToOtherAgent`; CA-12 issuer foráneo real→`IssuerNotRecognized` | — |
| INV-1 privacidad | Raw decode attestation + dashboard code | **PASS** | Solo `{level,issued_at}` en data; dashboard muestra nivel/estado/tiempos, nada del humano | — |
| INV-2 atomicidad | `pay` = ix única; tests assertan balances/evento ausentes en cada revert | **PASS** | Atomicidad runtime + checks-antes-de-efectos en el orden del diseño | — |
| INV-3 honestidad estructural | `demo/README.md` §"Limitación honesta" + `docs/06` §seguridad | **PASS** | Declarado explícitamente: gate protege al vendedor; SPL libres por fuera | — |
| INV-4 único programa custom | `Anchor.toml` un programa; `attestation` es `UncheckedAccount` leída, sin CPI a SAS | **PASS** | SAS consumido solo por lectura (re-derivación PDA) | — |
| INV-5 devnet + sin secretos | git check-ignore + scan + todo evidencia en devnet | **PASS** | ver R-10 | — |

## Decisiones de diseño vs implementación (D1–D7)

| D | Decisión | Verificado | Nota |
|---|---|---|---|
| D1 Anchor 1.2.0 | ✓ | `anchor-lang` en Cargo, IDL consumido por 3 clientes | — |
| D2 recibo `emit!` | ✓ | evento en `Program data:`, sin cuenta extra | — |
| D3 servicio x402-shaped | ✓ | 402 requirements {scheme,payee,price,mint,programId,invoice} + X-Payment verify | — |
| D4 SAS real por lectura | ✓ | seeds `["attestation",cred,schema,agent]` re-derivadas en-programa; revocación=CloseAttestation | discriminadores corregidos empíricamente (DECISIONS.md) |
| D5 SPL Token | ✓ | `token::transfer` + mint `Tokenkeg`-owned | ver WARNING-1 (mint no atado) |
| D6 día calendario UTC | ✓ | `day_index = ts/86400`, reset implícito | borde-de-día documentado |
| D7 verify tx real + JSON | ✓ | service-x parsea `PaymentReceipt` de la tx confirmada antes de entregar | invoice single-use consumido |

## Hallazgos

### WARNING-1 — `pay` no ata el pago al mint USDC (seguridad real del gate)
`lib.rs` sólo exige `agent_ata.owner == agent` y `service_ata.owner == service` — ningún constraint de mint. `service-x` verifica `payee`/`amount`/`invoice` del `PaymentReceipt` (que **no incluye mint**) y jamás inspecciona los token accounts de la tx. Exploit: un agente crea un mint sin valor, abre el ATA de ese mint para el servicio (creación permissionless) y llama `pay` — todos los checks pasan, el recibo dice `payee=X, amount=500000`, el servicio entrega el recurso cobrado en tokens basura. La evidencia devnet real SÍ usó el mint correcto (lo verifiqué decodificando las ATAs del tx `tkfFin…`), así que el MVP se comporta bien en el camino honesto — pero un gate de pagos que acepta cualquier token es un hueco real para el claim "mueve USDC". Fix acotado: `usdc_mint` en `GateConfig` + `constraint` `agent_ata.mint == config.usdc_mint && service_ata.mint == config.usdc_mint` (o incluir mint en el recibo + check en service-x).

### WARNING-2 — Los reverts de la demo no quedan on-chain (brecha de auditabilidad)
El agente CLI usa `.rpc()` sin `skipPreflight` → los `pay` que revierten mueren en simulación client-side y **nunca se graban como txs fallidas**. Lo confirmé: `getSignaturesForAddress` del agente A muestra 5 txs, cero con `err`; igual en el mandato. El GateError es genuino (la simulación corre el binario real del programa y devuelve el código exacto — y la suite lo prueba on-runtime), pero el checklist del README ("tx fallida" verificable en explorer para beats 4/5/6) promete algo que no puede existir: no hay signature que abrir. Fix: enviar los pays de los beats de revert con `skipPreflight: true` (quedan como txs fallidas inspeccionables) o reword del checklist.

### SUGGESTION-1 — `expiry` del mandato demo = 0 (spec ejemplificaba "mañana")
Cosmético: el mecanismo de expiry está probado (CA-9). Si se quiere fidelidad literal al guion, re-init con expiry real o ajustar la spec.

### SUGGESTION-2 — Assert puntual de `service_ref` en el test CA-3
El test verifica 5/6 campos del recibo; `service_ref` queda cubierto e2e por el invoice-binding de service-x, pero el assert directo vale una línea.

### SUGGESTION-3 — Hardening menor (post-hackathon)
`initialize_config` deja que el primer llamante fije `admin` (irrelevante hoy — config ya inicializada) e issuer `/attest` no autentica el caller (mock). Ninguno viola spec; documentarlos si se pitchea como producción.

## Veredicto

**PASS CON WARNINGS.** Los 10 requisitos y los 12 criterios de aceptación quedan probados con evidencia que YO generé (no transcrita): 20/20 tests re-corridos, 9/9 signatures devnet confirmadas con su instrucción esperada, recibo decodificado a mano desde `Program data:`, estados de mandato/attestation decodificados raw y re-derivación de PDAs propia. Los 5 invariantes se mantienen. Los warnings no invalidan spec: son huecos de hardening/auditabilidad a registrar antes de archive — el WARNING-1 conviene fixearlo o declararlo en el pitch/demo.

---

## Addendum post-verify — sesión 18 (02/10/2026): W1 y W2 RESUELTOS

El humano aprobó fixear ambos warnings antes de archive. Resultado: **los dos quedan RESUELTOS con evidencia devnet nueva**; los SUGGESTION quedan registrados sin cambios (cosméticos/post-hackathon).

### WARNING-1 → RESUELTO (mint bound)

- `GateConfig` gana `usdc_mint: Pubkey` (set en `initialize_config`, firma `(admin, sas_credential, sas_schema, usdc_mint, min_level)`); cuenta +32 B.
- `Pay` exige `agent_ata.mint == config.usdc_mint` y `service_ata.mint == config.usdc_mint` → `GateError::WrongMint` (nueva variante).
- `PaymentReceipt` pasa a **7 campos** (`mint` incluido) — el recibo declara el activo cobrado; `service-x` además verifica `receipt.mint === USDC_MINT`.
- Migración del singleton: ix nueva `close_config` (seeds + discriminador + `admin` a bytes crudos del layout viejo) → close tx `5AwRPjsFSmr9jboNvKdgTE7Kvav3DqpJpyW9AtzGDyvpaWDysPrvWG4tiNSXFyY2dRQSv3EHN9q5QTj7hTPq8N4A` + re-init tx `35QuEqjic1awUS5Jfbp1YEy231mhtPRvXrcMv7yoMi6SaXGx3Q7Vzkn2s5NW7cJkXxZRb2sRrCmCSaWNXqfMjiMk` con `usdc_mint=gmfqCXG6…` (mismo PDA `AD8km3tH…`).
- Test nuevo **CA-13**: pay con mint ajeno revierte `WrongMint`, sin transfer ni evento.
- Redeploy: upgrade tx `5WsEeB132qdZMpiZBioxKvHPJWY3v8T5Mtoo8Fmvo74fzoTDcDZ1uVYkuc2jeA7GjXYWQj63wewskAKZbW9ErFiM` — **mismo Program ID `D8pcKtez…`** (authority = owner `F3ij…`).
- Evidencia e2e: beat-3 de la corrida final `3W9HSVZFQ6FQoH8XVusA4t38PpRMEbjMbjc53GKWxjwPL4R4DzasucES3oRzHrhTGYqAmhuiHEC9gUVk6Sbdwnm8` → receipt con `mint=gmfqCXG6…` en el response 200 del servicio.

### WARNING-2 → RESUELTO (reverts on-chain)

- `agent/src/pay.ts --skip-preflight`: envío manual `sendRawTransaction({skipPreflight:true})` + lectura autoritativa con `getTransaction` (tolera el rechazo race de `confirmTransaction`); imprime `pay REVERTIDO on-chain: <GateError>` + signature + link explorer. Pays felices conservan preflight normal (`.rpc()`).
- `run_beats.sh` usa el flag en beats 4/5/6 → corrida final con **4 txs fallidas reales**:
  - B4 `AttestationMissing` → `5fQegTbiTwtJ6YmQq3xDv2qjsY6hpwT5j4J55raCVXzikRnsD33qocnFpnb3sesMF8bwiHiiU735quabdKm5XXSo` — verificada con `solana confirm -v`: `Status: Error … custom program error: 0x1772` (6002), fee cobrado.
  - B5a `OverPerTxLimit` → `4CkKhEjSEWTmJGMxmmx1vHGMgE7SPRJw2oesroYiE5VCLfSaG7Q4q7D526N48A8T985vgw4MdHT2VsoES1qTqswk`
  - B5b `PayeeNotWhitelisted` → `5MPXz1Zyoyhki4t4YWrsJVHBX7ZxAREufti9wa7Tp1qBgk8K4qFncE6hykn6vYBrGaKTiiYRzePbWtqSHKMbARAT`
  - B6 `MandateRevoked` → `5V82hQsLUi2CmB4VTXd3ntuJcwzW9hEtcxVpQCMF4CwdswE4cRDcQjQPqBKZpUBAaAGaRXWLQYwfZtC8JEM6UrL9` (revoke OK: `sXwCv8ua47kwRCpwFqcZHQJ9CPLj22yCabhWepZgm46tMFGevhWpnXcf7RBQzYJSrf29JVL2SeufJtAf1VQT9JG`)
- README checklist corregido: cada beat de revert linkea a una tx **fallida real** con `err` + `Error Code` en logs.

### Suite post-fix

`npx ts-mocha` (WSL, surfpool embebido) → **21 passing** (20 previos + CA-13 WrongMint). Flake conocido: un run murió en `before` de S1 por surfpool (`surfnet_writeProgram` conn refused) — infra, no programa; re-run verde.

### Veredicto actualizado

**PASS — warnings cerrados.** R-01..R-10, CA-1..CA-13 e INV-1..5 con evidencia: 21/21 tests + redeploy mismo program id + GateConfig migrado + 6 beats con signatures de éxito Y de reverts on-chain reales.
