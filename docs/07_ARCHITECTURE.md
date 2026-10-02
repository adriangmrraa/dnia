# Arquitectura — agentic-dni (suite O+R+S)

> **Estado:** ESCRITO — pendiente revisión humana (gate de la fase `design`).
> Fecha: 02/10/2026 · Cambio SDD: `agentic-dni` · Fase: `design`
> Decisiones onchain (opciones/tradeoffs/invalidadores): `docs/06_SOLANA_DECISION.md` (D1–D7). Requisitos: `sdd/changes/agentic-dni/spec.md` (R-01..R-10, CA-1..CA-12, INV-1..INV-5).
> **NO contiene código de implementación** — layouts y flujos son de diseño (pseudo-Rust/pseudo-TS a nivel firma), la fase `apply` los materializa.

## 1. Vista de componentes

```
                        ┌─────────────────────────── DEVNET ───────────────────────────┐
                        │                                                              │
                        │   SAS program (oficial, no nuestro)                          │
                        │   22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG               │
                        │   ┌────────────┐ ┌─────────┐ ┌───────────────────────────┐  │
                        │   │ Credential │→│ Schema  │→│ Attestation PDA (agente A)│  │
                        │   │ "issuer"   │ │ human-  │ │ seeds:["attestation",cred,│  │
                        │   │            │ │ verified│ │        schema, walletA]   │  │
                        │   └────────────┘ └─────────┘ └───────────────────────────┘  │
                        │                                                              │
                        │   agentic_gate program (único programa custom — INV-4)       │
                        │   ┌─────────────────┐  ┌────────────────────────────────┐   │
                        │   │ GateConfig PDA  │  │ Mandate PDA                     │   │
                        │   │ ["config"]      │  │ seeds:["mandate",owner,agent]   │   │
                        │   │ cred/schema/lvl │  │ policy + contadores             │   │
                        │   └─────────────────┘  └────────────────────────────────┘   │
                        │   SPL Token: USDC-test mint + ATAs                           │
                        │   Eventos: PaymentReceipt (en logs de cada pay)              │
                        └──────────────────────────────────────────────────────────────┘
                                      ▲            ▲                 ▲
        off-chain (Node/TS en Windows o WSL)        │                 │
   ┌──────────────────┐   ┌─────────────────┐      │      ┌──────────┴───────┐
   │ services/issuer  │   │ agent/ CLI      │      │      │ dashboard/       │
   │ mock KYC: emite  │   │ wallets A y B;  │──────┘      │ read-only devnet │
   │ y revoca SAS     │   │ habla x402-flow │             │ (ledger+mandato+ │
   │ attestations     │   │ y firma `pay`   │             │  attestation)    │
   └──────────────────┘   └────────┬────────┘             └──────────────────┘
          ▲                        │ 402 → pay → X-Payment
          │                        ▼
   humano owner ──────── services/service-x (endpoint gateado estilo-x402)
   (firma/revoca              verifica tx on-chain antes de entregar recurso)
   mandato vía scripts)
```

**Trust boundaries (líneas que NO se cruzan):**
- El **programa gate** es la única autoridad que ejecuta el chequeo — services/dashboard jamás "confían", verifican on-chain.
- El **mock issuer** solo escribe SAS attestations (credential→schema→attestation); no toca el gate ni los tokens.
- El **dashboard** es read-only: no firma nada, no muestra datos del humano (INV-1).
- El **agente** solo firma `pay`; no puede escribir contadores ni forjar recibos (los contadores los muta el programa; el recibo lo emite el programa).

## 2. Estado on-chain — layouts de cuentas

### 2.1 `GateConfig` (PDA, seeds `["config"]`, owner = agentic_gate)

| Campo | Tipo | Rol |
|---|---|---|
| `admin` | `Pubkey` | Quien puede actualizar `sas_credential`/`sas_schema`/`min_level` |
| `sas_credential` | `Pubkey` | Credential PDA del issuer confiable (nuestro mock issuer en la demo) |
| `sas_schema` | `Pubkey` | Schema PDA esperado ("human-verified-agent" v1) |
| `min_level` | `u8` | Nivel mínimo exigido en `attestation.data.level` (demo: 1) |
| `bump` | `u8` | bump del PDA |

Una sola instancia. Permite rotar issuer/schema sin redeployar (issuers múltiples quedan LATER — lista de 1 en MVP).

### 2.2 `Mandate` (PDA, seeds `["mandate", owner, agent]`, owner = agentic_gate)

