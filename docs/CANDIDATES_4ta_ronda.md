# Pool de candidatos — 4ta ronda ("superficies recién creadas")

- Fecha: 01/10/2026
- Estado: `candidate-pool`. Ninguno aprobado. O queda como el candidato con Gate aprobado (build pausado por decisión del usuario — se retoma cuando indique).
- Eje de esta ronda: superficies que **no existían hace 12-18 meses** — Token-2022 transfer hooks, Seeker+Secure Element, x402/agentic commerce, privacidad auditable.

**Hallazgo transversal [EVIDENCIA]:** el patrón se confirmó otra vez — incluso superficies nuevas tienen ~10-11 intentos y ~0 winners (agent bonds ~11, stocks tokenizados ~11, pay-to-message ~11, sensores/IoT ~11 con un winner de nicho, tickets-NFT ~10, receipts-de-agentes ~11 con Mercantill ganando el vecino enterprise). La diferenciación sigue siendo **corredor concreto + momento + mecanismo que solo ahora se puede**.

---

## P — "La entrada que no se puede revender cara" (Token-2022 transfer hooks)

**La superficie nueva:** Token-2022 transfer-hook extension — reglas de transferencia ejecutadas *por el programa del token*, no por el marketplace. Esto es lo que hizo fracasar a TODA la era NFT-ticketing: las regalías/resale-rules eran bypassables porque el control vivía en el marketplace, no en el activo. Con hooks, la regla va DENTRO del activo — técnicamente imposible de eludir.

**Problema [EVIDENCIA]:** reventa abusiva en Argentina — entradas de recitales/eventos a 3-5x en grupos de IG/Telegram, organizadores y artistas que no ven un peso del mercado secundario, compradores estafados con entradas falsas. Dolor cultural documentado.

**Producto:** entrada como Token-2022 mint con transfer hook programado: solo transferible a ≤precio de cara, regalía automática al artista/organizador en cada reventa, solo canales autorizados. La entrada falsa no puede existir (la provenance es el mint mismo); la entrada cara no puede venderse (el hook revierte el transfer).

**Demo:** comprar entrada → intentar revender a 3x → el programa **revierte la transacción en vivo** → revender a precio → funciona + la wallet del artista recibe regalía. Dos desenlaces, un contrato. Cualquier jurado lo entiende en 30 segundos.

**Por qué Solana:** extracción limpia — Ticketek pone reglas unilaterales fuera del activo (y las rompe o cobra por ellas); acá la regla es estructuralmente inbypasseable y auditable por cualquiera. Plata moviéndose: sí, en cada reventa.

**Precedentes:** ~10 NFT-ticketing en Colosseum (FairTget, Tick3t, ChainPass, EventMint, PassExchange...), 0 winners — **todos pre-transfer-hook, plain NFT**. El mecanismo diferenciador no existía cuando lo intentaron.

**Riesgos honestos:** adopción B2B2C (los organizadores tienen que emitir por acá — wedge: venues independientes/festivales chicos + artistas anti-reventa); no resuelve la venta primaria ni la identidad del portador (¿QRNFC rotativo? diseño de check-in aparte); liquidez del secundario depende del corredor.

**Lectura:** el mejor candidato consumer de esta ronda — mecanismo genuinamente nuevo + dolor visceral + demo dramática.

---

## Q — "Un teléfono real = un claim" (Seeker hardware-bound actions)

**La superficie nueva:** ~150k Solana Seekers despachados (ago-2025) — cada uno con Seeker Genesis Token (soulbound, 1 por dispositivo) + Seed Vault en Secure Element. **Prueba de "acción desde un teléfono real y único" sin KYC ni identidad** — sybil-resistance de hardware, solo existe en Solana.

**Problema [EVIDENCIA]:** cada airdrop/campaña de rewards del ecosistema se desangra por farming sybil — el farmer con 10.000 wallets le saca el incentivo a los usuarios reales. El problema #1 de distribución de tokens. Además: asistencia verificable (POAP con dientes), reviews de "estuve ahí" reales, claims de 1-dispositivo-1-beneficio.

**Producto:** capa de claim hardware-bound — verificar SGT + firma del Secure Element → claim válido. El cliente es el **proyecto Solana que lanza la campaña** (B2B): cada equipo del propio Colosseum que hace airdrop/rewards lo necesita. Secundario: apps consumer con "acciones reales" (asistencia a eventos, check-ins físicos con incentivo).

