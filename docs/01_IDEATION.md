# Ideación / hipótesis de problema

Estado: EN INVESTIGACIÓN (01/10/2026)
Áreas conocidas por participantes: herramientas de agentes IA, harnesses/configs de agentes, desarrollo de software. Equipo 2-3 personas. Repo previo de referencia existe (`This-is-my-harness`, NO se toca — solo conceptual).

## Idea propuesta [HIPÓTESIS — sin validar]

Red social + registry donde usuarios publican su **harness** (config/paquete de agente IA: instrucciones, skills, MCP, workflows, etc.). Otros usuarios pueden instalar/usar el harness de alguien con un click desde su perfil público.

Componente Solana propuesto por el equipo (a validar):
- Cada harness cargado se registra onchain.
- [HIPÓTESIS fuerte del equipo] cada harness = un token; uso/puntuación/comentarios justifican su valor de mercado; usar el harness de otro ≈ comprar su token → beneficios al creador por adopción.

Riesgos ya identificados sobre el modelo de token (a contrastar en research):
- Fragmentación de liquidez (miles de tokens ilíquidos).
- Fricción de pago en el momento de probar un harness.
- Incentivo de farming: inflar "uso" propio para subir el token.
- Pregunta del jurado: ¿por qué necesita un token? — respuesta débil si es "para especular".

Alternativas a contrastar (NO decididas):
- Provenance onchain (autoría + hash de versión + timestamp).
- Pagos directos SOL/USDC por instalación/premium.
- Reputación verificable onchain (verified-use attestations).
- Curation markets / staking como aval.

## Problema observable [HIPÓTESIS]

Las configs de agentes IA (Codex, Claude Code, Cursor, OpenCode...) son fragmentadas, no portables, se comparten por copy-paste de repos/gists sin verificación ni reputación. [VERIFICAR con evidencia: ¿la gente realmente busca y reusa harnesses de otros? ¿dónde lo hace hoy?]

## Usuario específico [HIPÓTESIS]

Builders/devs que usan agentes de código a diario y quieren workflows probados; y builders que producen harnesses y quieren reputación/ingresos.

## Workarounds actuales [POR VERIFICAR]

Copy-paste de dotfiles/repos, awesome-lists, marketplaces de prompts, registries MCP (smithery, etc.).

## Opciones descartadas y por qué

- Continuar `This-is-my-harness` como base de código: DESCARTADO por decisión del equipo (01/10/2026) — proyecto nuevo en este directorio; aquel repo queda como referencia conceptual.

## Opciones descartadas y por qué — actualización

- **Idea "red social/marketplace de harnesses con token por harness": PIVOTEADA (01/10/2026).** Evidencia: 6 intentos directos en Frontier (Skillmarkdown, Skill Loops, SkillHive, Merrit, DNAcloud, leverbrain), 0 premios; la variante token-por-activo es la de peor historial (Merrit + friend.tech). Decisión del equipo tras ver docs/03.

## Opciones descartadas y por qué — actualización 2 (01/10/2026)

- **Opción A (pagos/remesas frontera AR-PY): DESCARTADA.** El dolor base ya está resuelto en el corredor específico: QR interoperable Mercado Pago↔Upay/Depay en PY desde jul-2025, SML BCRA-BCP desde 2021, Lemon/Belo pagan QR fiat con crypto, y 12+ clones "crypto→QR" en Colosseum (solo LocalPay ganó). Único gap residual (PYG/efectivo→USDC, cambista informal) implica riesgo regulatorio de cambio de moneda informal. Detalle en docs/03.
- **Opción B (x402 para cobrar del exterior):** no evaluada a fondo; queda en reserva.
- **Opción D (datos clínicos/mensajes onchain para SaaS dentalogic): DESCARTADA (01/10).** Fundamento técnico: datos onchain ≠ más seguros — blockchain da integridad+timestamp, no confidencialidad (todo público); conflicto con derecho al olvido (GDPR/HIPAA/Ley 25.326). La variante correcta (hash audit trail, datos offchain) ya fue intentada ~18 veces en Colosseum (health records + notarización), cero premios. Detalle en docs/03.
- **Opción C (reputación informal): REFORMULADA Y GUARDADA como candidato.** Versión superviviente: NO lending, NO attestations opinables — historial de ingresos = cobros USDC reales de terceros → informe verificable. El propio usuario detectó el riesgo sybil (self-swap no cuenta como ingreso); diseño ancla la prueba en pagos de terceros. Dossier completo: docs/CANDIDATE_C_proof-of-income.md.
- **Opción D-bis (votación electoral ciudadana onchain desde el celular): DESCARTADA (01/10/2026).** Triple evidencia negativa: cluster Colosseum de 130 proyectos de votación con 0 premios en civic-elections (SolVote ya hizo la variante exacta); paper canónico Park/Rivest et al. demuestra que blockchain voting empeora el problema (recibos vendibles→compra de voto) sin resolver identidad/endpoint/coerción; Voatz auditado y abandonado; Argentina legisla hacia papel (Ley 27.781). Además falla la extracción: tamper-evidence lo da una DB con hash-chain y el padrón sigue siendo centralizado. Dossier: docs/CANDIDATE_D_voting.md.

## Opciones descartadas y por qué — actualización 3 (01/10/2026)

- **Pool 2da ronda (E-I): RECHAZADO por el usuario** — vaquita cross-border, agente-paga-humano, fianza viva, pasaporte zkTLS, compra colectiva. Dossier: docs/CANDIDATES_2nda_ronda.md.
- **Pool 3ra ronda (J-N): evaluado, no elegido** — J fondo-objetivo custody-out, K obligaciones familiares, L voucher restringido, **M preventa de cosecha (descartada explícitamente por el usuario tras análisis)**, N seña de turno. Dossier: docs/CANDIDATES_3ra_ronda.md. Quedan en pool como reserva.
- **Opción O ("DNI agéntico"): APROBADA EN RESEARCH GATE — CONSTRUIR (01/10/2026).** Idea del usuario reformulada: de "registro universal obligatorio por ley" a **capa de credencial de humano-verificado onchain exigible por programas/facilitators x402**. Evidencia: ~25 adyacentes Colosseum con 0 winners en el vacío exacto; ERC-8004 mainnet sin capa humana; Skyfire cerrado/off-chain; regulación en draft. Alcance: core MVP + mock issuer + demo dos agentes; puente 8004 fuera del MVP. Dossier: docs/CANDIDATE_O_agentic-dni.md. Gate: docs/04_RESEARCH_GATE.md.

## Problema elegido PARA CONSTRUIR (Research Gate aprobado 01/10/2026 — build pausado por decisión del usuario, se retoma cuando diga)

**Candidato O — capa de verificación humana para agentes ("DNI agéntico"):** credencial onchain (SAS) que prueba "humano verificado atrás de este agente", exigible dentro de programas/transacciones — compuerta económica para los rails x402. Dossier completo: docs/CANDIDATE_O_agentic-dni.md.

En reserva: Candidato C (pausado, dossier completo — listo para retomar si O falla), pools 2da/3ra ronda documentados.
