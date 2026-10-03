# Spec comportamental — ui-redesign

> Estado: **BORRADOR — contenido completo, pendiente revisión humana** (gate de la fase `spec`: revisión humana de spec).
> Fecha: 03/10/2026 · Cambio SDD: `ui-redesign` · Skill: `formosa-sdd-spec`.
> Fuentes canónicas: `sdd/changes/ui-redesign/proposal.md` (alcance aprobado) · `sdd/changes/ui-redesign/design.md` §1–§9 (**plan autoritativo** — diagnóstico, tokens, componentes, copy, a11y, fases F1–F5, checklist, no-objetivos) · `sdd/changes/ui-redesign/preview.html` (referencia visual ejecutable) · `AGENTS.md`.

## Para quién / problema / outcome

Para un **jurado o evaluador del hackathon** — que quiere entender qué es agentic-dni en 30 segundos — y para un **dev** que quiere verificar el código y las txs, que hoy se encuentran con un sitio que **parece un README renderizado** (tema GitHub stock `#0d1117`/`#58a6ff`, Segoe UI), donde **todo pesa igual** (hero de 2.1rem, body 0.85rem, cards idénticas), la **jerga es el primer contacto** ("attestation SAS PDA", "GateError", "Program data:" en títulos y ledes) y la data viva de devnet **no se percibe** (polling 4s sin feedback visual), el sistema debe presentar **el mismo contenido verificable** con **identidad propia** ("capa de confianza": oscuro premium, acento teal/violeta, marca con brandmark), **jerarquía real** (el ojo sabe dónde mirar primero), **señales de vida** (dots pulsantes, stepper que se enciende) y **copy en capas** (criollo visible, técnico en tooltips, jerga en código) — **sin tocar la lógica de datos ni romper la regla offline**.

Audiencias cubiertas: jurado no-dev (nivel 1, criollo), evaluador técnico (nivel 2, tooltips/detalles), auditor (nivel 3, code blocks + explorer).

## Requisitos MUST (observables y testeables)

> Convención: cada requisito indica **cómo se verifica** (inspección de código / grep / build / check visual-manual). "El sitio" = las 5 páginas de `demo/dashboard/` (`/`, `/dashboard`, `/docs`, `/demo`, `/colaborar`).

