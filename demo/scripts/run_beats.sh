#!/usr/bin/env bash
# S8 — Demo de 6 beats contra DEVNET REAL (R-10).
# Encadena: attest A → init_mandate → pay feliz → pay B huérfano →
# over-limit + payee Y → revoke + pay final revertido.
# Imprime signatures + URLs de explorer; verifica el resultado esperado
# de cada beat y falla (exit 1) si alguno no se comporta.
#
# Pre-requisito: issuer :3401, service-x :3402, service-y :3403 corriendo
# (bash scripts/start_services.sh) y demo/.env poblado (S5).
#
# Uso (WSL, parado en demo/):  bash scripts/run_beats.sh
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

ISSUER="http://localhost:${ISSUER_PORT:-3401}"
X="http://localhost:${SERVICE_X_PORT:-3402}/api/premium"
Y="http://localhost:${SERVICE_Y_PORT:-3403}/api/premium"
OWNER="npx tsx scripts/owner.ts"
PAY="npx tsx agent/src/pay.ts"
RESULTS=()

banner() { echo; echo "══════════ BEAT $1 — $2 ══════════"; }
ok()     { RESULTS+=("BEAT $1 ✓ $2"); echo "──> ✓ $2"; }
fail()   { RESULTS+=("BEAT $1 ✗ $2"); echo "──> ✗ FALLO: $2"; }
sigline(){ echo "$1" | grep -oE '[1-9A-HJ-NP-Za-km-z]{80,90}' | head -1; }

# ── Beat 1 · attest A ────────────────────────────────────────────────────
banner 1 "attest A (issuer SAS → human-verified level 2)"
out=$(curl -s -X POST "$ISSUER/attest" -H 'content-type: application/json' \
  -d "{\"wallet\":\"$AGENT_A_WALLET\",\"level\":2}")
echo "$out"
s=$(sigline "$out")
if [ -n "$s" ]; then ex="https://explorer.solana.com/tx/$s?cluster=devnet"
  echo "  tx $s"; echo "  $ex"; ok 1 "attestation A emitida — $s"
elif echo "$out" | grep -q '"existing":true'; then
  ok 1 "attestation A ya existía (idempotente)"
else fail 1 "attest A: $out"; fi

# ── Beat 2 · init_mandate A ──────────────────────────────────────────────
banner 2 "init_mandate A (max \$5/tx · cap \$10/día · whitelist = X)"
st=$($OWNER status --agent a 2>&1); echo "$st"
if echo "$st" | grep -q "revoked      true"; then
  echo "── mandato revocado: close + re-init para la demo"
  $OWNER close --agent a
  st="reinit"
fi
if echo "$st" | grep -q "inexistente" || [ "$st" = "reinit" ]; then
  out=$($OWNER init-mandate --agent a --max 5 --cap 10 --payees x 2>&1)
  echo "$out"; s=$(sigline "$out")
  [ -n "$s" ] && ok 2 "mandato creado — $s" || fail 2 "init_mandate: $out"
else
  ok 2 "mandato ya vigente (idempotente — se reutiliza)"
fi

# ── Beat 3 · pay feliz A→X ──────────────────────────────────────────────
banner 3 "pago feliz A→X \$0.50 (402 → pay on-chain → 200)"
out=$($PAY "$X" 0.50 2>&1); echo "$out"
s=$(sigline "$out")
if echo "$out" | grep -q "pay confirmado" && echo "$out" | grep -q "← 200"; then
  ok 3 "pago confirmado + recurso 200 — $s"
else fail 3 "pay A→X: $(echo "$out" | tail -3)"; fi

# ── Beat 4 · B huérfano (sin attestation) ────────────────────────────────
# Los pays que revierten van con --skip-preflight (W2): el revert aterriza
# on-chain como tx fallida con signature real — verificable en explorer.
banner 4 "pago B→X \$0.50 sin attestation → AttestationMissing (tx fallida on-chain)"
bst=$(curl -s "$ISSUER/status/$AGENT_B_WALLET")
echo "  status B: $bst"
if echo "$bst" | grep -q '"status":"vigente"'; then
  echo "  (B estaba attestado — revoco para el beat)"
  curl -s -X POST "$ISSUER/revoke" -H 'content-type: application/json' \
    -d "{\"wallet\":\"$AGENT_B_WALLET\"}"; echo; sleep 2
fi
out=$($PAY "$X" 0.50 --keypair keys/agent-b.json --skip-preflight 2>&1); echo "$out"
s=$(sigline "$out")
if echo "$out" | grep -q "AttestationMissing" && [ -n "$s" ]; then
  ok 4 "revertido con AttestationMissing — tx fallida $s"
else fail 4 "se esperaba AttestationMissing+sig: $(echo "$out" | tail -2)"; fi

# ── Beat 5 · over-limit + payee no whitelisted ───────────────────────────
banner 5 "A→X \$10 → OverPerTxLimit · A→Y \$0.50 → PayeeNotWhitelisted (txs fallidas on-chain)"
out=$($PAY "$X" 10 --skip-preflight 2>&1); echo "$out"
s=$(sigline "$out")
echo "$out" | grep -q "OverPerTxLimit" && [ -n "$s" ] \
  && ok 5a "revertido con OverPerTxLimit — tx fallida $s" \
  || fail 5a "esperaba OverPerTxLimit+sig: $(echo "$out" | tail -2)"
out=$($PAY "$Y" 0.50 --skip-preflight 2>&1); echo "$out"
s=$(sigline "$out")
echo "$out" | grep -q "PayeeNotWhitelisted" && [ -n "$s" ] \
  && ok 5b "revertido con PayeeNotWhitelisted — tx fallida $s" \
  || fail 5b "esperaba PayeeNotWhitelisted+sig: $(echo "$out" | tail -2)"

# ── Beat 6 · revoke mandato + pay final revertido ────────────────────────
banner 6 "owner revoca mandato A → siguiente pay → MandateRevoked (tx fallida on-chain)"
out=$($OWNER revoke --agent a 2>&1); echo "$out"; s=$(sigline "$out")
[ -n "$s" ] && echo "  explorer: https://explorer.solana.com/tx/$s?cluster=devnet"
sleep 3
out=$($PAY "$X" 0.50 --skip-preflight 2>&1); echo "$out"
s2=$(sigline "$out")
if echo "$out" | grep -q "MandateRevoked" && [ -n "$s2" ]; then
  ok 6 "revoke $s → pay revertido MandateRevoked — tx fallida $s2 (¡mirá el dashboard!)"
else fail 6 "esperaba MandateRevoked+sig: $(echo "$out" | tail -2)"; fi

# ── Resumen ──────────────────────────────────────────────────────────────
echo; echo "══════════ RESUMEN DE BEATS ══════════"
printf '%s\n' "${RESULTS[@]}"
fails=$(printf '%s\n' "${RESULTS[@]}" | grep -c "✗" || true)
echo; [ "$fails" -eq 0 ] && echo "LOS 6 BEATS OK — devnet real" \
  || { echo "$fails beat(s) fallaron"; exit 1; }
