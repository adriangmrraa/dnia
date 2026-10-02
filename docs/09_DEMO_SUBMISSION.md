# Demo / entrega — agentic-dni (suite O+R+S)

Estado: **DEMO EJECUTADA Y VERIFICADA EN DEVNET — ENTREGA PENDIENTE (acción humana)**
Fecha del documento: 02/10/2026 · Change SDD: `sdd/changes/agentic-dni/` (ARCHIVADO)

> Regla del playbook: **no declarar enviado sin comprobante**. Este documento registra
> qué se construyó, la evidencia real on-chain y qué falta para las DOS entregas
> (Colosseum y Superteam Earn son acciones distintas).

## 1. Ficha del proyecto

- **Nombre:** agentic-dni — capa de accountability para pagos de agentes IA (suite O+R+S)
- **Equipo:** 2-3 personas (aliases sin PII registrados a propósito)
- **Usuario/cliente:** gate operator — facilitators x402 (PayAI, MCPay, Corbits-class) y merchants/servicios que cobran a agentes en Solana. Usuario secundario: dueño del agente.
- **Problema:** los agentes IA pagan con credenciales de sus dueños — nada distingue agente de humano, qué humano verificado responde detrás, ni bajo qué autorización gasta. ERC-8004 (mainnet 29/01/2026) salió **sin** human-binding; Skyfire es cerrado/off-chain (JWT no verificable por programas); ~25 proyectos Colosseum adyacentes, 0 winners en esta capa.
- **Qué se construyó (todo en `demo/`):**
  1. **Programa de pago gateado** `agentic_gate` (Anchor 1.2.0) — único programa custom. La instrucción `pay` exige atómicamente en UNA tx: attestation SAS válida del agente → mandato PDA del owner que cubra el pago → transfer SPL USDC-test → evento `PaymentReceipt` (7 campos, incluye `mint`). Cualquier check que falla revierte la tx completa.
  2. **Mock issuer** — servicio TS que emite/revoca attestations SAS reales vía `sas-lib` (`POST /attest`, `POST /revoke`, `GET /status/:wallet`).
  3. **Servicios x402-shaped** — `service-x` / `service-y`: `GET /api/premium` → 402 + requirements → el agente paga on-chain → retry con `X-Payment` → el servicio verifica la tx real (`PaymentReceipt`: payee/monto/invoice/mint) → 200 con recurso.
  4. **Agent CLI** — `agent pay <url> <amount>` (flujo 402→pay→X-Payment completo; flag `--skip-preflight` para que los reverts aterricen como txs fallidas reales).
  5. **Dashboard de audit** — Vite+React read-only (:3404): ledger de pagos parseado de `Program data:` on-chain, estado del mandato (policy/contadores/revocación) y estado de la attestation. Cero firma, cero escritura, cero PII.

## 2. Solana en el producto (función real, no sticker)

El programa **exige la credencial dentro de la misma transacción que mueve fondos**:
un JWT off-chain no puede revertir una tx; acá el check de identidad (attestation
SAS leída por el programa vía re-derivación de PDA, sin CPI), la autorización
(mandato PDA con policy + contadores que solo el programa muta) y la evidencia
(`PaymentReceipt` emitido por el programa) son efecto atómico del pago.

**Program ID (devnet):** `D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2`
Explorer: `https://explorer.solana.com/address/D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2?cluster=devnet`

Direcciones verificables del sistema:

| Pieza | Dirección |
|---|---|
| GateConfig PDA | `AD8km3tHv3VC9gNV5L9WZKuDKJoLu5K4B9QdFjrUxNRv` |
| Mandate PDA (owner→Agente A) | `3S7NvdxwYh4sirkQbcV9GUaUtzive3K5JzHrou3Gx7rS` |
| SAS Credential (mock issuer) | `JDe4sL4r73pQ3ovgkk95wNTo4SaS3U48R9PryQeZ3HRC` |
| SAS Schema (`agentic-dni-human-verified` v1) | `6bz7y1xCr8k6PzAGP1P9cwNp9Qp8RPbDjzDgod7M7ohK` |
| Attestation PDA Agente A | `pAht9t8UcZkmGSZXWEHSe1VPL2E6iMt42SYUQ2tdMXt` |
| Mint USDC-test (SPL, 6 dec) | `gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk` |
| SAS program (ajeno, oficial) | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` |

## 3. Demo — 6 beats (~90 seg) con evidencia REAL

Corrida final post-fix (sesión 18, 02/10/2026) vía `bash scripts/run_beats.sh` →
**LOS 6 BEATS OK**. Cada signature se verifica en
`https://explorer.solana.com/tx/<sig>?cluster=devnet`.

