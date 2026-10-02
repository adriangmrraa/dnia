#!/usr/bin/env bash
# S5 — build + deploy del programa a devnet + initialize_config.
# Idempotente: si el programa ya está deployed con el mismo binario, anchor
# lo detecta; init_config.ts es idempotente por sí mismo.
#
# Prerequisito: scripts/setup_devnet.sh + setup_sas.ts ya corrieron (owner
# con ≥3 SOL, SAS_CREDENTIAL/SAS_SCHEMA en .env).
#
# Uso (WSL, parado en demo/): bash scripts/build_deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Keypair que fija el program id (declare_id == pubkey de este archivo).
# En la copia WSL vive SOLO en target/deploy/ (wsl_sync lo copia desde
# keys/program-agentic_gate.json del repo — keys/ no se sincroniza).
mkdir -p target/deploy
if [ -f keys/program-agentic_gate.json ]; then
  cp keys/program-agentic_gate.json target/deploy/agentic_gate-keypair.json
fi
[ -f target/deploy/agentic_gate-keypair.json ] || {
  echo "falta target/deploy/agentic_gate-keypair.json — correr wsl_sync.sh push"
  exit 1
}

anchor build
anchor deploy \
  --provider.cluster devnet \
  --provider.wallet keys/owner.json

# Program id = pubkey del keypair fijo → .env (init_config.ts lo requiere).
PROGRAM_ID=$(solana-keygen pubkey target/deploy/agentic_gate-keypair.json)
if grep -q "^AGENTIC_GATE_PROGRAM_ID=" .env 2>/dev/null; then
  sed -i "s|^AGENTIC_GATE_PROGRAM_ID=.*|AGENTIC_GATE_PROGRAM_ID=$PROGRAM_ID|" .env
else
  [ -s .env ] && [ -n "$(tail -c1 .env)" ] && echo >> .env
  echo "AGENTIC_GATE_PROGRAM_ID=$PROGRAM_ID" >> .env
fi
echo "AGENTIC_GATE_PROGRAM_ID=$PROGRAM_ID"

npx tsx scripts/init_config.ts

echo "✓ programa live en devnet:"
solana program show "$PROGRAM_ID" --url devnet | head -8
