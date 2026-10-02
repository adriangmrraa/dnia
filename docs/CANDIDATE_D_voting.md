# Candidato D — Votación electoral ciudadana onchain desde el celular

> **Estado:** ANALIZADO — **NO recomendado como candidato** (01/10/2026). Evidencia negativa en las tres dimensiones: precedentes Colosseum, precedentes mundo real, y análisis estructural.
> **Fuentes:** docs/SOURCES.md — Copilot [C23]-[C31], web [S33]-[S37].

---

## 1. La idea en una frase

App web/mobile donde el ciudadano vota en elecciones reales desde el celular; los votos se guardan onchain → inmutables, no centralizados en una DB del gobierno, sin infraestructura física de elecciones, más participación por comodidad.

## 2. Qué afirma la idea vs qué resuelve realmente Solana

| Afirmación implícita | Veredicto | Detalle |
|---|---|---|
| "Nadie puede cambiar mi voto una vez emitido" | PARCIALMENTE CIERTO | El ledger es tamper-evident: un voto registrado no se altera silenciosamente. Pero es la parte FÁCIL de la elección — un hash-chain en DB común + auditoría pública logra lo mismo. |
| "No está centralizado en una DB del gobierno" | FALSO en lo importante | El padrón (quién puede votar) ES y debe ser del Estado. La autoridad electoral decide elegibilidad — no hay forma de descentralizar eso sin romper "una persona un voto". La chain solo replica lo que el registro autorizó. |
| "Evitamos infraestructura y movimiento de personas" | CIERTO pero con costo | Y lo que perdés a cambio: el cuarto oscuro. Votar sin supervisión habilita coerción y compra de voto a escala industrial. |
| "Promueve más participación" | REFUTADO por evidencia [S34] | Park/Specter/Narula/Rivest (MIT, Journal of Cybersecurity 2021): estudios de voto por internet muestran efecto sobre turnout "little to no effect" y puede AUMENTAR disenfranchisement (brecha digital). |

## 3. Los cuatro problemas estructurales (donde muere la idea)

El ledger inmutable es el 5% del problema. El 95% que una blockchain NO resuelve:

1. **Identidad / Sybil.** "Una persona = un voto" exige un registro de elegibles → autoridad central obligatoria. SolVote (Radar) ya lo implementó con KYC + token single-use — y no resolvió nada nuevo: el KYC ES la autoridad central.
2. **Secreto vs verificabilidad.** El voto secreto existe para que NADIE pueda probar cómo votaste (anti compra/coerción). Un recibo criptográfico onchain es literalmente una **prueba vendible** de tu voto — en Argentina, donde "voto cantado" y clientelismo son problemas reales, esto es un acelerante, no una solución. Las soluciones criptográficas reales (MACI, re-voto override de Estonia, FHE/MPC — lo intentaron EnigmaVote, Baloteer, Terra Dourada) son proyectos de investigación, no MVP de 2 semanas.
3. **Endpoint.** Si el celular está comprometido, el malware cambia el voto ANTES de firmarlo — la chain registra fielmente un fraude. Mitad del problema de Voatz fue exactamente esto [S33]: "the ballot is busted BEFORE the blockchain".
4. **Adopción.** El cliente real sería una autoridad electoral. En Argentina la Ley 27.781 (oct-2024) acaba de imponer Boleta Única de PAPEL y el Código Electoral admite tecnología electrónica solo en etapas NO de emisión (art. 33) [S36]. No hay cliente demo-able: no podés mostrar "elección real funcionando" ni pilotear con un gobierno en 10 días.

## 4. Precedentes Colosseum (Copilot, API v2, consultas 01/10/2026)

- **Cluster "Solana-based Decentralized Voting Systems": n=130 proyectos.** Las consultas "citizen voting mobile app onchain elections" y "government election vote integrity" devuelven top-25 íntegramente sin premio: Elec-chain, SolVote (KYC+NFT proof-of-vote — la idea casi exacta), Devos, VoteChain, Votenet DAO, Votify, Xvote, Utopia, IDv2, Terra Dourada (Halo2+post-quantum), EnigmaVote (FHE+zkVM), Baloteer (Telegram+zkCompression+Arcium MPC), ZkVote (zkID), Janamat (civic Nepal), RealSentiment, CivicYield, Mint A Vote, Seekerthon, United Humans...
- **Categoría `governance` completa: 357 proyectos → 6 ganadores totales** (TRACK_PRIZE) + 3 menciones. Los 6 ganadores: Quadratus Protocol (5to DAOs, quadratic voting treasury), LivingIP (4to DAOs&NS, storytelling cNFT), Blonk (5to DAOs&NS, multisig en Telegram), AlphaFC (1ro DAOs&NS, governance de club de fútbol), Echo (2do, DeSci expert network), Superfan (2do Consumer, futarchy music DAO). **Cero es votación electoral ciudadana** — todos son gobernanza de DAOs/clubes/tesorerías.
- **Patrón:** lo que premiaron no es "votar" sino herramientas para comunidades crypto-nativas que YA tienen identidad onchain resuelta (tokens = padrón). En elecciones reales el padrón es justamente lo que no existe onchain.

