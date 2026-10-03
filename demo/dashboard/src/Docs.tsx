/**
 * Docs (/docs) — la historia de adopción: quién adopta, qué hace y qué NO
 * necesita; la integración real (snippet literal de service-z); los niveles
 * de adopción y la fricción honesta que queda.
 * Fuente: docs/CANDIDATE_O_agentic-dni.md §12-§13 + docs/11_PRESENTACION.md §2/§5.
 * Estática — funciona sin servicios levantados ni .env.
 */
import { Link } from "./router";
import { CodeBlock, Gloss, useReveal } from "./ui";
import { GATE_CHECK_SRC, SERVICE_Z_SNIPPET, SERVICE_Z_SRC } from "./snippets";

const ACTORS = [
  {
    who: "Servicio / merchant",
    tag: "~10 líneas",
    does: (
      <>
        Responde{" "}
        <Gloss tip="HTTP 402 Payment Required: el servicio contesta «pagá primero» con los requisitos del pago">
          402
        </Gloss>{" "}
        con los requirements y verifica el{" "}
        <Gloss tip="PaymentReceipt: recibo público que emite el programa en la misma tx — quién pagó, a quién, cuánto y cuándo">
          PaymentReceipt
        </Gloss>{" "}
        on-chain — <code>{"createGate({programId, payee, price, mint})"}</code>{" "}
        + ~10 líneas de handler. service-z (:3405) quedó gateado solo con eso.
      </>
    ),
    notNeeds: "Registro, API key, SDK propietario, permiso del gate.",
  },
  {
    who: "Facilitator / router x402",
    tag: "hook de settle",
    does: (
      <>
        El mismo verify como hook de settle en su flujo 402: parsea{" "}
        <code>Program data:</code> de la tx y exige payee/mint/monto/invoice
        propios. Es el punto de integración natural (PayAI, MCPay-class).
      </>
    ),
    notNeeds: "Nada extra — es una lectura RPC cualquiera.",
  },
  {
    who: "Owner del agente",
    tag: "una tx y listo",
    does: (
      <>
        Una tx <code>init_mandate</code> con la policy (máx/tx, cap diario,{" "}
        <Gloss tip="whitelist: la lista de payees que el dueño firmó dentro del mandato — el programa rechaza cualquier otro">
          whitelist
        </Gloss>{" "}
        de payees, expiry) y <code>revoke_mandate</code> cuando quiera. En la
        demo:{" "}
        <code>
          owner.ts init-mandate --agent a --max 5 --cap 10 --payees x
        </code>
        .
      </>
    ),
    notNeeds: "Custodia nueva — firma con su wallet actual.",
  },
  {
    who: "Humano (principal)",
    tag: "una vez",
    does: (
      <>
        Una llamada al{" "}
        <Gloss tip="issuer: el verificador que emite (y puede revocar) las credenciales — hace el KYC off-chain">
          issuer
        </Gloss>
        : <code>POST /attest {"{wallet, level}"}</code>. En producción es el
        flujo KYC del issuer elegido — el mock demuestra la capa, no el KYC.
      </>
    ),
    notNeeds:
      "PII on-chain — solo nivel + timestamp quedan en la attestation (INV-1).",
  },
];

const FRICTIONS = [
  {
    k: "Alta del mandato",
    v: "hoy es una tx del owner por CLI; producción pide UX wallet (un approve en Phantom). Y el MVP no tiene update_mandate: agregar un payee es close + re-init (roadmap).",
  },
  {
    k: "Elección de issuer",
    v: "el gate confía en el (credential, schema) configurado — decidir qué issuer(s) aceptar es gobernanza real; multi-issuer está en roadmap.",
  },
  {
    k: "Gestión de wallets",
    v: "el servicio necesita una wallet payee + ATA del mint — trivial pero no cero (adopt_service.ts lo automatiza en la demo).",
  },
  {
    k: "Cold-start de agentes",
    v: "attestation + mandato + fondos USDC; nada de eso se resuelve adoptando el verify.",
  },
];

