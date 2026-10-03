# Plan de pruebas — ui-redesign

> Estado: **ESCRITO — pendiente aprobación junto con `tasks.md`** (gate de la fase `tasks`: aprobar primer slice).
> Fecha: 03/10/2026 · Cambio SDD: `ui-redesign` · Cobertura: spec R-01..R-16, CA-1..CA-13, INV-1..INV-5.
> Ejecución: `cd demo/dashboard && npm run build` (Vite, Windows o WSL — indistinto, es build estático). Servir: `npx vite --port 3404 --host` (dev) o `npm run preview` sobre `dist/`. Toda evidencia real se registra en `docs/SESSION_LOG.md` (comando + salida resumida).
> **No hay test runner en `demo/dashboard/`** [EVIDENCIA — `package.json` solo expone `dev`/`build`/`preview`]. Este cambio es presentación: la verificación = **build limpio + checks estáticos (grep) + revisión visual/a11y por página**. RED→GREEN→REFACTOR no aplica; en su lugar, cada slice cierra con su aceptación observable.

## Infraestructura de verificación

- **Build gate por slice:** `npm run build` exit 0 — corre al final de CADA slice (S1–S7).
- **Checks estáticos:** `rg`/grep sobre `demo/dashboard/index.html`, `demo/dashboard/src/` y `demo/dashboard/dist/` post-build.
- **Checks visuales:** navegación de las 5 rutas (`/`, `/dashboard`, `/docs`, `/demo`, `/colaborar`) en viewport desktop (~1280–1440px) y mobile (375px) con devtools.
- **Checks live (opcional según entorno):** servicios + runner arriba (`scripts/start_services.sh` en WSL) para verificar stepper en vivo, status dots y polling 4s. Si el entorno de verify no los tiene, se suplen por code-inspection + mock del output (registrar cuál se usó).
- **A11y:** devtools → Rendering → emular `prefers-reduced-motion`; navegación por Tab; ratio de contraste calculado (fórmula WCAG o herramienta).

## Nivel 1 — Checks estáticos / build (cada slice; cierre completo en S7)

| Check | Comando (parado en `demo/dashboard/`) | PASS |
|---|---|---|
| Build | `npm run build` | exit 0, `dist/` generado, sin errores |
| Tipos | `npx tsc --noEmit` | sin errores nuevos respecto de la baseline (hoy compila limpio) |
| Paleta vieja | `rg -i "#(0d1117|161b22|58a6ff|1f6feb|21262d|30363d|8b949e|c9d1d9|e6edf3|3fb950|238636|f85149|d29922|010409)" src/index.css` | **0 matches** (CA-3) |
| Recursos externos en fuente | `rg -n "https?://" index.html src/index.css` + `rg -n "@import|url\(\s*['\"]?https?" src/` | **0 matches** de CDN/fuentes/hosts externos (R-03) |
| Recursos externos en build | `rg -n "fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr|cdnjs" dist/` | **0 matches** (CA-2) |
| URLs externas en dist (revisión) | `rg -n "https?://" dist/` | solo permitido: `explorer.solana.com` (anchors salientes) y el endpoint RPC devnet configurado — todo lo demás = FAIL |
| Deps | `git diff package.json` | `dependencies`/`devDependencies` sin diff (INV-2) |
| Archivos protegidos | `git diff src/gate.ts src/site.ts src/snippets.ts src/router.tsx` | `site.ts`/`gate.ts`/`snippets.ts` vacío; `router.tsx` vacío o solo-cosmético (INV-3/CA-13) |
| Glosario | `rg -n "term-gloss" src/` | presente y aplicado a los 8 términos: attestation, mandato/PDA, 402, PaymentReceipt, whitelist, issuer, devnet, ATA (CA-7) |
| Reduced-motion | `rg -n "prefers-reduced-motion" src/index.css` | existe y envuelve las animaciones/transiciones decorativas (CA-8) |
| Fuentes | `ls public/fonts/` + `rg -n "@font-face" src/index.css` | woff2 presentes (3 familias, pesos de §3.2) + `@font-face` ×3 con `font-display: swap` |
| HTML externo | `rg -n "link|src=|href=" index.html` | ningún recurso externo (R-02/R-03) |

## Nivel 2 — Offline / build output

| Caso | Cómo se verifica | PASS |
|---|---|---|
| Sitio sin red (estáticas) | `npm run preview` (o dev) + devtools → Network → modo Offline → recargar `/`, `/docs`, `/demo`, `/colaborar` | las 4 páginas estáticas renderizan completas, con tipografías propias (las woff2 salen del bundle local) |
| Dashboard sin red | mismo modo Offline en `/dashboard` | la página renderiza el shell + muestra `err` de RPC en gracia (comportamiento existente, no regresión) |
| Requests en vivo | devtools → Network → recorrer las 5 rutas online | requests solo a `localhost`/`127.0.0.1` (assets + `/svc/` probes) + endpoint RPC devnet — **cero** font/CDN/imagen externa (CA-2) |
| Fallback tipográfico | devtools → Network → bloquear `/fonts/*` → recargar | el sitio sigue legible, layout íntegro con `system-ui`/`ui-monospace` (R-02) |

## Nivel 3 — Revisión visual por página (cada slice de página)