## 5. Precedentes mundo real (web research 01/10/2026)

| Caso | Qué pasó | Lección |
|---|---|---|
| **Voatz** (EE.UU., usado en elecciones reales WV/Denver/Oregon/Utah) | Análisis MIT/USENIX Security 2020: vulnerabilidades permiten alterar/detener/exponer el voto; adversario pasivo de red podía recuperar el voto secreto; blockchain no protegía el tramo app→servidor. West Virginia lo abandonó [S33][S37] | El único despliegue real a escala terminó en abandono tras auditoría |
| **"Going from Bad to Worse"** (Park, Specter, Narula, Rivest — Journal of Cybersecurity 2021) | Paper canónico: blockchain voting no solo no resuelve los riesgos de internet voting sino que introduce problemas NUEVOS (recibos vendibles = compra de voto a escala). Turnout: sin efecto probado [S34] | El consenso académico es CONTRA — esta idea fue refutada profesionalmente |
| **Estonia i-voting** (el caso exitoso más citado) | Funciona desde 2005 — **sin blockchain**: voto encriptado con PKI, clave de apertura repartida en el comité electoral, posibilidad de re-votar (último voto cuenta, el presencial pisa al digital → mitiga coerción). Requisito: e-ID nacional con 20+ años de adopción [S35] | El éxito depende de infraestructura de IDENTIDAD estatal, no del ledger. El componente "blockchain" no aporta |
| **Argentina** | Ley 27.781 (2024): Boleta Única de Papel obligatoria nacional. Art. 33 CNE: electrónica solo en registro/candidaturas, no emisión. Debates de voto electrónico (BUE CABA 2015, VESD 2015) siempre cayeron por costo/auditabilidad [S36] | La dirección regulatoria real es HACIA el papel, no hacia internet |

## 6. Prueba de extracción

| Pregunta | Respuesta |
|---|---|
| ¿Una DB + auditoría resuelve lo mismo? | Sí para el claim central: un log append-only con hashes públicos da tamper-evidence igual que la chain. El valor diferencial de Solana (sin intermediario) no aplica: la elección NECESITA una autoridad emisora del padrón. |
| ¿Qué hace Solana concreto? | Ancla un tally auditable públicamente. Pero el punto de fallo real (endpoint, padrón, secreto, coerción) está fuera de la chain. |
| Si quitás Solana, ¿muere el producto? | No — Estonia prueba que el sistema funciona sin chain. Y con Solana, el producto sigue igual de roto en lo que importa. **Falla la extracción en ambas direcciones.** |

## 7. Veredicto

**NO ES CANDIDATO.** Triple evidencia negativa:

1. **Colosseum:** ~130 proyectos de votación, 0 premios en votación electoral; la categoría governance entera dio 6 ganadores y ninguno es civic voting.
2. **Mundo real:** el único despliegue serio (Voatz) murió por auditoría; el paper canónico demuestra que blockchain empeora el problema; Argentina legisla hacia papel.
3. **Estructural:** el ledger resuelve la parte fácil y CREA el problema de compra de voto (recibo criptográfico = prueba vendible). El jurado conoce esta idea de memoria — es de las más propuestas y más refutadas del espacio.

### Lo que sobrevive (si les interesa el espacio cívico)

- **Gobernanza de organizaciones no-soberanas** (consorcios, cooperativas, sindicatos, consejos estudiantiles): padrón conocido → identidad trivial; stakes menores → coerción menos crítica. PERO es lo que hicieron SolVote/Votenet/Quadratus — igualmente saturado, y sin plata moviéndose (la meta-lección de docs/03: el jurado premia corredor concreto + usuarios reales + transacciones, y una elección no tiene flujo de dinero).
- **Attestations cívicas / participación no-vinculante** (peticiones, presupuesto participativo, reporte verificable de sentimiento): Janamat/CivicYield lo intentaron sin premio. Mismo techo.
- El mecanismo ganador cercano es **proof-of-personhood** (Humanship ID, 5to cypherpunk): identidad es el cuello de botella real de todo esto — pero es problema de infraestructura estatal, no de app.

### Qué cambiaría el veredicto

Un corredor concreto con demanda HOY: p.ej. "votaciones de consorcios/consorcios de propietarios en CABA" donde haya cuórum bajo documentado y administradores que pagarían por la herramienta. Aún así compite con ~130 precedentes sin premio y con herramientas web2 triviales (Google Forms ya resuelve la confianza en ese contexto — nadie audita un consorcio con blockchain).
