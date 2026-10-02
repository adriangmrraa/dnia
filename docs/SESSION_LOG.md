# Bitácora de sesiones (append-only)

Plantilla: fecha | meta | máquina y acceso real | archivos revisados | tareas ejecutadas | pruebas y resultado | decisiones/permiso | bloqueos | siguiente acción y responsable | Engram topic_key (si hubo).

## Sesión 1 — 01/10/2026

- **Meta:** iniciar hackathon — diagnóstico de entorno + comenzar investigación de la idea.
- **Máquina y acceso real:** LOCAL_USER, Windows 10 + Git Bash, lectura/escritura verificadas en la carpeta del proyecto.
- **Archivos revisados:** AGENTS.md, CLAUDE.md, PROJECT_STATE.md, PROMPT_DE_INICIO.md, README_PRIMERO.md, harness/INSTALLATION_GUIDE.md, .agents/skills/formosa-sdd-init, formosa-sdd-explore, formosa-sdd-research-gate; repo externo This-is-my-harness (árbol, README, doc de producto, git log — solo lectura).
- **Tareas ejecutadas:** inventario de herramientas no destructivo; diagnóstico volcado a docs/ENVIRONMENT.md; idea registrada en docs/01_IDEATION.md; primera pasada de market research (3×2 búsquedas web) volcada a docs/02_MARKET_RESEARCH.md, docs/03_COMPETITORS.md, docs/SOURCES.md (20 fuentes).
- **Pruebas y resultado:** git/node/go/rustc presentes y versionados; Engram MCP list_tools falla (2 intentos) → fallback Markdown.
- **Decisiones/permiso:** usuario decidió NO tocar el repo previo y construir proyecto nuevo aquí; equipo 2-3; sin cuenta Colosseum todavía; ninguna instalación autorizada.
- **Bloqueos:** Colosseum Copilot requiere cuenta (acción del usuario); Engram MCP caído.
- **Siguiente acción:** usuario crea cuenta Colosseum → instalar Copilot con permiso → completar campo 4 del Research Gate → discutir modelo económico (token vs SAS+x402) con equipo → validación con devs → decisión de gate.
- **Engram topic_key:** no aplicable (MCP no operativo).
- **Post-cierre (misma sesión):** el usuario pidió copiar `This-is-my-harness` a este proyecto para usarlo de base sin tocar el original. Ejecutado: `robocopy /E` a `platform/` (270 archivos, 3.6MB; excluidos node_modules/target/.next/dist). Historial git completo (main, ahead 3) y cambios sin commitear preservados. Original intacto.
- **Colosseum Copilot:** instalado global (~/.config/devin/skills/colosseum-copilot v2.0.1) + login aprobado por usuario (evidence:read). Consultas: precedentes de marketplace de skills (6 intentos Frontier, 0 premios → pivote idea original), QR/crypto payments (12+ intentos), reputación informal (~12 intentos, 0 premios).
- **Pivote documentado:** opción A descartada (mercado ya resuelto: MP↔Upay QR bridge + SML + Lemon/Belo + 12 clones Colosseum). Candidato C guardado con reformulación (proof-of-income por cobros USDC, anti-sybil = pagos de terceros reales): docs/CANDIDATE_C_proof-of-income.md. El usuario detectó por sí mismo el ataque de self-swap → diseño ajustado.
- **Siguiente acción real:** usuario decide si avanza con Candidato C → entrevistas de validación con informales → Research Gate.

## Sesión 2 — 01/10/2026 (continuación)

- **Meta:** explorar ideas alternativas globales + profundizar diseño del Candidato C.
- **Barrido Copilot (5 espacios, ~60 proyectos, 0 premios):** guardrails/disputas agentes x402 (~20), payroll privado (~12), escrow buyer-protection (~11), marketplaces agente↔humano (~11), pay-per-crawl (~9). Idea "datos clínicos onchain" (dentalogic) DESCARTADA — datos onchain ≠ seguros (público+GDPR) y variantes correctas ya intentadas ~18 veces sin premio. Lección meta registrada en docs/03: el jurado premia corredor concreto + usuarios reales + plata moviéndose, no espacio vacío.
- **2da pasada Candidato C:** MAINDOCS 🏆 (winner Renaissance) valida el mecanismo wallet→documento verificable; Destácame (7M users, 40 bancos) valida el mercado; zkTLS/Reclaim abre historia retroactiva (Binance/MP).
- **Validación E-001:** el fundador ES el ICP (freelance, 10 años en negro, sin historial crediticio). Dolor confirmado n=1.
- **Diseño profundizado en dossier:** modelo 3 tiers de evidencia (T1 pago USDC directo / T2 attestation+depósito / T3 solo ahorro), clasificación anti-auto-fondeo, calidad de pagador, modelo consent-gated (links pull + solicitudes push, nada público por defecto), wallet embebida no-custodial, flujo pagador fiat→USDC vía ramp licenciado con referencia Solana Pay, alcance global, catálogo completo de grises/fugas.
- **Próxima acción:** entrevista con evaluador (inmobiliaria/financiera) — compromiso usuario para mañana → completar Research Gate → decisión CONSTRUIR/PIVOTEAR/DESCARTAR.

## Sesión 3 — 01/10/2026 (continuación)

- **Meta:** analizar idea nueva del usuario — votación electoral ciudadana onchain desde el celular — con el mismo procedimiento del Candidato C (Copilot + web research + prueba de extracción + dossier).
- **Copilot (autenticado, v2, 6 consultas):** winners-only pass (top-25: solo Quadratus/LivingIP/Blonk son voting real, todos DAO-flavored); 2 búsquedas amplias (top-25 sin premio); conteo categoría governance: **357 proyectos, 6 winners, 0 civic-elections**; cluster "Solana-based Decentralized Voting Systems" **n=130**.
- **Web research:** Voatz (USENIX Sec 2020: alterar/exponer voto; WV abandonó); Park-Specter-Narula-Rivest "Going from Bad to Worse" (2021): blockchain empeora el problema — recibos vendibles→compra de voto, sin efecto en turnout; Estonia i-voting funciona SIN chain (e-ID nacional es el pilar); Ley 27.781 AR = papel obligatorio, art.33 excluye emisión electrónica.
- **Resultado:** Candidato D DESCARTADO con dossier `docs/CANDIDATE_D_voting.md`. Registrado en docs/01_IDEATION.md, docs/03_COMPETITORS.md, docs/SOURCES.md ([C23]-[C31], [S33]-[S37]).
- **Bloqueos:** ninguno nuevo. Engram sigue caído (fallback Markdown).
- **Siguiente acción:** usuario decide entre Candidato C (validación pendiente: entrevista evaluador) u otra idea nueva.

## Sesión 4 — 01/10/2026 (continuación)

- **Meta:** generar 5 candidatos nuevos con el estándar del Candidato C (usuario accesible + extracción Solana + plata/verificabilidad + espacio no saturado).
- **Copilot (autenticado v2, 9 barridos + 4 detalles de proyecto):** espacios verificados saturados con 0 premios — reviews verificadas (~11), reputación gig portable (~11), herencia crypto (~11), pagos freelancer cross-border (~11), receipts/provenance de agentes (~11), funding OSS/donaciones (~11), ROSCA (~10), agente↔humano (~11), proof-of-delivery (~11), compra colectiva (~4-6, el más fino).
- **Detalles clave:** Susu Protocol (Frontier) = ROSCA serio con curva de colateral, sin premio, apuntó a pools de desconocidos; HumanLayer (Frontier) = data-labeling digital para AI labs, no tareas físicas; Proof of Human = sybil-detection; Vaquita Protocol (Radar) = evidencia fina.
- **Resultado:** pool de 5 candidatos en `docs/CANDIDATES_2nda_ronda.md`: E Vaquita cross-border, F agente-paga-humano físico, G fianza verificable, H pasaporte zkTLS gig, I compra colectiva fronteriza. Ninguno iguala el paquete completo de C — riesgos documentados por candidato.
- **Siguiente acción:** usuario elige candidato → validación con usuarios reales → Research Gate (decisión humana).

## Sesión 5 — 01/10/2026 (continuación)

