#!/usr/bin/env bash
# Chequeo de estado devnet: pubkeys de actores + balances + .env.
# Solo lectura. Uso (WSL, en demo/): bash scripts/check_devnet.sh
set -uo pipefail
cd "$(dirname "$0")/.."

echo "=== pubkeys ==="
for k in owner agent-a agent-b issuer service-x service-y program-agentic_gate; do
  f="keys/$k.json"
  if [ -f "$f" ]; then
    printf '%-24s %s\n' "$k" "$(solana-keygen pubkey "$f")"
  else
    printf '%-24s (falta)\n' "$k"
  fi
done

echo "=== balances devnet ==="
for k in owner agent-a agent-b issuer; do
  f="keys/$k.json"
  [ -f "$f" ] || continue
  pk=$(solana-keygen pubkey "$f")
  bal=$(solana balance "$pk" --url devnet 2>/dev/null | awk '{print $1}')
  printf '%-10s %s → %s SOL\n' "$k" "$pk" "${bal:-?}"
done

echo "=== .env ==="
[ -f .env ] && cat .env || echo "(sin .env)"
