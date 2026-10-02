# RESEARCH GATE — Candidato O: capa de human-verification para agentes ("DNI agéntico")

> **Estado del gate:** **CERRADO — CONSTRUIR** (01/10/2026). Alcance final: suite de accountability (identidad + mandato + recibo) con gate program-enforceable.
> Fecha: 01/10/2026 · Metodología: Copilot autenticado (v2, evidence:read) + web research primario + análisis estructural · Dossier: `docs/CANDIDATE_O_agentic-dni.md` · Competencia: `docs/03_COMPETITORS.md` §O · Fuentes: `docs/SOURCES.md` [C61]-[C66], [C67]-[C76] (4ta ronda, origen de R y S), [S38]-[S51].
> Nota histórica: la versión previa de este archivo evaluaba la idea "marketplace de skills" (descartada) — sus datos de campo 4 quedaron preservados en docs/03_COMPETITORS.md.

## 1. Problema real [EVIDENCIA]

Los agentes IA actúan con las credenciales de sus dueños — nada en una request distingue agente de humano, identifica qué agente es, ni dice quién lo autorizó (formalizado en IETF draft AIP [S44]). Consecuencias: sin frontera técnica de permisos, sin audit trail atribuible, sin ancla de responsabilidad legal. ERC-8004 (mainnet 29/01/2026 [S39]) resolvió identidad seudónima de agente — un NFT no prueba humano ni ancla liability. Reguladores ya lo están redactando: Filipinas HB 11014 (Digital Authority Credential verificable [S42]), Brasil PL 974/2026 (binding a CPF/CNPJ [S41]), US AI AGENT Act draft (registro FTC de agentes custodios [S43]).

## 2. Usuario y comprador [HIPÓTESIS — parcialmente verificado]

- **Gate operator (comprador real):** x402 facilitators y servicios/merchants que cobran a agentes — PayAI, MCPay, Corbits. Su propuesta a merchants se fortalece ofreciendo "solo agentes con humano verificado". *Validación pendiente: ≥1 conversación.*
- **Dueño del agente:** devs que operan agentes y necesitan que sean aceptados por rails — pagan por la credencial como "costo de existir".
- **Emisor:** verificadores KYC existentes (Persona/Veriff-class) — modelo issuer-agnóstico.
- **Regulador:** adopción futura posible (los drafts ya existen) — horizonte, no cliente inicial.

## 3. Cómo se resuelve hoy [EVIDENCIA]

| Solución actual | Limitación |
|---|---|
| Skyfire KYA/KYAPay | Cerrado: JWTs off-chain, issuer=verifier, suscripción, no consumible por programas onchain, muere con la empresa [S40] |
| ERC-8004 identity | Seudónimo — NFT dice "soy agente #1234", no "hay un humano verificado atrás" [S38][S39] |
| agentid-kya-solana | Identidad autodeclarada — sin verificación humana real [S45] |
| API keys / OAuth | Sin frontera agente/humano, sin credencial pública, sin accountability [S44] |
| Nada | Lo más común: el merchant asume que quien paga es responsable — falso y frágil |

## 4. Antecedentes Colosseum con URLs — COMPLETADO (01/10/2026)

~25 proyectos adyacentes, **0 winners** en human-verification para agentes: Parakletos (tesis literal, passports sin binding verificable [C62]), Regent Protocol (KYC→agente como gestión propia, demo ERC no Solana [C63]), AgentGate (payment gate pero identidad = config del dueño [C64]), Agent-Cred (custodia hotkey/coldkey [C65]), Mandate.md, NomadPass, Bonded, MinKYC, Krexa, Agent Trust, Verun, Sentinel, Aperture, CGAE, Agentic, SNSIP-Agent [C61][C66]. Winner vecino: Humanship ID (5to cypherpunk, proof-of-personhood humano). Winners en la capa inferior (rails): MCPay 1ro Stablecoins [C7], Latinum 1ro AI [C8]. URLs en docs/03_COMPETITORS.md y SOURCES.md.

## 5. Productos/protocolos actuales — COMPLETADO

Ver tabla §3. Competidores directos: Skyfire (cerrado, off-chain), ERC-8004 (estándar sin human layer). Adyacentes: IETF AIP/AIRS (drafts), SATI (reputación x402). Ninguno hace credencial de humano-verificado onchain exigible por programas.

## 6. Gap falsable + incertidumbre

**Gap:** "existe demanda de facilitators/merchants x402 por gatear transacciones de agentes a humanos verificados" — falsable con 1-3 conversaciones.
**Incertidumbres honestas:** (a) cold-start: credencial que nadie exige no vale — Skyfire lo resolvió bundleando pagos; (b) 8004 puede agregar human-binding vía ValidationRegistry; (c) el argumento regulatorio es señal, no demanda (3-5 años); (d) como empresa, infra pura monetiza tarde — destino probable = estándar/absorbido, no IPO.

## 7. Diferenciación/ventaja para el usuario

