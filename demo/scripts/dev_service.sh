#!/usr/bin/env bash
# Levanta UN servicio de la demo en FOREGROUND — para shells persistentes
# (tmux, una terminal dedicada, o una sesión `wsl` viva). En WSL1 los
# procesos en segundo plano mueren si no queda ningún foreground vivo;
# por eso este script usa `exec` (el servicio ES el proceso del shell).
#
# Uso (WSL, parado en demo/):
#   bash scripts/dev_service.sh issuer   # :3401 mock issuer SAS
#   bash scripts/dev_service.sh x        # :3402 servicio gateado (payee X)
#   bash scripts/dev_service.sh y        # :3403 servicio gateado (payee Y)
#   bash scripts/dev_service.sh runner   # :3406 corre run_beats.sh desde /demo
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; . ./.env; set +a

case "${1:-}" in
  issuer)
    echo "issuer → :${ISSUER_PORT:-3401}"
    exec npx tsx services/issuer/src/index.ts
    ;;
  x)
    echo "service-x → :${SERVICE_X_PORT:-3402} payee=$SERVICE_X_WALLET"
    PAYEE_WALLET=$SERVICE_X_WALLET PORT=${SERVICE_X_PORT:-3402} \
      exec npx tsx services/service-x/src/index.ts
    ;;
  y)
    echo "service-y → :${SERVICE_Y_PORT:-3403} payee=$SERVICE_Y_WALLET"
    PAYEE_WALLET=$SERVICE_Y_WALLET PORT=${SERVICE_Y_PORT:-3403} \
      exec npx tsx services/service-x/src/index.ts
    ;;
  z)
    [ -n "${SERVICE_Z_WALLET:-}" ] || {
      echo "falta SERVICE_Z_WALLET en .env — correr: npx tsx scripts/adopt_service.ts z" >&2
      exit 1
    }
    echo "service-z → :${SERVICE_Z_PORT:-3405} payee=$SERVICE_Z_WALLET"
    PAYEE_WALLET=$SERVICE_Z_WALLET PORT=${SERVICE_Z_PORT:-3405} \
      exec npx tsx services/service-z/src/index.ts
    ;;
  runner)
    echo "demo-runner → :${DEMO_RUNNER_PORT:-3406}"
    exec npx tsx services/demo-runner/src/index.ts
    ;;
  *)
    echo "uso: dev_service.sh issuer|x|y|z|runner" >&2; exit 2 ;;
esac
