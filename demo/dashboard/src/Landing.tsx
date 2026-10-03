/**
 * Landing (/) — "historia que baja": hero criollo → problema → primitivas
 * (Credencial/Permiso/Recibo) → flujo atómico → evidencia en timeline →
 * actores → por qué ahora → privacidad/negocio/limitación → CTA a /demo.
 * Todo estático: esta página funciona offline y sin .env.
 */
import { Link } from "./router";
import { Gloss, useReveal } from "./ui";
import {
  ADDRESSES,
  BEATS,
  PROGRAM_ID,
  explorerAddr,
  explorerTx,
  short,
} from "./site";

/* Títulos criollos por beat — la data real (desc/sigs/err) sale de site.ts. */
const BEAT_TITLES: Record<string, string> = {
  "1": "Credencial emitida",
  "2": "Permiso firmado",
  "3": "Pago aceptado",
  "4": "Agente sin credencial → rechazado",
  "5a": "Límite por pago excedido → rechazado",
  "5b": "Servicio no autorizado → rechazado",
  "6": "Revocación en vivo",
};

const PRIMITIVES = [
  {
    icon: "🪪",
    name: "Credencial",
    q: "¿Hay un humano detrás?",
    sub: "attestation SAS",
    body: (
      <>
        Un{" "}
        <Gloss tip="issuer: el verificador que emite (y puede revocar) las credenciales — hace el KYC off-chain">
          verificador
        </Gloss>{" "}
        confirma que hay <b>un humano</b> detrás de la wallet del agente. Solo
        se ve nivel + fecha — <b>nunca datos personales</b>. Y lo puede
        revocar cuando quiera.
      </>
    ),
  },
  {
    icon: "✍️",
    name: "Permiso",
    q: "¿Qué autorizó el dueño?",
    sub: "mandato PDA",
    body: (
      <>
        El dueño firma los límites: <b>cuánto por pago, cuánto por día</b> y a
        qué servicios puede pagarle. Lo puede revocar cuando quiera — los
        contadores de gasto los muta <b>solo el programa</b>.
      </>
    ),
  },
  {
    icon: "🧾",
    name: "Recibo",
    q: "¿Qué pasó?",
    sub: "PaymentReceipt",
    body: (
      <>
        Cada pago deja un <b>recibo público</b>: quién pagó, a quién, cuánto y
        cuándo — con el pedido vinculado. Es la prueba si hay una disputa.
      </>
    ),
  },
];

const ACTORS = [
  {
    who: "Humano / dueño",
    tag: "una vez y listo",
    body: (
      <>
        Se verifica <b>una sola vez</b> con un{" "}
        <Gloss tip="issuer: el verificador que emite (y puede revocar) las credenciales — hace el KYC off-chain">
          issuer
        </Gloss>{" "}
        (KYC off-chain) y firma un permiso on-chain:{" "}
        <i>"mi agente gasta máx $5 por pago, $10 por día, solo a este servicio"</i>
        . Después no toca nada — salvo revocar.
      </>
    ),
  },
  {
    who: "Agente",
    tag: "en cada pago",
    body: (
      <>
        Paga en los servicios que usan la capa. No presenta nada: el programa
        chequea credencial + permiso en la misma transacción. Si algo no
        cierra, <b>la plata nunca se mueve</b> — revierte antes de transferir.
      </>
    ),
  },
  {
    who: "Servicio / merchant",
    tag: "~10 líneas",
    body: (
      <>
        Copia{" "}
        <code>{"createGate({programId, payee, price, mint})"}</code> + ~10
        líneas de handler. Sin cuenta, sin API key, sin permiso —{" "}
        <b>la chain es la API</b>.
      </>
    ),
  },
];

const FLOW = [
  {
    step: "1 · credencial",
    txt: "primero mira la credencial: ¿hay un humano verificado detrás de esta wallet? Falta, vencida o revocada → la tx muere acá",
  },
  {
    step: "2 · permiso",
    txt: "después el permiso del dueño: monto por pago, tope diario, servicio autorizado, vencimiento, revocación — cualquier cosa fuera → revert",
  },
  {
    step: "3 · plata",
    txt: "recién ahí mueve la plata: transferencia de tokens del agente a la cuenta del servicio",
  },
  {
    step: "4 · recibo",
    txt: "y deja el recibo público: la prueba que el servicio verifica para entregar el recurso",
  },
];

