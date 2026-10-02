# agentic-dni — material de demo (Solana devnet)

MVP para el Road to Colosseum × Formosa: un gate de pagos para agentes de IA
donde cada pago exige **atómicamente**, en la misma transacción:

1. Attestation SAS válida (`human-verified`, level ≥ min) del agente pagador.
2. Mandato del owner vigente que cubra monto, payee y cap diario.
3. Transferencia SPL de USDC-test agente → servicio.
4. Evento `PaymentReceipt` verificable en los logs de la tx.

Nada de mainnet, nada de PII on-chain, nada de fondos reales.

## Levantar la demo (WSL, desde `demo/`)

```bash
bash scripts/start_services.sh        # issuer :3401 · servicio X :3402 · servicio Y :3403
bash scripts/sync_dashboard_env.sh    # genera dashboard/.env (solo pubkeys)
cd dashboard && npx vite --port 3404  # dashboard read-only → http://localhost:3404
```

Los servicios corren en foreground-managed shells (WSL1 mata procesos
background al cerrar la sesión — `scripts/dev_service.sh` los envuelve).

## Guion ~90 segundos (6 beats)

Todo automatizado: `bash scripts/run_beats.sh`. Narración sugerida:

1. **Attest A** (~10s) — “El issuer emite una attestation SAS real en devnet:
   el agente A queda verificado como operado por humano, level 2.”
   `POST :3401/attest {wallet: A, level: 2}` → firma on-chain.
2. **Init mandate** (~10s) — “El owner crea el mandato: máximo \$5 por
   transacción, cap \$10 por día, y solo puede pagarle al servicio X.”
   `owner.ts init-mandate --agent a --max 5 --cap 10 --payees x`.
3. **Pago feliz** (~15s) — “El agente pide el recurso premium, recibe un 402
   con los requisitos, paga on-chain y reintenta con `X-Payment`: 200.”
   `agent pay http://localhost:3402/api/premium 0.50` → tx confirmada.
   Mostrar el ledger del dashboard con la línea nueva linkeada al explorer.
4. **B huérfano** (~10s) — “El agente B tiene mandato pero NO attestation:
   el mismo programa lo rechaza con `AttestationMissing`.”
   `agent pay … 0.50 --keypair keys/agent-b.json` → revert.
5. **Límites** (~15s) — “\$10 excede el máximo por tx → `OverPerTxLimit`.
   El mismo pago de \$0.50 al servicio Y → `PayeeNotWhitelisted`. Ningún
   servicio ni middleware decide esto: revierte on-chain.”
6. **Revocación en vivo** (~15s) — “El owner revoca el mandato… y el
   siguiente pago del agente revierte `MandateRevoked`. Mirá el dashboard:
   el panel del mandato pasó a **revocado** sin recargar nada manual —
   solo está leyendo la chain.” `owner.ts revoke --agent a`.

## Checklist de verificación en Explorer (cluster=devnet)

| Beat | Qué verificar en `explorer.solana.com/tx/<sig>?cluster=devnet` |
|---|---|
| 1 attest | Programa SAS `22zoJM…` ejecutado; cuenta attestation PDA creada |
| 2 mandato | Programa gate `D8pcKtez…`; ix `init_mandate` exitosa |
| 3 pay | `transfer` SPL de 500.000 base units A→ATA(X) + logs `Program data:` con `PaymentReceipt` |
| 4 B huérfano | tx **fallida**, log `Error Code: AttestationMissing` |
| 5 over-limit | tx fallida `Error Code: OverPerTxLimit` |
| 5 payee Y | tx fallida `Error Code: PayeeNotWhitelisted` |
| 6 revoke+pay | `revoke_mandate` OK; el `pay` siguiente falla `MandateRevoked` |

Direcciones y firmas de la corrida registrada: `docs/SESSION_LOG.md` y
`sdd/changes/agentic-dni/tasks.md` (sección Evidencia de cada slice).

## Limitación honesta del MVP

El gate solo protege al **vendedor** que lo usa: un agente siempre puede hacer
transfers SPL libres por fuera. El valor es que el programa — no un JWT ni un
middleware — hace cumplir identidad + autorización en la misma tx que mueve
fondos. Lo que el gate cobra, el gate lo garantiza.