- **R-01 — Tokens `:root` únicos.** `src/index.css` define las custom properties del design §3.1 como única fuente de verdad: `--bg #070b13`, `--surface #0d1524`, `--surface-2 #12203a`, `--border #1d2c47`, `--text #e8eef7`, `--text-dim #8fa1bd`, `--accent #2dd4bf`, `--accent-2 #a78bfa`, `--grad`, `--ok #34d399`, `--warn #fbbf24`, `--bad #fb7185`, `--r-card 14px`, `--r-chip 999px`, `--glow`, `--f-display/--f-body/--f-mono`. *Verifica:* inspección de `:root` + **grep de los hex del tema viejo en `index.css` → 0 matches** (`#0d1117`, `#161b22`, `#58a6ff`, `#1f6feb`, `#21262d`, `#30363d`, `#8b949e`, `#c9d1d9`, `#e6edf3`, `#3fb950`, `#238636`, `#f85149`, `#d29922`, `#010409` — paleta actual, [EVIDENCIA] leída de `index.css`). Hex nuevos sueltos permitidos solo donde el design los fija (p.ej. fondo de `.term` `#040810`, texto del `.btn.primary` `#06121a`).
- **R-02 — Tipografía self-hosted.** Space Grotesk (display 600/700), Inter (body 400/500/600) y JetBrains Mono (400/500) se sirven como **woff2 locales en `demo/dashboard/public/fonts/`** con `@font-face` en `index.css` (`font-display: swap`) y fallbacks `system-ui`/`ui-monospace`. Jerarquía del §3.2: hero ~3.2rem, secciones 1.5rem, body 1rem. *Verifica:* los archivos existen; `@font-face` ×3 familias en el CSS; devtools → las fuentes cargan desde `/fonts/` local; si una woff2 se bloquea, el layout no se rompe (fallback).
- **R-03 — Offline: cero recursos externos cargados.** Ningún recurso estático (fuentes, CSS, JS, imágenes, íconos) se carga de un dominio externo: prohibido `<link>`/`<script src>`/`@import`/`url()` a CDN, Google Fonts, unpkg, jsdelivr, etc. — en fuente **y** en el build output (`dist/`). **Aclaración de scope:** los `<a href>` salientes a `explorer.solana.com` son contenido (el usuario elige abrirlos) y el fetch RPC a devnet del dashboard es la feature existente — ambos quedan permitidos; el check §8 del design ("solo localhost + RPC") lo confirma. *Verifica:* grep de `http(s)` en `index.html`, `index.css` y `dist/` → matches solo explorer/RPC en anchors o config; devtools → Network → requests solo a localhost + RPC.
- **R-04 — Cero dependencias nuevas.** `demo/dashboard/package.json` queda **sin diff** en `dependencies` ni `devDependencies`. Lo único nuevo: archivos woff2 estáticos + CSS/TSX. *Verifica:* `git diff package.json` vacío en las secciones de deps.
- **R-05 — Layout.** `.wrap` = 1120px en páginas de sitio; el dashboard puede llegar a 1280px; secciones con aire (3–4rem); grid de cards `repeat(auto-fit, minmax(280px, 1fr))`; `.tablewrap` con scroll-x se conserva. *Verifica:* inspección CSS + visual.
- **R-06 — Sistema de componentes compartidos.** `index.css` provee todas las clases del §3.4: `.brandmark`, `.btn` (primary gradient + ghost), `.card`, `.verdict` (con dot + estados ok/bad/warn/muted), `.stat`, `.status-dot`/`.dot` (pulse), `.stepper`/`.stp`, `.term` (window-chrome), `.term-gloss`, `.codeblock` (header con filename + copy + colores de token CSS-only), `.timeline`, `.nav`/`.topnav` (sticky + blur), `.chip`. *Verifica:* inspección de `index.css` — cada clase existe.
- **R-07 — Nav + footer con marca (App.tsx).** Nav sticky con `backdrop-filter` blur, `.brandmark` = rombito SVG inline gradient + wordmark `agentic-**dni**`, link activo con underline gradient, chip devnet con `.status-dot` verde. Footer: mismo contenido actual + brandmark. *Verifica:* visual en las 5 rutas; el SVG es inline (sin asset externo).
- **R-08 — Landing `/` reordenada (§4.1).** Orden: (1) hero — chip `devnet · live` con dot + H1 criollo + lede llano + CTA dual (`/demo` primary, `/dashboard` ghost) + stats strip (`6 beats`, `~10 líneas`, `0` API keys); (2) "el problema" (card editorial); (3) tres primitivas renombradas **Credencial / Permiso / Recibo** con subtítulo técnico (`attestation SAS`, `mandato PDA`, `PaymentReceipt`) en `.term-gloss`/`.sub`; (4) flujo atómico 4 pasos; (5) evidencia — los 6 beats como `.timeline` con punto ok/fail + sig link, tabla completa sobrevive en `<details>` "ver tabla completa"; (6) actores; (7) por qué ahora (4 o 5 cards, **cero contenido eliminado** — ambas opciones del §4.1 válidas); (8) privacidad + negocio + **limitación honesta** (igual contenido); (9) CTA final a `/demo`. *Verifica:* visual + las 9 secciones presentes; toda la data sigue viniendo de `site.ts` (BEATS/ADDRESSES/PROGRAM_ID) sin editarlo.
- **R-09 — Dashboard `/dashboard` (§4.2).** Status strip nuevo arriba: **mínimo 3 `.stat`/`statcard`** — credencial (✓ verificado nivel N), permiso (vigente/revocado), gastó hoy ($X de $Y cap); un 4to stat (p.ej. "pagos en el ledger") permitido según preview. Selector de agente → chips con `.status-dot` de attestation (reemplaza el `.mini` texto de hoy). Panels identidad/mandato: mismos datos, `dl` más aireado, badge prominente. **Ledger**: filtro rápido (todos / aceptados / rechazados / operaciones), veredicto + "por qué" en criollo inline (reusa `ERROR_EXPLAIN` existente), sig → explorer; header sticky si crece. Tab Adopción: refresh visual sin cambio funcional. **El polling 4s, el checkbox live y el read-only quedan intactos.** *Verifica:* visual + dashboard sigue mostrando datos live; estado visible sin scroll a ~900px de alto.
- **R-10 — `/docs` y tab Adopción (§4.3).** La tabla de actores pasa a **4 cards por rol** con `quién` / `qué hace` / `qué NO necesita` (el "NO" destacado en verde — es el selling point). "La vuelta completa" → 3 pasos numerados grandes (01/02/03). El snippet → `.codeblock` con header `services/service-z/src/index.ts` + tokens de color CSS-only. Niveles de adopción + fricción honesta: mismo contenido, mejor ritmo. `Adoption.tsx` (tab del dashboard): mismo refresh visual. *Verifica:* visual + contenido conservado (los 4 actores, las 4 fricciones, el snippet completo).
- **R-11 — `/demo` (§4.4).** Hero de página: título + **`.stepper` de 6 beats** + botón `▶ Correr demo` prominente. El stepper se enciende en vivo parseando los banners **`══ BEAT N ══`** que `scripts/run_beats.sh` ya imprime en el output streameado (el "`=== beat N`" del design §7 — marcador real verificado [EVIDENCIA] en `run_beats.sh:23`); beats completados marcados, beat actual `running`, resultado final refleja el `__RESULT__`/veredicto existente. Los rechazos (beats 4–6) son txs fallidas **intencionales** — se distinguen sin confundir "fallo del script". Terminal con `.term` chrome (dots + título + copy). Estado de servicios → cards con `.status-dot` online/offline + comando para levantarlo. Comandos → `.codeblock` con copy button. Guion beat-a-beat y checklist explorer: tablas conservadas, mejor spacing. *Verifica:* corrida real → el nodo del beat corriendo se enciende; la lógica de fetch/stream existente no se toca.
- **R-12 — `/colaborar` (§4.5).** Repo CTA prominente (card con `.brandmark` + URL + license badge) arriba — hoy enterrado en el lede. Áreas → cards con `.chip` de tag. Cierre: mini-sección "lo que más vale hoy" (conversación con facilitator x402) subida. *Verifica:* visual.
- **R-13 — Copy por capas (§5).** Nivel 1 criollo: la primera mención de cada término va en llano ("la credencial del agente", "el permiso firmado por el dueño", "el servicio responde *pagá primero*"); el término técnico es el apellido (subtítulo chico o `.term-gloss`). Glosario `.term-gloss` ≈ **8 términos cubiertos**: attestation, mandato/PDA, 402, PaymentReceipt, whitelist, issuer, devnet, ATA — underline punteado + tooltip criollo en hover **y focus** + `aria-label` (focusable por teclado, no hover-only). La jerga sobrevive solo en code blocks, `<details>`, tooltips, nombres de ix/comandos y links al explorer. *Verifica:* grep/inspección — los 8 términos tienen `.term-gloss`; revisión de títulos/ledes página por página (nivel 1 sin jerga desnuda).
- **R-14 — Motion sutil (§3.5).** `fade-up` on scroll (IntersectionObserver + clase, ~15 líneas — único JS nuevo), `pulse` en `.status-dot`/badge live, hover lift en cards interactivas/botones, transición de nodos del stepper, shimmer de gradiente **solo** en `.hl` del hero. Regla: <300ms por elemento, nada que bloquee ni distraiga, todo desactivable. *Verifica:* visual + `prefers-reduced-motion` lo apaga (ver R-15).
- **R-15 — Accesibilidad + responsive (§6).** Contraste AA en `--text-dim` sobre superficies y en `.verdict` (≥4.5:1 texto normal); `focus-visible` con outline accent en links/botones/tabs; `@media (prefers-reduced-motion: reduce)` desactiva **toda** animación/transición decorativa; `.term-gloss` operable por teclado; breakpoint 700px conservado + ajustes (stats apilan, stepper scrollea horizontal); mobile 375px sin overflow-x fuera de `.tablewrap`/`.stepper`. *Verifica:* devtools (emulación reduced-motion, viewport 375px, ratio checker) + navegación por Tab.
- **R-16 — Lógica y datos intactos.** `src/gate.ts`, `src/snippets.ts`: **cero cambios**. `src/site.ts`: **cero cambios** (ni de presentación). `src/router.tsx`: sin cambios funcionales (`Link`/`usePath`/`navigate` iguales — ya acepta `className` vía props). `App.tsx`/páginas: cambios solo de presentación — **polling 4s, auto-refresh, stream del runner, probes de salud, parseo de `__RESULT__`/sigs y el carácter read-only quedan idénticos en comportamiento**. *Verifica:* `git diff` de los 4 archivos protegidos (vacío o solo-cosmético) + diff de los TSX muestra solo markup/estilos/copy — no cambios en hooks de datos ni endpoints.

