# Pool de candidatos — 3ra ronda ("otra visión")

- Fecha: 2026-01-30
- Estado: `candidate-pool`. Ninguno aprobado. Ninguno validado.
- Generado por: agente de investigación. Precedentes vía Copilot; mercado vía web pendiente por candidato.

---

## Por qué esta ronda es distinta

El usuario rechazó los 5 de la 2da ronda — que con distancia eran **variaciones del mismo patrón**
(attestation + escrow + reputación). Esta ronda cambia el eje: en vez de generalizar el
mecanismo de C, se exploraron primitivas distintas — plata con propósito fijado, custodia
fuera del intermediario, obligaciones familiares verificables, compra adelantada de
producción, y depósitos de asistencia.

**Hallazgo transversal de los barridos [EVIDENCIA]:** TODO espacio obvio tiene ~10+ intentos
y ~0 winners en Colosseum (voting 130, raffle/VRF ~11, agro/CSA ~11, group-savings ~11,
vouchers ~11, no-show stakes ~11, paramétricos ~11, remesas-con-propósito ~11, tesorerías ~11,
royalties ~11, oráculos ~11). La diferenciación ya no está en el protocolo sino en el
**corredor concreto + momento**. Los winners de betting social (Pregame 1ro Consumer —
apuesta P2P por Blinks; WeLikeSports Winner Frontier — pools parimutuel tipo prode) confirman
que el jurado premia UX/distribución sobre mecanismo, y a la vez dejan ese espacio coronado
(los probables jueces ya premiaron el concepto).

Además — producto de la búsqueda web de esta sesión: **la lección meta más accionable es
corredor-primero**: arrancar donde ya duele el status quo (falla catastrófica documentada,
fricción que ya pagamos en plata o en juicio), no donde blockchain "sería lindo".

---

## Los 5 candidatos de la 3ra ronda

### J — "El fondo que la agencia no puede tocar" (ahorro de grupo con objetivo)

**Problema [EVIDENCIA]:** Los viajes de egresados argentinos son un corredor de ahorro masivo
con falla catastrófica recurrente: las agencias cobran cuotas mensuales durante 1-2 años y
periódicamente quiebran o desaparecen con el fondo (escándalos documentados — familias que
pagaron 15+ cuotas y se quedaron sin viaje y sin plata). La misma estructura de falla existe
en casamientos, cooperativas de vivienda informal y vaquitas-con-destino.

**Producto:** fondo compartido donde el intermediario **nunca custodia**. Cada familia aporta
su cuota USDC (registro por familia — sabés quién está al día); la liberación es por hitos
verificados: "vuelos comprados" (constancia → libera tramo), "hotel reservado" → libera tramo.
Si la agencia incumple → refund automático del resto. La agencia recibe plata contra evidencia,
no contra promesa.

**Por qué Solana:** extracción limpia — el punto entero es que la custodia no la tiene el
agente. Un fintech normal lo haría custodiando la plata (regulación de fondos, licencia,
balance sheet). Acá el programa custodia; la app es una interfaz. Distinto del vaquita de la
ronda anterior: el pozo no rota entre miembros — se libera contra hitos a un proveedor.

**Precedentes Copilot:** ~11 intentos de savings-goals (Savings Ladder, SafeNudge, jarfi,
Dily, ShareApp, Fund Together App), 0 premios. Ninguno apuntó al corredor
"custodia-fuera-del-intermediario-con-hitos" — son apps de ahorro genéricas.

**Demo plausible:** dos wallets-familia + una agencia falsa; aportes mensuales; hito "vuelos"
con constancia subida → release parcial en vivo. Story visceral.

**Riesgos honestos:**
- La agencia puede resistirse: su flujo de caja ES su modelo de negocio. Cliente real ≠ solo
  las familias — probablemente hay que venderle la transparencia como ventaja competitiva a
  agencias nuevas/chicas.
- Legal: coordinar fondos de terceros puede rozar regulación (intermediación financiera).
  Mitigación: programa non-custodial + agencia como beneficiario declarado — chequear.
