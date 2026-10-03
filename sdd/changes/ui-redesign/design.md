# Diseño — `ui-redesign`

Estado: **PROPUESTO** — listo para revisión humana.

> Rediseño del sitio `demo/dashboard/` (5 páginas) con sistema de diseño propio,
> identidad "capa de confianza", motion sutil y copy en criollo. Todo offline,
> cero dependencias nuevas de runtime.
>
> **Ver el diseño:** abrir [`preview.html`](./preview.html) en el browser —
> muestra tokens, componentes y mocks de las páginas tal como quedarían.

## 1. Diagnóstico — qué le pasa a la UI actual

| # | Problema | Evidencia | Costo |
|---|----------|-----------|-------|
| 1 | Sin identidad propia | `#0d1117`/`#161b22`/`#58a6ff` + Segoe UI = tema GitHub stock | Parece un README, no un producto |
| 2 | Sin jerarquía | hero `h1` de 2.1rem, body 0.85rem, cards idénticas | El jurado no sabe dónde mirar primero |
| 3 | Jerga como primer contacto | "attestation SAS PDA", "GateError", "Program data:", "x402", "invoice vinculante" en títulos y lede | Excluye al evaluador no-Solana |
| 4 | No se siente vivo | hay polling 4s a devnet y cero feedback visual | La feature "live on-chain" no se percibe |
| 5 | Todo denso e igual | max-width 960px único, tablas apretadas, cards planas | Fatiga visual, nada "mostrable" |
| 6 | Sin marca | `agentic-dni` es texto plano en el nav | Cero recordación |

Lo que **sí** está bien y se conserva: el contenido (beats reales, direcciones verificables, honestidad declarada), la voz rioplatense, y el stack sin deps.

## 2. Dirección — "la capa de confianza"

El producto es un **sello de verificación para pagos de agentes**. La UI tiene que
sentirse así: oscura y premium (crypto-native, no corporativa), con un acento
propio que NO sea el azul GitHub, tipografía con carácter, y señales de vida
(dots pulsantes, steppers que se encienden) porque la data ES viva.

**Metáfora visual:** sello/credencial → el violeta marca identidad (attestation,
mandato), el teal marca acción y estado verificado. El verde/rojo quedan
reservados para veredictos on-chain (aceptado/rechazado) — que es donde HOY
comunican.

### Tensión de diseño resuelta

El sitio vende a **dos audiencias**: jurados/evaluadores (quieren entender en 30
segundos) y devs (quieren verificar el código y las txs). Respuesta: **capas de
profundidad** — nivel 1 criollo visible, nivel 2 técnico en tooltips/detalles,
nivel 3 jerga completa en code blocks y links al explorer. La jerga no se borra:
se ordena.

## 3. Sistema de diseño

### 3.1 Tokens (CSS custom properties — única fuente de verdad)

```css
:root {
  /* superficies — azul noche, más profundo y frío que el gris GitHub */
  --bg:        #070b13;
  --surface:   #0d1524;
  --surface-2: #12203a;
  --border:    #1d2c47;

  /* texto */
  --text:      #e8eef7;
  --text-dim:  #8fa1bd;

  /* acentos de marca */
  --accent:    #2dd4bf;  /* teal — acción, "verificado" */
  --accent-2:  #a78bfa;  /* violeta — identidad/credencial */
  --grad: linear-gradient(120deg, var(--accent), var(--accent-2));

  /* semánticos (veredictos on-chain) */
  --ok:   #34d399;
  --warn: #fbbf24;
  --bad:  #fb7185;

  /* forma */
  --r-card: 14px;
  --r-chip: 999px;
  --glow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
          0 8px 30px rgb(0 0 0 / .45);

  /* tipografía */
  --f-display: "Space Grotesk", system-ui, sans-serif;
  --f-body:    "Inter", system-ui, sans-serif;
  --f-mono:    "JetBrains Mono", ui-monospace, monospace;
}
```

### 3.2 Tipografía

| Rol | Font | Tamaño | Uso |
|-----|------|--------|-----|
| Display | Space Grotesk 600/700 | 3.2rem → 1.5rem | hero, títulos de sección |
| Body | Inter 400/500/600 | 1rem base, 0.9 sm | todo el texto corrido |
| Mono | JetBrains Mono 400/500 | 0.8–0.85rem | addresses, código, terminal |