const WHY_NOW = [
  {
    k: "El estándar salió sin la capa humana",
    v: "ERC-8004 deployó mainnet el 29/01/2026 — identidad de agente seudónima, cero human-binding. La ventana está abierta.",
  },
  {
    k: "El modelo existe — off-chain",
    v: "Google AP2 definió mandates + receipts como documentos. Un JWT no revierte una transacción; acá son objetos on-chain que el programa exige.",
  },
  {
    k: "El competidor directo es cerrado",
    v: "Skyfire hace KYA con JWTs verificables solo contra sus claves: no consumible por programas on-chain y muere con la empresa. Nosotros somos abiertos e issuer-agnósticos.",
  },
  {
    k: "La regulación lo confirma",
    v: "Filipinas HB 11014, Brasil PL 974/2026, US AI AGENT Act — evidencia de que el problema es real, no la razón de existir. No es un proyecto regulatorio: el ecosistema se resguarda solo, por incentivos de mercado — el merchant exige humano verificado porque no quiere ser estafado. Si la ley nunca llega funciona igual; si llega, mejor una capa open-source corriendo que un registro estatal cerrado.",
  },
  {
    k: "El vacío está verificado",
    v: "~25 proyectos Colosseum adyacentes, 0 winners en esta capa: nadie hizo human-verification exigible dentro del pago mismo.",
  },
];

const PRIVACY = [
  {
    k: "On-chain se ve",
    v: '"hay un humano verificado nivel N detrás de este agente, emitido por issuer X" — nivel, timestamp, estado de revocación. Nada más.',
  },
  {
    k: "On-chain NO está",
    v: "quién es el humano. La identidad real la guarda el issuer off-chain; revelarla exige proceso legal hacia el issuer. Accountability judicial — no trazabilidad masiva ni DNI público.",
  },
];