| Campo | Tipo | Rol |
|---|---|---|
| `owner` | `Pubkey` | Humano dueño — único que crea/revoca/cierra |
| `agent` | `Pubkey` | Wallet del agente ligado (UN mandato por par owner-agente — spec OUT agregación) |
| `max_per_tx` | `u64` | Tope por transacción en unidades base USDC (6 dec) — R-03 |
| `daily_cap` | `u64` | Tope por día calendario UTC — D6 |
| `spent_today` | `u64` | Gasto acumulado de la ventana actual |
| `day_index` | `i64` | `unix_timestamp/86400` de la ventana activa |
| `total_spent` | `u64` | Acumulado histórico (legibilidad dashboard) |
| `payee_whitelist` | `Vec<Pubkey>` cap 8 | Payees (wallets de servicios) autorizados — R-03 |
| `expiry` | `i64` | `0` = sin expiración; si no, `> now` exigido |
| `revoked` | `bool` | Revocación del owner — beat 6 |
| `bump` | `u8` | bump del PDA |

Tamaño ≈ `8 (disc) + 32+32 + 8*5 + 8 + (4+32*8) + 8 + 1 + 1` ≈ 426 bytes → reservar 512.

### 2.3 Attestation SAS (cuenta ajena, programa SAS `22zoJM...`)

| Campo | Tipo | Rol en nuestro check |
|---|---|---|
| `nonce` | `Pubkey` | = wallet del agente (la attestation queda ligada a A vía seeds) |
| `credential` | `Pubkey` | debe == `config.sas_credential` |
| `schema` | `Pubkey` | debe == `config.sas_schema` |
| `data` | `Vec<u8>` | layout del schema demo: `{level: u8, issued_at: i64}` — **solo nivel+timestamp** (INV-1) |
| `signer` | `Pubkey` | signer autorizado que emitió (informativo) |
| `expiry` | `i64` | `0` = no expira |
| `token_account` | `Pubkey` | `default` (attestation no tokenizada) |

**Revocación SAS = `CloseAttestation` borra la cuenta** → "revocada" ≡ "no existe la cuenta en la PDA derivada". El programa no lee un flag: la ausencia es el revert (AttestationMissing). El dashboard distingue revocada de nunca-emitida consultando el historial de la PDA (`getSignaturesForAddress`).

Schema SAS de la demo: name `agentic-dni-human-verified`, version `1`, fields `["level","issued_at"]`, layout `[u8, i64]`. Credential: name `AGENTIC-DNI-MOCK-ISSUER`, authority = keypair del mock issuer, `authorized_signers = [issuer_signer]`.

### 2.4 SPL Token (ajeno)

- `USDC-test` mint (decimals 6), creado por script en devnet; authority = deployer demo.
- ATAs: `agentA_ata`, `agentB_ata`, `serviceX_ata`, `serviceY_ata`, fondeo inicial vía `mintTo` del script.

## 3. Instrucciones del programa `agentic_gate`

| Ix | Firmante | Cuentas clave | Efecto | Requiere |
|---|---|---|---|---|
| `initialize_config(admin, sas_credential, sas_schema, min_level)` | payer/admin | `config` (init), system | crea GateConfig | una vez |
| `update_config(...)` | `config.admin` | `config` | rota issuer/schema/min_level | admin |
| `init_mandate(agent, max_per_tx, daily_cap, payees[], expiry)` | `owner` | `mandate` (init seeds [owner,agent]), system | crea Mandate con contadores en 0 | CA-2 |
| `revoke_mandate()` | `owner` | `mandate` | `revoked = true` | R-06, beat 6 |
| `close_mandate()` | `owner` | `mandate` | cierra cuenta, devuelve rent | permite re-init post-revoke (reparación de demo) |
| `pay(amount: u64, service_ref: [u8;16])` | `agent` | ver §4 | gate + transfer + recibo | R-01..R-05 |

*Whitelist mgmt:* la whitelist se define en `init_mandate` (param `payees[]`); editar whitelist en runtime = `update_mandate` queda **LATER** (no lo exige ningún beat ni CA — la spec pide "crear y revocar"; si la fase tasks detecta necesidad, se agrega como slice).

## 4. `pay` — flujo exacto (orden, reverts, CPI, evento)

Cuentas: `agent` (signer, mut), `config` (read), `attestation` (read, la SAS PDA del agente), `mandate` (mut, PDA propio), `service` (read — wallet del payee), `agent_ata` (mut), `service_ata` (mut), `token_program`, `system_program` implícito.