- **Fuentes self-hosted**: woff2 en `demo/dashboard/public/fonts/` + `@font-face`. Cumple la regla offline (cero CDN). Peso total ~150 KB.
- Jerarquía real: el hero pasa de 2.1rem a ~3.2rem con gradient en la palabra clave; secciones 1.5rem; body sube de 0.85 a 1rem (legibilidad).
- Fallback seguro si una woff2 no carga: `system-ui`/`ui-monospace` — nunca rompe.

### 3.3 Layout

- `.wrap` sube de 960 → **1120px** en páginas de sitio; el dashboard puede usar hasta 1280 (es herramienta, no prosa).
- Secciones con `margin` generoso (3–4rem) y aire; la densidad se reserva a tablas/ledger.
- Grid de cards: `repeat(auto-fit, minmax(280px, 1fr))` — mismo comportamiento, mejor ritmo.

### 3.4 Componentes (todos CSS + React existente, sin libs)

| Componente | Qué es | Dónde |
|-----------|--------|-------|
| `.brandmark` | rombito gradient + wordmark "agentic-**dni**" inline SVG (8 líneas, sin asset) | nav, footer |
| `.btn` | primary con gradient teal→violeta + lift en hover; secondary ghost | todas |
| `.card` | surface + border + sombra; `.card:hover` lift solo en interactivas | todas |
| `.verdict` | como hoy pero con **dot** (●) + pill refinada; estados: ok/bad/warn/muted | dashboard, demo |
| `.stat` | número grande display + label — el estado on-chain de un vistazo | dashboard |
| `.status-dot` | punto con `pulse` CSS — online/offline en vivo | dashboard, demo, adopción |
| `.stepper` | 6 nodos beat que se encienden al correr la demo | `/demo` |
| `.term` | terminal con window-chrome (dots + título + copy btn) | `/demo`, `/docs` |
| `.term-gloss` | palabra técnica con underline punteado → tooltip criollo en hover/focus | todas |
| `.codeblock` | `pre.code` mejorado: header con nombre de archivo + líneas + colores por token (comentario/keyword/string) sin lib | docs, adopción |
| `.timeline` | beats como línea temporal vertical en vez de tabla | landing |
| `.nav` | sticky con blur `backdrop-filter`, link activo con underline gradient | App |
| `.chip` | igual semántica, borde gradient sutil | meta |

### 3.5 Motion — sutil, CSS puro, `prefers-reduced-motion` respetado

| Efecto | Dónde | Por qué |
|--------|-------|---------|
| `fade-up` on scroll (IntersectionObserver + clase) | landing, docs | las secciones entran, no "cargan" |
| `pulse` 2s | `.status-dot`, badge "live (4s)" | comunica que el dato es real-time |
| hover lift `translateY(-2px)` + glow | cards interactivas, botones | affordance |
| stepper nodo encendido con `transition` | `/demo` | el beat corriendo se ve corriendo |
| gradient text shimmer sutil | solo hero `h1 .hl` | marca, una vez, no en todos lados |

Regla: **nada de motion que bloquee ni distraiga** — total < 300ms por elemento, desactivable.

## 4. Página por página

### 4.1 `/` Landing — de "listado de features" a "historia que baja"

Hoy: hero débil → 9 secciones de cards iguales. Reorden propuesto:

1. **Hero**: chip `solana devnet · live` con dot pulsante + H1 grande ("Los agentes ya mueven plata. **Que alguien responda.**") + lede llano + CTA dual (primary → /demo "verlo funcionar"; ghost → /dashboard). Stats strip bajo el hero: `6 beats · txs reales devnet` / `~10 líneas` para adoptar / `0` permisos ni API keys.
2. **El problema** (nuevo, 1 card editorial): hoy un agente paga y nadie responde — 3 líneas, criollo.
3. **Tres primitivas** → renombrar a lenguaje llano: **Credencial** (¿quién está atrás?), **Permiso** (¿qué autorizó el dueño?), **Recibo** (¿qué pasó?) — con el término técnico como subtítulo (`attestation SAS`, `mandato PDA`, `PaymentReceipt`) en `.term-gloss`.
4. **Flujo atómico** → visual 4 pasos con conectores, cada paso = 1 línea criolla; el detalle técnico queda en el note.
5. **Evidencia** → los 6 beats como `.timeline` (no tabla): punto ok/fail + título + sig link. Tabla completa sobrevive en `<details>` "ver tabla completa".
6. **Actores** (3 cards, igual contenido, mejor jerarquía).
7. **Por qué ahora** → bajar de 5 a 4 cards (fusionar regulación+vacío) o mantener 5 con mejor jerarquía.
8. **Privacidad** + **Negocio** + **Limitación honesta** — igual contenido.
9. **CTA final** (nuevo): "Corré la demo — 90 segundos, devnet real" → `/demo`.