## Criterios de aceptación — mapeo 1:1 con el checklist §8 del design

**CA-1 ↔ "`npm run build` limpio".** DADO el código final, CUANDO `cd demo/dashboard && npm run build`, ENTONCES termina exit 0 sin errores. PASS = build verde; FAIL = cualquier error. (Se recomienda además `npx tsc --noEmit` sin errores nuevos — la baseline actual compila.)

**CA-2 ↔ "Ninguna request a CDN/externa".** DADO el sitio servido (dev o preview), CUANDO se navegan las 5 páginas con devtools → Network, ENTONCES las únicas requests son localhost (assets locales) + RPC devnet (dashboard) + probes `/svc/` — cero font/CDN/imagen externa. Además: grep `https?://` en `index.html`, `src/index.css` y `dist/` → matches permitidos solo en anchors a `explorer.solana.com` y el RPC configurado. PASS = ambas verificaciones limpias; FAIL = cualquier recurso estático externo.

**CA-3 ↔ "Todas las páginas usan tokens".** DADO `src/index.css`, CUANDO se grepean los hex del tema viejo (lista de R-01), ENTONCES 0 matches; y los `.tsx` no introducen hex inline que reimplementen la paleta vieja. PASS = 0 hex viejos; FAIL = queda alguno.

**CA-4 ↔ "El hero comunica el qué en <5s sin jerga".** DADO `/` cargada, CUANDO una persona no-dev mira solo el hero, ENTONCES puede decir qué hace el producto sin leer un término técnico. PASS = test manual con alguien externo (o revisión humana del copy: H1 + lede sin jerga); FAIL = el nivel 1 exige vocabulario Solana.