| Página | Qué mirar (spec) | PASS |
|---|---|---|
| `/` (S3) | hero: chip live + dot, H1 criollo con `.hl` gradient, CTA dual, stats strip ×3; sección problema; primitivas Credencial/Permiso/Recibo con subtítulo técnico; flujo 4 pasos; evidencia en `.timeline` + tabla completa en `<details>`; actores; por-qué-ahora; privacidad + negocio + **limitación honesta**; CTA final | las 9 secciones §4.1 en orden; <5s para decir qué es sin jerga (CA-4); limitación visible (CA-11) |
| `/dashboard` (S5) | status strip (credencial/permiso/gasto) arriba de todo; selector de agente con dots por attestation; panels con badge prominente; ledger con filtro (todos/aceptados/rechazados/operaciones) + "por qué" criollo + sig→explorer; checkbox live + refresh siguen andando | estado completo sin scroll a ~900px (CA-5); polling 4s visible (los datos se actualizan solos); filtro funciona (CA-13) |
| `/docs` (S6) | 4 cards por rol (quién/hace/NO — el NO en verde); vuelta completa en 3 pasos grandes; snippet en `.codeblock` con header `services/service-z/src/index.ts`; niveles + fricción honesta presentes | contenido completo conservado (4 actores, 4 fricciones); codeblock legible con tokens de color |
| `/demo` (S4) | stepper 6 beats + botón `▶` prominente; al correr, el nodo del beat actual se enciende (`══ BEAT N ══` del stream real); `.term` con chrome + copy; servicios con dots online/offline + comando de arranque; comandos en `.codeblock`; guion + checklist conservados | CA-6 (corrida real o mock del output documentado); runner offline → botón deshabilitado + nota |
| `/colaborar` (S6) | repo CTA prominente arriba (brandmark + URL + license badge); áreas con chips de tag; mini-sección "lo que más vale hoy" al cierre | CTA visible sin scroll; contenido conservado |
| Nav/footer (S2) | sticky + blur al scrollear; brandmark SVG + wordmark gradient; link activo con underline gradient; chip devnet con dot; footer con brandmark | consistente en las 5 rutas (CA-3 parcial visual) |
| Copy (S7) | títulos/ledes nivel 1 en criollo; jerga solo en code/details/tooltips | CA-12 página por página |

## Nivel 4 — Live + accesibilidad

| Check | Cómo se verifica | PASS |
|---|---|---|
| Dashboard vivo | `/dashboard` con RPC devnet: status strip refleja att/mandate reales; esperar 4s+ → refresh automático | datos live correctos; "live (4s)" sigue funcionando (INV-3) |
| Stepper en vivo | runner arriba → `▶ Correr demo` → observar nodos durante la corrida | el beat corriente se enciende al aparecer su banner; completados marcados; resultado final refleja el veredicto (CA-6) |
| Status dots servicios | `/demo` con servicios arriba/abajo | dots online (pulse) / offline correctos tras re-probar |
| Reduced-motion | devtools → Rendering → `prefers-reduced-motion: reduce` → recorrer el sitio | pulse/shimmer/fade-up/lift/stepper quietos (CA-8) |
| Focus visible | navegar las 5 páginas solo con Tab | outline accent en links/botones/tabs; `.term-gloss` alcanzable y muestra tooltip en focus (R-15/CA-7) |
| Contraste AA | calcular ratio de `--text-dim #8fa1bd` sobre `--bg`/`--surface`/`--surface-2` + `.verdict` ok/bad/warn/muted | ≥4.5:1 texto normal (≥3:1 solo display grande) (CA-9) |
| Mobile 375px | devtools → viewport 375px → las 5 rutas | cero overflow-x de página (solo scroll interno `.tablewrap`/`.stepper`); stats apilan; hero ~2rem (CA-10) |
| Error sin `.env` | renombrar `dashboard/.env` temporalmente → `/dashboard` | error guiado existente, layout íntegro (no regresión) |
| Render seguro | inspección: output del runner y datos de chain renderizan como texto | cero `dangerouslySetInnerHTML` sobre contenido externo (INV-5) |

## Invariantes verificadas en la verificación final (S7 / verify)

- **INV-1 Offline:** niveles 1–2 limpios (0 recursos externos en fuente y `dist/`; offline renderiza).
- **INV-2 Cero deps:** `git diff package.json` vacío en deps.
- **INV-3 Comportamiento intacto:** `git diff` de `gate.ts`/`site.ts`/`snippets.ts` vacío y `router.tsx` sin cambio funcional; polling 4s + read-only + stream del runner operativos (nivel 4).
- **INV-4 Honestidad + voz:** "Limitación honesta" visible en `/`; stats del hero = datos reales (6 beats, ~10 líneas, 0 API keys); sin claims nuevos.
- **INV-5 Render seguro:** inspección de `DemoPage.tsx`/`Dashboard.tsx` — nada de HTML inyectado; sin scripts externos.

## Mapa CA → verificación

| CA | Nivel(es) |
|---|---|
| CA-1 build limpio | Nivel 1 (cada slice) |
| CA-2 cero CDN/externas | Nivel 1 (grep) + Nivel 2 (network) |
| CA-3 tokens en todo | Nivel 1 (grep hex viejos) + Nivel 3 (visual) |
| CA-4 hero <5s | Nivel 3 + test humano |
| CA-5 dashboard sin scroll | Nivel 3/4 |
| CA-6 stepper vivo | Nivel 4 (o mock documentado) |
| CA-7 glosario 8 términos | Nivel 1 (grep) + Nivel 3 (focus) |
| CA-8 reduced-motion | Nivel 4 (emulación) |
| CA-9 contraste AA | Nivel 4 (cálculo) |
| CA-10 mobile 375px | Nivel 4 |
| CA-11 honestidad | Nivel 3 |
| CA-12 copy nivel 1 | Nivel 3 (revisión por página) |
| CA-13 comportamiento intacto | Nivel 1 (git diff) + Nivel 4 (live) |

## Evidencia

Cada nivel deja registro real en `docs/SESSION_LOG.md`: salida resumida del build, comandos grep con su resultado, capturas/notas de la revisión visual por página, y el resultado del check offline. Sin evidencia → el slice no se marca `[x]` y la verificación no se declara PASS.
