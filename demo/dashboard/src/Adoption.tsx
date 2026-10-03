/**
 * Tab "Adopción" del dashboard — la historia de cómo un servicio se suma
 * al gate: sin cuenta, sin API key, sin permiso. La chain es la API.
 *
 * El snippet se EXTRAE del código real de services/service-z (las líneas
 * marcadas "// ── INTEGRACIÓN") y el estado de los adoptantes se consulta
 * en vivo vía el proxy de vite (/svc/x|y|z → :3402|:3403|:3405).
 */
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { CodeBlock, Gloss } from "./ui";
import { DemoConfig, GateConfigView, explorerAddr } from "./gate";
import {
  GATE_CHECK_SRC,
  SERVICE_Z_SNIPPET as SNIPPET,
  SERVICE_Z_SRC,
} from "./snippets";

const short = (s?: string | PublicKey) =>
  s ? `${s.toString().slice(0, 6)}…${s.toString().slice(-4)}` : "—";

interface Adopter {
  key: string;
  label: string;
  desc: string;
  port: number;
  payee?: PublicKey;
}

export default function Adoption({
  cfg,
  gateCfg,
}: {
  cfg: DemoConfig;
  gateCfg: GateConfigView | null;
}) {
  const adopters: Adopter[] = [
    {
      key: "x",
      label: "Servicio X",
      desc: "API premium — el adoptante original",
      port: 3402,
      payee: cfg.serviceX,
    },
    {
      key: "y",
      label: "Servicio Y",
      desc: "misma imagen, otro payee — no whitelisted por el mandato demo",
      port: 3403,
      payee: cfg.serviceY,
    },
    ...(cfg.serviceZ
      ? [
          {
            key: "z",
            label: "Servicio Z",
            desc: "adoptante nuevo — sumado en vivo por demo_adoption.sh",
            port: 3405,
            payee: cfg.serviceZ,
          },
        ]
      : []),
  ];

  const [health, setHealth] = useState<
    Record<string, { online: boolean; payee?: string; price?: string }>
  >({});

  useEffect(() => {
    let dead = false;
    for (const a of adopters) {
      fetch(`/svc/${a.key}/health`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((j) => {
          if (!dead)
            setHealth((h) => ({ ...h, [a.key]: { online: true, ...j } }));
        })
        .catch(() => {
          if (!dead) setHealth((h) => ({ ...h, [a.key]: { online: false } }));
        });
    }
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  return (
    <>
      {/* ── El claim ── */}
      <article className="card wide">
        <h2 className="sect">Cómo se adopta — cero fricción</h2>
        <p className="plain">
          Un servicio se suma al gate{" "}
          <b>sin cuenta, sin API key y sin permiso</b>: declara su wallet
          payee y el programId, responde{" "}
          <Gloss tip="HTTP 402 Payment Required: el servicio contesta «pagá primero» con los requisitos del pago">
            402
          </Gloss>{" "}
          con los requirements y verifica el recibo on-chain.{" "}
          <b>La chain es la API</b> — el programa exige identidad + mandato en
          la misma tx que mueve la plata; el servicio solo lee el recibo que
          el programa emitió.
        </p>
        <ol className="steps big">
          <li>
            <p>
              <b>Declarás tu cobro</b> — payee wallet + precio + el programId
              del gate (público, devnet).
            </p>
          </li>
          <li>
            <p>
              <b>Respondés 402</b> con los requirements si no hay{" "}
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
        <p className="note">
          adoptar ≠ cobrarle a cualquiera: el OWNER de cada agente decide a
          qué servicios puede pagar su agente (
          <Gloss tip="whitelist: la lista de payees que el dueño firmó dentro del mandato — el programa rechaza cualquier otro">
            whitelist
          </Gloss>{" "}
          del mandato). Eso no es fricción — es la feature.
        </p>
      </article>

      {/* ── La integración literal ── */}
      <article className="card wide">
        <h2 className="sect">La integración completa — estas líneas son TODO</h2>
        <CodeBlock
          file="services/service-z/src/index.ts — extracto literal (las líneas // ── INTEGRACIÓN)"
          code={SNIPPET}
          highlight
        />
        <p className="plain">
          El resto del archivo es un express común (routes, listen).{" "}
          <code>createGate</code> encapsula requirements + verificación del
          recibo — es el archivo que un adoptante real copiaría hoy a su repo:
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
      </article>

      {/* ── Adoptantes en vivo ── */}
      <article className="card wide">
        <h2 className="sect">Adoptantes en vivo</h2>
        <div className="adopters">
          {adopters.map((a) => {
            const h = health[a.key];
            return (
              <div className="adopter" key={a.key}>
                <div className="adopter-head">
                  <b>{a.label}</b>
                  <span className="chip">
                    <i
                      className={`dot ${h === undefined ? "off" : h.online ? "ok" : "bad"}`}
                    ></i>
                    {h === undefined ? "…" : h.online ? "ONLINE" : "NO LEVANTADO"}
                  </span>
                </div>
                <div className="adopter-body">
                  <div>{a.desc}</div>
                  <div>
                    :{a.port} · payee{" "}
                    {a.payee ? (
                      <a
                        href={explorerAddr(a.payee)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(a.payee)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                  {h?.online && h.price && (
                    <div>
                      precio ${(Number(h.price) / 1_000_000).toFixed(2)} USDC-test
                    </div>
                  )}
                  <code>curl -i localhost:{a.port}/api/premium</code>
                </div>
              </div>
            );
          })}
        </div>
        <p className="note">
          un adoptante que no responde = "no levantado" — se inicia con{" "}
          <code>bash scripts/dev_service.sh x|y|z</code> (WSL, sesión
          persistente). El issuer mock está en :3401.
        </p>
      </article>

      {/* ── Beat en vivo + honestidad ── */}
      <article className="card wide">
        <h2 className="sect">Verlo en vivo — beat de adopción</h2>
        <CodeBlock file="terminal — WSL, parado en demo/" code="bash scripts/demo_adoption.sh" />
        <p className="plain">
          Levanta <b>service-z</b> (:3405), prueba que ya responde{" "}
          <Gloss tip="HTTP 402 Payment Required: el servicio contesta «pagá primero» con los requisitos del pago">
            402
          </Gloss>
          , muestra al agente A rebotando con <code>PayeeNotWhitelisted</code>{" "}
          on-chain (la chain decide, no el servicio), el owner whitelisting a
          z con <code>init_mandate</code>… y el mismo pago pasando a 200 con
          recibo verificable.
        </p>
        <p className="note">
          fricción honesta que queda: el owner crea/revoca mandatos con su
          wallet (hoy CLI — en producción es un approve en Phantom), el mint
          y el issuer los fija el gate{" "}
          {gateCfg?.sasCredential
            ? `(credential ${short(gateCfg.sasCredential)}, nivel ≥ ${gateCfg.minLevel})`
            : ""}
          , y el MVP no tiene <code>update_mandate</code> — agregar un payee es
          close + re-init (roadmap).
        </p>
      </article>
    </>
  );
}
