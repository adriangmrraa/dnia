#!/usr/bin/env bash
# S5 — Setup de actores reales en devnet. IDEMPOTENTE: keypairs existentes se
# reutilizan, airdrops solo si falta saldo, mint/ATAs idempotentes.
#
#   1. Keypairs en demo/keys/ (gitignored): owner, agent-a, agent-b, issuer,
#      service-x, service-y.
#   2. Airdrops SOL (owner paga rent/fees; issuer firma SAS; agentes fees).
#   3. Mint USDC-test + ATAs + mintTo 100 USDC a cada agente (setup_tokens.ts).
#   4. Escribe addresses en demo/.env (upsert — nunca pisa claves ajenas).
#
# Uso (WSL, parado en demo/): bash scripts/setup_devnet.sh
set -euo pipefail
cd "$(dirname "$0")/.."

KEYS=keys
mkdir -p "$KEYS"

new_keypair() { # $1 = nombre (keys/<nombre>.json)
  local f="$KEYS/$1.json"
  if [ -f "$f" ]; then
    echo "keypair $1 ya existe — reutilizo" >&2
  else
    solana-keygen new --no-bip39-passphrase -s -o "$f" -f >/dev/null
    echo "keypair $1 creado" >&2
  fi
  solana-keygen pubkey "$f"
}

OWNER=$(new_keypair owner)
AGENT_A=$(new_keypair agent-a)
AGENT_B=$(new_keypair agent-b)
ISSUER=$(new_keypair issuer)
SERVICE_X=$(new_keypair service-x)
SERVICE_Y=$(new_keypair service-y)

# .env: upsert simple (una línea KEY=val; sin depender de tsx todavía)
env_upsert() { # $1=KEY $2=VAL
  local f=.env
  touch "$f"
  if grep -q "^$1=" "$f"; then sed -i "s|^$1=.*|$1=$2|" "$f";
  else
    # si el archivo no termina en newline, el append fusionaría líneas
    [ -s "$f" ] && [ -n "$(tail -c1 "$f")" ] && echo >> "$f"
    echo "$1=$2" >> "$f"
  fi
}

env_upsert OWNER_KEYPAIR "keys/owner.json"
env_upsert AGENT_A_KEYPAIR "keys/agent-a.json"
env_upsert AGENT_B_KEYPAIR "keys/agent-b.json"
env_upsert ISSUER_KEYPAIR "keys/issuer.json"
env_upsert OWNER_WALLET "$OWNER"
env_upsert AGENT_A_WALLET "$AGENT_A"
env_upsert AGENT_B_WALLET "$AGENT_B"
env_upsert ISSUER_WALLET "$ISSUER"
env_upsert SERVICE_X_WALLET "$SERVICE_X"
env_upsert SERVICE_Y_WALLET "$SERVICE_Y"
env_upsert SOLANA_RPC_URL "${SOLANA_RPC_URL:-https://api.devnet.solana.com}"

echo "── direcciones ──"
echo "owner    $OWNER"
echo "agentA   $AGENT_A"
echo "agentB   $AGENT_B"
echo "issuer   $ISSUER"
echo "serviceX $SERVICE_X"
echo "serviceY $SERVICE_Y"

# ── Airdrops (idempotentes via ensureSol) ───────────────────────────────
npx tsx scripts/fund_actors.ts

# ── Mint + ATAs + fondeo USDC ───────────────────────────────────────────
npx tsx scripts/setup_tokens.ts

echo "✓ setup_devnet completo (ver .env)"
