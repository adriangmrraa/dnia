# Pool de candidatos — 2da ronda (01/10/2026)

> **Contexto:** búsqueda de 5 candidatos con el mismo estándar que pasó C: corredor concreto con usuarios alcanzables esta semana, Solana esencial (prueba de extracción), plata moviéndose o hecho-verificable como producto, sin lending/capital/token especulativo, demo-able en días.
>
> **Método:** 9 barridos Copilot (API v2, autenticado) sobre espacios candidatos + fetch de detalle de precedentes clave + research web. Resultado transversal: **todo espacio obvio tiene ~10-20 intentos y 0 premios** — la diferenciación no es el protocolo, es el WEDGE (qué corredor concreto lo estrena). Fuentes: docs/SOURCES.md [C32]-[C45].
>
> **Advertencia honesta:** ningún candidato nuevo iguala la combinación completa de C (founder=ICP + mecanismo validado por un winner + demanda documentada). Cada uno pasa los mismos filtros con un perfil de riesgo distinto.

---

## E — VAQUITA CROSS-BORDER: la junta/vaquita como programa, con el primo que vive afuera

**Una frase:** ROSCA (juntas/vaquitas/pasandakus) donde el contrato ES el organizador: N personas aportan USDC por ronda, rotación automática, y la killer feature es que **el miembro que emigró participa igual** — el familiar en España/EE.UU. aporta a la junta de la familia en Formosa sin intermediario de cambio.

**Por qué ahora:** las juntas informales ya existen por todas partes en LatAm; su modo de fallo #1 documentado es el organizador que se fuga con el pozo. La diáspora actualmente queda afuera (no puede aportar ARS cash). USDC elimina la frontera del aporte.

**Extracción Solana:** SÍ. El valor es que nadie custodia el pozo — pool programable con reglas de rotación. Sin chain es "pasale la plata a fulana que organiza", que es exactamente el problema.

**Plata moviéndose en la demo:** 4 wallets aportan USDC a un pool, el programa rota y paga la ronda — visible, en vivo, en 30 segundos.

**Precedentes (10+, 0 premios):** Vaquita Protocol (Radar — literalmente el nombre), Susu Protocol (Frontier — el más serio: curva de colateral dinámica anti-default estratégico, Anchor program con UI), Rotare, Roosta, Circles, ChainPot, InTrust, LoopVault, Poolver, Chord [C38][C41][C43].

**Por qué fallaron / nuestro wedge:** Susu apuntó a pools de DESCONOCIDOS underbanked global → exigió colateral alto (mata al pobre) y mostró solo pitch. Nuestro wedge: **grupos que YA tienen enforcement social** (familia, club, barrio, laburo) — el programa no necesita colateral porque la presión social cobra la cuota; el producto vende el riel + el miembro diáspora. El precedente más cercano (Susu) dejó el hueco: nadie diseñó para la junta familiar existente con un pie afuera del país.

**Riesgos:** enforcement sigue siendo social (el contrato no cobra cuotas — hay que decirlo así); onboarding crypto del grupo local (mitigable: wallet embebida como en C); demanda de "junta con cripto" por validar.

**Validación esta semana:** ¿3 grupos que ya hacen vaquita/junta la usarían con un miembro afuera? Entrevista alcanzable en cualquier familia/barrio.

---

## F — MANO DE OBRA PARA AGENTES: agentes IA pagan humanos verificados por tareas del mundo físico

**Una frase:** el Mechanical Turk invertido — un agente/empresa de IA necesita "un humano en Formosa que fotografíe X / verifique Y / retire Z", postea la tarea con bounty USDC vía x402, un humano con attestation de persona (SAS) la toma, entrega foto con hash+geo, cobra al instante.

**Por qué ahora:** superficie <12 meses — la economía de agentes explotó en 2025-26 (x402 = 39M txs en Solana) y el cuello de botella emergente es el mundo físico: los agentes no tienen cuerpo. La dirección de todos los marketplaces previos fue "humano contrata agente" o "agente contrata agente" — NADIE construyó el riel agente→humano-para-lo-físico.

