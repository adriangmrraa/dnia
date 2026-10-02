#!/usr/bin/env bash
# Frena los servicios de la demo levantados por start_services.sh.
# Uso (WSL, parado en demo/): bash scripts/stop_services.sh
set -uo pipefail
pkill -f "tsx services/issuer/src/index.ts" 2>/dev/null && echo "issuer frenado" || true
pkill -f "tsx services/service-x/src/index.ts" 2>/dev/null && echo "service-x/y frenados" || true
exit 0
