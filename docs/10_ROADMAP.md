# Continuidad post-hackathon — agentic-dni

Estado: **DEFINIDO A NIVEL DOCUMENTAL — pendiente decisión humana de continuar**
Fecha: 02/10/2026 · Change SDD `agentic-dni` ARCHIVADO (PASS post-fix W1/W2)

## 1. Limitaciones documentadas del MVP (honestas, sin disimular)

| Limitación | Naturaleza | Qué implica |
|---|---|---|
| El agente puede hacer SPL transfers libres por fuera del gate | Estructural (INV-3) — por diseño | El gate protege al **vendedor** que lo adopta; no "encadena" al agente. Se declara en pitch/demo: lo que el gate cobra, el gate lo garantiza. Si un piloto exigiera enforcement a nivel token, requiere otro diseño (Token-2022 hooks — ver §3). |
| Mandato de la demo con `expiry=0` (sin expiración) | Cosmética — la spec ejemplificaba "mañana" | El mecanismo de expiry sí está probado (CA-9, `MandateExpired` en suite). Fidelidad literal del guion: re-init con expiry real si se quiere. |
| `initialize_config` sin restricción del primer `admin` | Hardening demo-scope | La config ya está inicializada en devnet (admin = owner `F3ij…`); en producción exigiría signer fijo o deploy-time init. |
| Issuer `POST /attest` y `POST /revoke` sin autenticar al caller | Hardening demo-scope | Es mock issuer — demuestra la capa, no el KYC. Producción: auth + issuer real (Persona/Veriff-class). |
| Ix `close_config` existe como herramienta de migración | Consciente — admin-gated | Permite re-inicializar el singleton de config (usada para migrar a `usdc_mint`). Queda como escape admin; evaluar timelock/multisig si el producto madura. |
| `service_ref` en el recibo ata pago↔invoice pero sin store de nonces consumidos | Hardening conocido | El servicio verifica binding payee+monto+invoice+mint; anti-replay completo (invoice single-use persistido) queda como mejora. |
| Cap diario = día calendario UTC (`day_index`) | Tradeoff de diseño (D6) | Borde de día: 2×cap posible en ~2 min al cruzar medianoche UTC. Declarado; rolling/fixed-window real es cambio acotado. |
| UN mandato por par (owner, agente); whitelist ≤8 payees | Spec (OUT agregación) | Suficiente para demo; producción necesitaría agregación/multi-mandato. |

## 2. Condición post-demo del Research Gate (no opcional para claims)

El gate (04_RESEARCH_GATE §11) fijó: **contacto con ≥1 facilitator x402 real
(PayAI / MCPay / Corbits) para validar pull** — "¿gatearían pagos de agentes a
humanos verificados con esto?". No bloqueó el build ni bloquea la entrega; **bloquea
cualquier claim de demanda real**. Registrar la conversación y resultado en
`docs/08_VALIDATION.md` cuando ocurra.

## 3. Candidatos de próxima iteración (priorizados por evidencia/riesgo)

1. **Conversación con facilitator + pitch real** — es la condición del gate y la evidencia que falta. Antes que cualquier código nuevo.
2. **Recibo como cuenta PDA (composabilidad)** — hoy el recibo es event-log (`emit!`, D2): barato y suficiente para evidencia off-chain, pero los programas no pueden leer eventos. Un `Receipt` PDA habilitaría composición on-chain (refund-exige-recibo, acceso-condicionado-a-compra, reputación). Cambio aditivo — no rompe lo existente.
3. **`update_mandate` (edición de policy en runtime)** — diferido en diseño (ningún beat/CA lo exigía); un owner real quiere editar whitelist/límites sin close+re-init.
4. **Anti-replay de invoice** — store de `service_ref` consumidos en service-x (o nonce on-chain si el binding debe ser program-side).
5. **Rolling 24h / fixed-window para `daily_cap`** — solo si el borde de día importa en piloto.
6. **Multi-issuer en GateConfig** — hoy un solo `sas_credential`/`sas_schema` confiable; producción issuer-agnóstica exige set de issuers.
7. **Token-2022 reconsiderado** — hooks a nivel token solo si un piloto pide enforcement sobre el activo mismo (contradice INV-3: evaluar caso a caso).
8. **Puente/metadata ERC-8004** — scope diferido del MVP: referenciar la attestation SAS desde el registration file 8004. Narrativa "cross-chain en producción" del pitch; no dependencia técnica.
9. **KYC real** — integración con issuer de verificación (Persona/Veriff-class, ~$1–2/verificación); el mock issuer demuestra la capa, el negocio necesita el convenio.