### 4.2 `/dashboard` — herramienta de auditoría glanceable

- **Status strip** (nuevo, arriba): 3 `.stat` — `Credencial: ✓ verificado nivel 2` / `Permiso: vigente` / `Gastó hoy: $0.50 de $10`. Lo que el jurado debe ver en 2 segundos.
- Selector de agente → chips con `.status-dot` de attestation (hoy es texto mini).
- Panels identidad/mandato: mismos datos, `dl` más aireado, badge prominente.
- **Ledger**: filtro rápido (todos / aceptados / rechazados / operaciones), fila con veredicto + "por qué" en criollo inline (ya existe el mapa `ERROR_EXPLAIN` — se visualiza mejor), sig → explorer. Header sticky si crece.
- Tab Adopción: mismo refresh visual (sin cambio funcional).

### 4.3 `/docs` Adopción — "la chain es la API" hecho visible

- Tabla de actores → **4 cards por rol** con header `quién` / `qué hace` / `qué NO necesita` (el "NO" en verde, es el selling point).
- "La vuelta completa" → 3 pasos numerados grandes (01/02/03) en vez de `<ol>` apretada.
- Snippet → `.codeblock` con header `services/service-z/src/index.ts` + colores de token CSS-only.
- Niveles de adopción + fricción honesta → igual, mejor ritmo visual.

### 4.4 `/demo` — el botón es el protagonista

- **Hero de la página**: título + `.stepper` de 6 beats + botón `▶ Correr demo` grande centrado. Mientras corre, el stepper enciende el beat actual (parseo del output `=== beat N` ya existe en el script) y la terminal streamea abajo con `.term` chrome.
- Estado de servicios: cards con `.status-dot` pulsante online/offline + comando para levantarlo.
- Comandos → `.codeblock` con copy button.
- Guion beat-a-beat y checklist → conservar tablas (son referencia, están bien), mejor spacing + `.verdict` nuevo.

### 4.5 `/colaborar` — la más simple, CTA primero

- Repo CTA prominente (card con `.brandmark` + URL + license badge) — hoy está enterrado en el lede.
- Áreas → cards con `.chip` de tag (programa/adopción/integración/interop).
- Cierre: mini-sección "lo que más vale hoy" → la conversación con facilitator x402 (ya está en el note — subirla).

### 4.6 Nav + footer (App.tsx)

- Nav sticky con blur, `.brandmark` gradient, links con estado activo underline gradient, chip devnet con `.status-dot` verde.
- Footer: 2 líneas, mismo contenido + brandmark.

## 5. Guía de copy — "técnico solo donde suma"

Regla de oro: **la primera mención de cada término va en criollo; el término técnico es el apellido, no el nombre.**

| Hoy dice | Pasa a decir | Dónde queda la jerga |
|----------|--------------|----------------------|
| attestation SAS PDA | "la credencial del agente" | `.term-gloss` → "attestation SAS: credencial on-chain emitida por un verificador" |
| mandato PDA | "el permiso firmado por el dueño" | tooltip → "Mandate PDA: la cuenta del programa que guarda la policy" |
| GateError `AttestationMissing` | "rechazado: nadie verificó al humano" | el error crudo sigue en la fila/ledger como `<code>` |
| x402 / responde 402 | "el servicio responde *pagá primero*" | "(código HTTP 402)" la primera vez |
| `Program data:` | "el recibo que emite el programa" | el log literal sigue en el `<details>`/code |
| ATA / invoice vinculante | "cuenta de tokens del servicio" / "el recibo referencia tu pedido" | tooltips |
| init_mandate / revoke_mandate | "crear permiso" / "revocar permiso" | los nombres de ix van en los comandos/code |

