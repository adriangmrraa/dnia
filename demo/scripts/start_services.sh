#!/usr/bin/env bash
# S6 — levanta los servicios off-chain de la demo en background (WSL).
#   issuer :3401 · service-x :3402 · service-y :3403
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

# Espera de readiness (máx ~15s).
for i in $(seq 1 15); do
  okx=$(curl -sf --max-time 2 "http://localhost:$SERVICE_X_PORT/health" >/dev/null 2>&1 && echo 1)
  oky=$(curl -sf --max-time 2 "http://localhost:$SERVICE_Y_PORT/health" >/dev/null 2>&1 && echo 1)
  oki=$(curl -sf --max-time 3 "http://localhost:$ISSUER_PORT/status/$AGENT_A_WALLET" >/dev/null 2>&1 && echo 1)
  [ -n "$okx" ] && [ -n "$oky" ] && [ -n "$oki" ] && { echo "✓ los 3 servicios responden"; exit 0; }
  sleep 1
done
echo "⚠ algún servicio no respondió — ver logs/*.log" >&2
tail -n 15 logs/issuer.log logs/service-x.log logs/service-y.log >&2
exit 1