- **Meta:** usuario rechazó los 5 de la 2da ronda ("no me gusta ninguna, esforzate") → 3ra ronda con eje distinto: primitivas diferentes en vez de más attestation/escrow.
- **Copilot (12 barridos + 3 detalles):** betting social (Pregame 🏆1ro-Consumer Blinks P2P; WeLikeSports 🏆Frontier pools parimutuel — coronó el corredor "prode"; Poll HM iMessage con tracción real) → dirección descartada (validada pero premiada ya). Paramétricos ~11/0, remesas-con-propósito ~11/0, tesorerías cerradas ~11/0, no-show stakes ~11/0, royalties ~11/0, oráculos ~11/0, savings-goals ~11/0 (nadie hizo custody-out-of-agency), rifa-VRF ~11/0, child-support = corredor vacío (ruido semántico), vouchers-restringidos ~11/0 (nadie hizo aid+whitelist), agro ~11/0 (todos tokenizaban tierra, nadie hizo preventa simple).
- **Meta-lección confirmada:** TODO espacio protocolo-genérico tiene ~10+ intentos y ~0 premios — la diferenciación está en el corredor concreto + momento, no en el mecanismo.
- **Resultado:** pool 3ra ronda en `docs/CANDIDATES_3ra_ronda.md`: J fondo-de-objetivo custody-out (corredor: quiebras de agencias de egresados), K obligaciones familiares verificables (cuota alimentaria/sponsorship — corredor vacío), L voucher uso-restringido (ayuda con whitelist merchants), M preventa de cosecha (compra adelantada ≠ crédito — Formosa real), N seña de turno (contexto dentalogic del equipo). Fuentes [C46]-[C60].
- **Siguiente acción:** usuario evalúa el pool → propuesto "corredor test": 1 conversación por candidato top (agencia viajes / pagador-receptor cuota / comedor-ONG) antes de cualquier elección.

## Sesión 6 — 01/10/2026 (continuación)

- **Meta:** usuario trajo idea propia — "DNI agéntico" obligatorio para todos los agentes IA, regulación incluida, identidad en Solana.
- **Evaluación M (preventa cosecha):** explicada en detalle a pedido del usuario (ciclo de escrow por hitos, compra-adelantada ≠ crédito, beneficios a ambas partes y al ecosistema local). Usuario la **descartó** ("no me gusta para nada") → no quedó registrada como candidato activo, solo permanece en el pool 3ra ronda.
- **Copilot (2 barridos + 4 detalles):** agent-identity/KYA ~13 intentos 0 winners (Parakletos = tesis literal sin premio; Regent = KYC→agente gestión-propia demo ERC; AgentGate = gate de pagos pero identidad del dueño; Agent-Cred = custodia wallet). Segundo barrido "verified-human-gate": ~13 más, todos governance del dueño — **vacío confirmado: credencial de humano-verificado exigible por terceros no existe en Colosseum**.
- **Web research:** ERC-8004 deployó mainnet 29/01/2026 (identidad agente seudónima, SIN human-binding — ventana abierta); Skyfire KYA/KYAPay productizó el binding pero cerrado/off-chain/JWT; agentid-kya-solana = esqueleto OSS sin verificación humana real; regulación en movimiento (Filipinas HB 11014 propone la credencial exacta; Brasil PL 974/2026; US AI AGENT Act draft; IETF AIP/AIRS en draft).
- **Reformulación clave:** de "registro universal obligatorio por ley" a **capa de credencial de humano-verificado que los rails económicos exigen hoy** (enforcement económico antes que legal). Extracción: pasa SOLO como compuerta onchain — JWT de Skyfire no es verificable dentro de programas Solana. Rails destino: MCPay/Latinum/facilitators como clientes naturales.
- **Resultado:** dossier completo en `docs/CANDIDATE_O_agentic-dni.md` (cliente, problema, mapa de lo existente, diferenciación, integración con rails, riesgos honestos, requisitos de Research Gate). Sección en `03_COMPETITORS.md`; fuentes [C61]-[C66] y [S38]-[S46].
- **Riesgo central documentado:** cold-start (necesita ≥1 facilitator real gateando) + dependencia de KYC externo + destino probable = absorbido/estandarizado, no IPO.
- **Siguiente acción:** usuario decide si O pasa a Research Gate → validación con un facilitator x402 (PayAI/MCPay/Corbits) como condición explícita.

## Sesión 7 — 01/10/2026 (continuación)

- **Meta:** Research Gate para Candidato O completado y decisión humana emitida.
- **Resultado:** `docs/04_RESEARCH_GATE.md` lleno con los 11 campos → **DECISIÓN: CONSTRUIR** (aprobado por usuario, alias pendiente de registrar). Alcance aprobado: core MVP = SAS attestation "human-verified agent" + x402 gate + demo dos agentes + dashboard audit; **mock issuer** para demo (KYC real post-hackathon); **puente 8004 fuera del MVP** (solo narrativa pitch, visión cross-chain de producción). Condición registrada: contacto con ≥1 facilitator x402 post-demo para validar pull.
- **Archivos actualizados:** 04_RESEARCH_GATE (aprobado), CANDIDATE_O (estado + scope), DECISIONS.md (registro append-only), PROJECT_STATE (fase → crear sdd/changes/agentic-dni).
- **Siguiente acción:** crear `sdd/changes/agentic-dni/` y arrancar fase SDD: propuesta → spec → diseño → tasks → implementación.

## Sesión 8 — 01/10/2026 (continuación)

- **Meta:** usuario pausó el build de O ("no aun no quiero construir") → verificar documentación completa y seguir explorando ideas por eje "superficies recién creadas".
- **Cierre documental O:** `01_IDEATION.md` actualizado (O como elegido + reserva de C + pools), PROJECT_STATE coherente (gate aprobado, build pausado, listo para retomar). Todo quedó reproducible.
- **Copilot 4ta ronda (7 barridos + 1 detalle):** tickets-NFT ~10/0 (todos pre-transfer-hook), Seeker attestation ~11/0 (soltag OSS existe como referencia), agent receipts ~11/0 con Mercantill ganando el vecino enterprise-controls, M2M ~11/0 (demo-hostile), AI provenance ~11/0 (cementerio notarización), agent bonds ~11/0 (AgentBond literal existe), stocks tokenizados ~11/0 (+xStocks incumbent), pay-to-message ~11/0, sensores ~11 con Kiko 5to-DePIN.
- **Web:** capacidades Seeker verificadas (SGT soulbound 1/dispositivo + Seed Vault Secure Element) — la primitiva de Q es real.
- **Resultado:** pool 4ta ronda en `docs/CANDIDATES_4ta_ronda.md`: P entradas anti-reventa (transfer hooks), Q claims hardware-bound (Seeker), R factura del agente (x402 receipts), S mandato verificable, T suscripción-que-muere-sola. Observación estratégica: O+R+S podrían ser UN producto (accountability completa de pagos de agentes).
- **Siguiente acción:** usuario decide: arrancar SDD de O, o evaluar P/Q como alternativas, o la opción O+R+S como suite.

## Sesión 9 — 01/10/2026 (continuación)

- **Decisión del equipo:** expandir O a **suite O+R+S** — "capa de accountability de la economía de agentes" (identidad quién-está-atrás + mandato qué-autorizó + recibo qué-pasó, como efecto atómico del pago gateado).
- **Verificaciones técnicas:** SAS confirmado live (credential→schema→attestation PDAs, expiry, revocable, legible por programas vía CPI — `sas-lib` TS) [S50]. AP2 de Google define el modelo exacto (mandates VDC open/closed + receipts) — nuestra suite = ese modelo onchain-exigible; vocabulario compatible gratis [S51].
- **Diseño unificado documentado** en dossier O §10: programa de pago gateado (check attestation + check mandato PDA + transfer USDC + emitir recibo en UNA tx), honestidad estructural (gate vive lado vendedor — el agente puede pagar fuera; el servicio es quien cierra la puerta), demo de 6 beats, riesgo scope-creep mitigado (único programa custom = el gate).
- **Pendiente para spec/diseño SDD:** toolchain del programa (Anchor vs nativo — Solana CLI/Anchor ausentes, instalación con permiso); decisión gate-in-program vs gate-en-facilitator.

## Sesión 10 — 02/10/2026