**CA-5 ↔ "Dashboard: estado visible sin scroll".** DADO `/dashboard` con datos live a ~900px de alto, ENTONCES credencial + permiso + gasto del agente seleccionado se ven sin scrollear. PASS = status strip completo above-the-fold; FAIL = hay que scrollear para saber si el agente está verificado.

**CA-6 ↔ "`/demo`: el stepper refleja el beat corriendo en vivo".** DADO el runner online, CUANDO se corre la demo desde el botón, ENTONCES el nodo del beat en curso se enciende (parseo de banners `══ BEAT N ══` del output real) y los completados quedan marcados. PASS = stepper sincronizado con el stream en una corrida real; FAIL = stepper estático o desincronizado. (Verificación manual en vivo; si el runner no está disponible en el entorno de verify, code-inspection del parseo + mock del output.)

**CA-7 ↔ "`.term-gloss` cubre los 8 términos".** DADO el sitio final, CUANDO se inspecciona, ENTONCES attestation, mandato/PDA, 402, PaymentReceipt, whitelist, issuer, devnet y ATA aparecen con `.term-gloss` (tooltip criollo + `aria-label`, focusable). PASS = 8/8 con tooltip accesible; FAIL = falta alguno o es hover-only.

**CA-8 ↔ "`prefers-reduced-motion` apaga toda animación".** DADO devtools → Rendering → `prefers-reduced-motion: reduce`, ENTONCES pulse/shimmer/fade-up/lift/transiciones decorativas quedan quietos. PASS = nada se mueve salvo lo estrictamente funcional; FAIL = alguna animación sigue.