## 4. Lecciones aprendidas (sesiones 14–18 — para la próxima iteración/equipo)

- **test-validator no arranca en WSL1 ni en este Windows** (`multi_bind`→SO_REUSEPORT→EADDRINUSE en WSL1; `Os 1314` privilegio en Windows). **Solución adoptada: surfpool embebido** (`@solana/surfpool` → LiteSVM real + JSON-RPC, levantado en el `before()` de mocha, deploy del `.so` por ruta). Equivalente al `[[test.genesis]]` planificado y con extras que el validator no da fácil: `timeTravelToTimestamp` (CA-8/CA-9 deterministas), `fundSol`/`fundToken`. Flake conocido: raramente muere el arranque (`surfnet_writeProgram` conn refused) — re-run.
- **`sas-lib` drift = riesgo real.** Mitigaciones que funcionaron: pinear `1.0.10`; `.npmrc` `legacy-peer-deps` (su peer kit@8 choca con el pin kit@5); **verificar empíricamente** los discriminadores contra el binario real (Credential=0, Schema=1, Attestation=2 — el codegen mentía); ojo con snake_case vs camelCase (el decoder IDL conserva `service_ref`/`max_per_tx` — dos bugs vinieron de asumir camelCase); revocación SAS = `CloseAttestation` (la cuenta desaparece, no hay flag `revoked`); `expiry==0` = sin expiración.
- **Faucet devnet rate-limit (429 diario):** fondear actores con `SystemProgram.transfer` desde la wallet owner en vez de airdrops por keypair.
- **WSL1 mata procesos background al cerrar la sesión:** los servicios de la demo corren en foreground envueltos por `scripts/dev_service.sh`.
- **Reverts no quedan on-chain con `.rpc()` default:** el preflight mata la tx en simulación client-side y jamás existe la tx fallida. Para evidencia auditable de reverts: `sendRawTransaction({skipPreflight:true})` + `getTransaction` autoritativo (flag `--skip-preflight` del agent CLI — solo para los beats de revert; los pays felices conservan preflight).
- **Dump del programa dependiente como fixture:** `solana program dump 22zoJM… -u devnet` → `tests/fixtures/sas.so` commiteado = tests deterministas offline contra el SAS real, no contra un mock.
- **Migración de cuenta singleton con layout incompatible:** más simple `close_config` + re-init en el mismo PDA que `realloc`+zero-copy (admin = upgrade authority, config de demo).
- **Verificación adversarial vale:** el verify con revisor fresco encontró dos huecos reales (mint no atado, reverts sin tx) que el claim "verde" ocultaba. Mantener re-verificación con comandos propios en iteraciones futuras.

## 5. D+1 / D+7 / D+30 (propuesta — ajustar con el equipo)

- **D+1:** publicar repo + grabar video 2–3 min + ejecutar entrega Colosseum; registrar link/id de submission en `docs/09_DEMO_SUBMISSION.md` §6.
- **D+7:** entrega Superteam Earn (acción separada, bases propias); abrir conversación con ≥1 facilitator x402 (condición del gate); registrar en `08_VALIDATION.md`.
- **D+30:** si hay pull real → próxima iteración SDD (nuevo change) con el candidato prioritario que salga de esa conversación — probablemente recibo-PDA o integración facilitator-hook. Si no hay pull → pivote honesto documentado (el dossier ya registra: destino probable de esta capa = estándar/absorción, no IPO).
- **Equipo que continúa / mentores:** PENDIENTE — decisión humana post-evento.