- **Meta:** usuario reanudó el build ("build pausado" de sesión 9 levantado) → ejecutar fase **PROPOSE** del change `agentic-dni` según `harness/SDD_PLAYBOOK.md` + skill local `formosa-sdd-propose`.
- **Máquina y acceso real:** LOCAL_USER, Windows 10 + Git Bash; lectura/escritura verificadas. No se ejecutó código ni build (fase documental — la fase no escribe código por contrato).
- **Archivos revisados:** `.agents/skills/formosa-sdd-propose/SKILL.md`, `harness/SDD_PLAYBOOK.md`, `PROJECT_STATE.md`, `docs/CANDIDATE_O_agentic-dni.md` (dossier completo, fuente principal §10), `docs/04_RESEARCH_GATE.md`, `docs/DECISIONS.md`, `docs/05_PRODUCT_SPEC.md`, `docs/ENVIRONMENT.md`, `sdd/changes/agentic-dni/proposal.md` + `STATUS.md` (plantillas).
- **Tareas ejecutadas:** (1) `sdd/changes/agentic-dni/proposal.md` completado — objetivo, usuario/pagador, alcance IN + OUT explícito, MVP = demo 6 beats, riesgos, citando dossier/gate/DECISIONS; (2) `docs/05_PRODUCT_SPEC.md` — baseline inicial de producto consolidado; (3) `PROJECT_STATE.md` — fase propose done, change activo, nota "build pausado" limpiada (retomado por el usuario), próxima acción = spec; (4) `sdd/changes/agentic-dni/STATUS.md` actualizado.
- **Pruebas y resultado:** ninguna prueba técnica — fase documental. Artefacto ≠ evidencia: la propuesta quedó escrita pero **pendiente de aprobación humana** (gate de la fase: aceptar propuesta).
- **Decisiones/permiso:** ninguna decisión nueva del humano en esta sesión; el alcance se copió sin rediseñar desde el gate aprobado (suite O+R+S, mock issuer, 8004 fuera, devnet, recibo event-log probable).
- **Bloqueos:** Engram MCP sigue caído → `mem_save` omitido, fallback Markdown activo (registrado acá como manda el protocolo).
- **Siguiente acción:** usuario revisa/aprueba `proposal.md` → fase `spec` (`sdd/changes/agentic-dni/spec.md`: requisitos observables, flujo central, criterios de aceptación, fuera de scope).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 11 — 02/10/2026

- **Meta:** ejecutar fase **SPEC** del change `agentic-dni` según `harness/SDD_PLAYBOOK.md` + skill local `formosa-sdd-spec` (fase despachada tras aprobación humana de la propuesta).
- **Máquina y acceso real:** LOCAL_USER, Windows 10 + Git Bash; lectura/escritura verificadas en la carpeta del proyecto. No se ejecutó código ni build (fase documental — la fase no escribe código por contrato).
- **Archivos revisados:** `.agents/skills/formosa-sdd-spec/SKILL.md`, `harness/SDD_PLAYBOOK.md`, `AGENTS.md`, `CLAUDE.md` (adaptador), `sdd/changes/agentic-dni/proposal.md` + `STATUS.md`, `sdd/templates/spec.md` + `STATUS.md` + `test-plan.md`, `docs/CANDIDATE_O_agentic-dni.md` (§10 diseño de suite + demo 6 beats + honestidad estructural), `docs/04_RESEARCH_GATE.md` (alcance cerrado), `docs/05_PRODUCT_SPEC.md`, `docs/DECISIONS.md`, `docs/ENVIRONMENT.md`, `PROJECT_STATE.md`.
- **Tareas ejecutadas:** (1) `sdd/changes/agentic-dni/spec.md` completado — framing usuario/problema/outcome, 10 requisitos MUST observables (R-01..R-10), criterios de aceptación CA-1..CA-6 mapeados 1:1 a los 6 beats con condiciones PASS/FAIL explícitas + edge cases CA-7..CA-12, invariantes INV-1..INV-5, errores/seguridad/accesibilidad, OUT explícito; (2) `STATUS.md` → spec escrita, próxima fase design; (3) `PROJECT_STATE.md` → fase, change activo, próxima acción, sesión.
- **Pruebas y resultado:** ninguna prueba técnica — fase documental. Artefacto ≠ evidencia: la spec quedó escrita pero **pendiente de revisión humana** (gate de la fase); no se afirmó aprobación.
- **Decisiones/permiso:** ninguna decisión de diseño tomada — las 7 forks quedaron marcadas OPEN para `design` (Anchor vs nativo, recibo event-log vs cuenta-PDA, modo integración x402, SAS real vs schema propio, SPL vs Token-2022, ventana de cap_diario, respuesta del servicio en beat 3). Invariante de privacidad fijado a nivel spec: onchain solo nivel/issuer/timestamp/revocación — nunca PII.
- **Bloqueos:** Engram MCP sigue caído → `mem_save` omitido, fallback Markdown (registrado según protocolo).
- **Siguiente acción:** usuario revisa/aprueba `spec.md` → fase `design` resuelve las 7 decisiones OPEN (`docs/06_SOLANA_DECISION.md`, `docs/07_ARCHITECTURE.md`, `sdd/changes/agentic-dni/design.md`).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 12 — 02/10/2026

- **Meta:** ejecutar fase **DESIGN** del change `agentic-dni` según `harness/SDD_PLAYBOOK.md` + skill local `formosa-sdd-design` (fase despachada por el orquestador SDD tras aprobación humana de la spec).
- **Máquina y acceso real:** LOCAL_USER, Windows 10 + Git Bash; lectura/escritura verificadas en la carpeta del proyecto. No se escribió código ni se ejecutó build (fase documental — la fase no escribe código por contrato).
- **Archivos revisados:** `.agents/skills/formosa-sdd-design/SKILL.md`, `harness/SDD_PLAYBOOK.md`, `sdd/changes/agentic-dni/{proposal,spec,design,STATUS}.md`, `sdd/templates/design.md`, `docs/CANDIDATE_O_agentic-dni.md` (§10 suite aprobada + 6 beats + honestidad estructural), `docs/{04_RESEARCH_GATE,05_PRODUCT_SPEC,DECISIONS,ENVIRONMENT,SESSION_LOG,SOURCES}.md`, `docs/ENVIRONMENT.md` (toolchain WSL real), `.agents/skills/{solana-dev,solana-hackathon}/SKILL.md`, `AGENTS.md`, `PROJECT_STATE.md`.
- **Verificación externa (web, fuentes primarias):** `sas-lib@1.0.10` en npm (Solana Foundation, sobre `@solana/kit`); SAS program `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` live en devnet; layout `Attestation{nonce,credential,schema,data,signer,expiry,token_account}` y seeds `["attestation",credential,schema,nonce]` verificados en `program/src` + `clients/typescript/src/pdas.ts` del repo oficial; **revocación SAS = `CloseAttestation` borra la cuenta** (no hay flag revoked); `expiry==0` = sin expiración.
- **Tareas ejecutadas:** (1) `docs/06_SOLANA_DECISION.md` — registro de las 7 decisiones con opciones/tradeoffs/invalidadores: D1 Anchor 1.2.0, D2 recibo `emit!` event-log, D3 servicio propio x402-shaped, D4 SAS real devnet con check por lectura de cuenta (sin CPI), D5 SPL Token, D6 cap_diario = día calendario UTC, D7 servicio verifica tx on-chain + recurso JSON; (2) `docs/07_ARCHITECTURE.md` — diagrama de componentes + trust boundaries, layouts `GateConfig`/`Mandate`/Attestation SAS, flujo `pay` exacto con orden de checks y errores distinguibles, componentes off-chain (issuer/service-x/agent CLI/dashboard/scripts), repo layout `demo/`, estrategia build/test/deploy en WSL; (3) `sdd/changes/agentic-dni/design.md` — artefacto SDD consolidado mapeado a spec; (4) `STATUS.md` + `PROJECT_STATE.md` actualizados.
- **Pruebas y resultado:** ninguna prueba técnica — fase documental. Verificación de fuentes primarias sí ejecutada (ver arriba). Artefacto ≠ evidencia: el diseño quedó escrito pero **pendiente de revisión humana** (gate de la fase).
- **Decisiones/permiso:** las 7 forks OPEN de spec resueltas con elección técnicamente dominante cada una (sin fork genuino que requiera al humano); hallazgo SAS (revocación = cuenta cerrada) incorporado al check on-chain; `update_mandate` diferido a LATER (ningún beat/CA lo exige).
- **Bloqueos:** Engram MCP sigue caído → `mem_save` omitido, fallback Markdown (registrado según protocolo).
- **Siguiente acción:** usuario revisa/aprueba diseño (`design.md` + `docs/06` + `docs/07`) → fase `tasks` (`sdd/changes/agentic-dni/tasks.md` + `test-plan.md` — slices verticales y pruebas ejecutables).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 13 — 02/10/2026

