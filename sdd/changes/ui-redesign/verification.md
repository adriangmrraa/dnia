# Verificación ui-redesign

Estado: **EJECUTADA — PASS CON WARNINGS** (03/10/2026 — revisor adversarial independiente; ningún claim del apply se aceptó sin evidencia propia).

Método: (1) spec/design/tasks/test-plan leídos completos + `AGENTS.md`; (2) **re-ejecución propia** del build y tsc (no transcrito del evidence de apply); (3) scans propios de recursos externos en fuente y `dist/` (dominios extraídos y clasificados uno a uno); (4) inspección estática de los 12 archivos tocados + `git diff` línea por línea de los protegidos y de los hooks de datos; (5) **ejecución real de `beatStates()`** (función extraída verbatim del código) contra un mock del output real de `run_beats.sh`; (6) cálculo WCAG propio de los ratios de contraste; (7) spot-check del dev server vivo en `http://127.0.0.1:3404`.

Demo usuario real o simulación: **parcial** — el dev server :3404 está vivo y sirve las 5 rutas + woff2 con MIME correcto; la corrida real del stepper NO se ejecutó (requiere `POST /svc/runner/run` → muta estado on-chain: close+re-init de mandato, revoke — fuera de alcance de una verificación read-only). El runner :3406 **sí responde** (`/health` 200 directo y vía proxy) — la corrida live queda a 1 clic del humano. El parseo del stepper se verificó ejecutándolo contra un mock fiel al formato real del script.

## Tabla de criterios