- Ciclo de validación largo (un viaje de egresados dura 18 meses) — el piloto real podría ser
  un evento corto (casamiento, quinta, gira de estudio de un club).

**Veredicto preliminar:** fuerte en narrativa y demo; el wedge depende de que UNA agencia
acepte operar así — validable en 2 llamadas.

---

### K — "Responsabilidad verificable" (obligaciones familiares onchain)

**Problema [EVIDENCIA parcial + HIPÓTESIS]:** La cuota alimentaria es un desastre de
evidencia en LatAm: el que paga dice "pagué en efectivo", la que recibe dice "no me pagó",
y el juzgado se arma de capturas de transferencia falsificables. El mismo patrón de
"prueba de sostenimiento" aparece en visas/patrocinios (el sponsor debe demostrar que mantiene
a un familiar) y en reclamos laborales informales.

**Producto:** registro de obligaciones con pago integrado. El obligado define la cuota
(monto, día); cada pago USDC queda anclado al compromiso (Solana Pay `reference`) — registro
inalterable, visible para ambas partes y exportable como constancia para juzgado/embajada.
Sin custodia: los pagos van directo obligado → receptor; el programa solo anota el compromiso
y vincula los pagos.

**Por qué Solana:** la prueba de pago aislada la da cualquier banco — el valor onchain es que
el registro **no lo controla ninguna de las dos partes** ni el banco del pagador (que el
receptor no puede auditar). Ambos lados obtienen verdad compartida sin confiar en el otro ni
en un tercero. La constancia exportable la verifica cualquiera sin pedirle permiso a la app.

**Precedentes Copilot:** barrido "child support / alimony / family court" devolvió **ruido
semántico** (freelance markets, identity) — el corredor real parece **no transitado**
[SIN VERIFICAR exhaustivamente].

**Demo plausible:** compromiso registrado → pago → constancia PDF/link verificable onchain en
segundos. El "tribunal test" = mostrar la constancia a un abogado de familia real.

**Riesgos honestos:**
- El que paga en efectivo para evadir no va a adoptar — el cliente real es **el receptor**
  (quiere evidencia) o el pagador cumplidor (quiere protegerse). Producto con adopción de un
  solo lado del conflicto — el otro lado tiene incentivo de NO usarlo. Riesgo estructural
  similar al de fianza-viva de la ronda 2.
- Contexto judicial: una constancia onchain no es prueba automática — valor probatorio real
  depende de pericia. El wedge honesto = organización privada + evidencia inicial.
- Sensibilidad altísima del dominio (conflicto familiar) — el MVP debe ser neutro, no "arma".

**Veredicto preliminar:** corredor casi vacío + dolor documentado + demo clara; el riesgo
estructural (una parte no quiere evidencia) es el núcleo a validar.

---

### L — "Plata con propósito fijado" (vouchers de uso restringido)

**Problema [EVIDENCIA]:** La ayuda en plata tiene dos fallas opuestas: cash libre se puede
usar para otra cosa (lo que el donante/programa teme), y canastas/bonos físicos son caros,
estigmatizantes y logísticos. Programas municipales de alimentación, comedores, ONG de ayuda
alimentaria y hasta remesas familiares "para mercadería" comparten el mismo deseo:
**plata que solo se puede gastar en lo previsto**.

**Producto:** voucher USDC con propósito programado onchain: el programa/donante emite crédito
canjeable únicamente en merchants del whitelist (almacenes adheridos, por categoría MCC o por
lista de wallets). El beneficiario gasta libremente *dentro* del set; el emisor ve redención
y destino agregado sin exponer identidades. No es pago de factura puntual (remesa-bound de la
ronda 2): es **crédito gastable con reglas** — más flexible para el beneficiario.

**Por qué Solana:** la restricción es una regla del programa, no promesa de una app — el
voucher literalmente no puede ejecutarse en un merchant no aprobado. Extraction: una DB no
puede impedir el gasto, solo registrarlo.

