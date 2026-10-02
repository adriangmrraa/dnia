/**
 * Demo (/demo) — cómo reproducir: los comandos, el guion beat a beat con
 * qué mirar, el checklist de explorer y el estado EN VIVO de cada servicio.
 * Si los servicios no están levantados los chips muestran "offline" y la
 * página sigue funcionando — todo lo estático se ve igual.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "./router";
import { BEATS, PROGRAM_ID, explorerAddr, explorerTx, short } from "./site";

interface ServiceProbe {
  key: string;
  label: string;
  port: number;
  /** Path a fetchear vía proxy vite — CUALQUIER respuesta HTTP = proceso vivo. */
  path: string;
  desc: string;
}

const SERVICES: ServiceProbe[] = [
  {
    key: "issuer",
    label: "Issuer mock (SAS)",
    port: 3401,
    path: "/status/ping", // 404/500 cuenta igual: lo que importa es que responda
    desc: "emite/revoca attestations SAS reales · POST /attest · /revoke · GET /status/:wallet",
  },
  {
    key: "x",
    label: "Servicio X",
    port: 3402,
    path: "/health",
    desc: "API premium gateada — el adoptante original",
  },
  {
    key: "y",
    label: "Servicio Y",
    port: 3403,
    path: "/health",
    desc: "misma imagen, otro payee — no whitelisted por el mandato demo",
  },
  {
    key: "z",
    label: "Servicio Z",
    port: 3405,
    path: "/health",
    desc: "adoptante del beat demo_adoption.sh — opcional, se levanta en vivo",
  },
  {
    key: "runner",
    label: "Demo runner",
    port: 3406,
    path: "/health",
    desc: "ejecuta run_beats.sh a pedido del botón ▶ — POST /run, streamea el output",
  },
];

interface Health {
  online: boolean;
  payee?: string;
  price?: string;
}

const COMMANDS = `bash scripts/start_services.sh        # issuer :3401 · x :3402 · y :3403 · runner :3406
bash scripts/sync_dashboard_env.sh    # genera dashboard/.env (solo pubkeys)
cd dashboard && npx vite --port 3404 --host   # este sitio → http://localhost:3404
bash scripts/run_beats.sh             # los 6 beats encadenados, verifica cada uno
bash scripts/demo_adoption.sh         # beat extra: service-z se suma al gate en vivo`;

const BEAT_GUIDE = [
  {
    n: "1",
    cmd: 'POST :3401/attest {"wallet": A, "level": 2}',
    look: "Attestation SAS real emitida en devnet: Agente A queda verificado como operado por humano (level 2). En explorer: programa SAS 22zoJM… ejecutado + cuenta attestation PDA creada.",
  },
  {
    n: "2",
    cmd: "owner.ts init-mandate --agent a --max 5 --cap 10 --payees x",
    look: "El owner firma el mandato: máx $5/tx, cap $10/día, solo Servicio X. En explorer: ix init_mandate exitosa sobre el programa gate.",
  },
  {
    n: "3",
    cmd: "agent pay http://localhost:3402/api/premium 0.50",
    look: "402 → pay on-chain → retry con X-Payment → 200. En explorer: transfer SPL A→ATA(X) + logs Program data: con PaymentReceipt (incluye mint). En el dashboard: línea nueva en el ledger.",
  },
  {
    n: "4",
    cmd: "agent pay … 0.50 --keypair keys/agent-b.json --skip-preflight",
    look: "B tiene mandato pero NO attestation → tx fallida REAL on-chain con Error Code: AttestationMissing. Sin --skip-preflight el revert muere en simulación y jamás existe la tx.",
  },
  {
    n: "5",
    cmd: "agent pay X 10 (over-limit) · agent pay Y 0.50 (no whitelisted)",
    look: "Dos txs fallidas reales: OverPerTxLimit y PayeeNotWhitelisted. Ningún middleware decide esto — revierte el programa y queda en la chain para siempre.",
  },
  {
    n: "6",
    cmd: "owner.ts revoke --agent a  →  agent pay X 0.50",
    look: "El owner revoca el mandato y el mismo pago que en el beat 3 confirmaba revierte MandateRevoked. Mirar el dashboard: el panel del mandato pasa a revocado solo leyendo la chain.",
  },
];

/** Resultado que manda el runner en la línea final `__RESULT__{json}`. */
interface RunResult {
  ok: boolean;
  exitCode: number | null;
  output?: string;
  startedAt?: string;
  finishedAt?: string;
  timedOut?: boolean;
  error?: string;
}

interface RunState {
  phase: "idle" | "running" | "done" | "error";
  output: string;
  result: RunResult | null;
  /** Nota humana (409, runner caído, stream cortado). */
  note?: string;
}

/** Signature devnet = base58 de ~88 chars — mismo criterio que sigline() del script. */
const SIG_RE = /[1-9A-HJ-NP-Za-km-z]{80,90}/g;

