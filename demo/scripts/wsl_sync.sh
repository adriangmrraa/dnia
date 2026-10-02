#!/usr/bin/env bash
# Sync del workspace demo/ ↔ copia de trabajo en WSL home.
# Los builds de cargo/anchor corren en ~/agentic-dni-demo (fuera de /mnt/c,
# que es muy lento para IO intensivo). El repo Windows sigue siendo la fuente
# de verdad: las fuentes se editan ahí y se copian de vuelta con `pull`.
#
# Uso (desde Git Bash, parado en cualquier lado):
#   wsl -d Ubuntu -- bash -lc "bash '/mnt/c/Users/Asus/Documents/Hackaton Solana/demo/scripts/wsl_sync.sh' push"
#   wsl -d Ubuntu -- bash -lc "bash '/mnt/c/Users/Asus/Documents/Hackaton Solana/demo/scripts/wsl_sync.sh' pull"
#
#   push: repo → ~/agentic-dni-demo (espejo limpio, sin target/node_modules/keys/.env)
#         + copia keys/program-agentic_gate.json → target/deploy/agentic_gate-keypair.json
#   pull: ~/agentic-dni-demo → repo (fuentes sin --delete + target/idl, target/types,
#         target/deploy/*.so — NUNCA keypairs)
set -euo pipefail

WSL_WORK="${WSL_WORK:-$HOME/agentic-dni-demo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

EXCLUDES=(
  --exclude 'target/'
  --exclude 'node_modules/'
  --exclude 'keys/'
  --exclude '.env'
  --exclude 'test-ledger/'
  --exclude '.anchor/'
  --exclude '.surfpool/'
  --exclude 'dist/'
)

case "${1:-}" in
  push)
    mkdir -p "$WSL_WORK"
    rsync -a --delete "${EXCLUDES[@]}" "$DEMO_DIR/" "$WSL_WORK/"
    # Keypair del programa: única pieza de keys/ que también existe del lado WSL
    # (define el program id en localnet/devnet). Nunca vuelve al repo.
    if [ -f "$DEMO_DIR/keys/program-agentic_gate.json" ]; then
      mkdir -p "$WSL_WORK/target/deploy"
      cp "$DEMO_DIR/keys/program-agentic_gate.json" \
         "$WSL_WORK/target/deploy/agentic_gate-keypair.json"
    fi
    echo "push OK → $WSL_WORK"
    ;;
  pull)
    [ -d "$WSL_WORK" ] || { echo "no existe $WSL_WORK (hacer push primero)"; exit 1; }
    rsync -a "${EXCLUDES[@]}" "$WSL_WORK/" "$DEMO_DIR/"
    mkdir -p "$DEMO_DIR/target/idl" "$DEMO_DIR/target/types" "$DEMO_DIR/target/deploy"
    for f in "$WSL_WORK"/target/idl/*.json; do [ -e "$f" ] && cp "$f" "$DEMO_DIR/target/idl/"; done
    for f in "$WSL_WORK"/target/types/*.ts;  do [ -e "$f" ] && cp "$f" "$DEMO_DIR/target/types/"; done
    for f in "$WSL_WORK"/target/deploy/*.so; do [ -e "$f" ] && cp "$f" "$DEMO_DIR/target/deploy/"; done
    echo "pull OK → $DEMO_DIR"
    ;;
  *)
    echo "uso: wsl_sync.sh push|pull"; exit 1 ;;
esac