**Precedentes Copilot:** ~11 voucher/aid-ish (Unify Giving — plataforma de donaciones;
FOODWARE; Voucher_Shop; BulkCredit HM-Stablecoin), 0 winners en el corredor
"whitelist-de-merchants para ayuda". El concepto madre (restricted-use money) no está
coronado.

**Demo plausible:** un "almacén" (wallet) whitelisted + uno que no; voucher que paga en el
primero y **revertido** en el segundo — el demo se explica solo.

**Riesgos honestos:**
- Necesita merchants adheridos → arranque de dos lados (clásico de payments). Wedge posible:
  UN comedor/ONG + 2-3 almacenes de barrio en piloto cerrado.
- UX del beneficiario: gente en situación de asistencia puede no tener wallet — necesita
  abstracción total (embedded wallet, NFC/QR físico).
- Riesgo de narrativa: "plata con condiciones" puede leerse paternalista — el diseño debe ser
  dignidad-primero (mercado amplio, categorías amplias).

**Veredicto preliminar:** primitiva diferente de verdad (dinero programable, no attestation);
el piloto necesita un programa de ayuda aliado — validable si el equipo tiene contacto
municipal/ONG.

---

### M — "Comprá la cosecha antes" (preventa de producción)

**Problema [EVIDENCIA parcial + HIPÓTESIS]:** El pequeño productor financia la cosecha con
deuda cara o vendiendo anticipado a acopiadores en condiciones malas. Del otro lado,
consumidores urbanos y la diáspora querrían comprar directo "la cosecha de la chacra de
Fulano" — pero el productor no tiene cómo recibir anticipos ni comprometer entrega.

**Producto:** preventa de lote: el productor lista "mi cosecha de mandioca/limón de junio,
lotes de X kg a $Y"; compradores pagan anticipo USDC que queda en escrow del programa.
Liberación escalonada por hitos attestados (siembra → cosecha → despacho con remito/georef).
Si el hito falla, refund proporcional automático. **No es crédito** — el productor no devuelve
plata, entrega mercadería; es compra adelantada, legalmente distinto (esquiva la trampa
lending que mató a AgroCredit de la ronda 2).

**Por qué Solana:** escrow condicional multi-parte + milestones verificables + pagos
internacionales del comprador (diáspora que quiere "su chacra") — el anti-patrón fintech es
exactamente la alternativa (custodiar anticipos = ser acopiador regulado).

**Precedentes Copilot:** ~11 agro (FarmLoop, AgroToken, Mazra'at, AgriVerse, Sow, Seedlot,
Tru Market, AgroRWA, MUNCH), 0 wins — pero casi todos tokenizaban el **campo** (RWA de
tierra) en vez de hacer la preventa simple de **mercadería** entre personas. El wedge
"forward-purchase consumidor↔productor" parece no transitado [SIN VERIFICAR fino].

**Demo plausible:** productor lista lote → 2 compradores prepagan → hito "cosecha" attestado
con foto/geo → release parcial → "entrega" → release final.

**Riesgos honestos:**
- Logística real (frío, entrega, calidad) es un negocio de supply-chain, no solo contrato —
  el piloto debe usar producto no-perecedero o entrega local.
- Oracle de hitos: ¿quién attesta "sembró"? Wedge honesto = auto-attestation del productor +
  comprador acepta riesgo visible, o inspector comunitario.
- Demanda de anticipos: productores reales pueden preferir el acopiador (liquidez total ya).
  La diferenciación = mejor precio + compradores que el acopiador no alcanza (diáspora).

**Veredicto preliminar:** corredor vacío + Formosa-real + mecanismo legalmente limpio; la
logística es la variable a acotar en el MVP (lote no-perecedero, entrega local).

---

### N — "El turno que duele" (seña anti-inasistencia)

**Problema [EVIDENCIA]:** Ausentismo a turnos: en consultorios/servicios reservables es del
orden de ~20-30% y hoy se combate con señas por transferencia manuales (devoluciones a mano,
"te lo devuelvo si venís") o multas informales inaplicables.