**CA-9 ↔ "Contraste AA en texto dim y verdicts".** DADO `--text-dim` sobre `--bg`/`--surface`/`--surface-2` y los `.verdict` ok/bad/warn/muted, CUANDO se calcula el ratio (herramienta o fórmula WCAG), ENTONCES ≥4.5:1 para texto normal (≥3:1 aceptable solo en texto grande display). PASS = ratios conformes; FAIL = algún texto dim o verdict <4.5:1.

**CA-10 ↔ "Mobile 375px: sin overflow-x fuera de tablas".** DADO viewport 375px, CUANDO se navegan las 5 páginas, ENTONCES no hay scroll horizontal de página — solo scroll-x interno en `.tablewrap`/`.stepper`. PASS = 5/5 sin overflow; FAIL = alguna página scrollea en X.

**CA-11 ↔ "Honestidad intacta".** DADO `/`, ENTONCES la sección "Limitación honesta" sigue presente y visible con su contenido (el gate protege al vendedor; SPL libres por fuera siguen existiendo). PASS = sección presente sin edulcorar; FAIL = removida, escondida o suavizada.

**CA-12 ↔ "Copy: cero término técnico sin traducción criolla en nivel 1".** DADO los títulos de sección, ledes y cards de las 5 páginas, CUANDO se revisan, ENTONCES todo término técnico en nivel 1 tiene su versión criolla (el término va de apellido/subtítulo/tooltip). PASS = revisión página por página limpia; FAIL = jerga desnuda en nivel 1 (la jerga en code/details/tooltips/comandos NO cuenta como falla — es nivel 3 permitido).

**CA-13 — Comportamiento intacto (R-16).** DADO `git diff`, ENTONCES `gate.ts`, `site.ts`, `snippets.ts` sin cambios; `router.tsx` sin cambios funcionales; en los `.tsx` de página no hay cambios en hooks de datos (fetches, intervalos, parseo de `__RESULT__`, SIG_RE, probes); `package.json` sin diff de deps; el dashboard sigue read-only (ningún `.sendTransaction`/firma). PASS = diffs solo cosméticos/markup/copy; FAIL = cambio funcional o dep nueva.

## Errores / seguridad / accesibilidad / invariantes

**Invariantes de spec (cualquier implementación que los viole = FAIL):**

- **INV-1 — Offline estricto.** Cero recursos estáticos externos cargados por la página (fuentes, CSS, JS, imágenes). Fuentes = woff2 locales únicamente. (Los anchors a explorer y el RPC devnet del dashboard son scope permitido — R-03.)
- **INV-2 — Cero dependencias nuevas.** `package.json` sin diff en deps; nada de Tailwind, icon packs, libs de animación ni de tooltips.
- **INV-3 — Comportamiento intacto.** `gate.ts`/`site.ts`/`snippets.ts`/`router.tsx` sin cambios funcionales (site.ts: ningún cambio); polling 4s, live-refresh, stream del runner, probes `/svc/`, parseo de resultado y el modo read-only se preservan; el dashboard nunca firma ni escribe.
- **INV-4 — Honestidad + voz.** La limitación declarada sigue visible; cero claims inflados ni stats inventados (los números del hero vienen de datos reales ya publicados: 6 beats, ~10 líneas, 0 API keys); español rioplatense; sin PII nueva en pantalla.
- **INV-5 — Render seguro.** El output del runner y los datos de la chain se renderizan como **texto** (`pre`/textContent) — prohibido `dangerouslySetInnerHTML` sobre contenido externo; cero scripts externos = nada que inyectar; el copy button usa `navigator.clipboard` sin permisos extra.

