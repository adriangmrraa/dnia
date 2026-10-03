/**
 * Colaborar (/colaborar) — cómo contribuir: repo (placeholder hasta que se
 * publique), issues/PRs, y las áreas reales de trabajo del roadmap.
 * Estática — funciona offline.
 */
import { Brandmark, Gloss, useReveal } from "./ui";
import { GITHUB_REPO_URL, PROGRAM_ID, explorerAddr } from "./site";

const AREAS = [
  {
    k: "Issuers KYC reales",
    v: "el issuer de la demo es mock — demuestra la capa, no la verificación. Producción = integrar un verificador real (Persona/Veriff-class, ~$1-2/check). El schema es issuer-agnóstico por diseño: múltiples verificadores pueden attestar sin lock-in.",
    tag: "integración",
  },
  {
    k: "Integración con facilitators x402",
    v: "el verify de createGate como hook de settle/verify en el flujo 402 de un facilitator real (PayAI, MCPay, Corbits-class). Es el wedge del producto — y la condición abierta del Research Gate.",
    tag: "adopción",
  },
  {
    k: "Recibo como cuenta PDA",
    v: "hoy el PaymentReceipt es un event-log (barato, indexable). Una cuenta PDA lo haría legible por otros programas: refund-exige-recibo, acceso-condicionado-a-compra, reputación on-chain. Cambio aditivo — no rompe lo existente.",
    tag: "programa",
  },
  {
    k: "Puente ERC-8004",
    v: "referenciar la attestation SAS desde el registration file del agente en 8004 — interop cross-chain de identidad agéntica. Una línea de metadata; marketing de interop, no dependencia.",
    tag: "interop",
  },
  {
    k: "update_mandate + anti-replay + multi-issuer",
    v: "editar la policy sin close+re-init; store de invoices consumidos (anti-replay completo); GateConfig con set de issuers confiables en vez de uno solo.",
    tag: "programa",
  },
];

function RepoLink() {
  // GITHUB_REPO_URL es null hasta que el repo se publique (ver site.ts).
  if (!GITHUB_REPO_URL) {
    return (
      <span className="repo-pending">
        repo por publicar — la URL va en{" "}
        <code>dashboard/src/site.ts → GITHUB_REPO_URL</code>
      </span>
    );
  }
  return (
    <a className="url" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
      {GITHUB_REPO_URL} ↗
    </a>
  );
}

export default function Colaborar() {
  const ref = useReveal<HTMLElement>();
  return (
    <main className="wrap" ref={ref}>
      <header className="pagehead">
        <h1>Colaborar — la capa es de todos</h1>
        <p className="lede">
          dnia es un protocolo abierto — el gate y los schemas son bien
          público: nadie confía en una capa de credenciales que controla un
          competidor.
        </p>
      </header>

      {/* ── Repo CTA — lo primero que se ve ── */}
      <section className="card repo-cta fade-up">
        <Brandmark size={34} />
        <div className="grow">
          <b>dnia</b> — código abierto{" "}
          <span className="license-badge">Apache-2.0</span>
          <div>
            <RepoLink />
          </div>
        </div>
        <a
          className="chip"
          href={explorerAddr(PROGRAM_ID)}
          target="_blank"
          rel="noreferrer"
        >
          <i className="dot ok"></i>programa devnet ↗
        </a>
      </section>

      {/* ── Cómo contribuir ── */}
      <section className="card wide fade-up">
        <h2 className="sect">Cómo contribuir</h2>
        <ol className="steps big">
          <li>
            <p>
              <b>Abrí un issue</b> — bug, pregunta de diseño o propuesta de
              integración. El dossier de investigación (
              <code>docs/CANDIDATE_O_agentic-dni.md</code>) y el roadmap (
              <code>docs/10_ROADMAP.md</code>) explican el porqué de cada
              decisión.
            </p>
          </li>
          <li>
            <p>
              <b>PRs bienvenidos</b> — el único programa custom es{" "}
              <code>agentic_gate</code> (
              <a
                href={explorerAddr(PROGRAM_ID)}
                target="_blank"
                rel="noreferrer"
              >
                {PROGRAM_ID}
              </a>
              , Anchor 1.2.0). Todo lo demás es TypeScript: servicios, agent
              CLI, este sitio.
            </p>
          </li>
          <li>
            <p>
              <b>Verificá antes de proponer</b> — la suite corre sobre
              surfpool/LiteSVM con el programa SAS real dumpeado de devnet
              (21/21): <code>cd demo && npx ts-mocha</code>. La evidencia
              on-chain está en <code>docs/09_DEMO_SUBMISSION.md</code>.
            </p>
          </li>
        </ol>
      </section>

      {/* ── Áreas de trabajo ── */}
      <section className="fade-up">
        <h2 className="sect">En qué se puede trabajar (roadmap real)</h2>
        <div className="whygrid">
          {AREAS.map((a) => (
            <article className="card" key={a.k}>
              <p className="chip">{a.tag}</p>
              <h3 className="why-k">{a.k}</h3>
              <p className="plain">{a.v}</p>
            </article>
          ))}
        </div>
        <p className="note">
          priorización completa por evidencia/riesgo:{" "}
          <code>docs/10_ROADMAP.md</code> §3.
        </p>
      </section>

      {/* ── Lo que más vale hoy ── */}
      <section className="card wide honest fade-up">
        <h2 className="sect">Lo que más vale hoy</h2>
        <p className="plain">
          No es código. La condición honesta del proyecto: antes que código
          nuevo hace falta <b>una conversación con ≥1 facilitator{" "}
          <Gloss tip="x402: el estándar abierto que usa HTTP 402 para cobros de agente a servicio — PayAI, MCPay, Corbits">
            x402
          </Gloss>{" "}
          que confirme el pull</b> — un router real dispuesto a enchufar el
          verify como hook de settle. Si podés abrir esa puerta, vale más que
          cualquier PR. Todo lo demás del roadmap espera atrás de esa
          señal.
        </p>
      </section>

      {/* ── Licencia ── */}
      <section className="card wide fade-up">
        <h2 className="sect">Licencia — Apache-2.0</h2>
        <p className="plain">
          Apache License 2.0: uso libre, comercial incluido, con grant de
          patentes explícito (el estándar del ecosistema — lo mismo que Anchor,
          Solana y la mayoría de la infra seria). El texto completo está en{" "}
          <code>LICENSE</code> en la raíz del repo.
        </p>
      </section>
    </main>
  );
}
