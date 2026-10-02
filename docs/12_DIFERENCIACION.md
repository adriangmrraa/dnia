# Por qué dnia es distinto — análisis vs Colosseum

> Posicionamiento frente a los ~25 proyectos Colosseum adyacentes y los
> productos de mercado. Fuentes: `docs/03_COMPETITORS.md` §O,
> `docs/04_RESEARCH_GATE.md`, `docs/SOURCES.md`.

## 1. El panorama: el espacio existe, nadie lo resolvió

La idea "agentes con identidad/accountability" fue intentada **~25 veces**
en Colosseum. Cero premios. La lista completa está en `03_COMPETITORS.md`;
los patrones de por qué fallaron:

| Patrón que intentaron | Ejemplos | Por qué no resolvió el problema |
|---|---|---|
| Passport/registry de agente | Parakletos, NomadPass, Agent Trust, Verun | Identidad **autodeclarada** — el agente dice quién es; nadie verificó que haya un humano atrás |
| KYC como gestión propia | Regent Protocol, MinKYC, Krexa | El dueño se verifica a sí mismo para SU uso — no es una credencial que terceros puedan exigir |
| Gate de pagos por config | AgentGate, Sentinel, Aperture | Policy del dueño sí, pero la "identidad" es una variable de config — sin binding a humano verificado |
| Custodia de claves | Agent-Cred, Bonded, Agent Keys | Resuelven *custodia* (quién tiene la key), no *responsabilidad* (quién responde) |
| Pitch sin demo | Skillmarkdown y la mayoría | Video a cámara, nada verificable en la chain |

**Lo que Colosseum sí premió en este espacio fueron los rieles:**
MCPay (1ro Stablecoins — pay-per-call x402) y Latinum (1ro AI — middleware
de pagos agent-to-service). Es decir: el jurado ya validó que la tubería de
pagos de agentes importa. Lo que nadie construyó es **la cerradura**: quién
puede pasar por esa tubería y bajo qué autorización.

Esa cerradura es dnia.

## 2. La diferencia técnica real (no retórica)

La mayoría de los proyectos anteriores ponen la verificación **alrededor**
del pago — un servidor web que chequea algo y decide. dnia pone la
verificación **dentro** del pago:

```text
pay(agent, monto, servicio) — una sola transacción atómica:
  1. el programa re-deriva y lee la attestation SAS del agente
     (credencial pública emitida por un issuer verificado)
  2. lee el mandato PDA firmado por el owner (límites, whitelist, expiry)
  3. transfiere USDC
  4. emite PaymentReceipt
  → si 1 o 2 fallan, la transacción entera REVIERTE
```

Consecuencias que ningún adyacente puede decir:

- **La credencial es consumible por programas.** Un JWT de Skyfire no puede
  ser verificado dentro de un programa Solana sin oráculo. Una attestation
  SAS es una cuenta on-chain: cualquier programa la lee sin permiso de
  nadie. Eso habilita enforcement económico — no "el merchant eligió
  verificar", sino "el protocolo no deja pasar el pago".
- **Los reverts son evidencia pública.** En nuestra corrida canónica hay 4
  transacciones **fallidas reales** en devnet con su `Error Code` visible en
  el explorer (`AttestationMissing`, `OverPerTxLimit`,
  `PayeeNotWhitelisted`, `MandateRevoked`). Cualquier jurado puede clickear
  y ver al programa rechazando — no es una slide, no es un mock.
- **El humano no está en la chain.** La attestation expone nivel + issuer +
  timestamp + estado de revocación — nunca PII. La identidad real la guarda
  el issuer; revelarla requiere proceso legal al issuer. Accountability
  judicial, no vigilancia masiva.

## 3. La diferencia de modelo: abierto vs cerrado

