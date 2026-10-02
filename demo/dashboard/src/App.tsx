/**
 * Dashboard read-only del gate (R-08): ledger de pagos, estado del mandato
 * y estado de la attestation SAS del agente — todo leído de devnet.
 * No firma ni escribe nada; sin PII (INV-1).
 */
import { useCallback, useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import {
  AttestationView,
  DemoConfig,
  LedgerRow,
  MandateView,
  attestationPda,
  explorerAddr,
  explorerTx,
  fetchAttestation,
  fetchLedger,
  fetchMandate,
  loadConfig,
  mandatePda,
} from "./gate";

const short = (s?: string) => (s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "—");
const fmtTs = (t?: number | null) =>
  t ? new Date(t * 1000).toLocaleTimeString() : "—";

const BADGE: Record<string, string> = {
  vigente: "ok",
  vigenteM: "ok",
  revocado: "bad",
  revocada: "bad",
  expirado: "warn",
  expirada: "warn",
  "nunca-emitida": "muted",
  inexistente: "muted",
  error: "bad",
};

export default function App() {
  const [cfg, setCfg] = useState<DemoConfig | null>(null);
  const [agentIdx, setAgentIdx] = useState(0);
  const [mandate, setMandate] = useState<MandateView | null>(null);
  const [att, setAtt] = useState<AttestationView | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    try {
      setCfg(loadConfig());
    } catch (e: any) {
      setErr(`config inválida — falta dashboard/.env (sync_env_dashboard.sh): ${e.message}`);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!cfg) return;
    try {
      const conn = new Connection(cfg.rpcUrl, "confirmed");
      const agent = cfg.agents[agentIdx].wallet;
      const mPda = mandatePda(cfg.owner, agent, cfg.programId);
      const aPda = attestationPda(cfg, agent);
      const [m, a, l] = await Promise.all([
        fetchMandate(conn, mPda),
        fetchAttestation(conn, aPda),
        fetchLedger(conn, mPda, cfg.programId),
      ]);
      setMandate(m);
      setAtt(a);
      setLedger(l);
      setErr(null);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }, [cfg, agentIdx]);

  useEffect(() => {
    refresh();
  }, [refresh, tick]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, [auto]);

  if (err && !cfg)
    return <main className="wrap"><h1>agentic-dni · audit</h1><p className="bad">{err}</p></main>;
  if (!cfg) return <main className="wrap"><p>cargando…</p></main>;

  const agent = cfg.agents[agentIdx];

  return (
    <main className="wrap">
      <header>
        <h1>agentic-dni · audit dashboard</h1>
        <div className="meta">
          <span className="chip">solana devnet</span>
          <a href={explorerAddr(cfg.programId)} target="_blank" rel="noreferrer">
            gate {short(cfg.programId.toBase58())}
          </a>
          <label>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />{" "}
            live (4s)
          </label>
          <button onClick={refresh}>refrescar</button>
        </div>
      </header>

      <nav className="agents">
        {cfg.agents.map((a, i) => (
          <button
            key={a.wallet.toBase58()}
            className={i === agentIdx ? "sel" : ""}
            onClick={() => setAgentIdx(i)}
          >
            {a.label} <code>{short(a.wallet.toBase58())}</code>
          </button>
        ))}
      </nav>

      <section className="grid">
        {/* ── Panel: attestation SAS ── */}
        <article className="card">
          <h2>Attestation SAS</h2>
          <p className={`badge ${BADGE[att?.estado ?? "error"]}`}>
            {att?.estado ?? "…"}
          </p>
          <dl>
            <dt>PDA</dt>
            <dd>
              <a href={explorerAddr(att?.pda ?? "")} target="_blank" rel="noreferrer">
                {short(att?.pda.toBase58())}
              </a>
            </dd>
            <dt>nivel</dt>
            <dd>{att?.level ?? "—"}</dd>
            <dt>emitida</dt>
            <dd>{fmtTs(att?.issuedAt)}</dd>
            <dt>expiry</dt>
            <dd>{att?.expiry ? fmtTs(att.expiry) : "sin expiración"}</dd>
          </dl>
          <p className="note">
            sin PII on-chain: solo nivel + timestamp (INV-1) · revocada = cuenta
            cerrada por el issuer
          </p>
        </article>

        {/* ── Panel: mandato ── */}
        <article className="card">
          <h2>Mandato owner→agente</h2>
          <p className={`badge ${BADGE[mandate?.estado ?? "inexistente"]}`}>
            {mandate?.exists ? mandate.estado : "inexistente"}
          </p>
          <dl>
            <dt>PDA</dt>
            <dd>
              <a
                href={explorerAddr(mandate?.pda ?? "")}
                target="_blank"
                rel="noreferrer"
              >
                {short(mandate?.pda.toBase58())}
              </a>
            </dd>
            <dt>máx/tx</dt>
            <dd>${mandate?.maxPerTx ?? "—"}</dd>
            <dt>cap diario</dt>
            <dd>${mandate?.dailyCap ?? "—"}</dd>
            <dt>gastado hoy</dt>
            <dd>
              ${mandate?.spentToday ?? "—"} <small>(día {mandate?.dayIndex ?? "—"})</small>
            </dd>
            <dt>total</dt>
            <dd>${mandate?.totalSpent ?? "—"}</dd>
            <dt>whitelist</dt>
            <dd>
              {(mandate?.whitelist ?? []).map((w) => (
                <div key={w}>
                  <a href={explorerAddr(w)} target="_blank" rel="noreferrer">
                    {short(w)}
                  </a>
                  {w === cfg.serviceX.toBase58() && " (servicio X)"}
                  {w === cfg.serviceY.toBase58() && " (servicio Y)"}
                </div>
              ))}
            </dd>
            <dt>expiry</dt>
            <dd>{mandate?.expiry ? fmtTs(mandate.expiry) : "sin expiración"}</dd>
          </dl>
        </article>
      </section>

      {/* ── Panel: ledger de pagos ── */}
      <article className="card wide">
        <h2>Ledger de pagos del agente (txs del mandato)</h2>
        <table>
          <thead>
            <tr>
              <th>tx</th>
              <th>tipo</th>
              <th>monto</th>
              <th>payee</th>
              <th>invoice</th>
              <th>hora</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  sin transacciones todavía
                </td>
              </tr>
            )}
            {ledger.map((r) => (
              <tr key={r.sig} className={r.kind === "fallida" ? "fail" : ""}>
                <td>
                  <a href={explorerTx(r.sig)} target="_blank" rel="noreferrer">
                    {short(r.sig)}
                  </a>
                </td>
                <td>{r.kind === "pago" ? "pago ✓" : r.kind === "fallida" ? `fallida ✗` : "ix"}</td>
                <td>{r.amount ? `$${r.amount}` : "—"}</td>
                <td>{r.payee ? <a href={explorerAddr(r.payee)} target="_blank" rel="noreferrer">{short(r.payee)}</a> : "—"}</td>
                <td>
                  <code>{r.serviceRef ? r.serviceRef.slice(0, 12) + "…" : "—"}</code>
                </td>
                <td>{fmtTs(r.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          cada línea linkea al explorer — el recibo PaymentReceipt se parsea de
          los logs <code>Program data:</code> de la tx (R-05).
        </p>
      </article>

      {err && <p className="bad">{err}</p>}
    </main>
  );
}