- **Meta:** ejecutar fase **TASKS** del change `agentic-dni` según `harness/SDD_PLAYBOOK.md` + skill local `formosa-sdd-tasks` (fase despachada por el orquestador SDD tras aprobación humana del diseño).
- **Máquina y acceso real:** LOCAL_USER, Windows 10 + Git Bash; lectura/escritura verificadas en la carpeta del proyecto. No se escribió código ni se ejecutó build (fase documental — la fase no escribe código por contrato).
- **Archivos revisados:** `.agents/skills/formosa-sdd-tasks/SKILL.md`, `harness/SDD_PLAYBOOK.md`, `sdd/changes/agentic-dni/{proposal,spec,design,STATUS}.md`, `sdd/templates/{tasks,test-plan,STATUS}.md`, `docs/{06_SOLANA_DECISION,07_ARCHITECTURE,ENVIRONMENT,DECISIONS}.md`, `AGENTS.md`, `PROJECT_STATE.md`, `demo/` (solo README — carpeta vacía de código).
- **Tareas ejecutadas:** (1) `sdd/changes/agentic-dni/tasks.md` — 8 slices verticales ordenados por dependencia, cada uno con archivos bajo `demo/`, aceptación chequeable y cobertura R/CA/beat: **S1** scaffold `demo/`+pipeline WSL+GateConfig (PRIMER SLICE recomendado) · **S2** SAS dumpeado en test-validator (`scripts/dump_sas.sh` idempotente + `[[test.genesis]]` + helpers sas-lib/token) · **S3** `init_mandate`+`pay` completo (CA-2/3/4) · **S4** `revoke_mandate`/`close_mandate`+matriz de reverts CA-5..CA-12 · **S5** deploy devnet+setup actores · **S6** issuer+agente CLI+servicio x402 · **S7** dashboard read-only · **S8** demo 6 beats+docs; (2) `sdd/changes/agentic-dni/test-plan.md` — mapa 1:1 CA-1..CA-12 a casos `anchor test` + nivel 2 integración devnet + nivel 3 smoke beats; estrategia tiempo-dependiente CA-8/CA-9 = expiry corto (~10s) + retry de `pay` (fallback `warp_slot` en run dedicado); asserts de atomicidad INV-2 en todo revert; (3) `STATUS.md` + `PROJECT_STATE.md` actualizados.
- **Pruebas y resultado:** ninguna prueba técnica — fase documental. Artefacto ≠ evidencia: las tasks quedan escritas pero **pendiente aprobación humana del primer slice** (gate de la fase `tasks`: "aprobar primer slice"); no habilita código aún.
- **Decisiones/permiso:** ninguna decisión de implementación tomada; decisiones menores diferidas a `apply` documentadas en test-plan (p.ej. `pay` con `amount=0` → default recomendado `InvalidAmount`, spec no lo fija). Forecast de review incluido en `tasks.md`: ~1.700–2.300 líneas, 8 slices — informativo (repo local sin flujo PR).
- **Bloqueos:** Engram MCP sigue caído → `mem_save` omitido, fallback Markdown (registrado según protocolo).
- **Siguiente acción:** usuario revisa `tasks.md` + `test-plan.md` y aprueba el primer slice **S1** → fase `apply` (TDD, slice-by-slice, commits convencionales en español).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 14 — 02/10/2026

- **Meta:** ejecutar fase **APPLY** del change `agentic-dni` — slice **S1** (scaffold `demo/` + pipeline WSL + `GateConfig`), despachada tras aprobación humana explícita ("implement slices S1→S8 in order").
- **Máquina y acceso real:** LOCAL_USER, Windows 10; toda la ejecución Solana en WSL Ubuntu (`wsl -d Ubuntu -- bash -lc`), workspace `~/agentic-dni-demo` sincronizado con `demo/scripts/wsl_sync.sh` (repo Windows = fuente de verdad).
- **Tareas ejecutadas:** (1) `git init` del repo + commit baseline `bd73b9d`; (2) scaffold `demo/` completo (Anchor.toml, Cargo.toml workspace, package.json, .gitignore, .env.example, programs/agentic-gate, tests, scripts); (3) `initialize_config` + `update_config` (admin-only) + `GateConfig` PDA `["config"]` + `GateError` skeleton; (4) dump SAS devnet OK → `tests/fixtures/sas.so` (135.680 bytes); (5) diagnóstico validator + decisión de fallback (ver abajo); (6) harness `tests/helpers/surfnet.ts` + tests S1; (7) docs append (DECISIONS/STATUS/PROJECT_STATE/tasks).
- **Comandos/resultados (literales):** `anchor build` → `Finished release/test profile` sin errores (artefactos: `target/deploy/agentic_gate.so`, `target/idl/agentic_gate.json`); `solana program dump 22zoJM… /tmp/sas.so --url devnet` → OK; `anchor test --validator legacy` → **FALLA entorno** `broadcast multi_bind: AddrInUse` (WSL1 no emula SO_REUSEPORT — sin proceso conflictivo; verificado `netstat`/exclusiones); `solana-test-validator.exe` Windows → **FALLA** `Os { code: 1314 }` privilegio; `anchor test --skip-local-validator --skip-deploy` (npm test) → **3 passing (1s)**: init persiste 4 campos, non-admin `update_config` revierte `Unauthorized` sin mutar estado, admin rota campos. Programa: `D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2`.
- **Pruebas y resultado:** S1 VERDE — `anchor build` + `anchor test` OK en WSL con evidencia registrada.
- **Decisiones (append en DECISIONS.md):** (a) corrección factual SAS — discriminador `Attestation`=0, `Schema`=2, revocación=`CloseAttestation` (borra cuenta); (b) test stack local = **surfpool embebido** (LiteSVM real + JSON-RPC) por bloqueo ambiental de test-validator — mantiene runtime SVM real y la ruta `--skip-local-validator` prevista en test-plan como fallback.
- **Bloqueos:** ninguno activo. Engram MCP sigue caído → persistencia Markdown.
- **Siguiente acción:** S2 — helpers SAS/token + smoke attestation sobre el surfnet (deploy de `tests/fixtures/sas.so` por `soPath`).

## Sesión 15 — 02/10/2026 (apply S2–S7, consolidado)

- **Meta:** continuar fase APPLY de `agentic-dni` — S2..S7 ya ejecutados y commiteados en sesiones previas del mismo hilo; esta entrada consolida la evidencia (detalle por slice en `sdd/changes/agentic-dni/tasks.md`, sección Evidencia de cada slice).
- **Commits del rango:** S2/S3/S4 (tests surfpool 20/20 — commits previos del hilo) · S5 `92bbad3` (devnet real: programa `D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2` slot 506707105; SAS credential `JDe4sL4r73pQ3ovgkk95wNTo4SaS3U48R9PryQeZ3HRC` + schema `6bz7y1xCr8k6PzAGP1P9cwNp9Qp8RPbDjzDgod7M7ohK`; mint USDC-test `gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk`; GateConfig `AD8km3tHv3VC9gNV5L9WZKuDKJoLu5K4B9QdFjrUxNRv` init tx `4sKDwxiWiigTvfg1eCkRKpLe1CUuBomk16LSkb2SHvTkJmByD3pdBd3F4mX1wtLjgBtnHi4HbdFRXaw9dw5eWNrg`) · S6 `34d3897` (issuer/service-x/agente CLI; pago A→X `47XXNtadLoRbjoMqjsLEkFtDRiVPZedMdwEdq8LFUT3UCTzQzvT7JYMeYHUpeMdntuw11GeUR4CjeNyJZLgxQyE7`; reverts `AttestationMissing`/`PayeeNotWhitelisted`/`OverPerTxLimit`; revoke `4KKd9UtXdcJRq8SfiB2DY5RHRZH7MJKQhqGBvJy6vUcMT2PPUb8eJAZqrBKGViye5hV8nAaz6UH9EG7nnspFBNZ5` + re-attest `5nMUwUJqD2MfwEM8CuvWTYhfuzXwBh3SPUNDDiYCYQXspACZhWrnk1fNXSznr8spJiyVnBaRfLy4ZCRruRabaSRh`).
- **S7 ejecutado (esta sesión):** `demo/dashboard/` Vite+React read-only — `src/gate.ts` (mandatePda/attestationPda/fetchMandate/fetchAttestation/fetchLedger via `BorshAccountsCoder`+`EventParser`+layout SAS manual), `src/App.tsx` (3 paneles: ledger→explorer, mandato, attestation; selector de agente; live 4s), `src/index.css`, `scripts/sync_dashboard_env.sh` (demo/.env → dashboard/.env solo `VITE_*` públicas), `scripts/check_dashboard_data.ts` (ejerce la MISMA capa de datos que la UI).
- **Pruebas y resultado S7 (devnet real):** `tsc --noEmit` OK; `vite build` OK; `vite dev :3404` sirve + `VITE_*` inyectadas; `check_dashboard_data.ts` → mandato A **vigente** ($5/tx, cap $10, spent $1.00, whitelist=X), attestation A **vigente** (level 2, hadHistory=true por el revoke/re-attest de S6), ledger 3 txs incluido el pago S6 completo. Cero escrituras/firma: solo RPCs de lectura; sin keypair ni wallet-adapter.
- **Fix aplicado:** decoder IDL conserva snake_case (`max_per_tx`, `payee_whitelist`) — mismo patrón del bug `service_ref` de S6; `f()` tolera ambos.
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción:** S8 — `run_beats.sh` + `demo/README.md` + ejecución real de los 6 beats con dashboard reflejando revocación.