**Producto:** turno con depósito programado: el paciente deja stake USDC al reservar; al
asistir, check-in por QR en el consultorio → release inmediato (o descuento del total).
No-show → el stake se libera al consultorio (parcial o total según anticipación de aviso —
cancelar con 24h devuelve todo). El consultorio no toca la plata hasta el evento; el paciente
ve la regla antes de pagar — sin sorpresas.

**Por qué Solana:** stake + release condicional + ventana de cancelación son reglas
ejecutables, no una promesa del consultorio ni un cupón. Extraction: mercado de turnos con
DB propia = el consultorio custodia la seña (trust exactamente en quien cobra la multa).

**Precedentes Copilot:** ~11 (BeThere, commit, Interval, Stakes, Stakery, ForgeFi,
Safe Staker...), 0 wins — el mecanismo existe como patrón pero el corredor
consultorio/servicios reservables en español no aparece coronado.

**Demo plausible:** reserva con stake → dos desenlaces en vivo (check-in QR = devuelve;
timeout = libera al consultorio). Legible para cualquier jurado.

**Ventaja injusta del equipo [HIPÓTESIS]:** el equipo tiene contexto dentalogic (SaaS de
turnos/odontología) — posible corredor real con usuarios existentes, acceso a ICP que otros
equipos no tienen.

**Riesgos honestos:**
- Depende de que el consultorio tenga pacientes que acepten USDC (onramp necesario — la seña
  en pesos por rampa con costo/fricción).
- Competencia: cualquier agenda SaaS puede agregar "seña por MP" sin blockchain — la
  diferenciación real = regla no-unilateral + auditabilidad, modesta.
- Producto más simple/chico que C — quizá feature más que empresa.

**Veredicto preliminar:** mecanismo honesto + acceso directo a ICP real; alcance modesto —
buen segundo, difícil que sea "la gran idea".

---

## Ranking preliminar (toda la ronda, no aprobación)

| Candidato | Corredor | Solana | Plata/verdad | Acceso a usuarios | MVP/Demo | Diferenciación | Lectura |
|---|---|---|---|---|---|---|---|
| **J — Fondo de objetivo** | Agencias/ahorro colectivo con historia de fraude | Custodia fuera del intermediario | USDC en fondo + hitos | Media (familias en cuadra; agencias por convencer) | Alta | Alta (nadie hizo custody-out) | **El más jugoso de la ronda** |
| **K — Obligaciones familiares** | Juzgado/visa/domésticas | Registro neutro compartido | USDC + constancia | Alta (dolor en cada familia) | Media | Corredor vacío | Fuerte pero asimétrico (un lado no quiere evidencia) |
| **L — Voucher restringido** | Ayuda social/beneficiarios | Dinero programable real | USDC con reglas | Media-baja (necesita programa aliado) | Alta | Primitiva distinta | Potente si hay contacto municipal/ONG |
| **M — Preventa cosecha** | Productor-comprador | Escrow + hitos | USDC anticipo | Media (Formosa agro real) | Media | Vacío (todos tokenizaban tierra) | Diferenciado, logística = riesgo |
| **N — Seña de turno** | Consultorios | Stake-condicional | USDC stake | Alta (dentalogic) | Alta | Baja (mecanismo repetido, corredor propio) | Buen piloto, alcance chico |

**Lectura honesta:** ninguno junta todavía el paquete completo de C (founder-es-ICP +
mecanismo validado por un winner + dolor de exclusión documentado). Pero J tiene la mejor
historia del pool (fraude catastrófico documentado, custodia=el punto) y K/M son corredores
que la búsqueda muestra **realmente vacíos** (a diferencia de la ronda 2, donde todo era
"variante de algo probado"). Los 3 necesitan validación de corredor (hablar con agencia /
receptor de cuota / programa de ayuda) antes que nada.

**Siguiente paso propuesto:** no elegir todavía — una semana de "corredor test" para los 3
top: 1 conversación con una agencia de viajes (J), 1 con alguien que paga/cobra cuota (K),
1 con un comedor/ONG municipal (L). La idea que sobreviva la realidad del corredor gana.