| Beat | Qué pasa | Signature real (devnet) |
|---|---|---|
| 1 — Attest A | Mock issuer emite attestation SAS `human-verified` (level 2) sobre la wallet de Agente A | PDA `pAht9t8U…` (idempotente; tx original `tcRHMnJyLVZBLxpJ471y9oDUJovFtjtUPjDVdEoK3mScojdoaN18fujrqUWhJpNvha1WDE5y62CYxgrJ8GR7gBy`) |
| 2 — Init mandate | Owner firma mandato: ≤$5/tx, cap $10/día, whitelist = solo Servicio X | `32ZvGU3UVw8Ft6ztiTxLvYGnCLhVTQ7L7N3j712ARrjCeCei3sLvHPmPvAQ34ZV74WNjA2sjCAqxmDYHEJYBqGy2` (re-init tras close `eH1dowUNqomJcs24D3xzcTpJs1gHbY3exTekgQSR937yD3kzTovS8NefUdFVTgNPHAj3ArsDFhPJDXM1ihPRzac`) |
| 3 — Pago feliz | A paga $0.50 a X: attestation ✓ + mandato cubre ✓ → transfer + recibo → servicio entrega 200 | `3W9HSVZFQ6FQoH8XVusA4t38PpRMEbjMbjc53GKWxjwPL4R4DzasucES3oRzHrhTGYqAmhuiHEC9gUVk6Sbdwnm8` (receipt incluye `mint=gmfqCXG6…`) |
| 4 — B huérfano | B tiene mandato pero NO attestation → **tx fallida on-chain** `AttestationMissing` (err 0x1772, verificado con `solana confirm -v`) | `5fQegTbiTwtJ6YmQq3xDv2qjsY6hpwT5j4J55raCVXzikRnsD33qocnFpnb3sesMF8bwiHiiU735quabdKm5XXSo` |
| 5a — Over-limit | A intenta $10 > max $5 → **tx fallida** `OverPerTxLimit` | `4CkKhEjSEWTmJGMxmmx1vHGMgE7SPRJw2oesroYiE5VCLfSaG7Q4q7D526N48A8T985vgw4MdHT2VsoES1qTqswk` |
| 5b — Payee no whitelisted | A intenta $0.50 a Servicio Y → **tx fallida** `PayeeNotWhitelisted` | `5MPXz1Zyoyhki4t4YWrsJVHBX7ZxAREufti9wa7Tp1qBgk8K4qFncE6hykn6vYBrGaKTiiYRzePbWtqSHKMbARAT` |
| 6 — Revocación en vivo | Owner revoca el mandato → siguiente `pay` de A (que en beat 3 confirmaba) → **tx fallida** `MandateRevoked`; dashboard refleja "revocado" | revoke `sXwCv8ua47kwRCpwFqcZHQJ9CPLj22yCabhWepZgm46tMFGevhWpnXcf7RBQzYJSrf29JVL2SeufJtAf1VQT9JG` · pay fallido `5V82hQsLUi2CmB4VTXd3ntuJcwzW9hEtcxVpQCMF4CwdswE4cRDcQjQPqBKZpUBAaAGaRXWLQYwfZtC8JEM6UrL9` |

Evidencia operativa adicional: upgrade del programa post-fix (mismo Program ID) tx
`5WsEeB132qdZMpiZBioxKvHPJWY3v8T5Mtoo8Fmvo74fzoTDcDZ1uVYkuc2jeA7GjXYWQj63wewskAKZbW9ErFiM`;
migración GateConfig (close `5AwRPjsFSmr9jboNvKdgTE7Kvav3DqpJpyW9AtzGDyvpaWDysPrvWG4tiNSXFyY2dRQSv3EHN9q5QTj7hTPq8N4A`
+ re-init `35QuEqjic1awUS5Jfbp1YEy231mhtPRvXrcMv7yoMi6SaXGx3Q7Vzkn2s5NW7cJkXxZRb2sRrCmCSaWNXqfMjiMk` con `usdc_mint`).