```
CHECKS — identidad (R-02):
 1. attestation.owner == SAS_PROGRAM_ID          else AttestationMissing
 2. attestation.key == PDA(["attestation", config.sas_credential,
                            config.sas_schema, agent.key], SAS_PROGRAM_ID)
                                                 else IssuerNotRecognized   (CA-12: issuer/schema/agente no coincide)
 3. attestation deserializa (disc=2, campos SAS)  else AttestationMissing
 4. attestation.expiry == 0 || > clock.now        else AttestationExpired   (CA-8)
 5. decode data: level >= config.min_level        else AttestationLevelTooLow

CHECKS — autorización (R-03):
 6. mandate.agent == agent.key                    else MandateBoundToOtherAgent (CA-11)
    (seeds del PDA usan campos guardados → la cuenta ES el mandato (owner,agent) almacenado;
     este check además liga al firmante)
 7. !mandate.revoked                              else MandateRevoked       (beat 6)
 8. mandate.expiry == 0 || > now                  else MandateExpired       (CA-9)
 9. payee_whitelist.contains(service.key)         else PayeeNotWhitelisted  (beat 5b)
10. amount <= mandate.max_per_tx                  else OverPerTxLimit       (beat 5a)
11. day = now/86400; spent = (mandate.day_index==day) ? mandate.spent_today : 0
    spent + amount <= mandate.daily_cap           else OverDailyCap         (CA-10)

EFECTOS:
12. mandate.day_index = day; mandate.spent_today = spent + amount;
    mandate.total_spent += amount;

INTERACCIÓN:
13. CPI token::transfer(agent_ata → service_ata, amount)   — firma: agent (signer)   (R-04)

RECIBO (R-05):
14. emit!(PaymentReceipt {
        payer: agent.key, payee: service.key, amount,
        service_ref, mandate: mandate.key, timestamp: now })
```

Invariante INV-2 garantizado por la runtime: cualquier `err!` revierte la tx completa — no existe estado observable intermedio. Los errores son variantes del enum `GateError` → distinguibles en logs/explorer (satisfies "motivo distinguible" de R-02/R-03 y CA-4/CA-5).

## 5. Componentes off-chain

### 5.1 `demo/services/issuer` — mock issuer (Node + TS)

API HTTP mínima (keypair issuer en `.env` local, nunca en repo — INV-5):

| Endpoint | Acción |
|---|---|
| `POST /attest {agentWallet, level}` | `deriveAttestationPda` + `getCreateAttestationInstruction` (nonce=agentWallet, data=`{level, issued_at}`, expiry configurable) → tx a devnet → devuelve `{attestationPda, signature}` |
| `POST /revoke {agentWallet}` | `getCloseAttestationInstruction` → borra la attestation (CA-7) |
| `GET /status/:wallet` | `fetchAttestation` → `{exists, level, expiry}` |

Bootstrap (script `scripts/setup_sas.ts`, una vez): `getCreateCredentialInstruction` (authority=issuer) → `getCreateSchemaInstruction` (schema demo) → imprime `sas_credential`/`sas_schema` que se cargan en `initialize_config` y en `demo/.env` (direcciones públicas, no secretos).

### 5.2 `demo/services/service-x` — endpoint gateado estilo-x402 (Node + TS)

`GET /api/premium` (y una instancia gemela `service-y` con otra wallet — mismo binario, otro `PAYEE_WALLET`):

1. Sin `X-Payment` → `402` + requirements `{scheme:"agentic-gate", payee, price, mint, programId, invoice:uuid}` (D3/D7).
2. Con `X-Payment: <sig>` → `getTransaction(sig, commitment confirmed, maxSupportedTransactionVersion)` → verifica: status ok, ix a `agentic_gate`, evento `PaymentReceipt` parseado con `payee==miWallet && amount>=price && service_ref==invoice` → `200 {data: <recurso JSON premium>, receipt}`.

### 5.3 `demo/agent` — CLI del agente (Node + TS)

`agent pay <serviceUrl> <amount>`: request → parsea 402 → construye ix `pay` desde el **IDL generado** (cliente Anchor/`@solana/kit`) → envía tx → retry con `X-Payment` → imprime respuesta. Wallets: `keys/agent-a.json` / `keys/agent-b.json` (gitignored). Agentes A y B = mismo binario, distinta key.

### 5.4 `demo/dashboard` — audit UI (Vite + React, read-only, sin wallet)

| Panel | Fuente de datos on-chain |
|---|---|
| Ledger del agente | `getSignaturesForAddress(mandatePda)` → `getTransaction` por firma → parsear `PaymentReceipt` de logs `Program data:` (discriminator del IDL); cada línea linkea al explorer (CA-6) |
| Estado del mandato | fetch + decode `Mandate` por PDA derivada (policy, spent_today/daily_cap, expiry, revoked) |
| Estado attestation | `fetchAttestation` (sas-lib) en la PDA derivada → vigente / expirada / inexistente (= revocada o nunca emitida; historial de la PDA distingue) |

### 5.5 `demo/scripts/` — tooling de demo