export default function DemoPage() {
  const [health, setHealth] = useState<Record<string, Health>>({});
  const [checked, setChecked] = useState(false);
  const [run, setRun] = useState<RunState>({
    phase: "idle",
    output: "",
    result: null,
  });
  const termRef = useRef<HTMLPreElement>(null);

  const probe = useCallback(() => {
    for (const s of SERVICES) {
      fetch(`/svc/${s.key}${s.path}`, { signal: AbortSignal.timeout(4000) })
        .then(async (r) => {
          let extra: Partial<Health> = {};
          if (s.path === "/health" && r.ok) {
            const j = await r.json().catch(() => ({}));
            extra = { payee: j.payee, price: j.price };
          }
          setHealth((h) => ({ ...h, [s.key]: { online: true, ...extra } }));
        })
        .catch(() =>
          setHealth((h) => ({ ...h, [s.key]: { online: false } }))
        );
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  // La terminal sigue el output mientras corre.
  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight });
  }, [run.output]);

  /**
   * POST /svc/runner/run → stream text/plain del run_beats.sh en vivo.
   * El runner cierra el stream con una línea `__RESULT__` + JSON (resumen).
   */
  const runDemo = useCallback(async () => {
    setRun({ phase: "running", output: "", result: null });
    try {
      const res = await fetch("/svc/runner/run", { method: "POST" });
      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        setRun({
          phase: "error",
          output: "",
          result: null,
          note: `Ya hay una corrida en curso (desde ${j.startedAt ?? "?"}). Esperá a que termine.`,
        });
        return;
      }
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        setRun({
          phase: "error",
          output: "",
          result: null,
          note: `El runner respondió ${res.status}: ${t.slice(0, 200)}`,
        });
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setRun((r) => ({ ...r, output: text }));
      }
      text += dec.decode();
      const i = text.lastIndexOf("\n__RESULT__");
      let result: RunResult | null = null;
      let shown = text;
      if (i >= 0) {
        shown = text.slice(0, i);
        try {
          result = JSON.parse(text.slice(i + 11).trim()) as RunResult;
        } catch {
          /* stream cortado a mitad del sentinel */
        }
      }
      setRun({
        phase: "done",
        output: shown,
        result,
        note: result
          ? undefined
          : "el stream terminó sin resumen — ¿se cortó la conexión?",
      });
    } catch (e) {
      setRun((r) => ({
        phase: "error",
        output: r.output,
        result: null,
        note: `No se pudo hablar con el runner (${String(e)}) — ¿está corriendo? bash scripts/dev_service.sh runner`,
      }));
    }
  }, []);

  // Signatures detectadas en el output (dedup, en orden de aparición).
  const runSigs = useMemo(() => {
    const seen = new Set<string>();
    for (const m of run.output.matchAll(SIG_RE)) seen.add(m[0]);
    return [...seen];
  }, [run.output]);

  const runnerOffline = health["runner"]?.online === false;

  return (
    <main className="wrap">
      <header className="pagehead">
        <h1>Correr la demo — devnet, ~5 min</h1>
        <p className="lede">
          Todo en WSL Ubuntu (<code>wsl -d Ubuntu -- bash -lc</code>), parado
          en <code>demo/</code>. Los servicios corren en foreground-managed
          shells — WSL1 mata procesos background al cerrar la sesión, por eso{" "}
          <code>scripts/dev_service.sh issuer|x|y|z</code> los envuelve en una
          sesión persistente.
        </p>
      </header>

      {/* ── Estado en vivo ── */}
      <section>
        <h2 className="sect">
          Estado ahora{" "}
          <button onClick={probe} className="mini-btn">
            re-probar
          </button>
        </h2>
        <div className="adopters">
          {SERVICES.map((s) => {
            const h = health[s.key];
            return (
              <div className="adopter" key={s.key}>
                <div className="adopter-head">
                  <b>{s.label}</b>
                  <span
                    className={`verdict ${h?.online ? "ok" : h === undefined ? "muted" : "bad"}`}
                  >
                    {h === undefined || !checked
                      ? "…"
                      : h.online
                        ? "ONLINE"
                        : "OFFLINE"}
                  </span>
                </div>
                <div className="adopter-body">
                  <div>{s.desc}</div>
                  <div>
                    :{s.port}
                    {h?.online && h.payee && (
                      <>
                        {" "}
                        · payee{" "}
                        <a
                          href={explorerAddr(h.payee)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(h.payee)}
                        </a>
                      </>
                    )}
                    {h?.online && h.price && (
                      <> · ${(Number(h.price) / 1_000_000).toFixed(2)}</>
                    )}
                  </div>
                  {!h?.online && h !== undefined && (
                    <code>
                      bash scripts/dev_service.sh{" "}
                      {s.key === "issuer" ? "issuer" : s.key}
                    </code>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="note">
          offline no rompe nada: significa que el proceso local no está
          levantado — la evidencia on-chain (programa, mandatos, recibos, txs
          fallidas) sigue verificable en el explorer porque vive en devnet,
          no en estos procesos.
        </p>
      </section>

      {/* ── Correr la demo desde acá ── */}
      <section>
        <h2 className="sect">Correrla ahora — un click, devnet real</h2>
        <div className="card">
          <p className="plain">
            El botón ejecuta <code>bash scripts/run_beats.sh</code> de verdad,
            vía el servicio <code>demo-runner</code> (:3406): los 6 beats
            encadenados con <b>transacciones reales en devnet</b> — incluidos
            los reverts intencionados que quedan grabados on-chain como txs
            fallidas con signature (~90s). Necesita issuer + X + Y arriba —
            mirá el estado de acá arriba.
          </p>
          <div className="runbar">
            <button
              className="btn primary"
              onClick={runDemo}
              disabled={run.phase === "running" || runnerOffline}
            >
              {run.phase === "running"
                ? "● corriendo beats…"
                : "▶ Correr demo (devnet real)"}
            </button>
            {run.phase === "done" && run.result && (
              <span className={`verdict ${run.result.ok ? "ok" : "bad"}`}>
                {run.result.ok
                  ? "LOS 6 BEATS OK"
                  : `terminó con exit ${run.result.exitCode ?? "?"}`}
              </span>
            )}
            {run.phase === "error" && (
              <span className="verdict bad">no corrió</span>
            )}
          </div>
          {runnerOffline && (
            <p className="note">
              el runner está offline — en WSL, parado en <code>demo/</code>:{" "}
              <code>bash scripts/dev_service.sh runner</code> (o lo levanta{" "}
              <code>scripts/start_services.sh</code>).
            </p>
          )}
          {run.note && <p className="note">{run.note}</p>}
          {(run.phase !== "idle" || run.output) && (
            <pre ref={termRef} className="term">
              {run.output || "arrancando…"}
            </pre>
          )}
          {runSigs.length > 0 && (
            <div className="sm" style={{ marginTop: "0.6rem" }}>
              <b>Signatures de esta corrida</b> — abren el explorer devnet:
              <ul className="siglist">
                {runSigs.map((s) => (
                  <li key={s}>
                    <a
                      href={explorerTx(s)}
                      target="_blank"
                      rel="noreferrer"
                      title={s}
                    >
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="note">
            Re-correr es seguro: el script es idempotente — la attestation se
            reusa (beat 1) y si el mandato quedó revocado por el beat 6 de la
            corrida anterior, el beat 2 hace close + re-init. Lo que imprime
            el script es lo que pasó en la chain, sin edición.
          </p>
        </div>
      </section>

      {/* ── Comandos ── */}
      <section>
        <h2 className="sect">Levantar todo</h2>
        <pre className="code">
          <code>{COMMANDS}</code>
        </pre>
        <p className="note">
          <code>run_beats.sh</code> corre los 6 beats encadenados y verifica el
          resultado esperado de cada uno (falla exit 1 si algo no se
          comporta). <code>demo_adoption.sh</code> es el beat extra: service-z
          se suma al gate en vivo — alta de wallet + ATA, revert{" "}
          <code>PayeeNotWhitelisted</code> (la chain decide), whitelist del
          owner, pago 200. Guion completo de narración:{" "}
          <code>demo/README.md</code>.
        </p>
      </section>

      {/* ── Beat a beat ── */}
      <section>
        <h2 className="sect">El guion, beat a beat (~90 seg)</h2>
        <div className="card wide tablewrap">
          <table>
            <thead>
              <tr>
                <th>beat</th>
                <th>comando</th>
                <th>qué mirar</th>
              </tr>
            </thead>
            <tbody>
              {BEAT_GUIDE.map((b) => (
                <tr key={b.n}>
                  <td className="beat-n">{b.n}</td>
                  <td>
                    <code className="sm">{b.cmd}</code>
                  </td>
                  <td className="sm">{b.look}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Checklist explorer ── */}
      <section>
        <h2 className="sect">
          Checklist de verificación — la corrida canónica (02/10/2026)
        </h2>
        <p className="plain">
          Estas signatures son de la corrida registrada — verificables hoy en{" "}
          <code>explorer.solana.com/tx/&lt;sig&gt;?cluster=devnet</code>:
        </p>
        <div className="card wide tablewrap">
          <table>
            <thead>
              <tr>
                <th>beat</th>
                <th>qué verificar</th>
                <th>signature</th>
              </tr>
            </thead>
            <tbody>
              {BEATS.map((b) => (
                <tr key={b.n} className={b.result === "fail" ? "fail" : ""}>
                  <td className="beat-n">{b.n}</td>
                  <td className="sm">
                    {b.title}
                    {b.err && (
                      <>
                        {" — "}
                        <code>{b.err}</code>
                      </>
                    )}
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
          programa:{" "}
          <a href={explorerAddr(PROGRAM_ID)} target="_blank" rel="noreferrer">
            {PROGRAM_ID}
          </a>{" "}
          · en vivo, el estado del mandato/attestation/ledger se mira en el{" "}
          <Link to="/dashboard">dashboard</Link>.
        </p>
      </section>
    </main>
  );
}