## Sesión 16 — 02/10/2026 (apply S8 — demo 6 beats devnet real)

- **Meta:** cerrar APPLY de `agentic-dni` con el slice S8 — orquestación de la demo de 6 beats + docs, ejecutado contra devnet real.
- **Tareas ejecutadas:** (1) `demo/scripts/run_beats.sh` — beats encadenados con verificación de resultado esperado por beat (reverts deben contener el GateError exacto; exit 1 si algo no se comporta) + resumen ✓/✗, idempotente; (2) `demo/README.md` — guion ~90s en español + checklist explorer por beat + limitación honesta del MVP; (3) ejecución real `bash scripts/run_beats.sh`; (4) verificación post-beats con `check_dashboard_data.ts` (misma `dashboard/src/gate.ts` que la UI).
- **Comandos/resultados (literales — devnet, 02/10/2026):**
  - B1 attest A → `{"existing":true,"attestationPda":"pAht9t8UcZkmGSZXWEHSe1VPL2E6iMt42SYUQ2tdMXt"}` (idempotente — emitida en S6).
  - B2 init_mandate A → ya vigente (idempotente): `max=5`, `cap=10`, whitelist=[X], `revoked=false`.
  - B3 pay A→X $0.50 → 402 `invoice=e4fe4b4c6751262641a37e19376789e2` → tx **`tkfFinMDbvbd93j7yWXDdxpmseUKMLJbbRv6C2pgBsN8BrsjLbfqgCbASbK6xc498KAAjQfuTR5M8y9e13pZ6xq`** → `200` + receipt `{payer:A,payee:X,amount:500000,service_ref,mandate:3S7N…,timestamp:1790963342}`.
  - B4 pay B→X (status `nunca-emitida`) → REVERTIDO **`AttestationMissing`**.
  - B5a pay A→X $10 → REVERTIDO **`OverPerTxLimit`**; B5b pay A→Y $0.50 → REVERTIDO **`PayeeNotWhitelisted`**.
  - B6 `revoke --agent a` → tx **`t2rEuxeLaJkECJYjEmHt8kjY5Xiy7dde3xA6h27PkRX8Dum2ufta4e4cMvBvjStj9MVejMaNFjf4UzXbqH4Ha8Z`** → pay final A→X → REVERTIDO **`MandateRevoked`**.
  - `LOS 6 BEATS OK — devnet real` (exit 0).
- **Dashboard reflejando revocación (post-beats):** `check_dashboard_data.ts` → mandato A `estado:"revocado"`, `revoked:true`, `totalSpent:"$1.50"`; ledger 5 txs (revoke ix + pago `tkfFin…` + pagos previos + init); attestation A `vigente` (revocar mandato ≠ revocar identidad).
- **Pruebas y resultado:** S8 VERDE — los 6 beats corrieron en devnet con signatures reales verificables en explorer (`?cluster=devnet`).
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción:** fase VERIFY (`sdd-verify` valida implementación vs spec) y luego ARCHIVE; demo lista para grabar/presentar.

## Sesión 17 — 02/10/2026 (VERIFY — revisor adversarial independiente)

- **Meta:** ejecutar fase **VERIFY** del change `agentic-dni` según `harness/SDD_PLAYBOOK.md` + skill local `formosa-sdd-verify` — revisor fresco que NO confió en los claims de las sesiones 14–16: cada afirmación se re-verificó con comandos propios.
- **Máquina y acceso real:** LOCAL_USER, Windows 10; Solana CLI 4.3.0 vía `wsl -d Ubuntu -- bash -lc`; working copy `~/agentic-dni-demo` intacta.
- **Verificación independiente ejecutada (propia, no transcrita):**
  - `solana program show D8pcKtez… -u devnet` → live (authority=owner F3ij…, slot 506707105, 192.280 B).
  - `solana confirm -v` × **9 signatures** → todas `Status: Ok` con la ix esperada: Pay (`tkfFin…` beat-3, `47XX…`/`xLnMW…` S6), RevokeMandate (`t2rE…` beat-6), InitMandate (`5Fxx…`/`5gKu…`), InitializeConfig (`4sKD…`), SAS (`tcRH…` create, `4KKd…` close, `5nMU…` re-create).
  - Decode manual del `Program data:` del tx beat-3 (python propio, sin IDL del repo) → recibo con los 6 campos R-05, `service_ref=e4fe4b4c…` = invoice claimado.
  - Decode raw de Mandate PDA `3S7N…` → `revoked:true`, `spent_today=total_spent=1.500.000`, whitelist=[X]; GateConfig → credential/schema/min_level claimados; attestation PDA `pAht9t8U…` → `disc=2`, `data`={level:2, issued_at} (INV-1: cero PII), signer=issuer.
  - Re-derivación propia de PDAs con web3.js → attestation(A)=`pAht9t8U…` y mandate(A)=`3S7N…` exactos; attestation(B)=`DHmB6ciG…` inexistente con historial 0 ("nunca-emitida" real); mandate(B) existe.
  - Decode de ATAs del tx beat-3 → ambos mint `gmfqCXG6…` (USDC-test); service_ata balance 1.500.000 = los 3 pagos exactos.
  - **Suite re-ejecutada**: `npx ts-mocha` en WSL → **20 passing (9s)** (S1×3 + S2×4 + S3×3 + S4×10).
  - `check_dashboard_data.ts` re-ejecutado → mandato `revocado`, attestation `vigente`, ledger 5 txs — la capa de datos de la UI reproduce el estado real.
  - Repo: `git status` limpio; commits convencionales en español sin atribución IA; `git check-ignore` confirma `keys/*` + `.env` ignorados (solo `.gitkeep` trackeado); scan sin secretos; `git diff bd73b9d..HEAD` → todo código nuevo bajo `demo/` (`platform/` ni existe en este repo).
- **Hallazgos:** **WARNING-1** — `pay` no exige mint USDC: solo `agent_ata.owner==agent`/`service_ata.owner==service`; el recibo no incluye mint y service-x no lo verifica → exploit de mint basura posible (no explotado en evidencia; ATAs reales = USDC-test). **WARNING-2** — reverts de beats no quedan on-chain: agente usa `.rpc()` con preflight → simulación los rechaza sin grabar tx fallida (confirmado: 0 txs con err en historiales de agente A y mandato); el checklist del README promete "tx fallida" en explorer que no puede existir — GateError genuino pero sin link. SUGGESTION ×3: mandato demo `expiry=0` vs "mañana" del ejemplo; test CA-3 no asserta `service_ref` puntualmente; `initialize_config`/issuer `/attest` sin auth extra (mock ok).
- **Artefactos escritos:** `sdd/changes/agentic-dni/verification.md` (PASS CON WARNINGS, tabla R/CA/INV/D completa) · `docs/08_VALIDATION.md` (sección de validación técnica agregada preservando E-001) · `STATUS.md` · `PROJECT_STATE.md`.
- **Veredicto:** **PASS CON WARNINGS** — los 10 R, 12 CA y 5 INV probados con evidencia propia; la evidencia devnet de sesiones 15–16 es REAL en su totalidad.
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción:** humano decide si WARNING-1 entra como fix menor pre-archive o queda documentado → fase **ARCHIVE** (`docs/09_DEMO_SUBMISSION.md`, `docs/10_ROADMAP.md`).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 18 — 02/10/2026 (FIX-ROUND post-verify — W1 + W2 resueltos con evidencia devnet)