| Criterio | Test/comando/observación | Resultado | Evidencia | Bug/limitación |
|---|---|---|---|---|
| R-01 tokens `:root` únicos | lectura de `index.css:67-98` + diff de valores vs design §3.1 | **PASS** | Los 18 tokens presentes con valores exactos (`--bg #070b13`, `--surface #0d1524`, `--surface-2 #12203a`, `--border #1d2c47`, `--text #e8eef7`, `--text-dim #8fa1bd`, `--accent #2dd4bf`, `--accent-2 #a78bfa`, `--grad`, `--ok/--warn/--bad`, `--r-card`, `--r-chip`, `--glow`, `--f-display/--f-body/--f-mono`). Grep propio de los 14 hex del tema viejo → **0 matches en src/ y dist/** | hex nuevos sueltos no fijados por el design: `#c9d4e6` ×3 (texto de `.term`/`.codeblock`), `#f87171` (dot rojo del term-chrome) — ver WARNING-4 |
| R-02 tipografía self-hosted | `ls public/fonts/` + magic bytes + `@font-face` + `dist/fonts/` post-build | **PASS** | 8 woff2 reales (cabecera `wOF2` verificada en las 8): space-grotesk-{500,600,700} (13.3/13.3/12.8 KB), inter-{400,500,600} (23.7/24.3/24.5 KB), jetbrains-mono-{400,500} (21.2/21.8 KB) ≈172 KB. `@font-face` ×8 (index.css:9-64) con `font-display: swap` + fallbacks `system-ui`/`ui-monospace`. `dist/fonts/` = las 8 copiadas. Dev server sirve `font/woff2` (200) | fallback runtime no emulado (bloqueo de /fonts/ en devtools no ejecutado — [SIN VERIFICAR] visual) |
| R-03 offline cero externos | grep `https?://` en index.html/src + clasificación de dominios en `dist/` + spot-check server | **PASS** | `index.html`: 0 URLs externas (solo `/src/main.tsx`; `theme-color #070b13`). `src/`: 0 `@import`/`url(http`. En `dist/`: dominios = w3.org (ns SVG — permitido), explorer.solana.com + api.devnet.solana.com (permitidos), github.com (anchor del repo — contenido clickeable, no recurso cargado), feross.org + reactjs.org + api.testnet/mainnet.solana.com (strings dentro de libs bundleadas — comentarios/error-decoder/clusterApiUrl de web3.js, nunca se fetchean), localhost (texto de snippets). 0 fonts.googleapis/gstatic/unpkg/jsdelivr/cdn/cloudflare en todo el directorio | check de Network tab real no ejecutado ([SIN VERIFICAR] — evidencia estática contundente) |
| R-04 cero deps | `git diff demo/dashboard/package.json` + `git status` | **PASS** | `demo/dashboard/package.json` **sin diff ni status** — ni una línea. Nuevo: solo `public/fonts/` + `src/ui.tsx` (sin imports de paquetes nuevos) | `demo/package-lock.json` (raíz del workspace) regenerado: license MIT→Apache-2.0 + enumeración completa de transitivos/opcionales/workspaces — sin dep declarada nueva (`demo/package.json` tampoco tiene diff). Ver hallazgo RIESGO-3 |
| R-05 layout | inspección CSS | **PASS** | `.wrap` 1120px (l.111) + `.wrap--dash` 1280px (l.112); `.cards`/`whygrid`/`trio`/`adopters` `auto-fit minmax(280px|240px)`; `.tablewrap { overflow-x: auto }` (l.316) conservado | — |
| R-06 sistema §3.4 | cada clase del design grepeada en index.css | **PASS** | Presentes: `.brandmark`, `.btn`/`.primary`/`.big`, `.card`/`.lift`, `.verdict`+dot (ok/bad/warn/muted), `.stat`/`.statcard`/`.statstrip`, `.dot`/`.status-dot`+`@keyframes pulse`, `.stepper`/`.stp`/`.stp-link` (on/run/fail), `.term`+`.term-bar`+dots r/y/g, `.term-gloss`+`::after`, `.codeblock`+`.codeblock-bar`+`.tok-k/s/c/f`, `.timeline`/`.tl` (ok/fail), `.topnav` sticky+`backdrop-filter`+`.sel`, `.chip` | `.status-dot`, `.card .sub`, `.tablewrap.tall`, `.no` definidas pero sin uso en tsx — ver WARNING-1/2/5 |
| R-07 nav+footer marca | inspección `App.tsx` + CSS | **PASS** | `.topnav` sticky + `backdrop-filter: blur(12px)` (index.css:205-211); brandmark SVG inline (ui.tsx:16-47, rombito+check gradient, `aria-hidden`); wordmark `agentic-<b>dni</b>` con gradient text (l.215); `.sel` underline gradient (l.221); chip devnet `<i class="dot ok">` + link a explorer del programa; footer con Brandmark size 16 + Apache-2.0 + programa devnet. Switch de rutas sin diff funcional (mismo `case` set que HEAD — `/adopcion` alias preexistente) | — |
| R-08 landing reordenada | lectura completa `Landing.tsx` vs §4.1 | **PASS** | Las 9 secciones en orden: (1) hero — chip `solana devnet · en vivo` con dot + Gloss, H1 criollo ~3.2rem con `.hl` shimmer («Los agentes ya mueven plata. Que alguien responda.»), CTA dual `/demo` primary + `/dashboard` ghost, `.stats` `6/6`·`~10`·`0`; (2) "El problema" card editorial; (3) 3 primitivas Credencial/Permiso/Recibo con `.prim-icon`+`.prim-q` técnico; (4) flujo 4 pasos `.flow`+conectores+note; (5) evidencia `.timeline` desde `BEATS` de site.ts + tabla completa en `<details>` "ver tabla completa"; (6) actores ×3; (7) por qué ahora ×5 cards (opción válida — cero contenido eliminado); (8) privacidad+negocio+`.card.honest` limitación; (9) CTA final `/demo`. Extra: sección "Direcciones verificables" (contenido conservado del original — suma, no viola orden) | subtítulo de Permiso = `mandato on-chain` (spec listaba `mandato PDA` — el término PDA sí aparece en el Gloss y en el note del flujo) — SUGGESTION-1 |
| R-09 dashboard | lectura `Dashboard.tsx` + diff de hooks | **PARTIAL** | `.statstrip` con **4** `.statcard` (credencial/permiso/gasto hoy/ledger+hora) derivadas de `att`/`mandate`/`ledger` existentes + `aria-live="polite"`; selector agentes → chips con `.dot` por estado SAS (vigente→ok/expirada→warn/revocada→bad/sin→off) + `.mini` badge conservado; panels `dl` + `.badge` prominente + barra `.usage` `role="progressbar"` con `aria-*`; ledger `.filters` `.fbtn` (todo/pagos/rechazos/otras ops) client-side sobre `ledger` ya cargado; `.verdict` con dot + `ERROR_EXPLAIN` intacto inline; polling `setInterval(4000)` + `auto` checkbox + `refrescar` intactos | **WARNING-2**: `.tablewrap.tall` (thead sticky, index.css:317-318) existe pero el ledger usa solo `.tablewrap` (Dashboard.tsx:542) — el "header sticky si crece" del design §4.2 no quedó activo |
| R-10 docs + adopción | lectura `Docs.tsx`/`Adoption.tsx` | **PARTIAL** | Docs: 4 actores como `.adopter` cards (quién/tag/qué hace/**no necesita**); "La vuelta completa" + "tres pasos" → `ol.steps.big` (01/02/03 gradient); snippet → `CodeBlock` header `services/service-z/src/index.ts — extracto literal` + `highlight` tokens `.tok-*`; 4 fricciones conservadas. Adoption: mismo refresh (steps.big, CodeBlock, adoptantes con `.dot` + probes `/svc/` sin diff funcional) | **WARNING-1**: el "NO en verde" de §4.3 (`.adopter .no` existe en CSS l.350-351) **no está cableado** — Docs.tsx:128 usa `.muted` para el label y texto plano para el valor; el selling point verde no se ve |
| R-11 /demo stepper | lectura `DemoPage.tsx` + **ejecución real de `beatStates()`** contra mock del output real + `run_beats.sh` inspeccionado | **PASS (estático+mock) / [SIN VERIFICAR] live** | `.stepper` 6 nodos `aria-label` + `.stp`/`.stp-link` + botón `▶ Correr demo` primary big (disabled si running/runnerOffline + nota `dev_service.sh runner`); `.term` con `.term-bar` (dots r/y/g + título + `CopyBtn`); output vía `TermLines` = texto plano en `<pre>` (INV-5); servicios → `.adopter` con `.dot` ok/off/bad + comando de arranque; comandos → `CodeBlock`; guion + checklist tablas conservadas. **Mock ejecutado (función verbatim extraída):** corrida completa → `[on×6]`; mid-run (banner 4 impreso, sin veredicto) → `[on,on,on,run,"",""]`; `──> ✗` inesperado en beat 3 → `fail`; idle → `[""]×6`; corte tras 5a (sin 5b) → beat5 queda `run` (requiere 2 oks). Formato matcheado contra `run_beats.sh:23-25` real | corrida live no ejecutada (muta devnet) — el runner :3406 está arriba (`/health` 200), a 1 clic del humano — ver RIESGO-1 |
| R-12 /colaborar | lectura `Colaborar.tsx` | **PASS** | `.repo-cta` arriba del todo (Brandmark 34 + `GITHUB_REPO_URL` o `.repo-pending` si null — comportamiento conservado + `.license-badge` Apache-2.0 + chip programa devnet); 5 áreas con `.chip` tag (programa/adopción/integración/interop); `.card.honest` "Lo que más vale hoy" (conversación facilitator x402 subida) + sección Licencia | — |
| R-13 copy en capas | glosario grepeado en los 6 tsx + revisión de títulos/ledes | **PASS** | 27 instancias `Gloss` — los 8 términos obligatorios cubiertos: attestation SAS ×5, Mandate PDA ×4, HTTP 402 ×3, PaymentReceipt ×4, whitelist ×2, issuer ×4, devnet ×2, ATA ×3 (+ bonus x402 ×1). Mecanismo: `tabIndex={0}` + `aria-label={tip}` + `data-tip` → `::after` tooltip en `:hover` **y** `:focus` (index.css:414-426). Títulos/ledes 100% criollos en las 5 rutas; jerga confinada a code/`<details>`/tooltips/explorer | "whitelist" aparece una vez a pelo en el lede de Docs (Docs.tsx:111, paréntesis aclaratorio tras la frase criolla) — SUGGESTION-2 |
| R-14 motion sutil | inspección CSS + `useReveal` | **PASS con nota** | `fade-up` vía IntersectionObserver `useReveal` (ui.tsx:170-194, ~25 líneas con fallback `.in` sin IO); `pulse` solo en `.dot.ok`; hover lift en `.card.lift`/`.btn`; stepper transitions 0.3s; shimmer **solo** `.hero .hl`; todo desactivable | **WARNING-3**: `.fade-up` = 0.45s y `.usage-fill` = 0.4s exceden la regla §3.5 "<300ms por elemento" (las mata reduced-motion; resto ≤0.3s) |
| R-15 a11y + responsive | **cálculo WCAG propio** + inspección | **PASS** | Ratios calculados (fórmula WCAG, luminancia relativa): `--text-dim`/`--bg`=**7.50**, `/surface`=**6.96**, `/surface-2`=**6.19**; verdicts ok/warn/bad/muted sobre sus tintes = **8.18/9.27/6.20/6.19**; accent/bg=10.58, accent-2/bg=7.24 — todos ≥4.5:1. `:focus-visible` outline accent global (l.126-131); `@media (prefers-reduced-motion: reduce)` (l.462-471) global + overrides explícitos; `.term-gloss` focusable; breakpoint 700px con stats apilan + stepper scrollea; `aria-live` en statstrip; `role="progressbar"` con `aria-valuenow/min/max/label`; `lang="es"` | navegación por Tab y emulación reduced-motion en devtools no ejecutadas ([SIN VERIFICAR] — código correcto a inspección) |
| R-16 lógica intacta | `git diff`/`status` de los 4 protegidos + diff de los tsx | **PASS** | `gate.ts`, `site.ts`, `snippets.ts`, `router.tsx`, `dashboard/package.json` → **cero diff, ni status** (verificado explícito). En los tsx: lo removido es solo markup/copy (+ entrada muerta `vigenteM` del mapa BADGE); agregados = `lastTick`, `lf` (filtro client-side), `useReveal`, `beatStates`/`BEAT_NODES` — aditivos; `fetch`, `Promise.all`, `setInterval(4000)`, `auto`, probes `/svc/`, `__RESULT__`, `SIG_RE`, `attByAgent` → sin líneas de diff. Cero `sendTransaction`/firma en todo src/ | — |
| INV-1 offline estricto | scans R-03 + build output | **PASS** | Cero recursos estáticos externos en fuente y dist; fuentes = woff2 locales | — |
| INV-2 cero deps | `git diff` deps | **PASS** | `dashboard/package.json` intocado; regen de `demo/package-lock.json` documentada (RIESGO-3) — no agrega dep declarada | — |
| INV-3 comportamiento intacto | R-16 + data-layer diff | **PASS** | polling 4s, live-refresh, stream runner, probes, parseo `__RESULT__`/sigs, read-only — idénticos | — |
| INV-4 honestidad + voz | lectura landing | **PASS** | "Limitación honesta (declarada)" `.card.honest` visible con contenido íntegro (SPL libres por fuera, protege al vendedor); stats = datos reales (6 beats narrativa — site.ts tiene 7 filas porque beat 5 se lista 5a/5b; el script imprime `BEAT 5` una vez con dos oks — consistente); sin claims nuevos; voseo consistente ("Corré", "Abrí", "Verificá", "declarás"); sin PII nueva | — |
| INV-5 render seguro | grep `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function` | **PASS** | 0 matches en src/. Output del runner → `<pre>`+`TermLines` (texto); datos de chain → texto/anchors. `CopyBtn` usa `navigator.clipboard` | — |

## Checklist §8 del design ↔ CA

| # / CA | Resultado | Evidencia puntual |
|---|---|---|
| `npm run build` limpio (CA-1) | **PASS** | `vite v6.4.3` · `✓ 124 modules transformed` · `dist/index.html 0.74 kB` · `css 22.31 kB` · `js 625.30 kB` · `✓ built in 1m 15s` (solo warning chunk>500 kB, conocido). `npx tsc --noEmit` → exit 0, sin errores |
| Cero requests externas (CA-2) | **PASS estático / [SIN VERIFICAR] Network** | dominios en dist/ clasificados — todos permitidos o strings de lib; server vivo sirve solo assets locales |
| Tokens en todo (CA-3) | **PASS** | 0 hex viejos en src/ y dist/; sueltos nuevos = los 2 design-fijados + 2 cosméticos (WARNING-4) |
| Hero <5s sin jerga (CA-4) | **PASS por copy / [SIN VERIFICAR] humano externo** | H1+lede sin término técnico desnudo (Gloss lleva la jerga); el test con persona real queda pendiente |
| Dashboard sin scroll ~900px (CA-5) | **PASS estático / [SIN VERIFICAR] visual** | `.statstrip` es el primer elemento post-header — 4 statcards derivadas de datos live |
| Stepper en vivo (CA-6) | **PASS mock / [SIN VERIFICAR] live** | `beatStates()` ejecutado: 5 escenarios correctos; runner :3406 arriba — a 1 clic |
| Glosario 8 términos (CA-7) | **PASS** | 8/8 con `.term-gloss` focusable + aria-label + tooltip hover&focus |
| Reduced-motion (CA-8) | **PASS estático / [SIN VERIFICAR] emulación** | regla global + overrides explícitos en index.css:462-471 |
| Contraste AA (CA-9) | **PASS calculado** | ratios 6.19–16.88:1 — todos ≥4.5 |
| Mobile 375px (CA-10) | **PASS estático / [SIN VERIFICAR] visual** | breakpoint 700px + overflow-x interno acotado a `.tablewrap`/`.stepper` |
| Honestidad intacta (CA-11) | **PASS** | sección presente, texto sin edulcorar |
| Copy nivel-1 criollo (CA-12) | **PASS** | títulos/ledes limpios en las 5 rutas; SUGGESTION-2 |
| Comportamiento intacto (CA-13) | **PASS** | protegidos cero diff; data-hooks sin cambios; read-only; deps sin diff |

## Hallazgos

### WARNING-1 — "NO necesita" sin el verde del selling point (R-10 parcial)
`Docs.tsx:127-130` renderiza `<span className="muted">no necesita: </span>{a.notNeeds}` — la clase `.adopter .no` (`color: var(--ok)`, index.css:350-351) existe pero **no se usa en ningún tsx**. Design §4.3: "el 'NO' destacado en verde — es el selling point". Fix de 2 líneas: envolver el valor en `<span className="no">` (o el label+valor). El contenido está completo — es solo el highlight.

### WARNING-2 — Sticky header del ledger definido pero no aplicado (R-09 parcial)
`.tablewrap.tall` (index.css:317-318, thead `position: sticky`) quedó definida en S2 pero el ledger usa `<div className="tablewrap">` (Dashboard.tsx:542). El "header sticky si crece" de §4.2/R-09 no está activo. Fix: `className="tablewrap tall"` en el ledger. Cosmético pero era explícito del design.

### WARNING-3 — Dos animaciones superan la regla <300ms (§3.5)
`.fade-up` transition = 0.45s (index.css:429) y `.usage-fill` width transition = 0.4s (l.294). El design fijó "total < 300ms por elemento". Ambas quedan anuladas por `prefers-reduced-motion` (no es falla a11y), pero incumplen la regla propia del design. Fix trivial (bajar a ≤0.3s) o ampliar la regla.

### WARNING-4 — Hex sueltos no fijados por el design (menor)
`#c9d4e6` ×3 (texto de `.term pre`, `.codeblock pre`, `pre.code` — index.css:388/399/406) y `#f87171` (dot rojo del window-chrome, l.382). No son hex del tema viejo (CA-3 pasa), pero el spec R-01 solo permite sueltos "donde el design los fija" (`#040810`, `#06121a` — esos sí están). Sugerido: promover `#c9d4e6` a token `--code-text` o usar `var(--text)`.

### WARNING-5 — Clases CSS muertas (menor)
`.status-dot` (alias de `.dot` — todo el código usa `.dot`), `.card .sub` (las primitivas usan `.prim-q`), `.tablewrap.tall` (W2), `.no` (W1), `.steps` plain (todo usa `.steps big`). Peso muerto ~15 líneas — sin impacto funcional.

### SUGGESTION-1 — subtítulo "mandato on-chain" vs "mandato PDA"
`Landing.tsx:51` usa `sub: "mandato on-chain"` en la primitiva Permiso; el spec R-08 ejemplificaba `mandato PDA`. El término PDA sí aparece glosado en el note del flujo (l.279-281) y en Dashboard. Si se busca fidelidad literal, cambiar el `.prim-q`.

### SUGGESTION-2 — "whitelist" a pelo en lede de Docs
`Docs.tsx:111` — `(la whitelist del mandato)` en el lede nivel-1 sin `Gloss`. Hay Gloss de whitelist en l.50-52 del mismo archivo (primer uso técnico). Nivel de detalle, no rompe CA-12 (la frase criolla precede).

## Riesgos residuales (declarados honestamente)

- **RIESGO-1 [SIN VERIFICAR] — stepper en vivo**: la sincronización del stepper durante una corrida real no se ejecutó (requiere `POST /svc/runner/run` → muta estado on-chain: re-init de mandato + revoke; fuera de alcance de verify read-only). El parseo `beatStates()` quedó probado ejecutándolo sobre un mock fiel del formato real (`run_beats.sh:23,24,25` + RESUMEN) — 5/5 escenarios correctos. El runner está arriba: `localhost:3406/health` = 200 directo y vía proxy vite — la verificación live queda a 1 clic del humano (`▶ Correr demo` en `/demo`).
- **RIESGO-2 [SIN VERIFICAR] — checks que exigen browser render**: Network tab real, emulación `prefers-reduced-motion`, navegación Tab, viewport 375px, bloqueo de `/fonts/`. El código/CSS implementa todo lo requerido a inspección estática; falta la confirmación visual en devtools.
- **RIESGO-3 — `demo/package-lock.json` regenerado** (fuera de `demo/dashboard/`): diff de ~7.7k líneas — `license` MIT→Apache-2.0 (sincroniza con `demo/package.json`, que ya declaraba Apache-2.0) + enumeración completa de transitivos/opcionales/workspaces (470 vs 237 entries — agregados = babel/esbuild-opcionales/links de workspace; **0 removidos, 0 dep declarada nueva**). Ruido de revisión; sin impacto de deps (INV-2 intacto).
- **RIESGO-4 — `demo/target/idl/agentic_gate.json`** regenerado pero `git check-ignore` confirma `demo/.gitignore:11 → target/` — no entra al repo.
- Dev server **vivo** en `http://127.0.0.1:3404` durante la verificación: las 5 rutas → 200, woff2 → `font/woff2`, `index.html` sin recursos externos, CSS servido contiene tokens/gloss/reduced-motion. El `vite preview`/`dist/` queda consistente (mismo build verificado).

## Errores / edge cases del spec — estado observado

| Caso | Estado |
|---|---|
| Sin `dashboard/.env` | error guiado conservado (Dashboard.tsx:231-244 — mismo copy de siempre + layout `.card`) — PASS código |
| RPC caído | `err` se muestra bajo el shell (`{err && <p className="bad">}` l.599); las 4 estáticas no dependen de RPC — PASS código |
| woff2 no carga | `font-display: swap` + stacks `system-ui`/`ui-monospace` — PASS código ([SIN VERIFICAR] bloqueo real) |
| runner offline | `runnerOffline` → botón disabled + nota con comando (DemoPage.tsx:275,332-338) — PASS código |
| stream cortado | banner ausente → `""` (pending), no marca corridos de más — verificado en mock (CUT@5a → `run`) — PASS |
| ledger vacío / mandato inexistente / sin attestation | empty states presentes (l.555-563, l.514-519, `ATT_VERDICT["nunca-emitida"]`) — PASS código |

## Veredicto

**PASS CON WARNINGS.** Los 16 requisitos y los 13 criterios de aceptación se verifican con evidencia propia: build+tsc verdes ejecutados por mí, 0 hex viejos, 0 recursos externos (fuente y dist clasificados), fuentes reales woff2, protegidos con cero diff, data-layer intacto, glosario 8/8 accesible, contrastes AA calculados, `beatStates()` ejecutado contra mock real. Los invariantes INV-1..5 se mantienen.

Los warnings no bloquean pero **conviene cerrarlos antes de archive** — son fix de 5 líneas en total: W1 (`<span className="no">` en Docs), W2 (`tablewrap tall` en el ledger), W3 (bajar 2 transiciones a ≤0.3s), W4 (tokenizar `#c9d4e6`/`#f87171`). Los checks que exigen browser render quedan marcados [SIN VERIFICAR] con su estado estático probado — la pasada visual humana en el preview :3404 y la corrida real del stepper son el único pendiente real.

## Addendum — fix-round + rebrand (03/10/2026)

Post-verify, el humano aprobó cerrar los warnings y definió la marca del producto: **DNIA** (no "agentic-dni"). Cambios aplicados y re-verificados:

| Hallazgo | Fix aplicado | Estado |
|---|---|---|
| Rebrand | `agentic-dni` → `dnia` en `App.tsx` (nav + footer), `index.html` (title + meta description), `Landing.tsx` ×2, `Dashboard.tsx` h1, `Colaborar.tsx` ×2, header de `index.css` | **RESUELTO** — grep residual: solo `docs/CANDIDATE_O_agentic-dni.md` (nombre de archivo real) y `agentic_gate` (programa on-chain) — correctos |
| W1 — "no necesita" sin verde | `Docs.tsx`: label+valor ahora con `.no` (verde selling point) | **RESUELTO** |
| W2 — sticky thead inactivo | ledger → `className="tablewrap tall"` (Dashboard.tsx) | **RESUELTO** |
| W3 — transiciones >300ms | `.fade-up` 0.45→0.28s · `.usage-fill` 0.4→0.3s | **RESUELTO** |
| W4 — hex sueltos | token `--code-text: #c9d4e6` en `:root` (3 usos) · `.term-bar .r` → `var(--bad)` | **RESUELTO** |
| W5 — CSS muerto | `.status-dot` alias, `.card .sub`, `.steps` plano eliminados (~10 líneas; `.steps.big` absorbe font-size/color/bold) | **RESUELTO** |
| S1 — subtítulo primitiva | `mandato on-chain` → `mandato PDA` (Landing) | **RESUELTO** |
| S2 — whitelist a pelo | lede de Docs usa `Gloss` ("lista de servicios autorizados" + tip) | **RESUELTO** |

**Re-verificación (ejecutada por el implementador tras el fix):** `npm run build` → `✓ 124 modules transformed`, `dist/index.html 0.73 kB`, `css 22.11 kB`, `js 625.40 kB`, `✓ built in 27s` (mismo warning preexistente chunk>500 kB). `npx tsc --noEmit` → limpio. Grep `agentic-dni`/`agentic-<` en `demo/dashboard` → 0 matches fuera de los dos nombres históricos válidos.

**Veredicto actualizado: PASS — sin warnings abiertos.** Pendientes solo los checks que exigen browser humano ([SIN VERIFICAR]: corrida live del stepper, Network tab, emulación devtools) — la corrida `▶ Correr demo` con el runner :3406 sigue a 1 clic del humano.
