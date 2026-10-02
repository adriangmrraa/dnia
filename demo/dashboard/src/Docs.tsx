/**
 * Docs (/docs) — la historia de adopción: quién adopta, qué hace y qué NO
 * necesita; la integración real (snippet literal de service-z); los niveles
 * de adopción y la fricción honesta que queda.
 * Fuente: docs/CANDIDATE_O_agentic-dni.md §12 + docs/11_PRESENTACION.md §4.
 * Estática — funciona sin servicios levantados ni .env.
 */
import { Link } from "./router";
import { GATE_CHECK_SRC, SERVICE_Z_SNIPPET, SERVICE_Z_SRC } from "./snippets";

const ACTORS = [
  {
    who: "Servicio / merchant",
    does: "Responde 402 con los requirements y verifica el PaymentReceipt on-chain — createGate({programId, payee, price, mint}) + ~10 líneas de handler. service-z (:3405) quedó gateado solo con eso.",
    notNeeds: "Registro, API key, SDK propietario, permiso del gate.",
  },
  {
    who: "Facilitator / router x402",
    does: "El mismo verify como hook de settle en su flujo 402: parsea Program data: de la tx y exige payee/mint/monto/invoice propios. Es el punto de integración natural (PayAI, MCPay-class).",
    notNeeds: "Nada extra — es una lectura RPC cualquiera.",
  },
  {
    who: "Owner del agente",
    does: "Una tx init_mandate con la policy (máx/tx, cap diario, whitelist de payees, expiry) y revoke_mandate cuando quiera. En la demo: owner.ts init-mandate --agent a --max 5 --cap 10 --payees x.",
    notNeeds: "Custodia nueva — firma con su wallet actual.",
  },
  {
    who: "Humano (principal)",
    does: "Una llamada al issuer: POST /attest {wallet, level}. En producción es el flujo KYC del issuer elegido — el mock demuestra la capa, no el KYC.",
    notNeeds: "PII on-chain — solo nivel + timestamp quedan en la attestation (INV-1).",
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
  return (
    <main className="wrap">
      <header className="pagehead">
        <h1>Adopción — sin cuenta, sin API key, sin permiso</h1>
        <p className="lede">
          El programa gate y el programa SAS son capa de bien público:{" "}
          <b>la chain es la API</b>. Nadie se registra ante nosotros — cada rol
          interactúa con cuentas públicas. Adoptar ≠ cobrarle a cualquiera: el{" "}
          <b>owner de cada agente decide</b> a qué servicios puede pagar su
          agente (la whitelist del mandato). Eso no es fricción — es la feature.
        </p>
      </header>

      {/* ── Quién adopta y qué hace ── */}
      <section>
        <h2 className="sect">Quiénes adoptan y qué hacen</h2>
        <div className="card wide tablewrap">
          <table>
            <thead>
              <tr>
                <th>adoptante</th>
                <th>qué hace concretamente</th>
                <th>qué NO necesita</th>
              </tr>
            </thead>
            <tbody>
              {ACTORS.map((a) => (
                <tr key={a.who}>
                  <td>
                    <b>{a.who}</b>
                  </td>
                  <td className="sm">{a.does}</td>
                  <td className="sm muted">{a.notNeeds}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* ── Tres pasos ── */}
      <section className="card wide">
        <h2 className="sect">Para un servicio: tres pasos</h2>
        <ol className="steps">
          <li>
            <b>Declarás tu cobro</b> — payee wallet + precio + el programId del
            gate (público, devnet).
          </li>
          <li>
            <b>Respondés 402</b> con los requirements si la request no trae{" "}
            <code>X-Payment</code>.
          </li>
          <li>
            <b>Verificás el recibo</b> on-chain: payee, mint, monto e invoice
            vinculante. Listo — cobrás pagos gateados.
          </li>
        </ol>
      </section>

      {/* ── La integración literal ── */}
      <section>
        <h2 className="sect">La integración completa — estas líneas son TODO</h2>
        <article className="card wide">
          <p className="note">
            extracto literal de <code>services/service-z/src/index.ts</code> —
            el servicio que adopta el gate en vivo durante{" "}
            <code>demo_adoption.sh</code>:
          </p>
          <pre className="code">
            <code>{SERVICE_Z_SNIPPET}</code>
          </pre>
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
            <pre className="code">
              <code>{GATE_CHECK_SRC}</code>
            </pre>
          </details>
          <details>
            <summary>
              ver el servicio adoptante entero —{" "}
              <code>services/service-z/src/index.ts</code> (
              {SERVICE_Z_SRC.split("\n").length} líneas)
            </summary>
            <pre className="code">
              <code>{SERVICE_Z_SRC}</code>
            </pre>
          </details>
          <p className="note">
            el servicio NO confía en claims (D7): lee la tx confirmada y exige
            que el <code>PaymentReceipt</code> vincule payee + mint + monto +
            invoice — con consumo single-use del invoice (anti-replay básico).
          </p>
        </article>
      </section>

      {/* ── Niveles de adopción ── */}
      <section>
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
              un ATA cuyo dueño solo cobra vía recibo). Producción.
            </p>
          </article>
        </div>
      </section>

      {/* ── Fricción honesta ── */}
      <section>
        <h2 className="sect">Fricción honesta que queda</h2>
        <div className="card wide tablewrap">
          <table>
            <tbody>
              {FRICTIONS.map((f) => (
                <tr key={f.k}>
                  <td className="muted">{f.k}</td>
                  <td className="sm">{f.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