export default function Landing() {
  const ref = useReveal<HTMLElement>();
  return (
    <main className="wrap" ref={ref}>
      {/* ── 1 · Hero ── */}
      <section className="hero">
        <span className="chip">
          <i className="dot ok"></i>solana{" "}
          <Gloss tip="devnet: la red de prueba pública de Solana — transacciones reales, plata de mentira">
            devnet
          </Gloss>{" "}
          · en vivo
        </span>
        <h1>
          Los agentes ya mueven plata.
          <br />
          <span className="hl">Que alguien responda.</span>
        </h1>
        <p className="lede">
          dnia hace que cada pago de un agente exija — en la misma
          transacción — una{" "}
          <Gloss tip="attestation SAS: credencial on-chain emitida por un verificador">
            credencial
          </Gloss>
          , un{" "}
          <Gloss tip="Mandate PDA: la cuenta del programa que guarda la policy firmada por el dueño">
            permiso del dueño
          </Gloss>{" "}
          y deje un{" "}
          <Gloss tip="PaymentReceipt: recibo público que emite el programa en la misma tx — quién pagó, a quién, cuánto y cuándo">
            recibo público
          </Gloss>
          . Si algo no cierra, la plata nunca se mueve.
        </p>
        <div className="cta-row">
          <Link to="/demo" className="btn primary">
            ▶ Verlo funcionar — 90s
          </Link>
          <Link to="/dashboard" className="btn">
            Auditoría en vivo
          </Link>
        </div>
        <div className="stats">
          <div className="stat">
            <b>6/6</b>
            <span>beats · txs reales devnet</span>
          </div>
          <div className="stat">
            <b>~10</b>
            <span>líneas para adoptar</span>
          </div>
          <div className="stat">
            <b>0</b>
            <span>API keys · permisos · registro</span>
          </div>
        </div>
      </section>

      {/* ── 2 · El problema ── */}
      <section className="fade-up">
        <h2 className="sect">El problema</h2>
        <article className="card">
          <p className="plain" style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
            Hoy un agente con una wallet puede pagar lo que sea, a quien sea —
            y si sale mal, <b>nadie responde</b>. El servicio cobra y no sabe
            si hay un humano detrás, si ese humano autorizó el gasto o cómo
            reclamar después. La chain mueve la plata perfecto; lo que no
            mueve sola es la <b>responsabilidad</b>. dnia es la capa
            que falta: credencial + permiso + recibo, exigidos por el
            programa, no por la buena voluntad de nadie.
          </p>
        </article>
      </section>

      {/* ── 3 · Tres primitivas ── */}
      <section className="fade-up">
        <h2 className="sect">Tres primitivas, una transacción</h2>
        <div className="trio">
          {PRIMITIVES.map((p) => (
            <article className="card lift" key={p.name}>
              <div className="prim-icon">{p.icon}</div>
              <h3 className="prim">{p.name}</h3>
              <p className="prim-q">
                {p.q} · <code>{p.sub}</code>
              </p>
              <p className="plain">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 4 · El flujo atómico ── */}
      <section className="fade-up">
        <h2 className="sect">Todo o nada — en UNA transacción</h2>
        <div className="flow">
          {FLOW.map((f, i) => (
            <div className="flow-step" key={f.step}>
              <div className="flow-head">
                <code>{f.step}</code>
                {i < FLOW.length - 1 && <span className="flow-arrow">→</span>}
              </div>
              <p>{f.txt}</p>
            </div>
          ))}
        </div>
        <p className="note">
          abajo del capó: el programa re-deriva la{" "}
          <Gloss tip="attestation SAS: credencial on-chain emitida por un verificador — se valida owner, PDA, vigencia y nivel">
            attestation SAS
          </Gloss>{" "}
          del agente, lee el{" "}
          <Gloss tip="Mandate PDA: la cuenta del programa que guarda la policy firmada por el dueño — límites, whitelist, expiración">
            Mandate PDA
          </Gloss>{" "}
          del dueño, transfiere al{" "}
          <Gloss tip="ATA (Associated Token Account): la cuenta de tokens del servicio donde cae el pago">
            ATA
          </Gloss>{" "}
          del servicio y emite el{" "}
          <Gloss tip="PaymentReceipt: recibo público que emite el programa en la misma tx — quién pagó, a quién, cuánto y cuándo">
            recibo
          </Gloss>
          . Cualquier check que falla revierte la transacción completa: ni el
          pago ni el recibo existen. <b>La plata nunca se mueve</b> — el
          revert ocurre antes del transfer, no hay nada que devolver ni que
          disputar.{" "}
          <a href={explorerAddr(PROGRAM_ID)} target="_blank" rel="noreferrer">
            programa {short(PROGRAM_ID)} ↗
          </a>
        </p>
      </section>

      {/* ── 5 · Evidencia: los 6 beats como timeline ── */}
      <section className="fade-up">
        <h2 className="sect">La evidencia — 6 beats, signatures reales</h2>
        <p className="plain">
          Corrida canónica post-fix (02/10/2026). Los rechazos son{" "}
          <b>transacciones fallidas reales on-chain</b> — cada línea linkea al
          explorer:
        </p>
        <div className="card wide">
          <div className="timeline">
            {BEATS.map((b) => (
              <div
                className={`tl ${b.result === "ok" ? "ok" : "fail"}`}
                key={b.n}
              >
                <span className="n">beat {b.n}</span>
                <b>{BEAT_TITLES[b.n] ?? b.title}</b>
                <p>
                  {b.desc} {b.err && <code>{b.err}</code>} ·{" "}
                  {b.sigs.map((s) => (
                    <a
                      key={s}
                      href={explorerTx(s)}
                      target="_blank"
                      rel="noreferrer"
                      title={s}
                    >
                      tx ↗
                    </a>
                  ))}
                </p>
              </div>
            ))}
          </div>
          <details>
            <summary>ver tabla completa</summary>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>beat</th>
                    <th>qué pasó</th>
                    <th>resultado</th>
                    <th>signature (devnet)</th>
                  </tr>
                </thead>
                <tbody>
                  {BEATS.map((b) => (
                    <tr key={b.n} className={b.result === "fail" ? "fail" : ""}>
                      <td className="beat-n">{b.n}</td>
                      <td>
                        <b>{b.title}</b>
                        <div className="muted sm">{b.desc}</div>
                      </td>
                      <td>
                        <span
                          className={`verdict ${b.result === "ok" ? "ok" : "bad"}`}
                        >
                          <i></i>
                          {b.result === "ok" ? "CONFIRMADA" : "TX FALLIDA"}
                          {b.err && <em>{b.err}</em>}
                        </span>
                      </td>
                      <td className="sigcell">
                        {b.sigs.map((s) => (
                          <a
                            key={s}
                            href={explorerTx(s)}
                            target="_blank"
                            rel="noreferrer"
                            title={s}
                          >
                            {short(s)}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
        <p className="note">
          fuente: <code>docs/09_DEMO_SUBMISSION.md</code> §3 · upgrade del
          programa (mismo Program ID):{" "}
          <a
            href={explorerTx(
              "5WsEeB132qdZMpiZBioxKvHPJWY3v8T5Mtoo8Fmvo74fzoTDcDZ1uVYkuc2jeA7GjXYWQj63wewskAKZbW9ErFiM"
            )}
            target="_blank"
            rel="noreferrer"
          >
            5WsEeB…rFiM ↗
          </a>
        </p>
      </section>

      {/* ── Direcciones verificables ── */}
      <section className="fade-up">
        <h2 className="sect">Direcciones verificables (devnet)</h2>
        <div className="card wide tablewrap">
          <table>
            <tbody>
              {ADDRESSES.map((a) => (
                <tr key={a.addr}>
                  <td className="muted">{a.label}</td>
                  <td>
                    <a
                      href={explorerAddr(a.addr)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <code>{a.addr}</code>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 6 · Actores ── */}
      <section className="fade-up">
        <h2 className="sect">Tres actores, una vuelta</h2>
        <div className="trio">
          {ACTORS.map((a) => (
            <article className="card lift" key={a.who}>
              <h3 className="prim">{a.who}</h3>
              <p className="prim-q">{a.tag}</p>
              <p className="plain">{a.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 7 · Por qué ahora ── */}
      <section className="fade-up">
        <h2 className="sect">Por qué ahora</h2>
        <div className="whygrid">
          {WHY_NOW.map((w) => (
            <article className="card lift" key={w.k}>
              <h3 className="why-k">{w.k}</h3>
              <p className="plain">{w.v}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 8 · Privacidad ── */}
      <section className="fade-up">
        <h2 className="sect">Privacidad — accountability, no vigilancia</h2>
        <div className="whygrid">
          {PRIVACY.map((p) => (
            <article className="card" key={p.k}>
              <h3 className="why-k">{p.k}</h3>
              <p className="plain">{p.v}</p>
            </article>
          ))}
        </div>
        <p className="note">
          la credencial no te identifica — <b>te habilita</b>: un agente
          verificado accede a mercados que uno anónimo no puede. Y si el
          agente estafa, el rastro público del pago es la feature — el
          merchant lo adopta porque el recibo auditable es su defensa en una
          disputa. Contraste con Skyfire: issuer y verificador viven en su
          servidor privado — una empresa ve todo y la credencial muere con
          ella. Acá la credencial vive en la chain (la verifica cualquiera,
          sin permiso) y el PII queda distribuido donde corresponde.
        </p>
      </section>

      {/* ── 8b · El negocio ── */}
      <section className="fade-up">
        <h2 className="sect">Qué habilita para el negocio</h2>
        <div className="trio">
          <article className="card">
            <h3 className="prim">Defensa real en disputas</h3>
            <p className="prim-q">para el merchant</p>
            <p className="plain">
              Cobrás solo a agentes con humano verificado detrás. Si el agente
              estafa, el recibo on-chain — pagador, payee, monto, mandato,
              timestamp — es tu evidencia.{" "}
              <b>Sin rastro no hay reclamo posible: el rastro es la feature.</b>
            </p>
          </article>
          <article className="card">
            <h3 className="prim">Un mercado que el anonimato no toca</h3>
            <p className="prim-q">para el servicio</p>
            <p className="plain">
              La credencial no identifica — <b>habilita</b>: los agentes
              verificados acceden a lo que los anónimos no pueden. Ser
              gateado es venderle a un segmento con plata real y dueño
              responsable.
            </p>
          </article>
          <article className="card">
            <h3 className="prim">Accountability sin custodia</h3>
            <p className="prim-q">para todos</p>
            <p className="plain">
              Ofrecés agentes verificados <b>sin tocar PII</b>: la identidad la
              guarda el issuer, vos solo leés una cuenta pública. Adoptás
              accountability sin convertirte en custodio de datos de nadie.
            </p>
          </article>
        </div>
      </section>

      {/* ── 8c · Limitación honesta ── */}
      <section className="card wide honest fade-up">
        <h2 className="sect">Limitación honesta (declarada)</h2>
        <p className="plain">
          El gate protege al <b>vendedor</b> que lo usa: un agente siempre puede
          hacer SPL transfers libres por fuera del programa — el gate no
          "encadena" al agente, le cierra la puerta al servicio. Como en el
          mundo real: es el merchant el que exige la credencial.{" "}
          <b>Lo que el gate cobra, el gate lo garantiza.</b>
        </p>
      </section>

      {/* ── 9 · CTA final ── */}
      <section className="center fade-up" style={{ marginTop: "3.5rem" }}>
        <h2 className="sect">Corré la demo</h2>
        <p className="lede">
          90 segundos, devnet real — un botón, seis beats, cuatro reverts
          intencionales que quedan grabados on-chain.
        </p>
        <div className="cta-row">
          <Link to="/demo" className="btn primary big">
            ▶ Correr demo
          </Link>
          <Link to="/docs" className="btn">
            Cómo se adopta
          </Link>
        </div>
      </section>
    </main>
  );
}