**Demo:** dos intentos de claim al mismo airdrop — emulador/bot revierte, Seeker firmado por hardware pasa. La diferencia es visible en un segundo.

**Por qué Solana:** la primitiva es 100% Solana-native (SGT + attestation del hardware + programa que la exige). No hay versión web2 de "probar que sos un teléfono real sin decir quién sos" sin confiar en Google/Apple attest (que sí existe — App Attest — pero es cerrado, Apple-only, y no componible con valor).

**Precedentes:** ~11 adyacentes (vaults/auth — Shard-Lock, Seeker Vault, VaultID, HOLDOUT, ARGUS; SOLYD HM-DePIN lealtad), 0 winners directos. Repo OSS `soltag` hace attendance+Secure Element — referencia, no producto coronado.

**Riesgos honestos:** TAM = dueños de Seeker (~150k, crypto-nativos — chico pero denso); depende de Solana Mobile SDK (Mad Lads ecosystem); si el ecosistema de campañas no adopta, queda como librería linda. El cliente real (proyectos con airdrop) es fácil de alcanzar — Colosseum mismo es el canal.

**Lectura:** superficie única-Solana + problema sangrante del ecosistema + acceso directo al cliente vía el propio hackathon. Fuerte.

---

## R — "La factura del agente" (receipts/comprobantes de pagos x402)

**La superficie nueva:** x402 explotó (~39M txs); los agentes ya gastan plata. La capa contable/fiscal **no existe**: no hay chargebacks, no hay recibo estándar, no hay "comprobante" que la empresa puede meter en sus libros.

**Problema [EVIDENCIA+HIPÓTESIS]:** una empresa que deja agentes comprar servicios necesita conciliar: qué pagó, a quién, por qué, con qué autorización — para impuestos, auditoría interna, disputas. Hoy el pago x402 es un pago anónimo con tx signature, sin recibo fiscal ni metadata estructurada.

**Producto:** middleware x402 que emite una **receipt attestation onchain** por cada pago — ligada criptográficamente a la tx signature (como SATI ata feedback a pagos [S46]): quién vendió, quién compró (con credencial O si existe), qué servicio, cuánto, cuándo. Libro contable verificable y exportable — la "factura electrónica de la economía de agentes". AFIP-adjacent en Argentina; para merchants globales = audit trail.

**Demo:** agente paga → attestation de recibo onchain en la misma tx → dashboard muestra el libro de gastos del agente con cada línea verificable. Más aburrido que O pero muy "infra".

**Por qué Solana:** el recibo ligado a la firma de la tx es inherentemente onchain — la contabilidad vive donde vive el dinero; cualquiera puede auditar sin confiar en el contador ni en el facilitator.

**Precedentes:** ~11 adyacentes (Prova, Accural, Settle, DodoArc...), 0 wins directos en "receipts". **Mercantill ganó 4to-Stablecoins** con controles enterprise sobre Squads Grid — la capa vecina coronada, pero es gobernanza interna (multisig/policies), no comprobante fiscal/comercial para terceros.

**Riesgos honestos:** suena a feature de facilitator más que a empresa (riesgo de que MCPay/PayAI lo agreguen como línea de código — mitigación: ser el estándar abierto que todos referencian); adopción depende del mismo pull de O.

**Lectura:** buen complemento/segundo producto de O — juntos forman "la capa de accountability de la economía de agentes". Solo, quizá fino; como suite, fuerte.

---

## S — "El mandato que firmaste" (authorization receipts para agentic commerce)

**La superficie nueva:** AP2/ACP (Google/OpenAI+Stripe, sep-2025) — agentes que compran POR vos con "mandates" firmados. El concepto de autorización-delegada verificable es nativo de esta era.

**Problema:** cuando tu agente compra algo y sale mal, ¿quién responde? El merchant dice "vos autorizaste", vos decís "el agente se pasó". Sin registro verificable del mandato (límite, scope, expiración), no hay disputa resoluble — el precedente legal no existe todavía.

**Producto:** mandato como attestation onchain — el humano firma "mi agente puede gastar hasta $X en categoría Y hasta fecha Z"; cada compra del agente referencia el mandato. La disputa se resuelve mirando si el gasto cayó dentro del mandato — evidencia indiscutible para ambas partes. **Complemento exacto de O:** O prueba quién está atrás; S prueba qué autorizó.

