#!/usr/bin/env bash
# S6 — chequeo de aceptación: ciclo revoke/re-attest del issuer contra el
# agente A en devnet, con /status reflejando cada estado.
# Uso (WSL, demo/): bash scripts/s6_check.sh
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
ISSUER="http://localhost:${ISSUER_PORT:-3401}"
W=$AGENT_A_WALLET

echo "=== status antes ==="
curl -s "$ISSUER/status/$W"; echo
echo "=== revoke ==="
curl -s -X POST "$ISSUER/revoke" -H 'content-type: application/json' \
  -d "{\"wallet\":\"$W\"}"; echo
sleep 2
echo "=== status post-revoke (esperado: revocada) ==="
curl -s "$ISSUER/status/$W"; echo
echo "=== re-attest level 2 ==="
curl -s -X POST "$ISSUER/attest" -H 'content-type: application/json' \
  -d "{\"wallet\":\"$W\",\"level\":2}"; echo
sleep 2
echo "=== status final (esperado: vigente) ==="
curl -s "$ISSUER/status/$W"; echo
