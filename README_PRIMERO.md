# FORMOSA.DEV × SUPERTEAM ARGENTINA — STARTER HACKATHON v3.0

**Una sola entrega para los hackers: ESTE ZIP.** Descomprimilo dentro de una carpeta nueva, conservando la estructura completa y los directorios ocultos (`.agents`, `.github`). Abrí la carpeta raíz en tu agente de IA (Claude Code, OpenCode, Codex, Copilot u otro que pueda leer archivos). No necesitás crear documentos ni copiar plantillas manualmente: ya están presentes, vacías de conclusiones.

## Única acción del participante

Abrí `PROMPT_DE_INICIO.md`, copiá el prompt (desde «Leé»), pegalo en tu agente. Tu agente leerá `AGENTS.md`, revisará el entorno y te preguntará qué querés conseguir. Si tenés solamente chat web, adjuntá `AGENTS.md`, `harness/SDD_PLAYBOOK.md` y el prompt: ese agente NO podrá diagnosticar la notebook ni crear archivos allí por sí solo.

## ¿Qué hay dentro?

- `AGENTS.md`: contrato canónico; `CLAUDE.md`, `.github/copilot-instructions.md`, `opencode.json`: adaptadores.
- `harness/INSTALLATION_GUIDE.md`: URLs oficiales, Go, Engram, Matt Pocock, Copilot, Solana, Superteam, comandos por agente y verificación.
- `harness/SDD_PLAYBOOK.md`: fases, research gate, specification-driven development, Engram y handoff.
- `harness/SKILLS_CATALOG.md` + `.agents/skills/formosa-sdd-*/SKILL.md`: skills SDD locales y mapa de invocación por fase.
- `PROJECT_STATE.md` + `docs/`: archivos de investigación, decisiones, specs de negocio, validación, demo, continuidad y registro de fuentes.
- `sdd/templates/` + `sdd/changes/`: plantillas y espacio para specs técnicas específicas de cambios.
- `scripts/diagnostico.sh` / `scripts/diagnostico.ps1`: comandos LOCALES de inventario de solo lectura, opcionales y con autorización. NO instalan.
- `research/` y `demo/`: evidencia y guion, no secretos ni datos personales.

## Qué pasa en el primer uso

1. Detecta si está ejecutándose en local, WSL, cloud o chat; verifica herramientas sin leer secretos.
2. Evalúa nivel y objetivo de la persona conversando; NO impone perfiles fijos.
3. Propone instalación ajustada: Git/Node, Go→Engram, skills Matt Pocock, Colosseum Copilot, Solana Dev Skill y reglas de Superteam, comprobando lo que ya está instalado y solicitando permiso antes de modificar el sistema.
4. Explora problema, competidores (Copilot + fuentes verificadas), cliente/usuario y realiza el Research Gate.
5. Solo al aprobar el Research Gate, pasa a SDD: propuesta, spec, diseño, tareas, código, tests, verificación, demo y entrega; actualiza el repo y Engram cuando esté disponible.

## Para el encuentro

Pepe Club, 9 de Julio 629, Formosa Capital; sábado 3 de octubre de 2026, 09:00–18:00 según la guía pre-hackathon. Consultá novedades en https://luma.com/usz4536h. Llevar notebook, cargador, alargue/zapatilla y cuentas/instalaciones probadas; cada competidor requiere cuenta personal Colosseum. No hay instalación automática al extraer el ZIP. **Toda operación remota, pago, credencial o instalación necesita consentimiento.**
