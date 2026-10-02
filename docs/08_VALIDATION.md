# Registro de validación

Estado: **ENTREVISTA E-001 (n=1)** + **VALIDACIÓN TÉCNICA END-TO-END ejecutada (02/10/2026, fase VERIFY)** — ver §"Validación técnica de la demo" abajo.

Hipótesis: trabajadores con ingresos reales no formales/no declarables carecen de prueba de ingresos verificable para evaluadores (inmobiliarias, prestamistas, emisores de tarjeta).

## Entrevistas (anonimizadas + consentimiento + fecha)

### E-001 — 01/10/2026 — Fundador del equipo (él mismo es el ICP)
- Perfil: freelance, 28 años, ~10 años trabajando y cobrando en negro (banco + billeteras virtuales), algunas veces en USDC vía Binance. Monotributo desde hace <1 año.
- **Dolor confirmado [VALIDADO n=1]:** "si hace 10 años existiese esto y hubiese recibido mi dinero ahí, hoy tendría un historial grande — no lo tengo". Sin historial crediticio pese a ~10 años de ingresos reales.
- Pregunta del entrevistado: ¿el problema resuelto es acceder a préstamos / comprar casa?
- **Matiz técnico detectado [IMPORTANTE]:** pagos recibidos *dentro* de Binance NO son visibles onchain (ledger interno del CEX). Solo cuentan si se retiran a self-custody o si se prueba el historial vía zkTLS (Reclaim). Posible extensión del producto: anclar también pruebas zkTLS de historiales en Binance/MercadoPago.

## Feedback de usuarios/testers
- E-001 es evidencia fuerte del dolor (el fundador ES el usuario) pero n=1: falta validar lado evaluador (¿una inmobiliaria/prestamista aceptaría el informe?) y más casos.

## Experimentos, observaciones vs inferencias, decisiones
- Observación: dolor real y personal del fundador (observado, no inferido).
- Inferencia pendiente: que evaluadores acepten un informe onchain como prueba — SIN VERIFICAR.
- Pendiente: 1-2 entrevistas más (otros freelancers/informales) + 1 evaluador (inmobiliaria/financiera).
- Acción acordada: el equipo consigue una inmobiliaria o financiera para charlar (compromiso: mañana). Pregunta clave: "¿qué prueba de ingresos aceptás hoy? ¿verificarías un link onchain?"

---

## Validación técnica de la demo — fase VERIFY (02/10/2026, sesión 17)

> Nota de alcance: el producto pivoteó a `agentic-dni` (suite O+R+S — accountability de pagos de agentes). La entrevista E-001 queda como registro histórico del Candidato C; la validación técnica de abajo corresponde al change `agentic-dni` ya construido.
>
> Verificación ejecutada por un **revisor independiente** que no confió en los claims del SESSION_LOG: re-ejecutó la suite, confirmó cada signature on-chain y decodificó cuentas/eventos a mano. Detalle criterio-por-criterio: `sdd/changes/agentic-dni/verification.md`.

### Qué se verificó de forma independiente (comandos reales, no claims)

| Verificación | Comando / método | Resultado propio |
|---|---|---|
| Programa live en devnet | `solana program show D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2 -u devnet` | Existe: BPFLoaderUpgradeable, authority=owner `F3ij…`, slot 506707105, 192.280 B |
| Suite offline | `cd ~/agentic-dni-demo && npx ts-mocha -p ./tsconfig.json "tests/**/*.ts"` (WSL, surfpool/LiteSVM) | **20 passing (9s)** — CA-1..CA-12 + seguridad |
| Signatures de los beats | `solana confirm -v <sig> -u devnet` × 9 | Todas Ok con la ix esperada: Pay (`tkfFin…`, `47XX…`, `xLnMW…`), RevokeMandate (`t2rE…`), InitMandate ×2, InitializeConfig, SAS create/close/create |
| Recibo on-chain (R-05) | Decode manual del `Program data:` b64 del tx beat-3 | `{payer:A, payee:X, amount:500000, service_ref:e4fe4b4c…, mandate:3S7N…, ts:1790963342}` |
| Estado post-demo | Decode raw Mandate PDA + attestation PDA + historiales | Mandato `revoked:true`, `total_spent`=$1.50 (3 pagos), whitelist=[X]; attestation A `data`={level:2, issued_at} — cero PII; attestation B inexistente con 0 historial (nunca-emitida real) |
| Capa de datos del dashboard | `npx tsx scripts/check_dashboard_data.ts` (misma `gate.ts` que la UI) | Reprodujo el estado exacto: mandato revocado, attestation vigente, ledger 5 txs |
| Higiene repo | `git check-ignore`, `git ls-files`, `git diff bd73b9d..HEAD`, scan de secretos | keys/ y .env ignorados, solo `.gitkeep` trackeado; todo código nuevo en `demo/`; commits convencionales en español sin atribución IA; sin secretos |

### Veredicto de la demo

**La evidencia devnet del SESSION_LOG (sesiones 15–16) es REAL** — cada firma existe, cada tx hace lo que se afirma, los estados finales coinciden y los 12 criterios de aceptación tienen test verde ejecutado por el revisor. Tras el fix-round (sesión 18) los reverts además quedan grabados on-chain como txs fallidas con signature — ver addendum del verification.md.

### Limitaciones/huecos declarados por el revisor

- **WARNING-1 → RESUELTO (sesión 18):** `pay` ahora exige `agent_ata.mint == service_ata.mint == config.usdc_mint` (`GateError::WrongMint`), `PaymentReceipt` incluye `mint` (7 campos) y service-x lo verifica. Test CA-13 (mint ajeno → revert) verde; GateConfig migrado close+re-init con el mint seteado; redeploy al mismo program id.
- **WARNING-2 → RESUELTO (sesión 18):** los beats de revert corren con `--skip-preflight` → cada revert aterriza como **tx fallida real** con signature (B4 `5fQegTbi…`, B5a `4CkKhEj…`, B5b `5MPXz1…`, B6 `5V82hQ…`); `solana confirm -v` muestra `Error Code: AttestationMissing` (0x1772) + fee cobrado.
- SUGGESTION: mandato demo `expiry=0` (spec ejemplificaba "mañana"); test CA-3 no asserta `service_ref` puntualmente; `initialize_config`/issuer `/attest` sin restricciones adicionales (mock aceptable).

### Demo usuario real o simulación

End-to-end ejecutada en devnet real (sesión 16) y **re-verificada artefacto por artefacto** en esta fase; la corrida en vivo con servicios no se repitió (servicios no corriendo) — la reproducibilidad queda cubierta por `scripts/run_beats.sh` + `start_services.sh` idempotentes.