| | Skyfire KYA | ERC-8004 | dnia |
|---|---|---|---|
| Humano verificado detrás del agente | ✅ | ❌ (seudónimo, NFT) | ✅ |
| Verificable por terceros sin cuenta | ❌ (API key + suscripción) | ✅ | ✅ |
| **Exigible dentro de un programa on-chain** | ❌ (JWT off-chain) | ❌ | ✅ |
| Sobrevive al emisor | ❌ (muere con la empresa) | ✅ | ✅ |
| Complementa a los rails x402 | parcial | identidad base | ✅ (somos la human layer que 8004 omite) |

ERC-8004 salió a mainnet el 29/01/2026 con autores de Google/Consensys —
resolvió identidad seudónima de agente y su spec **omite explícitamente el
binding a humano**. No competimos con el estándar: somos la capa que le
falta.

## 4. Adopción cero fricción — demostrada, no prometida

El segundo modo de fallar en infra es exigir onboarding. dnia no exige
nada:

- **Sin cuenta** con el protocolo, **sin API key**, **sin permiso** — el
  programa, el schema SAS y el mint ya están desplegados y públicos en
  devnet. La chain es la API.
- El adoptante agrega `createGate({programId, payee, price, mint})` +
  ~10 líneas (`demo/services/gate-check.ts`). Dos niveles: soft (middleware
  chequea attestation por RPC) y routed (cobrar por el programa).
- `demo_adoption.sh` corre el ciclo completo en vivo: un servicio nuevo se
  suma → su primer pago rebota `PayeeNotWhitelisted` (el **owner** decide,
  no el servicio) → el owner lo whitelistea → mismo pago, 200 + recibo.
- El 402 que devuelve el servicio es x402-shaped: encaja en el flujo que
  MCPay/Latinum/PayAI ya construyeron — somos un hook, no un rewrite.

## 5. Por qué es útil de verdad (hoy, no en 2030)

**El problema existe ahora:** los agentes pagan con las credenciales de sus
dueños y nada en una request distingue agente de humano ni dice quién lo
autorizó (formalizado en IETF draft AIP). Para un merchant o facilitator
eso se traduce en: fraude sin contraparte, chargebacks sin defensa, y
liability sin ancla.

- **Merchant:** "solo cobro a agentes con humano verificado + mandato que lo
  cubre" → el recibo on-chain es su evidencia en una disputa.
- **Facilitator x402:** un hook en verify/settle — su oferta a merchants se
  fortalece ofreciendo rails con accountability.
- **Owner:** firma un mandato y su agente es aceptado en todos los
  servicios gateados — la credencial es su "costo de existir".
- **Regulación:** Filipinas HB 11014, Brasil PL 974/2026 y el draft US AI
  AGENT Act ya proponen exactamente esto (credencial verificable
  criptográficamente, binding a persona jurídica). Es tailwind, no motor:
  el producto funciona por incentivos económicos hoy; si la ley llega, la
  capa ya está corriendo.

## 6. Honestidad de scope (lo que NO decimos)

- El gate protege a los servicios que **optan por usarlo** — un agente
  siempre puede hacer transfers SPL libres fuera del gate. No vendemos
  enforcement protocol-wide.
- El issuer del demo es **mock** — la capa se demuestra, el KYC real
  (Persona/Veriff-class) es integración post-hackathon.
- Cold-start es el riesgo real: una credencial que nadie exige no vale.
  Por eso la condición post-demo del research gate es hablar con ≥1
  facilitator (PayAI/MCPay/Corbits) — demanda aún no validada y no lo
  afirmamos.
- El recibo es un evento de programa (no PDA) en el MVP; `update_mandate`,
  bridge 8004 y auditoría mainnet están en `docs/10_ROADMAP.md`.

## 7. La frase

> Los rails de pagos para agentes ya ganaron premios — MCPay, Latinum. Lo
> que nadie construyó es quién puede pasar por esos rails. dnia es la
> cerradura: una credencial pública de humano-verificado que los programas
> Solana pueden **exigir** dentro de la misma transacción que mueve la
> plata — abierta, sin cuenta, sin API key, y con los reverts visibles en
> el explorer.