export default function Docs() {
  const ref = useReveal<HTMLElement>();
  return (
    <main className="wrap" ref={ref}>
      <header className="pagehead">
        <h1>Adopción — sin cuenta, sin API key, sin permiso</h1>
        <p className="lede">
          El programa gate y el programa SAS son capa de bien público:{" "}
          <b>la chain es la API</b>. Nadie se registra ante nosotros — cada rol
          interactúa con cuentas públicas. Adoptar ≠ cobrarle a cualquiera: el{" "}
          <b>owner de cada agente decide</b> a qué servicios puede pagar su
          agente (la{" "}
          <Gloss tip="whitelist del mandato: la lista de servicios autorizados que el owner firmó — el agente solo puede pagar a esos">
            lista de servicios autorizados
          </Gloss>
          ). Eso no es fricción — es la feature.
        </p>
      </header>

      {/* ── Quién adopta y qué hace — 4 roles como cards ── */}
      <section className="fade-up">
        <h2 className="sect">Quiénes adoptan y qué hacen</h2>
        <div className="adopters">
          {ACTORS.map((a) => (
            <article className="adopter" key={a.who}>
              <div className="adopter-head">
                <b>{a.who}</b>
                <span className="prim-q">{a.tag}</span>
              </div>
              <div className="adopter-body">
                <div>{a.does}</div>
                <div>
                  <span className="no">no necesita: {a.notNeeds}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="note">
          El gate es un programa abierto: cualquiera puede crear mandatos,
          pagar gateado o verificar recibos sin hablar con nadie. La autoridad
          queda donde corresponde: el issuer decide a quién attesta; el owner
          decide a quién puede pagar su agente. El adoptante no pide permiso al
          gate — <b>exige</b> que el pago venga por el gate. Es x402 con
          enforcement on-chain: el middleware no decide, la tx revierte.
        </p>
      </section>

      {/* ── La vuelta completa ── */}
      <section className="card wide fade-up">
        <h2 className="sect">La vuelta completa — en criollo</h2>
        <ol className="steps big">
          <li>
            <p>
              <b>El humano, una vez:</b> se verifica con un issuer (KYC
              off-chain) y firma el mandato on-chain —{" "}
              <i>"mi agente gasta máx $5/tx, $20/mes, solo a estos
              servicios"</i>. Nunca más toca nada, salvo revocar.
            </p>
          </li>
          <li>
            <p>
              <b>El agente, siempre:</b> paga en los servicios gateados; el
              programa chequea attestation + mandato en la misma tx. Si excede
              el límite, la tx entera revierte antes del transfer —{" "}
              <b>la plata nunca se mueve</b>, no hay nada que devolver.
            </p>
          </li>
          <li>
            <p>
              <b>El servicio, ~10 líneas:</b>{" "}
              <code>{"createGate({programId, payee, price, mint})"}</code> +
              responder 402 y verificar el recibo. Sin cuenta, sin API key, sin
              permiso — la chain es la API.
            </p>
          </li>
        </ol>
        <p className="note">
          privacidad: on-chain solo se ve "humano verificado nivel N, issuer
          X" — nunca PII. La identidad real queda en el issuer off-chain y
          revelarla exige proceso legal hacia él: accountability judicial, no
          trazabilidad masiva ni DNI público.
        </p>
      </section>

      {/* ── Tres pasos ── */}
      <section className="card wide fade-up">
        <h2 className="sect">Para un servicio: tres pasos</h2>
        <ol className="steps big">
          <li>
            <p>
              <b>Declarás tu cobro</b> — payee wallet + precio + el programId
              del gate (público, devnet).
            </p>
          </li>
          <li>
            <p>
              <b>Respondés 402</b> con los requirements si la request no trae{" "}
              <code>X-Payment</code>.
            </p>
          </li>
          <li>
            <p>
              <b>Verificás el recibo</b> on-chain: payee, mint, monto e
              invoice vinculante. Listo — cobrás pagos gateados.
            </p>
          </li>
        </ol>
      </section>

      {/* ── La integración literal ── */}
      <section className="fade-up">
        <h2 className="sect">La integración completa — estas líneas son TODO</h2>
        <article className="card wide">
          <CodeBlock
            file="services/service-z/src/index.ts — extracto literal (las líneas // ── INTEGRACIÓN)"
            code={SERVICE_Z_SNIPPET}
            highlight
          />
          <p className="plain">
            El resto del archivo es un express común (routes, listen).{" "}
            <code>createGate</code> encapsula requirements + verificación del
            recibo — es el archivo que un adoptante real copiaría hoy a su
            repo (en producción sería un paquete SDK publicado):
          </p>
          <details>
            <summary>
              ver el helper completo — <code>services/gate-check.ts</code> (
              {GATE_CHECK_SRC.split("\n").length} líneas)
            </summary>
            <CodeBlock
              file="services/gate-check.ts"
              code={GATE_CHECK_SRC}
              highlight
            />
          </details>
          <details>
            <summary>
              ver el servicio adoptante entero —{" "}
              <code>services/service-z/src/index.ts</code> (
              {SERVICE_Z_SRC.split("\n").length} líneas)
            </summary>
            <CodeBlock
              file="services/service-z/src/index.ts"
              code={SERVICE_Z_SRC}
              highlight
            />
          </details>
          <p className="note">
            el servicio NO confía en claims (D7): lee la tx confirmada y exige
            que el <code>PaymentReceipt</code> vincule payee + mint + monto +
            invoice — con consumo single-use del invoice (anti-replay básico).
          </p>
        </article>
      </section>

      {/* ── Niveles de adopción ── */}
      <section className="fade-up">
        <h2 className="sect">Niveles de adopción</h2>
        <div className="adopters">
          <article className="card">
            <h3 className="why-k">Middleware blando (soft check)</h3>
            <p className="plain">
              Lo que hacen service-x/y/z hoy: el servicio publica requirements
              y verifica el recibo post-pago. Cero costo si nadie paga — es el
              nivel de integración que se muestra en la demo.
            </p>
          </article>
          <article className="card">
            <h3 className="why-k">Gate enforcement (routed-through-gate)</h3>
            <p className="plain">
              Más fuerte: el único camino de cobro es <code>pay</code> del
              gate — mismo código, cambia la exposición del payee (ej. cobros a
              un{" "}
              <Gloss tip="ATA (Associated Token Account): la cuenta de tokens del servicio donde cae el pago">
                ATA
              </Gloss>{" "}
              cuyo dueño solo cobra vía recibo). Producción.
            </p>
          </article>
        </div>
      </section>

      {/* ── Fricción honesta ── */}
      <section className="fade-up">
        <h2 className="sect">Fricción honesta que queda</h2>
        <div className="whygrid">
          {FRICTIONS.map((f) => (
            <article className="card" key={f.k}>
              <h3 className="why-k">{f.k}</h3>
              <p className="plain">{f.v}</p>
            </article>
          ))}
        </div>
        <p className="note">
          El beat de adopción en vivo lo demuestra:{" "}
          <code>bash scripts/demo_adoption.sh</code> levanta service-z, la
          chain rebota el primer pago con <code>PayeeNotWhitelisted</code> (la
          chain decide, no el servicio), el owner lo whitelista y el mismo pago
          pasa a 200. Ver también la tab <b>Adopción</b> del{" "}
          <Link to="/dashboard">dashboard</Link> y el estado en vivo en{" "}
          <Link to="/demo">/demo</Link>.
        </p>
      </section>
    </main>
  );
}
