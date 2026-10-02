#!/usr/bin/env bash
# Dumpea el programa SAS real de devnet a tests/fixtures/sas.so.
# Idempotente: saltea si el fixture ya existe; --force re-descarga.
# El .so se commitea → `anchor test` carga SAS en el validator local offline.
#
# Uso (WSL): bash scripts/dump_sas.sh [--force]
set -euo pipefail

SAS_PROGRAM="22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$SCRIPT_DIR/../tests/fixtures/sas.so"

if [ -f "$OUT" ] && [ "${1:-}" != "--force" ]; then
  echo "sas.so ya existe ($(wc -c < "$OUT") bytes) — skip (usar --force para re-descargar)"
  exit 0
fi

mkdir -p "$(dirname "$OUT")"
solana program dump "$SAS_PROGRAM" "$OUT" -u devnet
echo "sas.so actualizado: $(wc -c < "$OUT") bytes"
