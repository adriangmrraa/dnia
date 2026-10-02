#!/usr/bin/env bash
# S6 — levanta los servicios off-chain de la demo en background (WSL).
#   issuer :3401 · service-x :3402 · service-y :3403 · demo-runner :3406
# Idempotente: si ya responden /health o status, no duplica procesos.
# Logs en demo/logs/*.log. Parar con scripts/stop_services.sh.
#
# Uso (WSL, parado en demo/): bash scripts/start_services.sh
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p logs
# shellcheck disable=SC1091
set -a; . ./.env; set +a
ISSUER_PORT=${ISSUER_PORT:-3401}
SERVICE_X_PORT=${SERVICE_X_PORT:-3402}
SERVICE_Y_PORT=${SERVICE_Y_PORT:-3403}
DEMO_RUNNER_PORT=${DEMO_RUNNER_PORT:-3406}

up() { # $1=nombre $2=port $3=path-health
  curl -sf --max-time 2 "http://localhost:$2$3" >/dev/null 2>&1
}

if up issuer "$ISSUER_PORT" "/status/$AGENT_A_WALLET"; then
  echo "issuer ya corre en :$ISSUER_PORT"
else
  nohup npx tsx services/issuer/src/index.ts > logs/issuer.log 2>&1 &
  echo "issuer pid $! → :$ISSUER_PORT"
fi

if up service-x "$SERVICE_X_PORT" /health; then
  echo "service-x ya corre en :$SERVICE_X_PORT"
else
  PAYEE_WALLET=$SERVICE_X_WALLET PORT=$SERVICE_X_PORT \
    nohup npx tsx services/service-x/src/index.ts > logs/service-x.log 2>&1 &
  echo "service-x pid $! → :$SERVICE_X_PORT (payee $SERVICE_X_WALLET)"
fi

if up service-y "$SERVICE_Y_PORT" /health; then
  echo "service-y ya corre en :$SERVICE_Y_PORT"
else
  PAYEE_WALLET=$SERVICE_Y_WALLET PORT=$SERVICE_Y_PORT \
    nohup npx tsx services/service-x/src/index.ts > logs/service-y.log 2>&1 &
  echo "service-y pid $! → :$SERVICE_Y_PORT (payee $SERVICE_Y_WALLET)"
fi

# service-z es opcional: solo si adopt_service.ts ya lo dio de alta en .env
if [ -n "${SERVICE_Z_WALLET:-}" ]; then
  SERVICE_Z_PORT=${SERVICE_Z_PORT:-3405}
  if up service-z "$SERVICE_Z_PORT" /health; then
    echo "service-z ya corre en :$SERVICE_Z_PORT"
  else
    PAYEE_WALLET=$SERVICE_Z_WALLET PORT=$SERVICE_Z_PORT \
      nohup npx tsx services/service-z/src/index.ts > logs/service-z.log 2>&1 &
    echo "service-z pid $! → :$SERVICE_Z_PORT (payee $SERVICE_Z_WALLET)"
  fi
fi

# demo-runner: habilita el botón "▶ Correr demo" del sitio /demo — ejecuta
# run_beats.sh por HTTP (POST /run). No gatea nada, pero va con el lifecycle.
if up demo-runner "$DEMO_RUNNER_PORT" /health; then
  echo "demo-runner ya corre en :$DEMO_RUNNER_PORT"
else
  nohup npx tsx services/demo-runner/src/index.ts > logs/demo-runner.log 2>&1 &
  echo "demo-runner pid $! → :$DEMO_RUNNER_PORT"
fi

# Espera de readiness (máx ~15s). El `|| true` es necesario: una asignación
# `var=$(curl -sf ...)` que falla devuelve exit≠0 y `set -e` mataría el
# script silenciosamente antes de reintentar.
for i in $(seq 1 15); do
  okx=$(curl -sf --max-time 2 "http://localhost:$SERVICE_X_PORT/health" >/dev/null 2>&1 && echo 1 || true)
  oky=$(curl -sf --max-time 2 "http://localhost:$SERVICE_Y_PORT/health" >/dev/null 2>&1 && echo 1 || true)
  oki=$(curl -sf --max-time 3 "http://localhost:$ISSUER_PORT/status/$AGENT_A_WALLET" >/dev/null 2>&1 && echo 1 || true)
  okr=$(curl -sf --max-time 2 "http://localhost:$DEMO_RUNNER_PORT/health" >/dev/null 2>&1 && echo 1 || true)
  [ -n "$okx" ] && [ -n "$oky" ] && [ -n "$oki" ] && [ -n "$okr" ] && { echo "✓ los 4 servicios responden"; exit 0; }
  sleep 1
done
echo "⚠ algún servicio no respondió — ver logs/*.log" >&2
tail -n 15 logs/issuer.log logs/service-x.log logs/service-y.log logs/demo-runner.log >&2
exit 1