- **Meta:** resolver los dos warnings de sesión 17 (aprobados por el humano): **W1** atar `pay` al mint USDC configurado y **W2** que los pagos que revierten aterricen como txs fallidas reales en devnet; redeploy al MISMO program id, re-init del GateConfig y re-corrida completa de los beats con signatures capturadas.
- **Máquina y acceso real:** LOCAL_USER, Windows 10; todo Anchor/Solana vía `wsl -d Ubuntu -- bash -lc` (anchor 1.2.0, solana 4.3.0, node 22); working copy `~/agentic-dni-demo` sincronizada con `scripts/wsl_sync.sh`.
- **W1 implementado:** `GateConfig` gana `usdc_mint: Pubkey` (set en `initialize_config`, firma ahora `(admin, sas_credential, sas_schema, usdc_mint, min_level)`); en `Pay` ambos token accounts exigen `ata.mint == config.usdc_mint` → error nuevo **`WrongMint`** (último variante de `GateError`); `PaymentReceipt` pasa a **7 campos** con `mint`. Para migrar la cuenta vieja (layout incompatible, no deserializa) se agregó **`close_config`** (valida seeds + discriminador Anchor + `admin` leído a bytes crudos del layout viejo, drena rent al admin) — decisión: close+re-init en lugar de `realloc`, porque el admin ES la autoridad y la config es un singleton de demo.
- **W1 en consumidores:** `init_config.ts` (detecta layout viejo → `closeConfig` + `initializeConfig` con mint del `.env`); `service-x` verifica `receipt.mint === USDC_MINT` además de payee/amount/invoice; `dashboard/src/gate.ts` parsea el evento de 7 campos; tests actualizados + **CA-13** nuevo: `pay` con mint distinto revierte `WrongMint` sin transfer ni evento.
- **W2 implementado:** `agent/src/pay.ts` gana flag `--skip-preflight` — envío manual (`transaction()` → firma → `sendRawTransaction({skipPreflight:true})`); la confirmación tolera el rechazo de `confirmTransaction` (race conocida de web3.js que devuelve el `InstructionError` crudo cuando la tx aterriza fallida) y lee el resultado autoritativo con `getTransaction` → si `meta.err` imprime `pay REVERTIDO on-chain: <GateError>` + `tx fallida <sig>` + link explorer y sale 1. `run_beats.sh` usa el flag en beats 4/5/6; los pays felices conservan `.rpc()` con preflight normal. Fix colateral en `start_services.sh`: readiness curls con `|| true` (con `set -e` un curl fallido abortaba el script).
- **Pruebas:** `anchor build` OK; suite `npx ts-mocha` → **21 passing (3s)** (S1×3 + S2×4 + S3×3 + S4×11, incluye CA-13 WrongMint). Nota: un run previo dio 18/2 por muerte de surfpool en el `before` de S1 (flake de infra conocido, no del programa); el re-run verde es el que cuenta.
- **Deploy (mismo program id):** upgrade tx **`5WsEeB132qdZMpiZBioxKvHPJWY3v8T5Mtoo8Fmvo74fzoTDcDZ1uVYkuc2jeA7GjXYWQj63wewskAKZbW9ErFiM`** — `Program ID: D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2` (auto-extend +10.240 B; primer intento falló por authority mismatch — se desplegó con la wallet owner `F3ij…` que ES la upgrade authority). IDL re-anclado.
- **Migración GateConfig (mismo PDA `AD8km3tH…`):** close tx **`5AwRPjsFSmr9jboNvKdgTE7Kvav3DqpJpyW9AtzGDyvpaWDysPrvWG4tiNSXFyY2dRQSv3EHN9q5QTj7hTPq8N4A`** → re-init tx **`35QuEqjic1awUS5Jfbp1YEy231mhtPRvXrcMv7yoMi6SaXGx3Q7Vzkn2s5NW7cJkXxZRb2sRrCmCSaWNXqfMjiMk`** con `usdc_mint = gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk`.
- **Beats re-corridos en devnet (`run_beats.sh` → LOS 6 BEATS OK) — signatures de la corrida final:**
  - B1 attest A: idempotente, attestation PDA `pAht9t8UcZkmGSZXWEHSe1VPL2E6iMt42SYUQ2tdMXt` ya existente.
  - B2 mandato A: venía revocado → close **`eH1dowUNqomJcs24D3xzcTpJs1gHbY3exTekgQSR937yD3kzTovS8NefUdFVTgNPHAj3ArsDFhPJDXM1ihPRzac`** + re-init **`32ZvGU3UVw8Ft6ztiTxLvYGnCLhVTQ7L7N3j712ARrjCeCei3sLvHPmPvAQ34ZV74WNjA2sjCAqxmDYHEJYBqGy2`** (PDA `3S7N…` reutilizado, contadores en 0).
  - B3 pay A→X $0.50: **`3W9HSVZFQ6FQoH8XVusA4t38PpRMEbjMbjc53GKWxjwPL4R4DzasucES3oRzHrhTGYqAmhuiHEC9gUVk6Sbdwnm8`** → 200; receipt incluye `mint = gmfqCXG6…` (W1 visible e2e).
  - B4 B→X sin attestation: **tx fallida `5fQegTbiTwtJ6YmQq3xDv2qjsY6hpwT5j4J55raCVXzikRnsD33qocnFpnb3sesMF8bwiHiiU735quabdKm5XXSo`** — verificada con `solana confirm -v`: `Status: Error … custom program error: 0x1772` = `AttestationMissing` (6002), fee ◎0.000005 cobrado a B.
  - B5a A→X $10: **tx fallida `4CkKhEjSEWTmJGMxmmx1vHGMgE7SPRJw2oesroYiE5VCLfSaG7Q4q7D526N48A8T985vgw4MdHT2VsoES1qTqswk`** — `OverPerTxLimit`.
  - B5b A→Y $0.50: **tx fallida `5MPXz1Zyoyhki4t4YWrsJVHBX7ZxAREufti9wa7Tp1qBgk8K4qFncE6hykn6vYBrGaKTiiYRzePbWtqSHKMbARAT`** — `PayeeNotWhitelisted`.
  - B6 revoke **`sXwCv8ua47kwRCpwFqcZHQJ9CPLj22yCabhWepZgm46tMFGevhWpnXcf7RBQzYJSrf29JVL2SeufJtAf1VQT9JG`** → siguiente pay: **tx fallida `5V82hQsLUi2CmB4VTXd3ntuJcwzW9hEtcxVpQCMF4CwdswE4cRDcQjQPqBKZpUBAaAGaRXWLQYwfZtC8JEM6UrL9`** — `MandateRevoked`.
  - (Primera corrida post-deploy también dejó evidencia válida: B3 `2vkGh4…`, B5a `49U5iw…`, B5b `gDNbdJ…`, B6 `4QhV9a…`; B4 aterrizó fallida pero el CLI murió antes de imprimir la sig — motivo exacto del patch de `getTransaction`.)
  - Dashboard (`check_dashboard_data.ts` post-beats): ledger 19 txs con clasificación `pago`/`fallida`/`otra-ix` — las 4 txs fallidas de la corrida final + 3 de la corrida previa visibles; mandato `revocado`.
- **Docs corregidos:** `PROJECT_STATE.md` (línea `platform/` — la copia NO existe en este repo; constraint "original intocable" se mantiene), `07_ARCHITECTURE.md` (GateConfig + `usdc_mint`, `close_config`, WrongMint en flujo `pay`, recibo 7 campos), `06_SOLANA_DECISION.md` y `design.md`/`test-plan.md`/`tasks.md` (anotaciones post-verify), `08_VALIDATION.md` + `verification.md` (warnings → RESUELTOS), `demo/README.md` (checklist con txs fallidas reales + nota `--skip-preflight`).
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción:** fase **ARCHIVE** (`docs/09_DEMO_SUBMISSION.md` + `docs/10_ROADMAP.md`).

## Sesión 19 — 02/10/2026 (ARCHIVE — change agentic-dni cerrado + re-verificación independiente)

