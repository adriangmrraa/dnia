/**
 * Dashboard read-only del gate (R-08): ledger de pagos, estado del mandato
 * y estado de la attestation SAS del agente — todo leído de devnet.
 * No firma ni escribe nada; sin PII (INV-1).
 *
 * Dos vistas: "Auditoría" (el estado on-chain en criollo, para que un
 * jurado lo lea) y "Adopción" (cómo un servicio nuevo se suma al gate —
 * cero fricción, sin cuenta ni API key).
 */
import { useCallback, useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Gloss, useReveal } from "./ui";
import {
  AttestationView,
  DemoConfig,
  GateConfigView,
  LedgerRow,
  MandateView,
  SAS_PROGRAM_ID,
  attestationPda,
  explorerAddr,
  explorerTx,
  fetchAttestation,
  fetchGateConfig,
  fetchLedger,
  fetchMandate,
  loadConfig,
  mandatePda,
} from "./gate";
import Adoption from "./Adoption";

const short = (s?: string | PublicKey) =>
  s ? `${s.toString().slice(0, 6)}…${s.toString().slice(-4)}` : "—";
const fmtTs = (t?: number | null) =>
  t ? new Date(t * 1000).toLocaleTimeString() : "—";

/** Nombre amigable de un actor conocido de la demo (legibilidad). */
function actorName(cfg: DemoConfig, addr?: string | null): string | null {
  if (!addr) return null;
  const m = new Map<string, string>([
    [cfg.owner.toBase58(), "Owner (humano)"],
    [cfg.serviceX.toBase58(), "Servicio X"],
    [cfg.serviceY.toBase58(), "Servicio Y"],
    [cfg.programId.toBase58(), "programa gate"],
    [cfg.mint.toBase58(), "USDC-test"],
    [cfg.sasCredential.toBase58(), "issuer mock (credential)"],
    [cfg.sasSchema.toBase58(), "schema human-verified"],
    [SAS_PROGRAM_ID.toBase58(), "programa SAS"],
  ]);
  if (cfg.issuer) m.set(cfg.issuer.toBase58(), "Issuer (verificador)");
  if (cfg.serviceZ) m.set(cfg.serviceZ.toBase58(), "Servicio Z");
  for (const a of cfg.agents) m.set(a.wallet.toBase58(), a.label);
  return m.get(addr) ?? null;
}

function Addr({
  cfg,
  addr,
  className,
}: {
  cfg: DemoConfig;
  addr?: string | PublicKey | null;
  className?: string;
}) {
  if (!addr) return <span className="muted">—</span>;
  const s = addr.toString();
  const name = actorName(cfg, s);
  return (
    <span className={className}>
      {name && <b className="actor">{name} </b>}
      <a href={explorerAddr(s)} target="_blank" rel="noreferrer">
        {short(s)}
      </a>
    </span>
  );
}

// ── Copy legible de los GateError (los mismos nombres del IDL) ─────────
const ERROR_EXPLAIN: Record<string, string> = {
  AttestationMissing: "el agente no tiene una attestation SAS válida — nadie verificó al humano detrás",
  IssuerNotRecognized: "attestation de otro issuer, schema o wallet",
  AttestationExpired: "la attestation está vencida",
  AttestationLevelTooLow: "el nivel de la attestation no alcanza el mínimo del gate",
  MandateBoundToOtherAgent: "el mandato pertenece a otro agente",
  MandateRevoked: "el owner revocó el mandato",
  MandateExpired: "el mandato está vencido",
  PayeeNotWhitelisted: "el servicio no está autorizado por el owner",
  OverPerTxLimit: "supera el máximo por pago del mandato",
  OverDailyCap: "supera el tope diario del mandato",
  WrongMint: "el mint no es el USDC-test configurado en el gate",
  AgentTokenMismatch: "la cuenta de tokens no pertenece al agente",
  ServiceTokenMismatch: "la cuenta de tokens no pertenece al servicio",
  InvalidAmount: "monto inválido",
  Unauthorized: "firmante no autorizado",
  MathOverflow: "desbordamiento aritmético",
  TooManyPayees: "la whitelist excede 8 payees",
};

