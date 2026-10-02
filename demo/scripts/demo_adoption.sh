#!/usr/bin/env bash
# Beat de adopción "cero fricción": un servicio NUEVO (service-z, :3405)
# queda gate-protected en vivo — sin cuenta, sin API key, sin permiso.
#
# Narrativa:
#   1. alta del adoptante: wallet + ATA USDC-test (off-chain, nadie autoriza)
#   2. service-z corre con ~10 líneas de integración (services/gate-check.ts)
#   3. el servicio YA responde 402 con requirements del gate
#   4. agent A intenta pagar → la CHAIN decide: PayeeNotWhitelisted
#      (adoptar es gratis; que un pagador te autorice es la política)
#   5. el owner whitelista a z (MVP: close + re-init del mandato —
#      update_mandate está en roadmap)
#   6. mismo pago → 200 + PaymentReceipt on-chain
#
# WSL1-safe: service-z vive como job del script (los procesos background
# mueren al terminar la invocación — para dejarlo corriendo usar
# `bash scripts/dev_service.sh z` en una sesión persistente).
#
# Pre-requisito: demo/.env poblado. NO requiere issuer/x/y corriendo.
# Uso (WSL, parado en demo/): bash scripts/demo_adoption.sh
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
mkdir -p logs

ZPORT=${SERVICE_Z_PORT:-3405}
ZHEALTH="http://localhost:$ZPORT/health"
ZURL="http://localhost:$ZPORT/api/premium"
PAY="npx tsx agent/src/pay.ts"
OWNER="npx tsx scripts/owner.ts"
RESULTS=()

banner(){ echo; echo "══════════ ADOPCIÓN $1 — $2 ══════════"; }
ok(){ RESULTS+=("PASO $1 ✓ $2"); echo "──> ✓ $2"; }
fail(){ RESULTS+=("PASO $1 ✗ $2"); echo "──> ✗ FALLO: $2"; }
sigline(){ echo "$1" | grep -oE '[1-9A-HJ-NP-Za-km-z]{80,90}' | head -1; }

# ── 1 · alta del adoptante (wallet + ATA) ────────────────────────────────
banner 1 "alta de service-z — wallet + ATA USDC-test (sin permiso de nadie)"
if npx tsx scripts/adopt_service.ts z; then
  set -a; . ./.env; set +a   # recargar SERVICE_Z_WALLET
  ZW=$SERVICE_Z_WALLET
  ok 1 "wallet $ZW"
else
  fail 1 "adopt_service.ts"; echo "abortando"; exit 1
fi

# ── 2 · service-z en vivo ────────────────────────────────────────────────
banner 2 "service-z en :$ZPORT — adopta el gate con ~10 líneas"
if curl -sf --max-time 2 "$ZHEALTH" >/dev/null 2>&1; then
  echo "service-z ya corre en :$ZPORT (lo reuso)"
  ZPID=""
else
  PAYEE_WALLET=$ZW PORT=$ZPORT \
    npx tsx services/service-z/src/index.ts > logs/service-z.log 2>&1 &
  ZPID=$!
  [ -n "$ZPID" ] && trap '[ -n "${ZPID:-}" ] && kill "$ZPID" 2>/dev/null || true' EXIT
  for i in $(seq 1 15); do
    curl -sf --max-time 2 "$ZHEALTH" >/dev/null 2>&1 && break
    sleep 1
  done
fi
if curl -sf --max-time 2 "$ZHEALTH"; then echo; ok 2 "service-z responde /health (payee $ZW)"
else fail 2 "service-z no respondió — logs/service-z.log"; tail -n 10 logs/service-z.log; exit 1; fi

# ── 3 · ya es gate-protected: 402 + requirements ─────────────────────────
banner 3 "GET /api/premium sin pago → 402 requirements del gate"
req=$(curl -s --max-time 5 "$ZURL")
echo "$req"
if echo "$req" | grep -q '"scheme":"agentic-gate"'; then
  ok 3 "402 con payee/mint/programId/invoice — adoptado, sin cuenta ni API key"
else fail 3 "se esperaba 402 agentic-gate: $req"; fi

# ── 4 · el agente paga → el GATE decide (z no está whitelisted) ──────────
banner 4 "agent A paga \$0.50 → revert esperado (owner aún no autorizó z)"
out=$($PAY "$ZURL" 0.50 --skip-preflight 2>&1); echo "$out"
s=$(sigline "$out")
if echo "$out" | grep -q "PayeeNotWhitelisted"; then
  ok 4 "PayeeNotWhitelisted — tx fallida on-chain $s"
elif echo "$out" | grep -q "MandateRevoked"; then
  ok 4 "MandateRevoked — el mandato venía revocado (se re-crea en el paso 5) $s"
elif echo "$out" | grep -qE "AccountNotInitialized|account.*does not exist|inexistente"; then
  ok 4 "mandato inexistente — el gate igual rechaza (se crea en el paso 5)"
elif echo "$out" | grep -q "← 200"; then
  ok 4 "pago 200 directo — z ya estaba whitelisted (re-run idempotente)"
else fail 4 "resultado inesperado: $(echo "$out" | tail -3)"; fi

# ── 5 · el owner autoriza: whitelist += z ────────────────────────────────
banner 5 "owner whitelista a z (MVP: close + re-init del mandato)"
st=$($OWNER status --agent a 2>&1); echo "$st"
if echo "$st" | grep -q "${ZW:0:8}" && echo "$st" | grep -q "revoked      false"; then
  echo "── z ya está en la whitelist y el mandato está vigente — skip re-init"
  ok 5 "whitelist ya incluía z"
else
  echo "$st" | grep -q "inexistente" || $OWNER close --agent a
  out=$($OWNER init-mandate --agent a --max 5 --cap 10 --payees "x,$ZW" 2>&1)
  echo "$out"; s=$(sigline "$out")
  [ -n "$s" ] && ok 5 "mandato re-iniciado con payees [x,z] — $s" \
    || fail 5 "init-mandate: $out"
fi

# ── 6 · mismo pago, ahora cobra ──────────────────────────────────────────
banner 6 "agent A paga \$0.50 a service-z → 200 + PaymentReceipt on-chain"
out=$($PAY "$ZURL" 0.50 2>&1); echo "$out"
s=$(sigline "$out")
if echo "$out" | grep -q "← 200"; then
  ok 6 "service-z cobró — cero fricción, cero permiso. tx $s"
else fail 6 "esperaba 200: $(echo "$out" | tail -3)"; fi

# ── Resumen ──────────────────────────────────────────────────────────────
echo; echo "══════════ RESUMEN ADOPCIÓN ══════════"
printf '%s\n' "${RESULTS[@]}"
fails=$(printf '%s\n' "${RESULTS[@]}" | grep -c "✗" || true)
echo
if [ "$fails" -eq 0 ]; then
  echo "ADOPCIÓN OK — service-z es un adoptante real del gate (devnet)"
  echo "Para dejarlo corriendo: bash scripts/dev_service.sh z (sesión persistente)"
  echo "El dashboard (:3404) lo lista en Adopción si SERVICE_Z_WALLET está en .env"
else
  echo "$fails paso(s) fallaron"; exit 1
fi
