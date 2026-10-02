/**
 * Constantes compartidas del sitio — datos públicos del deployment devnet.
 * Todo lo de acá es verificable en el explorer (?cluster=devnet); nada es
 * secreto. Las páginas que NO leen la chain (landing/docs/demo/colaborar)
 * usan este módulo en vez de loadConfig() para funcionar aunque falte
 * dashboard/.env (que genera scripts/sync_dashboard_env.sh).
 */
import { explorerAddr, explorerTx } from "./gate";

export { explorerAddr, explorerTx };

/** Programa gate — único programa custom de la demo (Anchor 1.2.0, upgradeable). */
export const PROGRAM_ID = "D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2";
/** Programa SAS oficial en devnet (ajeno — Solana Attestation Service). */
export const SAS_PROGRAM_ID = "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";

// ────────────────────────────────────────────────────────────────────────────
// TODO(release): REEMPLAZAR por la URL pública real del repo cuando se publique.
// Es la ÚNICA constante que hay que tocar — todas las páginas la leen de acá.
// Mientras sea `null`, el sitio muestra "repo por publicar" en vez de un link.
// ────────────────────────────────────────────────────────────────────────────
export const GITHUB_REPO_URL: string | null = "https://github.com/adriangmrraa/dnia";

export const short = (s?: string | null) =>
  s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "—";

/** Direcciones públicas del sistema desplegado (docs/09_DEMO_SUBMISSION.md §2). */
export const ADDRESSES: { label: string; addr: string }[] = [
  { label: "Programa gate (agentic_gate)", addr: PROGRAM_ID },
  { label: "GateConfig PDA", addr: "AD8km3tHv3VC9gNV5L9WZKuDKJoLu5K4B9QdFjrUxNRv" },
  {
    label: "Mandate PDA (owner → Agente A)",
    addr: "3S7NvdxwYh4sirkQbcV9GUaUtzive3K5JzHrou3Gx7rS",
  },
  {
    label: "SAS Credential (mock issuer)",
    addr: "JDe4sL4r73pQ3ovgkk95wNTo4SaS3U48R9PryQeZ3HRC",
  },
  {
    label: "SAS Schema (human-verified v1)",
    addr: "6bz7y1xCr8k6PzAGP1P9cwNp9Qp8RPbDjzDgod7M7ohK",
  },
  {
    label: "Attestation PDA Agente A",
    addr: "pAht9t8UcZkmGSZXWEHSe1VPL2E6iMt42SYUQ2tdMXt",
  },
  {
    label: "Mint USDC-test (SPL, 6 dec)",
    addr: "gmfqCXG6Jj5s3hS4uALJBHbN14ai8J8XWsp459vrpTk",
  },
  { label: "Programa SAS (oficial, ajeno)", addr: SAS_PROGRAM_ID },
  { label: "Owner (humano)", addr: "F3ij1MAL19AnRfBSjgodtMnqDREXSdw4QhFafF48KjAF" },
  { label: "Agente A (verificado)", addr: "EVtpj89o2qTvMT3CkGgr5iYdHbDUnFhTXtM6YcPrGGv" },
  { label: "Agente B (huérfano)", addr: "BXq73ERaMHUEsXbVtycQFqUodn5qVocFtA83ZHkusgJq" },
  { label: "Servicio X (payee)", addr: "9TPfKcdex7EobDJd9qgrTV78NPjxoe1SKcbKv6j8Pffe" },
  { label: "Servicio Y (payee)", addr: "ymz65JASu8bUyFxXqyeFSyGUVbWvPn5GXZETv3Gok6G" },
];

export interface Beat {
  n: string;
  title: string;
  desc: string;
  /** Una o dos signatures reales de la corrida canónica (sesión 18). */
  sigs: string[];
  result: "ok" | "fail";
  /** GateError esperado cuando la tx falla a propósito. */
  err?: string;
}

/**
 * Los 6 beats de la corrida canónica post-fix (docs/09 §3, sesión 18 —
 * 02/10/2026). TODAS estas txs existen en devnet, incluidas las fallidas:
 * un revert con --skip-preflight aterriza como tx con err en la chain.
 */
export const BEATS: Beat[] = [
  {
    n: "1",
    title: "Attest A",
    desc: "El issuer emite una attestation SAS real human-verified (level 2) sobre la wallet de Agente A.",
    sigs: [
      "tcRHMnJyLVZBLxpJ471y9oDUJovFtjtUPjDVdEoK3mScojdoaN18fujrqUWhJpNvha1WDE5y62CYxgrJ8GR7gBy",
    ],
    result: "ok",
  },
  {
    n: "2",
    title: "Init mandate",
    desc: "El owner firma el mandato: máx $5/tx, cap $10/día, whitelist = solo Servicio X.",
    sigs: [
      "32ZvGU3UVw8Ft6ztiTxLvYGnCLhVTQ7L7N3j712ARrjCeCei3sLvHPmPvAQ34ZV74WNjA2sjCAqxmDYHEJYBqGy2",
    ],
    result: "ok",
  },
  {
    n: "3",
    title: "Pago feliz",
    desc: "A paga $0.50 a X: attestation ✓ + mandato cubre ✓ → transfer + PaymentReceipt → el servicio entrega 200.",
    sigs: [
      "3W9HSVZFQ6FQoH8XVusA4t38PpRMEbjMbjc53GKWxjwPL4R4DzasucES3oRzHrhTGYqAmhuiHEC9gUVk6Sbdwnm8",
    ],
    result: "ok",
  },
  {
    n: "4",
    title: "Agente B huérfano",
    desc: "B tiene mandato pero NO attestation → tx fallida on-chain. El programa decide, no un middleware.",
    sigs: [
      "5fQegTbiTwtJ6YmQq3xDv2qjsY6hpwT5j4J55raCVXzikRnsD33qocnFpnb3sesMF8bwiHiiU735quabdKm5XXSo",
    ],
    result: "fail",
    err: "AttestationMissing",
  },
  {
    n: "5a",
    title: "Over-limit",
    desc: "A intenta pagar $10 con máximo $5 por tx → tx fallida on-chain.",
    sigs: [
      "4CkKhEjSEWTmJGMxmmx1vHGMgE7SPRJw2oesroYiE5VCLfSaG7Q4q7D526N48A8T985vgw4MdHT2VsoES1qTqswk",
    ],
    result: "fail",
    err: "OverPerTxLimit",
  },
  {
    n: "5b",
    title: "Payee no whitelisted",
    desc: "A intenta $0.50 a Servicio Y, que no está en la whitelist del mandato → tx fallida on-chain.",
    sigs: [
      "5MPXz1Zyoyhki4t4YWrsJVHBX7ZxAREufti9wa7Tp1qBgk8K4qFncE6hykn6vYBrGaKTiiYRzePbWtqSHKMbARAT",
    ],
    result: "fail",
    err: "PayeeNotWhitelisted",
  },
  {
    n: "6",
    title: "Revocación en vivo",
    desc: "El owner revoca el mandato y el siguiente pay de A — que en el beat 3 confirmaba — revierte. Revoke + pay fallido:",
    sigs: [
      "sXwCv8ua47kwRCpwFqcZHQJ9CPLj22yCabhWepZgm46tMFGevhWpnXcf7RBQzYJSrf29JVL2SeufJtAf1VQT9JG",
      "5V82hQsLUi2CmB4VTXd3ntuJcwzW9hEtcxVpQCMF4CwdswE4cRDcQjQPqBKZpUBAaAGaRXWLQYwfZtC8JEM6UrL9",
    ],
    result: "fail",
    err: "MandateRevoked",
  },
];
