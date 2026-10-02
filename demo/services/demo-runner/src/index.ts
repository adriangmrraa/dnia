/**
 * S9 — Demo runner: corre `bash scripts/run_beats.sh` (los 6 beats contra
 * devnet REAL) a pedido del sitio — la página /demo lo llama vía el proxy
 * `/svc/runner` de vite. Las transacciones que genera son reales.
 *
 *   POST /run   → streamea stdout+stderr del script como text/plain chunked;
 *                 la última línea del stream es `__RESULT__` + JSON con
 *                 {ok, exitCode, output, startedAt, finishedAt, timedOut?}.
 *                 409 si ya hay una corrida en curso (una a la vez).
 *   GET  /health → {ok, service, running} — el sitio lo usa para el chip
 *                 y para habilitar el botón ▶.
 *
 * cwd del spawn = demo/ (run_beats.sh carga ./.env solo — acá también llega
 * el env ya sourceado si se levantó con dev_service.sh / start_services.sh).
 * Misma regla WSL1 que el resto: foreground-managed shell —
 *   bash scripts/dev_service.sh runner
 */
import express from "express";
import { spawn, type ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";

const app = express();
app.use(express.json());

/** Portada del env (start_services.sh inyecta PORT vía DEMO_RUNNER_PORT). */
const PORT = Number(process.env.DEMO_RUNNER_PORT ?? 3406);
/** Tope duro de la corrida (~6 min; los beats tardan ~90-120s). */
const TIMEOUT_MS = Number(process.env.RUNNER_TIMEOUT_MS ?? 6 * 60 * 1000);

// demo/ = raíz del spawn. argv[1] es el entry tsx
// (services/demo-runner/src/index.ts → ../../..); fallback: cwd.
const DEMO_DIR = process.argv[1]
  ? path.resolve(path.dirname(process.argv[1]), "../../..")
  : process.cwd();
const SCRIPT = path.join("scripts", "run_beats.sh");

interface RunState {
  child: ChildProcess;
  startedAt: string;
}
let current: RunState | null = null;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "demo-runner", running: current !== null });
});

app.post("/run", (req, res) => {
  if (current) {
    res.status(409).json({
      error: "ya hay una corrida en curso — esperá a que termine",
      startedAt: current.startedAt,
    });
    return;
  }
  if (!fs.existsSync(path.join(DEMO_DIR, SCRIPT))) {
    res.status(500).json({ error: `no existe ${SCRIPT}`, cwd: DEMO_DIR });
    return;
  }

  const startedAt = new Date().toISOString();
  // detached: el bash es líder de su grupo de procesos — kill(-pid) mata el
  // árbol entero (bash + npx tsx + curl). Si solo matamos al bash, los
  // nietos (un pay/owner.ts a mitad de tx) quedan huérfanos corriendo.
  const child = spawn("bash", [SCRIPT], {
    cwd: DEMO_DIR,
    env: process.env,
    detached: true,
  });
  current = { child, startedAt };

  const killTree = (sig: NodeJS.Signals) => {
    try {
      if (child.pid) process.kill(-child.pid, sig);
    } catch {
      try {
        child.kill(sig);
      } catch {
        /* ya muerto */
      }
    }
  };

  // Stream crudo (el sitio lo muestra en una terminal) + buffer para el
  // JSON final — un cliente que no streamea puede leer todo de `output`.
  res.status(200);
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-accel-buffering", "no");
  res.flushHeaders();

  const chunks: Buffer[] = [];
  const write = (chunk: Buffer | string) => {
    try {
      res.write(chunk);
    } catch {
      /* socket roto — el close handler mata al child */
    }
  };
  const onData = (b: Buffer) => {
    chunks.push(b);
    write(b);
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);

  let timedOut = false;
  const killer = setTimeout(() => {
    timedOut = true;
    write(`\n[runner] timeout de ${Math.round(TIMEOUT_MS / 1000)}s — matando la corrida\n`);
    killTree("SIGTERM");
    setTimeout(() => killTree("SIGKILL"), 5000).unref();
  }, TIMEOUT_MS);

  // Cliente cortó la conexión a mitad de stream → no dejar el beat huérfano
  // (WSL1: un run suelto puede colgar el único terminal vivo del usuario).
  res.on("close", () => {
    if (!res.writableFinished && current?.child === child && child.exitCode === null) {
      console.log(`[runner] cliente desconectado — matando corrida (pid ${child.pid})`);
      killTree("SIGTERM");
      setTimeout(() => killTree("SIGKILL"), 5000).unref();
    }
  });

  const finish = (exitCode: number | null, spawnError?: string) => {
    clearTimeout(killer);
    const finishedAt = new Date().toISOString();
    const output = Buffer.concat(chunks).toString("utf8");
    const result = {
      ok: exitCode === 0 && !timedOut && !spawnError,
      exitCode,
      output,
      startedAt,
      finishedAt,
      ...(timedOut ? { timedOut: true } : {}),
      ...(spawnError ? { error: spawnError } : {}),
    };
    write(`\n__RESULT__${JSON.stringify(result)}\n`);
    current = null;
    res.end();
  };

  child.on("error", (e) => finish(null, String(e?.message ?? e)));
  child.on("close", (code) => {
    if (current?.child !== child) return; // spawn error ya reportó
    finish(typeof code === "number" ? code : null);
  });
});

app.listen(PORT, () => {
  console.log(`demo-runner en :${PORT} — POST /run corre ${SCRIPT}`);
  console.log(`cwd ${DEMO_DIR} · timeout ${TIMEOUT_MS}ms`);
});