- **Meta:** cerrar el change `agentic-dni` según `formosa-sdd-archive` — completar `docs/09_DEMO_SUBMISSION.md` y `docs/10_ROADMAP.md`, marcar STATUS final ARCHIVADO. Además, una segunda corrida independiente de los beats post-fix volvió a dar 6/6 en devnet (evidencia adicional de reproducibilidad).
- **Máquina y acceso real:** LOCAL_USER, Windows 10; cadena WSL idem sesión 18 (`wsl -d Ubuntu -- bash -lc`).
- **Re-verificación ejecutada (segunda corrida post-fix, independiente de la de sesión 18):** suite 21/21 (incl. CA-13 WrongMint); `anchor build` OK; upgrade re-confirmado mismo program id (`solana program show` → slot 506731519, authority owner intacta); GateConfig `AD8km3tH…` verificado en layout nuevo con `usdc_mint = gmfqCXG6…`; beats 6/6 con sigs propias — pay `2uPEkP…mgq`, txs fallidas on-chain `93EckDMu…y6q` (AttestationMissing 6002, confirmada `solana confirm -v`), `2pTWG7kA…Mcpc` (OverPerTxLimit 6010), `3gwBHzuN…jX6K` (PayeeNotWhitelisted), `Jq2QMDvy…DXs` (MandateRevoked). Ambas corridas (sesión 18 y esta) son evidencia válida; `docs/09` usa las de **sesión 18** como canónicas (signatures completas — ver nota de consistencia abajo).
- **Gotcha operativo encontrado:** `start_services.sh` con `nohup &` no sobrevive al fin de la invocación `wsl -- bash -lc` (WSL mata los procesos al no quedar sesión viva) — para re-correr servicios desde Windows hay que mantener la sesión WSL abierta (ej. sesión por servicio o `wsl -d Ubuntu` interactivo). Además, doble expansión de `$VAR` Git Bash→`bash -lc`: escribir launchers como archivo en vez de inline.
- **Artefactos escritos:** `docs/09_DEMO_SUBMISSION.md` (ficha + direcciones on-chain + tabla de 6 beats con signatures completas + cómo reproducir + evidencia de tests + checklist de entrega con ambas entregas **NO REALIZADAS**) · `docs/10_ROADMAP.md` (limitaciones documentadas, condición post-demo del gate — contactar ≥1 facilitator x402 —, candidatos de próxima iteración: recibo-PDA/update_mandate/anti-replay/multi-issuer/Token-2022/puente-8004/KYC real, lecciones WSL1+surfpool+sas-lib+faucet, D+1/D+7/D+30) · `sdd/changes/agentic-dni/STATUS.md` → ARCHIVADO · `docs/05_PRODUCT_SPEC.md` → baseline consolidado post-archive · `PROJECT_STATE.md` actualizado.
- **Nota de consistencia:** la entrada de esta sesión se escribió antes de que los artefactos 09/10 quedaran efectivamente completos; las signatures canónicas citadas en `docs/09` §3 son las de la **corrida de sesión 18** (post-fix W1/W2 — `3W9HSVZFQ6…`, `5fQegTbi…`, `4CkKhEj…`, `5MPXz1…`, `sXwCv8…`+`5V82hQ…`). Las sigs de la segunda corrida citadas arriba quedan como evidencia secundaria de reproducibilidad (registradas truncadas).
- **Veredicto final del change:** BUILD → VERIFY PASS (warnings resueltos) → ARCHIVED. Change `agentic-dni` cerrado.
- **Bloqueos:** ninguno técnico. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción (humana, fuera de SDD):** grabar video demo 2–3 min (`run_beats.sh` determinista), verificar bases/fechas y registrar entregas Colosseum + Superteam Earn con comprobante, contacto facilitator x402 (condición del Research Gate — bloquea claims de demanda).
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 20 — 02/10/2026 (post-archive — legibilidad del demo + historia de adopción)

- **Meta:** hacer el demo legible para un jurado y mostrar la historia de adopción "cero fricción": (1) dashboard legible (veredictos PAGO ACEPTADO/RECHAZADO con GateError en criollo, nombres amigables de actores, mandato/attestation en términos planos), (2) sección "Adopción" en el dashboard con el snippet real de integración + adoptantes en vivo, (3) beat de adopción en vivo: un servicio nuevo (service-z :3405) queda gate-protected agregando solo el check.
- **Máquina y acceso real:** LOCAL_USER, Windows 10; toolchain vía `wsl -d Ubuntu -- bash -lc`; working copy `~/agentic-dni-demo` sincronizada con `scripts/wsl_sync.sh push`.
- **Implementado:**
  - `demo/services/gate-check.ts` (nuevo): helper `createGate({programId, payee, price, mint})` → `requirements()` (402 + invoice single-use) + `verify(sig)` (tx on-chain → PaymentReceipt → payee/mint/monto/invoice). Extraído de service-x — ES la integración completa que un adoptante copia.
  - `service-x` refactorizado a `createGate` (mismo comportamiento externo: health + 402 verificados en vivo); `service-z` nuevo (:3405) — su archivo entero es el artefacto "un adoptante escribe ~10 líneas".
  - `scripts/adopt_service.ts` (alta sin permiso: wallet + ATA del mint, paga rent el owner) + `scripts/demo_adoption.sh` (beat WSL1-safe: alta → 402 → revert PayeeNotWhitelisted/MandateRevoked → owner whitelista → pago 200; idempotente si z ya está whitelisted y vigente).
  - Scripts: `dev_service.sh z`, `start_services.sh` levanta z si `SERVICE_Z_WALLET` existe, `stop_services.sh` mata z, `sync_dashboard_env.sh` emite `VITE_ISSUER_WALLET` + `VITE_SERVICE_Z_WALLET`, `.env.example` documenta z, `owner.ts` alias `z`.
  - Dashboard: tab `Auditoría` (chips de veredicto + GateError + explicación, nombres amigables owner/agentes/servicios/issuer/mint/programas, panel mandato en criollo con máx/tx + cap diario + whitelist nombrada, panel attestation "¿humano verificado? SÍ/NO" + issuer + nivel mínimo desde GateConfig on-chain, ix no-pay etiquetadas alta/revocación/cierre de mandato) y tab `Adopción` (claim + 3 pasos + snippet extraído de las líneas `// ── INTEGRACIÓN` del service-z real + fuentes `?raw` en <details> + adoptantes x/y/z en vivo via proxy `/svc/*` de vite + comando del beat + fricción honesta).
- **Verificación:** `npx tsc --noEmit` raíz = baseline idéntico (1 error preexistente import.meta en gate.ts:43 via check_dashboard_data — preexistente, no nuevo); `tsc --noEmit` dashboard = limpio; `npx vite build` OK (115 módulos, ?raw inlined); service-x smoke en vivo: `/health` + 402 requirements idénticos; vite proxy `/svc/x/health` → respuesta real del servicio. **`demo_adoption.sh` corrido E2E en devnet — 6/6 OK**: wallet z `7FeUU3iB…`, ATA `G76PdZSy…`, tx fallida on-chain `42BDup8a4qLaDPk2XvawRjoq5gk4cgm4S6unb5R76gNoAx8f4GVap5ygHemBTXPvqRkViPR54B3BENn9CAYDwbXh` (mandate cerrado en paso previo → AccountNotInitialized), close `4s9WQ9AP…`, re-init con payees [x,z] `3xxM5WSATqocedH4SCN4ToYAKN9SJAg6KsoT7Aak6XzTa7ry55UNhtZhzKWsz6Ji9wboqwERN457U5oNcpgt9XWo`, pago A→Z $0.50 → 200 + recibo `3vhhtWgMNGuvcn5tyhstC4UhNHsi1oaN57u1pLo83TCsQLiKZ99aYJg4mrvDHA4XrERonRSDctDbm3in8Wm9h6dm`. Estado on-chain resultante: mandato A vigente, whitelist [X, Z].
- **Bugs encontrados por la corrida E2E:** (1) CRLF en scripts nuevos escritos desde Windows — WSL bash los rechaza (`$''`); normalizados a LF (`.gitattributes` ya forzaba eol=lf en commit, pero wsl_sync copia el working file — gotcha real). (2) Bug latente preexistente en `owner.ts resolveActor`: `envOr()` devuelve `""` para alias no seteado y `"" ?? v` conserva `""` → `new PublicKey("")` crasheaba al pasar pubkeys literales a `--payees` (nunca ejercitado porque run_beats solo usa alias `x`); fix `|| undefined`. (3) tsconfig raíz sin `strict` → `!v.ok` NO narrowea union discriminada (booleano); fix `v.ok === false` — reproducido con caso mínimo.
- **Docs:** `CANDIDATE_O §12 Modelo de adopción` (adoptantes×acciones, sin cuenta/permiso, niveles soft/routed, fricción honesta) · `11_PRESENTACION §4 Adopción` (renumerado, header §6→§7) · `demo/README.md` (tabs + beat adopción) · SESSION_LOG s20 · PROJECT_STATE.
- **NO tocado:** el programa on-chain (cero cambios Anchor), `check_dashboard_data.ts` sigue pasando por la misma capa de datos.
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción (humana):** idem s19 + opcional: `demo_adoption.sh` como beat 7 del video; `dev_service.sh z` para dejar service-z corriendo durante la demo.
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 21 — 02/10/2026 (post-archive — sitio web completo + LICENSE Apache-2.0)