- Glosario implementado como `.term-gloss` (underline punteado + tooltip on hover/focus + `aria-label`), ~8 términos.
- Títulos de sección también bajan: "¿Quién está atrás? — attestation SAS" → "**¿Hay un humano detrás?**" con subtítulo chico "attestation SAS · nivel 2".
- La jerga **no se elimina** — devs la quieren: sigue en code blocks, `<details>`, tooltips y links al explorer.

## 6. Accesibilidad y responsive

- Contraste AA: `--text-dim` sube de `#8b949e` a `#8fa1bd` (AA 4.5:1 sobre surface).
- Focus visible: `outline` accent en links/botones/tab.
- `prefers-reduced-motion`: desactiva pulse/fade/shimmer.
- `.term-gloss` accesible por teclado (focusable, no hover-only).
- Mobile: mismo breakpoint 700px + ajustes (stats apilan, stepper scrollea horizontal, hero 2rem).
- Tablas → `.tablewrap` con scroll-x ya existe; se mantiene.

## 7. Implementación por fases

| Fase | Qué | Archivos | Verificación |
|------|-----|----------|--------------|
| F1 — Fundaciones | tokens `:root`, `@font-face`, descargar 3 woff2 × ~3 pesos a `public/fonts/`, base body/a/code | `index.css`, `index.html`, `public/fonts/` | build + las vars existen |
| F2 — Sistema | componentes compartidos (btn, card, verdict, status-dot, codeblock, term, stepper, brandmark, nav, footer) | `index.css`, `App.tsx` | nav/footer se ven nuevo |
| F3 — Landing + Demo | reorden landing + hero nuevo; demo con stepper+terminal | `Landing.tsx`, `DemoPage.tsx` | review visual + stepper enciende |
| F4 — Dashboard + Docs + Colaborar | status strip, filtro ledger, cards por rol, repo CTA | `Dashboard.tsx`, `Adoption.tsx`, `Docs.tsx`, `Colaborar.tsx` | review visual + dashboard sigue live |
| F5 — Copy + polish | `.term-gloss` + rewrites de títulos, a11y, responsive, `prefers-reduced-motion` | todos | checklist §8 + build limpio |

Sin deps nuevas. El único JS nuevo: IntersectionObserver para fade-up (~15 líneas) y el parseo de beat en el stepper (regex sobre `run.output` ya existente).

## 8. Checklist de aceptación

- [ ] `npm run build` limpio en `demo/dashboard`
- [ ] Ninguna request a CDN/externa en el sitio (devtools → Network → solo localhost + RPC)
- [ ] Todas las páginas usan tokens (no quedan hex sueltos del tema viejo en `index.css`)
- [ ] El hero comunica el qué en <5s sin leer jerga (test: mostrar a alguien no-dev)
- [ ] Dashboard: estado de credencial/permiso/gasto visible sin scroll
- [ ] `/demo`: el stepper refleja el beat corriendo en vivo
- [ ] `.term-gloss` cubre: attestation, mandato/PDA, 402, PaymentReceipt, whitelist, issuer, devnet, ATA
- [ ] `prefers-reduced-motion` apaga toda animación
- [ ] Contraste AA en texto dim y verdicts
- [ ] Mobile 375px: sin overflow-x fuera de tablas
- [ ] Honestidad intacta: la limitación declarada sigue visible en landing
- [ ] Copy: cero término técnico sin traducción criolla en nivel 1

## 9. Lo que NO se hace (y por qué)

| Descartado | Razón |
|-----------|-------|
| Tailwind / librería de componentes | rompe la regla offline + agrega deps por gusto; el CSS actual ya es un archivo único y ordenado |
| Gradiente Solana oficial (#14f195→#9945ff) | grita "template Solana" — teal/violeta propio mantiene crypto-native sin ser genérico |
| Animaciones GSAP/Framer | peso + complejidad sin retorno; CSS cubre lo necesario |
| Rediseñar datos/lógica (`gate.ts`) | fuera de scope — el dashboard ya lee bien la chain |
| Modo claro | scope; el dark es el contexto de demo. Los tokens lo dejan preparado |
