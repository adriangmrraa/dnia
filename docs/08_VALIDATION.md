# Registro de validación
Estado: 1 ENTREVISTA (fundador = ICP), sin más tests todavía
Hipótesis: trabajadores con ingresos reales no formales/no declarables carecen de prueba de ingresos verificable para evaluadores (inmobiliarias, prestamistas, emisores de tarjeta).

## Entrevistas (anonimizadas + consentimiento + fecha)

### E-001 — 01/10/2026 — Fundador del equipo (él mismo es el ICP)
- Perfil: freelance, 28 años, ~10 años trabajando y cobrando en negro (banco + billeteras virtuales), algunas veces en USDC vía Binance. Monotributo desde hace <1 año.
- **Dolor confirmado [VALIDADO n=1]:** "si hace 10 años existiese esto y hubiese recibido mi dinero ahí, hoy tendría un historial grande — no lo tengo". Sin historial crediticio pese a ~10 años de ingresos reales.
- Pregunta del entrevistado: ¿el problema resuelto es acceder a préstamos / comprar casa?
- **Matiz técnico detectado [IMPORTANTE]:** pagos recibidos *dentro* de Binance NO son visibles onchain (ledger interno del CEX). Solo cuentan si se retiran a self-custody o si se prueba el historial vía zkTLS (Reclaim). Posible extensión del producto: anclar también pruebas zkTLS de historiales en Binance/MercadoPago.

## Feedback de usuarios/testers
- E-001 es evidencia fuerte del dolor (el fundador ES el usuario) pero n=1: falta validar lado evaluador (¿una inmobiliaria/prestamista aceptaría el informe?) y más casos.

## Experimentos, observaciones vs inferencias, decisiones
- Observación: dolor real y personal del fundador (observado, no inferido).
- Inferencia pendiente: que evaluadores acepten un informe onchain como prueba — SIN VERIFICAR.
- Pendiente: 1-2 entrevistas más (otros freelancers/informales) + 1 evaluador (inmobiliaria/financiera).
- Acción acordada: el equipo consigue una inmobiliaria o financiera para charlar (compromiso: mañana). Pregunta clave: "¿qué prueba de ingresos aceptás hoy? ¿verificarías un link onchain?"
