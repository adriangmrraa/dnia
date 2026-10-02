/**
 * Landing (/) — el pitch hecho visual: qué es, las 3 primitivas, el flujo
 * atómico de `pay`, la evidencia devnet real (signatures → explorer) y
 * por qué ahora. Todo estático: esta página funciona offline y sin .env.
 */
import { Link } from "./router";
import {
  ADDRESSES,
  BEATS,
  PROGRAM_ID,
  explorerAddr,
  explorerTx,
  short,
} from "./site";

const PRIMITIVES = [
  {
    icon: "①",
    name: "Identidad",
    q: "¿Quién está atrás?",
    body: (
      <>
        Attestation <b>SAS real</b>: un issuer verifica que hay un humano
        detrás de la wallet del agente. Divulgación selectiva — solo expone
        nivel + timestamp, <b>nunca PII on-chain</b>. Revocable por el issuer.
      </>
    ),
  },
  {
    icon: "②",
    name: "Mandato",
    q: "¿Qué autorizó?",
    body: (
      <>
        PDA firmado por el owner: máximo por tx, cap diario, whitelist de
        payees, expiración, revocable. Los contadores de gasto los muta{" "}
        <b>solo el programa</b>.
      </>
    ),
  },
  {
    icon: "③",
    name: "Recibo",
    q: "¿Qué pasó?",
    body: (
      <>
        <code>PaymentReceipt</code> (7 campos) emitido por el programa en la
        misma tx: pagador, payee, monto, mint, invoice, mandato, timestamp.
        Evidencia auditable para siempre.
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
        Se verifica <b>una sola vez</b> con un issuer (KYC off-chain) y firma
        un mandato on-chain:{" "}
        <i>
          "mi agente gasta máx $5/tx, $20/mes, solo a estos servicios"
        </i>
        . Después no toca nada — salvo revocar.
      </>
    ),
  },
  {
    who: "Agente",
    tag: "en cada pago",
    body: (
      <>
        Paga en los servicios gateados. No presenta nada: el programa chequea
        attestation + mandato en la misma tx. Si algo no cierra,{" "}
        <b>la plata nunca se mueve</b> — la tx revierte antes del transfer.
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
    step: "1 · attestation",
    txt: "el programa re-deriva la PDA SAS del agente y la lee — falta, vencida o revocada → revert",
  },
  {
    step: "2 · mandato",
    txt: "lee el Mandate PDA del owner — monto > máx/tx, cap diario excedido, payee fuera de whitelist, vencido o revocado → revert",
  },
  {
    step: "3 · transfer",
    txt: "recién ahí mueve la plata: SPL transfer USDC-test agente → servicio",
  },
  {
    step: "4 · recibo",
    txt: "emite PaymentReceipt — la evidencia que el servicio verifica para entregar el recurso",
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
  return (
    <main className="wrap">
      {/* ── Hero ── */}
      <section className="hero">
        <p className="chip">solana devnet · Anchor 1.2.0</p>
        <h1>
          Pagos de agentes con <span className="hl">accountability exigible</span>{" "}
          on-chain
        </h1>
        <p className="lede">
          Hoy los agentes mueven plata y nadie responde por ellos. agentic-dni
          es la capa donde <b>identidad, autorización y recibo son exigidos por
          el programa</b> — en la misma transacción que mueve la plata. Sin
          credencial válida o sin mandato que cubra el pago:{" "}
          <b>la tx revierte</b>.
        </p>
        <div className="cta-row">
          <Link to="/dashboard" className="btn primary">
            Ver la auditoría en vivo →
          </Link>
          <Link to="/docs" className="btn">
            Cómo se adopta
          </Link>
          <Link to="/demo" className="btn">
            Correr la demo
          </Link>
        </div>
      </section>

      {/* ── Tres primitivas ── */}
      <section>
        <h2 className="sect">Tres primitivas, una instrucción <code>pay</code></h2>
        <div className="adopters trio">
          {PRIMITIVES.map((p) => (
            <article className="card" key={p.name}>
              <h3 className="prim">
                <span className="prim-icon">{p.icon}</span> {p.name}
              </h3>
              <p className="prim-q">{p.q}</p>
              <p className="plain">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cómo se usa ── */}
      <section>
        <h2 className="sect">Cómo se usa — tres actores, una vuelta</h2>
        <div className="adopters trio">
          {ACTORS.map((a) => (
            <article className="card" key={a.who}>
              <h3 className="prim">{a.who}</h3>
              <p className="prim-q">{a.tag}</p>
              <p className="plain">{a.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Flujo atómico ── */}
      <section>
        <h2 className="sect">
          El flujo atómico — todo o nada en UNA transacción
        </h2>
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
          Cualquier check que falla revierte la transacción completa: ni el
          pago ni el recibo existen. <b>La plata nunca se mueve</b> — el
          revert ocurre antes del transfer, no hay nada que devolver ni que
          disputar. Eso es lo que un programa on-chain hace y un middleware
          no puede. La autorización no es un documento que el merchant mira —
          es una regla que el programa ejecuta.{" "}
          <a href={explorerAddr(PROGRAM_ID)} target="_blank" rel="noreferrer">
            programa {short(PROGRAM_ID)} ↗
          </a>
        </p>
      </section>

      {/* ── Evidencia: los 6 beats ── */}
      <section>
        <h2 className="sect">
          La demo corrió en devnet — 6 beats, signatures reales
        </h2>
        <p className="plain">
          Corrida canónica post-fix (02/10/2026). Los rechazos son{" "}
          <b>transacciones fallidas reales on-chain</b> — cada línea linkea al
          explorer:
        </p>
        <div className="card wide tablewrap">
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
                    <span className={`verdict ${b.result === "ok" ? "ok" : "bad"}`}>
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
      <section>
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

      {/* ── Por qué ahora ── */}
      <section>
        <h2 className="sect">Por qué ahora</h2>
        <div className="whygrid">
          {WHY_NOW.map((w) => (
            <article className="card" key={w.k}>
              <h3 className="why-k">{w.k}</h3>
              <p className="plain">{w.v}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Privacidad ── */}
      <section>
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

      {/* ── El negocio ── */}
      <section>
        <h2 className="sect">Qué habilita para el negocio</h2>
        <div className="adopters trio">
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

      {/* ── Honestidad ── */}
      <section className="card wide honest">
        <h2 className="sect">Limitación honesta (declarada)</h2>
        <p className="plain">
          El gate protege al <b>vendedor</b> que lo usa: un agente siempre puede
          hacer SPL transfers libres por fuera del programa — el gate no
          "encadena" al agente, le cierra la puerta al servicio. Como en el
          mundo real: es el merchant el que exige la credencial.{" "}
          <b>Lo que el gate cobra, el gate lo garantiza.</b>
        </p>
      </section>
    </main>
  );
}