- vs Skyfire: abierto (issuer-agnóstico, cualquiera verifica sin API key), onchain (**program-enforceable** — un programa Solana puede revertir si falta la credencial; un JWT no puede ser verificado dentro del programa sin oráculo), credencial sobrevive al emisor, sin suscripción-gate.
- vs ERC-8004: complementamos, no competimos — somos la human layer que su spec omite; metadata compatible opcional.
- vs precedentes Colosseum: credencial pública verificable por terceros + compuerta económica — no identidad para el dueño ni governance interna.
- Privacidad por diseño: divulgación selectiva ("hay humano verificado: sí/nivel/issuer") — no DNI público.

## 8. Por qué Solana es esencial — prueba de extracción

**Pasa, con precisión:** solo si el producto es la compuerta onchain. Un programa Solana puede **exigir la attestation SAS dentro de la misma transacción** — enforcement estructural, no "el merchant eligió verificar". Eso no existe off-chain sin confiar en el servidor de un tercero. Además: neutralidad (nadie adopta el registry de un competidor), supervivencia (la attestation sobrevive al emisor), composabilidad (misma credencial para x402, escrows, DAOs, reputación). Si el producto degenerara a "verificador web", Solana sería sticker — restricción de diseño registrada en el dossier.

## 9. MVP — suite O+R+S (actualizado 01/10/2026)

**Arquitectura:** un programa de pago gateado cuya instrucción `pay` es atómica: (1) lee attestation SAS del agente → falta/revocada = revert; (2) lee mandato PDA del owner → monto/payee/expiry fuera de policy = revert; (3) transfiere USDC; (4) emite recibo.

1. SAS attestation schema "human-verified agent" (expone nivel+issuer+timestamp+revocación — divulgación selectiva, no identidad).
2. Issuer mock (la capa se demuestra, no el KYC).
3. Programa de pago gateado (único programa custom): check attestation + check mandato + transfer + emitir recibo.
4. Mandato PDA: owner firma policy {max_por_tx, whitelist payees, expiry, revocable}.
5. Recibo: evento/attestation con binding semántico (servicio + mandato) — decisión event-log vs cuenta-PDA pendiente en diseño.
6. Dashboard de audit.

**Demo de 6 beats (~90 seg):** verificado pasa y emite recibo → huérfano revierte → over-limit revierte → payee-no-whitelisted revierte → revocación de mandato en vivo → libro verificable en dashboard.

**Pitch:** "Hoy los agentes mueven plata y nadie responde por ellos. Facilitators y merchants ya tienen el problema — fraude, liability — aunque no haya ley. Construimos la capa que hace a un humano verificable responsable de cada pago, exigible por el programa, con de-anonimización solo por orden judicial. Cuando los estados terminen de escribir la regulación que ya están redactando, esta capa es la que ya está corriendo." — precisión regulatoria documentada en dossier §10.

## 10. Evidencia y SOURCES — COMPLETADO

Copilot [C61]-[C66] + [C67]-[C76] (4ta ronda) + web [S38]-[S51] en `docs/SOURCES.md`. Reclamos fuertes etiquetados [EVIDENCIA]/[HIPÓTESIS] en el dossier.

## 11. Decisión humana — **CONSTRUIR** ✅ — GATE CERRADO (01/10/2026)

**Decisión emitida:** CONSTRUIR — aprobado por el usuario en sesión (alias por registrar).
**Alcance final aprobado [DECISIÓN DEL EQUIPO — actualizado con suite O+R+S]:**
- **Producto: la suite de accountability** — tres primitivas, un programa: identidad (SAS attestation, humano-verificado, divulgación selectiva) + mandato (PDA con policy firmada por el humano) + recibo (emitido en la misma tx). El gate es una instrucción `pay` atómica.
- Core MVP: programa de pago gateado + issuer mock + mandato + recibo + demo de 6 beats + dashboard de audit.
- **Mock issuer aprobado para la demo** — la capa se demuestra, no el KYC. Verificador real (Persona/Veriff-class) es integración post-hackathon.
- **Puente 8004 FUERA del MVP** — solo narrativa del pitch ("cross-chain en producción"); metadata de compatibilidad se evalúa después del evento.
- **Recibo: event-log probable para MVP** (cuenta-PDA solo si hay composición entre programas) — decisión final en diseño SDD.
- **Toolchain pendiente en diseño:** Anchor vs programa nativo (Solana CLI/Anchor ausentes — instalación requiere permiso).

**Narrativa aprobada:** enforcement económico hoy + regulación como tailwind (NO motor); accountability judicial-ordered, NO trazabilidad total; "abierto + program-enforceable" vs Skyfire cerrado; complemento a 8004, no rival. Pitch canónico en §9 y dossier §10.

**Condición asociada (aceptada):** post-demo, contacto con ≥1 facilitator x402 (PayAI/MCPay/Corbits) para validar pull. No bloquea el build; bloquea cualquier claim de demanda real.

**Gate: CERRADO — APROBADO PARA CONSTRUIR.** Se habilita crear `sdd/changes/<slug>/` y el trabajo SDD (propuesta → spec → diseño → tasks → implementación incremental). Build pausado por decisión del equipo hasta nueva orden.