const IX_LABEL: Record<string, string> = {
  Pay: "pago",
  InitMandate: "alta de mandato",
  RevokeMandate: "revocación de mandato",
  CloseMandate: "cierre de mandato",
  InitializeConfig: "config inicial del gate",
  UpdateConfig: "actualización de config",
  CloseConfig: "cierre de config",
};

const BADGE: Record<string, string> = {
  vigente: "ok",
  revocado: "bad",
  revocada: "bad",
  expirado: "warn",
  expirada: "warn",
  "nunca-emitida": "muted",
  inexistente: "muted",
  error: "bad",
};

/** Chip de veredicto de una fila del ledger. */
function Verdict({ r }: { r: LedgerRow }) {
  if (r.kind === "pago")
    return (
      <span className="verdict ok">
        <i></i>PAGO ACEPTADO
      </span>
    );
  if (r.kind === "fallida") {
    const esPago = !r.ixName || r.ixName === "Pay";
    return (
      <span className="verdict bad">
        <i></i>
        {esPago ? "PAGO RECHAZADO" : "OPERACIÓN FALLIDA"}
        {r.errName && (
          <em>
            {r.errName}
            {ERROR_EXPLAIN[r.errName] ? ` — ${ERROR_EXPLAIN[r.errName]}` : ""}
          </em>
        )}
      </span>
    );
  }
  return (
    <span className="verdict muted">
      {IX_LABEL[r.ixName ?? ""] ?? "operación del gate"}
    </span>
  );
}

const ATT_VERDICT: Record<string, { txt: string; cls: string }> = {
  vigente: { txt: "SÍ — humano verificado", cls: "ok" },
  expirada: { txt: "vencida", cls: "warn" },
  revocada: { txt: "revocada por el issuer", cls: "bad" },
  "nunca-emitida": { txt: "NO — sin attestation", cls: "muted" },
  error: { txt: "error al leer", cls: "bad" },
};

const LEDGER_FILTERS: { k: string; label: string }[] = [
  { k: "all", label: "todo" },
  { k: "pago", label: "pagos" },
  { k: "fallida", label: "rechazos" },
  { k: "otra-ix", label: "otras ops" },
];

