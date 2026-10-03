# Propuesta — `ui-redesign`

Estado: **PROPUESTA** — pendiente aprobación humana.

## Qué

Rediseño completo de la interfaz del sitio `demo/dashboard/` (las 5 páginas: `/`, `/dashboard`, `/docs`, `/demo`, `/colaborar`): sistema de diseño propio (tokens, tipografía, componentes), mejor jerarquía visual, motion sutil, y copy más llano — técnico solo donde suma.

## Por qué

El sitio actual usa el tema oscuro genérico de GitHub (`#0d1117`/`#58a6ff`, Segoe UI). El contenido es excelente y la evidencia on-chain es real, pero la presentación:

1. **No tiene identidad propia** — parece un README renderizado, no un producto.
2. **No guía el ojo** — todo pesa igual; el jurado tiene que trabajar para encontrar lo importante.
3. **Habla en jerga** — "attestation SAS PDA", "GateError", "Program data:" como primer contacto excluye a cualquier evaluador no-Solana.
4. **No se siente vivo** — hay datos devnet en tiempo real y la UI no lo comunica.

Para un hackathon donde el sitio ES la vidriera (demo one-click, ledger auditable, landing del pitch), la UI es parte del producto.

## Alcance

- **In:** `demo/dashboard/src/` (index.css, App, Landing, Dashboard, Adoption, Docs, DemoPage, Colaborar), `index.html`, `public/fonts/` nuevo.
- **Out:** contratos on-chain, servicios, lógica de datos (`gate.ts`, `site.ts`, `snippets.ts`, router). El dashboard sigue read-only. Cero dependencias nuevas de runtime — todo CSS + React + fuentes woff2 locales (la demo corre offline, regla vigente).

## Restricciones heredadas

- **Offline-first**: nada de CDN, Google Fonts externas ni paquetes nuevos — las fuentes se descargan como woff2 locales.
- **Copy en español rioplatense** — se mantiene la voz; baja la jerga, no el tono.
- **Honestidad**: no inflar claims ni esconder la "limitación honesta".
- Read-only on-chain: la UI no firma ni escribe nada.

## Verificación

`cd demo/dashboard && npm run build` limpio + revisión visual página por página + checklist de la spec (fase 5 del design).