- **Meta:** convertir el dashboard en una experiencia web completa para el jurado/usuario: landing con el pitch y la evidencia devnet, el dashboard existente bajo `/dashboard`, guía de adopción, runbook de demo con estado en vivo de servicios, página de colaboración y LICENSE Apache-2.0.
- **Máquina y acceso real:** LOCAL_USER, Windows 10; verificación vía `wsl -d Ubuntu -- bash -lc` sobre `~/agentic-dni-demo` (sync `wsl_sync.sh push`).
- **Implementado (todo en `demo/dashboard/`):**
  - Router client-side propio (`src/router.tsx`) — cero dependencias nuevas (la demo corre offline); vite dev resuelve fallback SPA para cualquier path.
  - `/` Landing: hero con one-liner, 3 primitivas (Identidad/Mandato/Recibo) como cards, flujo atómico `pay` en 4 pasos, tabla de los 6 beats con signatures REALES de la corrida canónica s18 linkeadas al explorer, tabla de direcciones verificables (programa, PDAs, credential, schema, mint, actores), sección "por qué ahora" (ERC-8004 sin human layer, AP2 off-chain, Skyfire cerrado, regulación draft, ~25 adyacentes 0 winners), limitación honesta.
  - `/dashboard` — el contenido existente (tabs Auditoría + Adopción) movido sin cambios funcionales; mensaje claro si falta `dashboard/.env`.
  - `/docs` — guía de adopción: tabla por actor (servicio/facilitator/owner/humano — qué hace y qué NO necesita), 3 pasos, snippet literal extraído de `service-z` + fuentes `?raw` en details (misma mecánica que tab Adopción, factorizada en `src/snippets.ts`), niveles middleware blando vs gate enforcement, fricción honesta.
  - `/demo` — comandos completos, guion beat a beat con qué mirar, checklist explorer con sigs, chips de estado EN VIVO de issuer/x/y/z vía proxy vite (`/svc/issuer` nuevo → :3401); servicio caído = chip OFFLINE + comando para levantarlo, la página no depende de los servicios.
  - `/colaborar` — placeholder `GITHUB_REPO_URL` (const única en `src/site.ts`, null = "repo por publicar"), cómo abrir issues/PRs, áreas reales del roadmap (KYC issuers, facilitator hook, recibo-PDA, puente 8004, update_mandate/anti-replay/multi-issuer), badge Apache-2.0.
  - Shell: nav superior sticky (marca + links + chip devnet→programa), footer con licencia. Datos públicos centralizados en `src/site.ts` (PROGRAM_ID, ADDRESSES, BEATS) — las páginas estáticas no necesitan `.env` ni chain.
  - `LICENSE` Apache-2.0 texto completo en raíz del repo; `demo/package.json` license MIT→Apache-2.0; nota de licencia en footer + /colaborar.
- **Verificación:** `npx tsc --noEmit` (dashboard) limpio; `npx vite build` OK (123 módulos); vite dev smoke: todas las rutas 200 (fallback SPA OK), proxy `/svc/x/health` 200 e issuer vivo (400 en wallet inválida = proceso arriba). Páginas estáticas funcionan sin servicios ni `.env`.
- **NO tocado:** programa on-chain, servicios, agent CLI, scripts de beats (solo lectura nueva del proxy issuer).
- **Pendiente/TODO:** `GITHUB_REPO_URL` en `dashboard/src/site.ts` cuando el repo se publique.
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción (humana):** idem s20 + publicar repo → setear `GITHUB_REPO_URL`.
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).

## Sesión 22 — 02/10/2026 (post-archive — demo one-click desde /demo)

- **Meta:** que el guion de 6 beats se pueda correr con un botón desde el sitio `/demo` — sin dejar la evidencia fake: el botón dispara `run_beats.sh` REAL (devnet) y la página muestra el output en vivo + links al explorer.
- **Máquina y acceso real:** LOCAL_USER, Windows 10; toolchain vía `wsl -d Ubuntu -- bash -lc`; working copy `~/agentic-dni-demo` (sync `wsl_sync.sh push`).
- **Implementado:**
  - `demo/services/demo-runner/` (nuevo workspace `@demo/demo-runner`, :3406): express + `child_process.spawn`. `GET /health` → `{ok, running}`; `POST /run` → streamea stdout+stderr de `bash scripts/run_beats.sh` (cwd `demo/`, env `.env`) como `text/plain` chunked; línea final `__RESULT__` + JSON `{ok, exitCode, output, startedAt, finishedAt}` (stream + resumen, ambos). 409 si hay corrida en curso; timeout 6 min (RUNNER_TIMEOUT_MS); `detached:true` + `kill(-pid)` para matar el árbol (bash+tsx+curl) si el cliente corta el stream — sin beats huérfanos.
  - Lifecycle: `dev_service.sh runner` (nuevo case), `start_services.sh` lo levanta + readiness pasa a 4 servicios, `stop_services.sh` lo mata, `.env.example` + `DEMO_RUNNER_PORT=3406`.
  - UI (`dashboard/src/DemoPage.tsx`): sección "Correrla ahora — un click, devnet real" con botón primario `▶ Correr demo (devnet real)` → `POST /svc/runner/run` (proxy vite nuevo `/svc/runner`→:3406), terminal en vivo (`pre.term`, autoscroll, parse del sentinel `__RESULT__`), verdict ok/bad al terminar, signatures detectadas (regex base58 80-90, dedup) linkeadas a `explorer.solana.com/tx/<sig>?cluster=devnet`. Runner como 5º chip de estado; botón deshabilitado + instrucción `dev_service.sh runner` si está offline; nota de re-corrida idempotente. Honestidad explícita: el label dice que ejecuta txs REALES en devnet.
  - `index.css`: `.term` (terminal oscura mono), `.runbar`, `.siglist`, `button:disabled`.
- **Verificación E2E real (WSL):** runner levantado con `dev_service.sh`-equivalente; `POST /run` directo → stream + `__RESULT__{"ok":true,"exitCode":0}` (~41s); 2º POST concurrente → **409**; `/health` reporta `running` durante la corrida; **abort de cliente mata el árbol** (log `[runner] cliente desconectado — matando corrida`, cero procesos `run_beats` residuales); `POST /svc/runner/run` a través del proxy vite :3404 → 6/6 beats OK, 6 signatures únicas extraídas del output. `npx tsc --noEmit` raíz = baseline idéntico (1 error preexistente import.meta gate.ts:43); `tsc --noEmit` dashboard limpio; `npx vite build` OK (123 módulos). Sigs de la corrida proxy: pay `5RVngjPa…`, revokes/fallidas `3UXKs3aP…` `21aosurh…` `3hTvXEUh…` `25yUA8Lg…` `eTGcYepB…`.
- **Bugs/gotchas encontrados:** (1) `child.kill(SIGTERM)` solo alcanza al bash — sus hijos (`npx tsx`, `curl` en command-substitution) quedan huérfanos → fix `detached:true` + kill de grupo `kill(-pid)` con escalada SIGKILL. (2) `res.on("close")` del lado express SÍ dispara en abort de cliente (repro aislado verificado) — el hueco era el kill individual, no el evento. (3) `pkill -f <patrón>` matchea el propio `bash -lc` que lo contiene — self-kill silencioso (exit 15/9); en tests usar scripts archivo o pgrep con grep -v.
- **Idempotencia confirmada en vivo:** 2da corrida con mandato revocado → beat 2 hace close+re-init solo (`mandato cerrado` + `mandato creado`); beat 1 reusa attestation (`"existing":true`). No necesita reset step.
- **Docs:** `demo/README.md` (sección "Un click desde el sitio"), SESSION_LOG s22, PROJECT_STATE.
- **NO tocado:** programa on-chain, servicios existentes, `run_beats.sh` (el runner lo ejecuta tal cual — el output es la verdad on-chain).
- **Bloqueos:** ninguno. Engram MCP sigue caído → fallback Markdown.
- **Siguiente acción (humana):** idem s21 (entregas hackathon, video, facilitator). El botón sirve para grabar el video sin tipear.
- **Engram topic_key:** no aplicable (MCP no operativo — fallback Markdown).
