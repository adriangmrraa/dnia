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
  *)
    echo "uso: dev_service.sh issuer|x|y" >&2; exit 2 ;;
esac