**Errores / edge cases (observables — el sitio degrada en gracia):**

- Sin `dashboard/.env` → el dashboard muestra el error guiado existente (sin regresión).
- RPC devnet caído → las 4 páginas estáticas funcionan igual; el dashboard muestra `err` sin romper el layout (comportamiento existente).
- Una woff2 no carga → fallback `system-ui`/`ui-monospace`, layout íntegro (verificable bloqueando `/fonts/` en devtools).
- Runner offline → botón deshabilitado + nota (ya existe — no regresión); stepper queda en estado idle consistente.
- Stream cortado a mitad de corrida → el stepper no marca como corridos beats que no llegaron (estado consistente con `run.phase === "error"`).
- Ledger vacío / mandato inexistente / agente sin attestation → estados ya contemplados se ven correctos en la nueva UI.

**Accesibilidad:** ver R-15 — AA en dim/verdicts, focus-visible, reduced-motion, `.term-gloss` por teclado, jerarquía de headings conservada, `lang="es"`.

## No objetivos (OUT of scope — explícito; design §9 + alcance de la proposal)

- **Tailwind / librería de componentes / frameworks CSS** — rompe offline + agrega deps por gusto (§9).
- **Gradiente Solana oficial** (`#14f195→#9945ff`) — genérico; la marca propia es teal/violeta (§9).
- **GSAP / Framer / animaciones JS-driven** — CSS cubre lo necesario (§9).
- **Rediseñar datos o lógica** (`gate.ts`, `site.ts`, `snippets.ts`, `router.tsx`) — presentación solamente.
- **Modo claro** — el dark es el contexto de demo; los tokens lo dejan preparado (§9).
- **Contratos on-chain, servicios, scripts de `demo/`** — intocables; solo `demo/dashboard/`.
- **Nuevas rutas o cambios de router** — las 5 rutas quedan igual.
- **i18n / multi-idioma** — el sitio queda en español rioplatense.
- **PWA / service worker / cache offline programático** — no necesario: ya todo es local.
- **Cambios de contenido factual** (beats, direcciones, claims) — solo presentación y copy de superficie; la evidencia on-chain se muestra igual.

## Decisiones ABIERTAS — resueltas en design.md o menores de `apply` (ninguna bloquea spec)

Las decisiones de fondo ya las tomó `design.md` §2–§9 (paleta, dirección "capa de confianza", capas de copy, descartes). Quedan al criterio de `apply`, sin cambiar el outcome:

1. Pesos exactos descargados por familia tipográfica (design fija ~3 por familia, ~150 KB total).
2. Implementación del tooltip `.term-gloss` (p.ej. `::after` CSS sobre `:hover`/`:focus` + `tabindex="0"` + `aria-label`) — cualquier mecanismo que cumpla R-13/CA-7.
3. Regex exacto del stepper sobre `run.output` (los banners `══ BEAT N ══` y las líneas `──> ✓/✗` son los marcadores reales).
4. Dónde vive el helper `fade-up`/IntersectionObserver (compartido en `App.tsx` o por página) — ~15 líneas, sin archivo nuevo prohibido pero tampoco exigido.
5. 4to stat del status strip del dashboard (preview muestra 4; §4.2 exige 3 como mínimo).
6. "Por qué ahora": 4 cards fusionadas o 5 con jerarquía (§4.1 admite ambas — cero contenido eliminado).

## Quién aprobó y cuándo

**PENDIENTE** — gate de la fase `spec`: este documento requiere revisión y aprobación humana explícita. La proposal quedó aprobada al despacharse las fases siguientes (design ya escrito y revisable en `design.md`). La spec aprobada habilita `tasks`; **no habilita código**.