export default function Dashboard() {
  const ref = useReveal<HTMLElement>();
  const [cfg, setCfg] = useState<DemoConfig | null>(null);
  const [tab, setTab] = useState<"audit" | "adopcion">("audit");
  const [agentIdx, setAgentIdx] = useState(0);
  const [gateCfg, setGateCfg] = useState<GateConfigView | null>(null);
  const [mandate, setMandate] = useState<MandateView | null>(null);
  const [att, setAtt] = useState<AttestationView | null>(null);
  const [attByAgent, setAttByAgent] = useState<Record<string, AttestationView>>({});
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(true);
  const [lf, setLf] = useState("all");
  const [lastTick, setLastTick] = useState<Date | null>(null);

  useEffect(() => {
    try {
      setCfg(loadConfig());
    } catch (e: any) {
      setErr(`config inválida — falta dashboard/.env (sync_dashboard_env.sh): ${e.message}`);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!cfg) return;
    try {
      const conn = new Connection(cfg.rpcUrl, "confirmed");
      const agent = cfg.agents[agentIdx].wallet;
      const mPda = mandatePda(cfg.owner, agent, cfg.programId);
      const aPda = attestationPda(cfg, agent);
      const [g, m, a, l, atts] = await Promise.all([
        fetchGateConfig(conn, cfg.programId),
        fetchMandate(conn, mPda),
        fetchAttestation(conn, aPda),
        fetchLedger(conn, mPda, cfg.programId),
        // Estado de attestation de TODOS los agentes — badges en la nav.
        Promise.all(
          cfg.agents.map((ag) =>
            fetchAttestation(conn, attestationPda(cfg, ag.wallet))
          )
        ),
      ]);
      setGateCfg(g);
      setMandate(m);
      setAtt(a);
      setLedger(l);
      const map: Record<string, AttestationView> = {};
      cfg.agents.forEach((ag, i) => (map[ag.wallet.toBase58()] = atts[i]));
      setAttByAgent(map);
      setErr(null);
      setLastTick(new Date());
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
    return (
      <main className="wrap">
        <article className="card wide">
          <h1>dnia · auditoría en vivo</h1>
          <p className="bad">{err}</p>
          <p className="note">
            el dashboard read-only necesita <code>dashboard/.env</code> — se
            genera con <code>bash scripts/sync_dashboard_env.sh</code> (solo
            pubkeys, sin secretos) y luego re-serve vite.
          </p>
        </article>
      </main>
    );
  if (!cfg) return <main className="wrap"><p>cargando…</p></main>;

  const attV = ATT_VERDICT[att?.estado ?? "error"] ?? ATT_VERDICT.error;
  const wl = mandate?.whitelist ?? [];
  const spendPct =
    mandate?.exists && Number(mandate.dailyCap) > 0
      ? Math.min(
          100,
          (Number(mandate.spentToday) / Number(mandate.dailyCap)) * 100
        )
      : 0;
  const shownLedger =
    lf === "all" ? ledger : ledger.filter((r) => r.kind === lf);
  const credDot =
    att?.estado === "vigente"
      ? "ok"
      : att?.estado === "expirada"
        ? "warn"
        : "bad";
  const mandDot =
    mandate?.estado === "vigente"
      ? "ok"
      : mandate?.estado === "expirado"
        ? "warn"
        : mandate?.exists
          ? "bad"
          : "off";

  return (
    <main className="wrap wrap--dash" ref={ref}>
      <header className="pagehead">
        <h1>Auditoría en vivo — la chain, sin intermediarios</h1>
        <p className="lede">
          Credencial, permiso, gasto del día y recibos —{" "}
          <b>leídos directo de devnet</b> cada 4 segundos. Cada cuenta y cada
          tx linkea al explorer. Este panel nunca escribe: es solo lectura.
        </p>
        <div className="meta">
          <span className="chip">
            <i className="dot ok"></i>solana{" "}
            <Gloss tip="devnet: la red de prueba pública de Solana — transacciones reales, plata de mentira">
              devnet
            </Gloss>
          </span>
          <a href={explorerAddr(cfg.programId)} target="_blank" rel="noreferrer">
            gate {short(cfg.programId)} ↗
          </a>
          <label>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />{" "}
            live (4s)
          </label>
          <button className="mini-btn" onClick={refresh}>
            refrescar
          </button>
        </div>
      </header>

      {/* ── Status strip: lo que ya pasó, de un vistazo ── */}
      <section className="statstrip fade-up" aria-live="polite">
        <div className="statcard">
          <div className="lbl">
            <Gloss tip="attestation SAS: credencial on-chain emitida por un verificador">
              credencial
            </Gloss>
          </div>
          <div className={`val ${credDot === "ok" ? "ok" : "bad"}`}>
            <i className={`dot ${att ? credDot : "off"}`}></i>
            {!att ? "…" : att.estado}
          </div>
        </div>
        <div className="statcard">
          <div className="lbl">
            <Gloss tip="Mandate PDA: la cuenta del programa que guarda la policy firmada por el dueño">
              permiso
            </Gloss>
          </div>
          <div
            className={`val ${
              !mandate ? "" : mandate.estado === "vigente" ? "ok" : mandate.exists ? "bad" : ""
            }`}
          >
            <i className={`dot ${mandDot}`}></i>
            {!mandate ? "…" : mandate.exists ? mandate.estado : "inexistente"}
          </div>
        </div>
        <div className="statcard">
          <div className="lbl">gasto hoy</div>
          <div className="val">
            {mandate?.exists ? `$${mandate.spentToday}` : "—"}
            {mandate?.exists && <small>de ${mandate.dailyCap}</small>}
          </div>
        </div>
        <div className="statcard">
          <div className="lbl">ledger</div>
          <div className="val">
            {ledger.length}
            <small>
              txs del mandato ·{" "}
              {lastTick
                ? lastTick.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "…"}
            </small>
          </div>
        </div>
      </section>

      <nav className="tabs">
        <button
          className={tab === "audit" ? "sel" : ""}
          onClick={() => setTab("audit")}
        >
          Auditoría
        </button>
        <button
          className={tab === "adopcion" ? "sel" : ""}
          onClick={() => setTab("adopcion")}
        >
          Adopción — cero fricción
        </button>
      </nav>

      {tab === "adopcion" ? (
        <Adoption cfg={cfg} gateCfg={gateCfg} />
      ) : (
        <>
          <nav className="agents">
            {cfg.agents.map((a, i) => {
              const st = attByAgent[a.wallet.toBase58()]?.estado;
              const chip =
                st === "vigente"
                  ? ["verificado", "ok"]
                  : st === "revocada"
                    ? ["attestation revocada", "bad"]
                    : st === "expirada"
                      ? ["attestation vencida", "warn"]
                      : ["sin attestation", "muted"];
              const dot =
                st === "vigente"
                  ? "ok"
                  : st === "expirada"
                    ? "warn"
                    : st === "revocada"
                      ? "bad"
                      : "off";
              return (
                <button
                  key={a.wallet.toBase58()}
                  className={i === agentIdx ? "sel" : ""}
                  onClick={() => setAgentIdx(i)}
                >
                  <i className={`dot ${dot}`}></i>
                  {a.label} <code>{short(a.wallet)}</code>{" "}
                  <span className={`mini ${chip[1]}`}>{chip[0]}</span>
                </button>
              );
            })}
          </nav>

          <section className="grid">
            {/* ── Panel: identidad (attestation SAS) ── */}
            <article className="card">
              <h3>
                ¿Quién está atrás? —{" "}
                <Gloss tip="attestation SAS: credencial on-chain emitida por un verificador">
                  credencial
                </Gloss>
              </h3>
              <p className={`badge ${attV.cls}`}>{attV.txt}</p>
              <dl>
                <dt>nivel</dt>
                <dd>{att?.level ?? "—"}</dd>
                <dt>emitida</dt>
                <dd>{fmtTs(att?.issuedAt)}</dd>
                <dt>vence</dt>
                <dd>{att?.expiry ? fmtTs(att.expiry) : "sin expiración"}</dd>
                <dt>
                  <Gloss tip="issuer: el verificador que emite (y puede revocar) las credenciales — hace el KYC off-chain">
                    issuer
                  </Gloss>
                </dt>
                <dd>
                  {gateCfg?.sasCredential ? (
                    <Addr cfg={cfg} addr={gateCfg.sasCredential} />
                  ) : (
                    <Addr cfg={cfg} addr={cfg.sasCredential} />
                  )}
                </dd>
                <dt>PDA</dt>
                <dd>
                  <Addr cfg={cfg} addr={att?.pda} />
                </dd>
              </dl>
              <p className="note">
                el gate exige nivel ≥ {gateCfg?.minLevel ?? "…"} de este issuer
                · sin PII on-chain: solo nivel + timestamp (INV-1) · revocada =
                cuenta cerrada por el issuer
              </p>
            </article>

            {/* ── Panel: mandato — la política en criollo ── */}
            <article className="card">
              <h3>
                ¿Qué autorizó el owner? —{" "}
                <Gloss tip="Mandate PDA: la cuenta del programa que guarda la policy firmada por el dueño — límites, whitelist, expiración">
                  permiso
                </Gloss>
              </h3>
              <p className={`badge ${BADGE[mandate?.estado ?? "inexistente"]}`}>
                {mandate?.exists ? mandate.estado : "inexistente"}
              </p>
              {mandate?.exists ? (
                <>
                  <p className="plain">
                    Puede pagar <b>hasta ${mandate.maxPerTx} por pago</b>, hasta{" "}
                    <b>${mandate.dailyCap} por día</b> (hoy lleva $
                    {mandate.spentToday}) y <b>solo a estos servicios</b>:
                  </p>
                  <ul className="payees">
                    {wl.length === 0 && (
                      <li className="muted">
                        ninguno — el agente no puede pagar a nadie
                      </li>
                    )}
                    {wl.map((w) => (
                      <li key={w}>
                        <Addr cfg={cfg} addr={w} />
                      </li>
                    ))}
                  </ul>
                  <div
                    className="usage"
                    role="progressbar"
                    aria-valuenow={Math.round(spendPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="porcentaje del tope diario gastado"
                  >
                    <div
                      className="usage-fill"
                      style={{
                        width: `${spendPct}%`,
                        background:
                          spendPct > 90
                            ? "linear-gradient(90deg, var(--bad), var(--warn))"
                            : undefined,
                      }}
                    ></div>
                  </div>
                  <dl>
                    <dt>total gastado</dt>
                    <dd>${mandate.totalSpent}</dd>
                    <dt>vence</dt>
                    <dd>
                      {mandate.expiry ? fmtTs(mandate.expiry) : "sin expiración"}
                    </dd>
                    <dt>PDA</dt>
                    <dd>
                      <Addr cfg={cfg} addr={mandate.pda} />
                    </dd>
                  </dl>
                </>
              ) : (
                <p className="plain muted">
                  Sin mandato: este agente no puede pagar nada a través del
                  gate — cualquier `pay` revierte.
                </p>
              )}
              <p className="note">
                solo el owner (<Addr cfg={cfg} addr={mandate?.owner ?? cfg.owner} />)
                puede crear, revocar o cerrar este mandato — revocado = el
                próximo pago revierte MandateRevoked.
              </p>
            </article>
          </section>

          {/* ── Panel: ledger de pagos ── */}
          <article className="card wide">
            <h3>Qué pasó — ledger del agente (txs del mandato)</h3>
            <div className="filters">
              {LEDGER_FILTERS.map((fl) => (
                <button
                  key={fl.k}
                  className={`fbtn ${lf === fl.k ? "sel" : ""}`}
                  onClick={() => setLf(fl.k)}
                >
                  {fl.label}
                </button>
              ))}
            </div>
            <div className="tablewrap tall">
              <table>
                <thead>
                  <tr>
                    <th>tx</th>
                    <th>resultado</th>
                    <th>monto</th>
                    <th>destino</th>
                    <th>invoice</th>
                    <th>hora</th>
                  </tr>
                </thead>
                <tbody>
                  {shownLedger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        {ledger.length === 0
                          ? "sin transacciones todavía — corré la demo y este ledger se llena solo"
                          : "sin transacciones para este filtro"}
                      </td>
                    </tr>
                  )}
                  {shownLedger.map((r) => (
                    <tr key={r.sig} className={r.kind === "fallida" ? "fail" : ""}>
                      <td>
                        <a href={explorerTx(r.sig)} target="_blank" rel="noreferrer">
                          {short(r.sig)}
                        </a>
                      </td>
                      <td>
                        <Verdict r={r} />
                      </td>
                      <td>{r.amount ? `$${r.amount}` : "—"}</td>
                      <td>
                        <Addr cfg={cfg} addr={r.payee} />
                      </td>
                      <td>
                        <code>{r.serviceRef ? r.serviceRef.slice(0, 12) + "…" : "—"}</code>
                      </td>
                      <td>{fmtTs(r.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">
              cada línea linkea al explorer — el recibo{" "}
              <Gloss tip="PaymentReceipt: recibo público que emite el programa en la misma tx — quién pagó, a quién, cuánto y cuándo">
                PaymentReceipt
              </Gloss>{" "}
              se parsea de los logs <code>Program data:</code> de la tx (R-05) ·
              los rechazos son txs fallidas reales on-chain con su GateError.
            </p>
          </article>
        </>
      )}

      {err && <p className="bad">{err}</p>}
    </main>
  );
}