**Extracción Solana:** SÍ — micropagos por tarea ($0.50-5) solo existen con fees de $0.00025; las attestations SAS prueban "humano verificado cumplió en geo X" sin intermediario de plataforma.

**Plata moviéndose en la demo:** pueden hacer que SU PROPIO agente sea el primer comprador — controlan ambos lados de la demo: agente publica bounty → humano entrega → USDC fluye onchain. Demo end-to-end real, no simulada.

**Precedentes (11+, 0 premios):** HumanLayer (Frontier — marketplace de data-labeling para AI labs con payouts USDC: cubre el trabajo DIGITAL para IA, no el físico), AgentPay, Ayudantech, Prooflink, Proof of Human (detección sybil de wallets, no marketplace), AgentNet, AVN, Reddi Agent Protocol, Signal [C39][C42][C44].

**Por qué fallaron / nuestro wedge:** el cluster satura en "marketplace genérico agente↔humano" y en sybil-detection. Nadie atacó el corredor específico: **agentes que necesitan presencia física puntual** (verificar una obra, fotografiar un inmueble para un modelo, comprobar stock de un almacén, testigos de entrega). Casos de uso iniciales imaginables: datasets de visión geo-específicos, verificación física para marketplaces, inspección remota low-cost.

**Riesgos [HIPÓTESIS principal]:** demanda no probada — ¿los agentes/empresas de IA necesitan ESTO hoy o en 2 años? El lado humano de la oferta existe seguro (micro-trabajo paga poco y ya); la incógnita es el comprador. Mitigación: el equipo puede autogenerar la primera demanda (sus propios agentes).

**Validación esta semana:** ¿3 devs/operadores de agentes pagarían por tareas físicas remotas? Entrevista alcanzable en la red del equipo.

---

## G — FIANZA VIVA: depósito de alquiler en escrow con evidencia attestada

**Una frase:** el depósito de garantía del alquiler va a un escrow USDC; la entrada y salida del inmueble se documentan con fotos attestadas (hash onchain + timestamp + firma mutua inquilino/propietario); la devolución sigue reglas programables, no la buena voluntad del propietario.

**Por qué ahora:** "el propietario no me devolvió el depósito" es dolor universal en Argentina — hoy la prueba es fotos de WhatsApp sin valor y reclamo verbal. Con BUP del contexto inmobiliario informal, una evidencia con timestamp co-firmada cambia la negociación.

**Extracción Solana:** SÍ para el escrow (nadie custodia la plata) + attestations mutuas con timestamp (la evidencia no se puede re-fotografiar ni fechar hacia atrás). La parte que NO resuelve: evaluar daños es humano — el sistema aporta evidencia, no juicio. Hay que venderlo así.

**Plata moviéndose:** depósito real en escrow, liberación programada o disputa con evidencia — demo clara.

**Precedentes:** escrow/checkout genérico saturado (~11: HorizonPay, Solcart, Vigent, Umon, Trustless Work, SHIELD-PAY [C18]); la combinación específica fianza+evidencia-attestada no apareció en los barridos [SIN VERIFICAR exhaustividad].

**Riesgo estructural honesto:** quien decide adoptar es el PROPIETARIO (tiene el poder), pero quien se beneficia es el inquilino — el usuario no es el cliente. El wedge posible: inmobiliarias que cobran por "gestión de garantía documentada" (el escrow les da un producto nuevo que vender) o alquileres temporarios/turísticos donde la plataforma ya media.

**Validación esta semana:** 2 inquilinos + 1 inmobiliaria — ¿la evidencia attestada resuelve algo real o es overhead?

---

## H — PASAPORTE DE TRABAJO zkTLS: reputación portable de plataformas gig

**Una frase:** el repartidor de PedidosYa/Rappi/Uber o el freelancer de Workana genera una credencial verificable de su historial real (rating, viajes, años) probada con zkTLS desde el propio sitio de la plataforma — sin permiso de la plataforma — y la presenta al próximo empleador/plataforma.

**Por qué ahora:** zkTLS (Reclaim) maduró [S31] — por primera vez se puede probar "el sitio de Rappi mostró 4.9★ y 2.300 viajes" sin que Rappi lo permita ni vea. El historial del trabajador hoy muere con cada app; cambiar de plataforma = empezar de cero.

