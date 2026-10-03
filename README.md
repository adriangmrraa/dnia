# dnia — accountability layer for AI-agent payments

**Every AI agent that spends money has a verified human behind it — enforced
on-chain, atomically, on Solana.**

dnia is an open protocol that lets any x402-shaped service, merchant, or
payment facilitator require *human-backed* agent payments — without creating
an account with us, without an API key, and without asking anyone for
permission. The chain is the API.

Live on **Solana devnet** — every claim below links to a real transaction.

## 70-second pitch

<video src="https://adriangmrraa.github.io/dnia/media/dnia-pitch-en.mp4" controls width="100%"></video>

▶ [English](https://adriangmrraa.github.io/dnia/media/dnia-pitch-en.mp4) ·
[Español](https://adriangmrraa.github.io/dnia/media/dnia-pitch-es.mp4)
(70s · 1080p). Motion graphics built with HyperFrames; every signature
shown is a real devnet tx. Interactive slide deck: `demo/presentacion.html`
(+ `presentacion.pdf`).

## The problem

AI agents are starting to pay for things (x402, machine-to-machine APIs,
autonomous procurement). When an agent pays, nobody can answer three
questions that matter the moment money moves:

1. **Who** is behind this agent? (identity)
2. **What** did its owner actually authorize? (mandate)
3. **What** happened? (receipt)

Fraud, chargebacks, and liability disputes in agent commerce have no
on-chain answer today. Closed platforms solve it with accounts and API keys —
we solve it with a public good on Solana.

## The three primitives

| Primitive | Question | Implementation |
|---|---|---|
| **Identity** | Who's behind it? | A real [Solana Attestation Service](https://attest.solana.com) credential (`human-verified`, level ≥ min) bound to the agent's wallet. Selective disclosure: level + issuer + timestamps only — **no PII on-chain**. Revocable by the issuer. |
| **Mandate** | What was authorized? | A PDA signed by the owner: per-tx max, daily cap, payee whitelist, expiry, revocable. Spend counters are mutated **only by the program**. |
| **Receipt** | What happened? | `PaymentReceipt` (7 fields) emitted by the program in the same tx: payer, payee, amount, mint, invoice, mandate, timestamp. Auditable forever. |

## The atomic gate

```text
pay(agent, amount, service):          one transaction, all-or-nothing
  1. re-derive & read the agent's SAS attestation PDA   → missing/expired/revoked = REVERT
  2. check the owner mandate (per-tx max, daily cap,    → violated = REVERT
     payee whitelist, not expired, mint = expected USDC)
  3. SPL transfer USDC agent → service
  4. emit PaymentReceipt
```

A JWT can be skipped. A middleware can be bypassed. **A Solana program
reverts the transaction itself** — the payment cannot confirm unless
identity *and* authorization hold. That's why this is a program and not an
API.

## Zero-friction adoption

A merchant or service joins by adding a helper — not by signing up:

```ts
import { createGate } from "./gate-check";

const gate = createGate({ programId, payee: MY_WALLET, price: 0.5, mint: USDC });

app.get("/api/premium", async (req, res) => {
  const check = await gate.verify(req.headers["x-payment"]);
  if (!check.ok) return res.status(402).json(gate.requirements());
  res.json({ resource: "…", receipt: check.receipt });
});
```

- **No account** with this protocol. **No API key.** **No permission.**
- The program, the SAS credential schema, and the USDC mint are already
  deployed and public on devnet — you read them over RPC.
- The owner (agent's human) decides whom to whitelist — `init_mandate` /
  `revoke_mandate` are the only admin surface.
- `demo_adoption.sh` proves this end-to-end: a brand-new service (port 3405)
  joins, gets rejected (`PayeeNotWhitelisted` — the *owner* decides, not the
  service), gets whitelisted by the owner, then accepts payment 200.

Two adoption levels: **soft** (middleware checks attestation via RPC — any
HTTP service) and **routed** (payments settle through the gate program —
structural enforcement + receipts). See `demo/` docs page.

## Live on devnet

| Component | Address |
|---|---|
| Gate program (`agentic_gate`) | [`D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2`](https://explorer.solana.com/address/D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2?cluster=devnet) |
| SAS credential (mock issuer) | [`JDe4sL4r73pQ3ovgkk95wNTo4SaS3U48R9PryQeZ3HRC`](https://explorer.solana.com/address/JDe4sL4r73pQ3ovgkk95wNTo4SaS3U48R9PryQeZ3HRC?cluster=devnet) |
| SAS schema `human-verified v1` | [`6bz7y1xCr8k6PzAGP1P9cwNp9Qp8RPbDjzDgod7M7ohK`](https://explorer.solana.com/address/6bz7y1xCr8k6PzAGP1P9cwNp9Qp8RPbDjzDgod7M7ohK?cluster=devnet) |
| USDC-test mint | [`gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk`](https://explorer.solana.com/address/gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk?cluster=devnet) |

## The demo — 6 beats, all on-chain

`demo/scripts/run_beats.sh` runs the full script; every beat lands a real
devnet signature — **including the rejections** (failed txs are recorded
on-chain via `--skip-preflight`, so the exact `Error Code` is visible in the
explorer):

| Beat | Result | Evidence |
|---|---|---|
| 1 · Attest Agent A | ✅ SAS credential issued | [tx](https://explorer.solana.com/tx/tcRHMnJyLVZBLxpJ471y9oDUJovFtjtUPjDVdEoK3mScojdoaN18fujrqUWhJpNvha1WDE5y62CYxgrJ8GR7gBy?cluster=devnet) |
| 2 · Owner mandate ($5/tx, $10/day, only Service X) | ✅ mandate PDA created | [tx](https://explorer.solana.com/tx/32ZvGU3UVw8Ft6ztiTxLvYGnCLhVTQ7L7N3j712ARrjCeCei3sLvHPmPvAQ34ZV74WNjA2sjCAqxmDYHEJYBqGy2?cluster=devnet) |
| 3 · Happy-path payment $0.50 → X | ✅ transfer + receipt → HTTP 200 | [tx](https://explorer.solana.com/tx/3W9HSVZFQ6FQoH8XVusA4t38PpRMEbjMbjc53GKWxjwPL4R4DzasucES3oRzHrhTGYqAmhuiHEC9gUVk6Sbdwnm8?cluster=devnet) |
| 4 · Agent B (no attestation) | ❌ `AttestationMissing` | [failed tx](https://explorer.solana.com/tx/5fQegTbiTwtJ6YmQq3xDv2qjsY6hpwT5j4J55raCVXzikRnsD33qocnFpnb3sesMF8bwiHiiU735quabdKm5XXSo?cluster=devnet) |
| 5a · $10 over per-tx limit | ❌ `OverPerTxLimit` | [failed tx](https://explorer.solana.com/tx/4CkKhEjSEWTmJGMxmmx1vHGMgE7SPRJw2oesroYiE5VCLfSaG7Q4q7D526N48A8T985vgw4MdHT2VsoES1qTqswk?cluster=devnet) |
| 5b · Payee Y not whitelisted | ❌ `PayeeNotWhitelisted` | [failed tx](https://explorer.solana.com/tx/5MPXz1Zyoyhki4t4YWrsJVHBX7ZxAREufti9wa7Tp1qBgk8K4qFncE6hykn6vYBrGaKTiiYRzePbWtqSHKMbARAT?cluster=devnet) |
| 6 · Owner revokes → next pay reverts | ❌ `MandateRevoked` | [revoke](https://explorer.solana.com/tx/sXwCv8ua47kwRCpwFqcZHQJ9CPLj22yCabhWepZgm46tMFGevhWpnXcf7RBQzYJSrf29JVL2SeufJtAf1VQT9JG?cluster=devnet) + [failed pay](https://explorer.solana.com/tx/5V82hQsLUi2CmB4VTXd3ntuJcwzW9hEtcxVpQCMF4CwdswE4cRDcQjQPqBKZpUBAaAGaRXWLQYwfZtC8JEM6UrL9?cluster=devnet) |

**21/21 Anchor tests pass.** Full submission evidence: `docs/09_DEMO_SUBMISSION.md`.

## Run it yourself

Requirements: Linux/WSL, Node 22+, Rust + Anchor 1.2, Solana CLI on devnet.

```bash
cd demo
bash scripts/start_services.sh        # issuer :3401 · X :3402 · Y :3403 · demo-runner :3406
bash scripts/sync_dashboard_env.sh    # writes dashboard/.env (pubkeys only)
cd dashboard && npx vite --port 3404  # site → http://localhost:3404
```

The site is a multi-page product surface (offline-capable, zero external
deps): `/` pitch + live evidence · `/dashboard` on-chain audit (payments
accepted/rejected in plain language) · `/docs` adoption guide · `/demo`
runbook with live service status + **one-click demo runner** · `/colaborar`
contribute.

To replay the canonical run: `bash scripts/run_beats.sh`
Adoption beat: `bash scripts/demo_adoption.sh`

## Honest scope (what this is / isn't)

- ✅ Enforced on-chain: identity + mandate + mint-bound payment + receipt,
  atomic in one tx. Rejects are real failed transactions, not simulations.
- ✅ Devnet deployment, reproducible demo, read-only dashboard reading chain
  state — nothing is mocked on the ledger.
- ⚠️ **Demo issuer is mocked** — a real Persona/Veriff-class KYC issuer is
  future work. The SAS primitives and PDA derivation are real.
- ⚠️ The gate protects **sellers who opt in**: an agent can always send a
  free SPL transfer outside the gate. We don't claim protocol-wide
  enforcement — we make opted-in payments provably accountable.
- ⚠️ Receipt is a program event (not a PDA) in this MVP; `update_mandate`,
  mainnet audit, and an ERC-8004 bridge are on the roadmap
  (`docs/10_ROADMAP.md`).

## Repository layout

```text
demo/            the product: program, services, dashboard, demo scripts
  programs/      Anchor program (agentic_gate)
  services/      mock issuer, gated x402 services, demo-runner, gate-check.ts
  dashboard/     multi-page product site (Vite + React)
  scripts/       run_beats / demo_adoption / service lifecycle
  presentacion.html / .pdf   19-slide pitch deck (keynote-ready, offline)
docs/            research gate, architecture, demo submission, roadmap,
                 differentiation analysis (12), video brief (13),
                 media/ (pitch video)
sdd/             spec-driven development artifacts (proposal → archive)
```

## Contributing

Apache-2.0 — open protocol, patent grant included. Adopters don't need to
talk to us to integrate; contributors see `/colaborar` on the site or
`docs/10_ROADMAP.md` for open work (facilitator hook, receipt PDA, issuer
integrations, mandate updates).

## License

[Apache-2.0](LICENSE)