**Honestidad estructural (declarada en el pitch):** el gate protege al **vendedor** —
un agente siempre puede hacer SPL transfers libres por fuera del programa. El valor
es que lo que el gate cobra, el gate lo garantiza: identidad + autorización + recibo
en una sola tx, o nada.

## 4. Cómo reproducir (devnet, ~5 min)

Todo en WSL Ubuntu (`wsl -d Ubuntu -- bash -lc`), desde `demo/`:

```bash
bash scripts/start_services.sh        # issuer :3401 · service-x :3402 · service-y :3403
bash scripts/sync_dashboard_env.sh    # genera dashboard/.env (solo pubkeys, sin secretos)
cd dashboard && npx vite --port 3404  # dashboard read-only → http://localhost:3404
bash scripts/run_beats.sh             # los 6 beats encadenados, verifica resultado por beat
```

Detalle completo y narración por beat: `demo/README.md`. Servicios corren en
foreground (`scripts/dev_service.sh` los envuelve — WSL1 mata background al cerrar
la sesión). Keypairs de demo en `demo/keys/` (gitignored); `demo/.env` no se
commitea; `demo/.env.example` documenta todas las direcciones públicas.

## 5. Evidencia de tests

- **Suite:** `npx ts-mocha` en WSL contra **surfpool embebido** (LiteSVM = runtime
  SVM real + JSON-RPC) con el programa SAS dumpeado de devnet
  (`tests/fixtures/sas.so`, 135.680 bytes) → **21 passing**: CA-1..CA-12 mapeados
  1:1 a spec + CA-13 (`WrongMint`, post-verify) + tests de seguridad (non-owner,
  doble init, whitelist >8).
- **Re-verificación independiente (fase VERIFY, sesión 17):** revisor fresco
  re-ejecutó la suite (20/20 en ese momento), confirmó 9/9 signatures con la ix
  esperada, decodificó el recibo del beat-3 a mano (sin confiar en el IDL),
  decodificó Mandate/attestation raw y re-derivó PDAs propias → **PASS CON
  WARNINGS**; warnings W1 (mint no atado) y W2 (reverts no quedaban on-chain)
  **RESUELTOS en sesión 18** con la evidencia de arriba → veredicto actualizado
  **PASS**. Detalle completo: `sdd/changes/agentic-dni/verification.md`.
- **Atomicidad (INV-2):** en todo revert — balances intactos + sin evento
  `PaymentReceipt` — assertado en los 13 casos CA.

## 6. Checklist de entrega (DOS acciones distintas)

| Item | Estado |
|---|---|
| Repo público del proyecto | PENDIENTE — el repo vive local; falta publicarlo (decisión humana: GitHub público/privado-con-acceso-jurado) |
| Video demo 2–3 min | PENDIENTE — la demo es reproducible con `run_beats.sh`; falta grabar/registrar |
| Cuenta personal Colosseum de cada participante | POR CONFIRMAR (nunca guardar credenciales en el repo) |
| Registro proyecto track argentino | POR CONFIRMAR |
| **Entrega Colosseum** | **NO REALIZADA** — falta submit del proyecto en la plataforma |
| **Entrega Superteam Earn** | **NO REALIZADA** — acción separada de Colosseum, con sus propias bases |
| Reglas/fechas de https://superteam.ar/colosseum verificadas el | PENDIENTE — chequear bases vigentes antes de cada entrega |
| Condición post-demo (gate): contacto ≥1 facilitator x402 (PayAI/MCPay/Corbits) para validar pull | PENDIENTE — no bloquea la entrega; bloquea cualquier claim de demanda real en el pitch |

**Próximo paso inmediato (humano):** publicar repo + grabar video 2–3 min siguiendo
`demo/README.md` + ejecutar las DOS entregas. Ninguna entrega se declara hecha sin
comprobante (link/id de submission) — registrarlo acá cuando exista.