**Extracción Solana:** PARCIAL — zkTLS prueba el dato; el anchor onchain (SAS) lo hace portable y no-revocable por la plataforma. Sin chain es un PDF firmado por nosotros — vale menos pero no cero. Extracción más débil que en C/E/F.

**Precedentes (11+, 0 premios):** Strand, Gig Proof, Lancepoint, skill chain, Chainvolio, ProofWork, Tribe, Ghonsi [C33]. Todos construyeron marketplaces o scores — nadie construyó el PASAPORTE evidence-only (no decidir, solo probar).

**Por qué podría ser distinto:** mismo patrón que separó C del cementerio de lending — los predecesores quisieron ser la plataforma de trabajo; acá el producto es el documento verificable, no el mercado.

**Riesgos:** ¿quién paga? (el trabajador no paga, el verificador quizá — mismo riesgo comercial que C); fragilidad de providers zkTLS [S31]; si las plataformas tapa la API de historial, muere la fuente.

**Nota:** es el candidato más cercano a C en mecanismo — buena redundancia si C cae en validación, mala diversidad si buscan riesgo decorrelacionado.

---

## I — COMPRA COLECTIVA FRONTERIZA: pool de compra grupal con regla all-or-nothing

**Una frase:** grupos que ya organizan compras colectivas por WhatsApp (sneakers, hardware, instrumentos, insumos) fondean un pool USDC con threshold: si se llega al monto → se compra; si no → reembolso automático. El organizador nunca toca la plata.

**Por qué ahora:** Formosa es ciudad fronteriza — la compra grupal informal es realidad cotidiana (traer de afuera por encima de los límites individuales). El modo de fallo actual: la plata junta en la cuenta de una persona (mismo riesgo que la vaquita) y no hay garantía de "si no llegamos devuelvo".

**Extracción Solana:** SÍ — threshold escrow + refund automático es literalmente un smart contract canónico; sin chain el organizador custodia todo.

**Precedentes (el espacio MÁS FINO visto):** Groupshop, Snowball, FlashPool, Solcart — ~4-6 vistos, todos sin premio [C45]. Mucho menos saturado que el resto.

**Riesgos:** fricción aduanera/regulatoria real [SIN VERIFICAR] — courier régimen puerta-a-puerta AR tiene topes; el producto debería arrancar con compras DOMÉSTICAS agrupadas (mayorista local) donde la barrera es menor; demanda por validar (¿la gente organiza compras colectivas suficientemente seguido?).

**Validación esta semana:** encontrar 2 grupos de WhatsApp que ya compraron en conjunto → ¿usarían el pool con refund garantizado?

---

## Cuadro comparativo

| Cand. | Usuario accesible | Extracción | Plata moviéndose | Espacio (intentos/premios) | Riesgo dominante | Novedad superficie |
|---|---|---|---|---|---|---|
| E Vaquita | MUY ALTO (juntas existen ya) | FUERTE | Alta (pool+ronda) | ~10 / 0 | enforcement social no-programable | media |
| F Agente→humano | ALTO (equipo es la demanda) | FUERTE | Alta (x402 por tarea) | ~11 adyacentes / 0 | demanda del agente no probada | ALTA (<12m) |
| G Fianza | ALTO (inquilinos) | MEDIA | Media (depósito) | ~11 escrow genérico / 0 | usuario ≠ cliente | baja |
| H Pasaporte zkTLS | ALTO (gig workers) | MEDIA | Baja (no hay flujo) | ~11 / 0 | ¿quién paga? + fragilidad provider | media |
| I Compra colectiva | MEDIO-ALTO (grupos WhatsApp) | FUERTE | Media (pool+refund) | ~4-6 / 0 | barrera aduanera + demanda | media |

**Lectura:** E y F son los más fuertes — E por corredor cultural concreto con precedente serio que dejó el wedge abierto; F por superficie nueva donde el equipo ES el demand side. Si el criterio es "diversidad de riesgo", F no depende de nada de C; si el criterio es "probabilidad de validación rápida", E tiene usuarios en cada cuadra.