**Demo:** agente compra dentro del mandato → pasa; agente intenta exceder el límite/categoría → el programa revierte. "Mi agente no puede gastar de más ni aunque quiera."

**Por qué Solana:** el mandato como constraint onchain puede ser exigido por el programa de pago — enforcement estructural, no promesa.

**Riesgos honestos:** es un componente más que un producto standalone — encaja como feature de O (la capa de accountability completa = identidad + mandato + recibo). Como candidato solo: fino.

**Lectura:** fuerte como pieza del conjunto de O; débil standalone. Considerar como extensión de O en el pitch ("no solo quién está atrás — qué autorizó").

---

## T — "La suscripción que muere sola" (prepaid access pull-model)

**La superficie nueva:** acceso prepago por período en vez de débito automático — con vencimiento estructural.

**Problema [EVIDENCIA]:** suscripciones zombie — cobros automáticos que la gente olvida cancelar ($ miles de millones en el mundo en suscripciones no usadas). Del otro lado: el servicio que quiere cobrar sin perseguir tarjetas.

**Producto:** acceso prepagado por período — pagás una semana/mes, el acceso vive en el programa, vence solo. Sin cancelación (no hay nada que cancelar), sin tarjeta en archivo, sin "free trial que cobra". Si el servicio quiere renovar, te tiene que convencer de pagar de nuevo — el default es la salida, no la permanencia.

**Demo:** suscripción a un servicio → pago → access token onchain → deadline pasa → acceso revocado automáticamente (no hay cargo sorpresa, no hay trámite). La inversión del modelo: el que cobra tiene que ganar la renovación cada vez.

**Por qué Solana:** la expiración es una regla del programa, no una promesa del comercio — el acceso muere solo, verificable. Con tarjetas el "cancelar" depende de que el comercio/issuer procese tu pedido.

**Precedentes:** subscriptions existen como feature (Helio, Solana Pay), pero el producto "anti-suscripción-zombie" con muerte automática + refund de no-usado como núcleo no aparece coronado [verificación fina pendiente — espacio parcialmente transitado por billing-protocols].

**Riesgos honestos:** el merchant puede preferir el modelo zombie (es literalmente su negocio) — el cliente real es el consumidor, y el corredor serían servicios que ganan reputación por "no somos de esos" (early-stage, communities); débil como empresa sola.

**Lectura:** mecanismo honesto y demo legible; posicionamiento consumer; el modelo de negocio es la parte floja (¿quién paga? quizá merchants "buena leche" como diferenciador).

---

## Ranking preliminar de la ronda

| Candidato | Superficie nueva | Corredor | Extracción | Demo | Diferenciación | Lectura |
|---|---|---|---|---|---|---|
| **P — Entradas anti-reventa** | Transfer hooks Token-2022 | Eventos AR, reventa documentada | Regla dentro del activo | **Alta** (revert en vivo) | Primitiva no existía cuando intentaron | **El más visceral/demoable** |
| **Q — Seeker claims** | SGT + Secure Element | Airdrops/campañas sybil | Prueba hardware→programa | Alta | Único-Solana, sin análogo web2 | Fuerte si hay distribución Seeker |
| **R — Factura del agente** | x402 receipts | Facilitators/empresas | Recibo ligado a tx | Media | Vecino coronado (Mercantill controls), este nicho libre | Complemento de O |
| **S — Mandato verificable** | AP2/ACP mandates | Disputas agentic commerce | Mandato como constraint | Media | Como pieza de O | Feature más que producto |
| **T — Suscripción que muere sola** | Prepaid pull-model | Consumidores zombie-subs | Expiración estructural | Alta | Modelo invertido, merchants "buena leche" | Lindo, negocio flojo |

**Lectura honesta general:** ninguno de estos tiene el paquete completo de O (vacío verificado + timing + rails existentes con pull claro). P y Q son los más diferenciados y demoables; R y S son piezas del mismo puzzle que O (juntos = "accountability completa de la economía de agentes" — posiblemente la narrativa ganadora de un pitch único). T es el más débil en modelo.

**Observación estratégica:** O + R + S podrían ser UN solo producto — "la capa de accountability para pagos de agentes" (identidad + mandato + recibo). Eso sería más denso y más difícil de clonar que cada pieza sola. Vale pensarlo al momento de espec/diseño.
