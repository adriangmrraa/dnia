#!/usr/bin/env bash
# Genera dashboard/.env con variables VITE_* leídas de demo/.env.
# Solo pubkeys/direcciones públicas — nunca keypairs (INV-5, dashboard es read-only).
# Uso (WSL, parado en demo/): bash scripts/sync_dashboard_env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

cat > dashboard/.env <<EOF
# Generado por scripts/sync_dashboard_env.sh — no editar a mano.
VITE_RPC_URL=${SOLANA_RPC_URL:-https://api.devnet.solana.com}
VITE_PROGRAM_ID=$AGENTIC_GATE_PROGRAM_ID
VITE_OWNER_WALLET=$OWNER_WALLET
VITE_AGENT_A_WALLET=$AGENT_A_WALLET
VITE_AGENT_B_WALLET=$AGENT_B_WALLET
VITE_SAS_CREDENTIAL=$SAS_CREDENTIAL
VITE_SAS_SCHEMA=$SAS_SCHEMA
VITE_USDC_MINT=$USDC_MINT
VITE_SERVICE_X_WALLET=$SERVICE_X_WALLET
VITE_SERVICE_Y_WALLET=$SERVICE_Y_WALLET
EOF
echo "dashboard/.env escrito:"
cat dashboard/.env