- `setup_devnet.sh` (WSL): keypairs de demo → `solana airdrop` → `spl-token create-token --decimals 6` → ATAs + `mintTo` → imprime direcciones a `demo/.env` local.
- `build_deploy.sh` (WSL): `anchor build` → `solana program deploy`/`anchor deploy --provider.cluster devnet` → `initialize_config` con credential/schema SAS.
- `run_beats.sh`: orquesta beats 1–6 (llama issuer API, init_mandate, agent CLI, revoke) — la demo real se ejecuta manual guiada por este script.

## 6. Layout del repo (`demo/` únicamente — `platform/` intocable)

```
demo/
  Anchor.toml                     # provider devnet, program id
  Cargo.toml                      # workspace
  package.json                    # workspaces TS
  programs/agentic-gate/src/lib.rs
  programs/agentic-gate/Cargo.toml
  tests/agentic-gate.ts           # anchor test (test-validator + SAS dump)
  tests/fixtures/sas.so           # `solana program dump` del SAS desde devnet (1 vez)
  services/issuer/                # API mock issuer
  services/service-x/             # endpoint 402 gateado (instancias X e Y por config)
  agent/                          # CLI del agente
  dashboard/                      # Vite+React read-only
  scripts/                        # setup_devnet.sh, build_deploy.sh, setup_sas.ts, run_beats.sh
  keys/                           # keypairs demo — GITIGNORED (INV-5)
  target/idl/                     # IDL generado — lo consumen agent/dashboard/tests
```

## 7. Build / deploy / test — toolchain WSL

- **Todo lo Solana corre en WSL Ubuntu** (`wsl -d Ubuntu -- bash -lc "<cmd>"`; usuario `adriangmrra`): `anchor build`, `anchor test`, `deploy`, `spl-token`, airdrops. El host Windows tiene Rust roto para builds (`docs/ENVIRONMENT.md`).
- **Working copy en WSL home**: `/mnt/c` hace lentos los builds de cargo → se trabaja `~/agentic-dni-demo` (copia de `demo/` sin `target/`), y se copian de vuelta al repo: fuentes modificadas + `target/deploy/*.so` + `target/idl/*.json`. Opción documentada en ENVIRONMENT; la fuente de verdad sigue siendo el repo Windows.
- **Servicios/agent/dashboard** corren indistinto en Windows Node 22 o WSL (solo RPC/HTTP, sin toolchain nativo).
- **Tests del programa** (`anchor test`): test-validator local con el SAS program dumpeado de devnet (`solana program dump 22zoJM… sas.so -u devnet` → `solana-test-validator --bpf-program 22zoJM… fixtures/sas.so`) + helpers sas-lib para crear credential/schema/attestation en el validator. Casos de test = CA-1..CA-12 (mapa 1:1 en `test-plan.md`, fase tasks).
- **Deploy**: `anchor deploy --provider.cluster devnet` → program id se publica en `demo/.env.example`/docs (dirección pública, no secreto).

## 8. Seguridad / privacidad (mapeo a INV-1..INV-5)

- **INV-1:** schema SAS = `{level, issued_at}` + campos SAS públicos (issuer/schema/expiry). On-chain nunca hay PII ni vínculo agente→humano; el issuer mock custodia el (ficticio) binding off-chain.
- **INV-2:** atomicidad por runtime de Solana — `pay` es una sola ix; revert en cualquier check anula todo.
- **INV-3:** documentado en pitch/demo — el gate es del vendedor; el agente puede pagar fuera con SPL pelado y el sistema lo declara explícitamente.
- **INV-4:** un solo programa custom (`agentic_gate`); SAS es infraestructura de terceros consumida por lectura.
- **INV-5:** devnet only; `demo/keys/` y `.env` en `.gitignore`; cero secretos en artefactos SDD; USDC es mint de prueba propio sin valor.

Amenazas y mitigaciones: ver `06_SOLANA_DECISION.md` §seguridad (suplantación de attestation, mandato cruzado, replay de invoice — este último queda como hardening documentado, no exigido por spec).

## 9. Riesgos de diseño residuales

| Riesgo | Mitigación |
|---|---|
| Devnet flaky (RPC rate limits, resets de estado) | scripts idempotentes de setup; fallback de tests con SAS dumpeado en validator local; direcciones/tx re-chequeables en explorer |
| `sas-lib` API drift (v1.0.10 joven) | pinear versión en package.json; el check on-chain depende solo del layout de cuenta + seeds (estables en el programa, no en el SDK) |
| Evento no indexado por explorer genérico | el dashboard parsea `Program data:` con el IDL propio; además cada línea linkea al explorer para verificación manual |
| Scope creep (ya mitigado en spec) | instruction set mínimo; `update_mandate`, recibo-PDA y multi-issuer quedan explícitamente LATER |
