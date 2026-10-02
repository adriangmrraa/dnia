import { assert } from "chai";
import * as anchor from "@anchor-lang/core";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import BN from "bn.js";
import { bootGate, fundSol, stopGate, GateHarness } from "./helpers/surfnet";
import {
  attest,
  attestationPda,
  bootstrapIssuer,
  bootstrapSas,
  fetchAttestationData,
  revokeAttestation,
  SasContext,
} from "./helpers/sas";
import {
  ata,
  createTestUsdc,
  fundedKeypair,
  mintUsdc,
  tokenBalance,
} from "./helpers/token";
import { deserializeAttestationData } from "sas-lib";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// S1 — gate del scaffold: GateConfig persiste sus campos y solo el admin rota.
// Los CAs CA-1..CA-12 se agregan en S2/S3/S4 sobre este mismo harness.
// Post-verify (W1): GateConfig incluye `usdc_mint` (5to campo persistido).
describe("agentic-gate — S1: config del gate", () => {
  let h: GateHarness;

  const sasCredential = Keypair.generate().publicKey;
  const sasSchema = Keypair.generate().publicKey;
  const usdcMint = Keypair.generate().publicKey; // pubkey alcanza: se prueba persistencia

  let configPda: PublicKey;

  before(async () => {
    h = await bootGate();
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      h.program.programId
    );
  });

  after(async () => {
    await stopGate(h);
  });

  it("initialize_config persiste los 5 campos", async () => {
    const admin = h.payer.publicKey;

    await h.program.methods
      .initializeConfig(admin, sasCredential, sasSchema, usdcMint, 1)
      .rpc();

    const config = await h.program.account.gateConfig.fetch(configPda);
    assert.equal(config.admin.toBase58(), admin.toBase58());
    assert.equal(
      config.sasCredential.toBase58(),
      sasCredential.toBase58()
    );
    assert.equal(config.sasSchema.toBase58(), sasSchema.toBase58());
    assert.equal(config.usdcMint.toBase58(), usdcMint.toBase58());
    assert.equal(config.minLevel, 1);
  });

  it("update_config con firmante no-admin revierte (Unauthorized)", async () => {
    const intruder = Keypair.generate();
    fundSol(h, intruder.publicKey, LAMPORTS_PER_SOL / 10);

    const balBefore = await h.connection.getBalance(intruder.publicKey);

    let err: any = null;
    try {
      await h.program.methods
        .updateConfig(sasCredential, sasSchema, 2)
        .accountsPartial({ config: configPda, admin: intruder.publicKey })
        .signers([intruder])
        .rpc();
    } catch (e: any) {
      err = e;
    }
    assert.ok(err, "update_config debió revertir");
    const serialized = JSON.stringify(err);
    assert.ok(
      serialized.includes("Unauthorized") ||
        /has_one|2012|Error Number: 6000/i.test(serialized),
      `error inesperado: ${serialized}`
    );

    // Sin cambios de estado: el GateConfig sigue igual.
    const config = await h.program.account.gateConfig.fetch(configPda);
    assert.equal(config.minLevel, 1);
    assert.equal(
      config.sasSchema.toBase58(),
      sasSchema.toBase58()
    );
  });

  it("update_config con admin rota los campos", async () => {
    const newCred = Keypair.generate().publicKey;
    const newSchema = Keypair.generate().publicKey;

    await h.program.methods
      .updateConfig(newCred, newSchema, 3)
      .accountsPartial({ config: configPda, admin: h.payer.publicKey })
      .rpc();

    const config = await h.program.account.gateConfig.fetch(configPda);
    assert.equal(
      config.sasCredential.toBase58(),
      newCred.toBase58()
    );
    assert.equal(config.sasSchema.toBase58(), newSchema.toBase58());
    assert.equal(config.minLevel, 3);
  });
});

// S2 — SAS real (dump de devnet) corriendo dentro del surfnet + helpers
// de token. Verifica el bootstrap del issuer, la emisión/lectura de
// attestations por PDA y la revocación como cierre de cuenta.
describe("agentic-gate — S2: SAS en surfnet + tokens", () => {
  let h: GateHarness;
  let sas: SasContext;

  before(async () => {
    h = await bootGate();
    sas = await bootstrapSas(h);
  });

  after(async () => {
    await stopGate(h);
  });

  it("credential + schema existen on-chain (SAS real)", async () => {
    const credInfo = await h.connection.getAccountInfo(sas.credential);
    const schemaInfo = await h.connection.getAccountInfo(sas.schema);
    assert.isNotNull(credInfo, "credential inexistente");
    assert.isNotNull(schemaInfo, "schema inexistente");
    assert.equal(
      credInfo!.owner.toBase58(),
      "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
    );
    assert.equal(
      schemaInfo!.owner.toBase58(),
      "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"
    );
  });

  it("attest(wallet, level) escribe attestation legible en su PDA", async () => {
    const wallet = fundedKeypair(h);
    const { pda } = await attest(h, sas, wallet.publicKey, 2, 0);

    // El PDA se re-deriva determinísticamente desde credential+schema+wallet.
    const again = await attestationPda(sas, wallet.publicKey);
    assert.equal(pda.toBase58(), again.toBase58());

    const data = await fetchAttestationData(sas, pda);
    assert.isNotNull(data, "attestation no legible tras emitirla");
    assert.equal(
      data!.nonce.toString(),
      wallet.publicKey.toBase58()
    );
    const decoded = deserializeAttestationData(
      sas.schemaAccount,
      data!.data as Uint8Array
    ) as { level: number };
    assert.equal(decoded.level, 2);
  });

  it("revoke (CloseAttestation) deja la cuenta inexistente", async () => {
    const wallet = fundedKeypair(h);
    const { pda } = await attest(h, sas, wallet.publicKey, 1, 0);

    await revokeAttestation(h, sas, wallet.publicKey);

    const data = await fetchAttestationData(sas, pda);
    assert.isNull(data, "la attestation debió desaparecer al cerrarse");
  });

  it("mint USDC-test + ATA + mintTo funcionan", async () => {
    const mint = await createTestUsdc(h);
    const owner = fundedKeypair(h);
    const ownerAta = await ata(h, mint, owner.publicKey);
    await mintUsdc(h, mint, ownerAta, 1_500_000n); // 1.5 USDC

    assert.equal(await tokenBalance(h, ownerAta), 1_500_000n);
  });
});

// ── S3 — init_mandate + pay atómico (CA-2, CA-3, CA-4) ────────────────────

const USDC = (n: number) => new BN(n * 1_000_000);
const REF = (s: string) =>
  Array.from(Buffer.from(s.padEnd(16, "\0").slice(0, 16), "utf8"));

/** Decodifica el PaymentReceipt emitido en una tx (logs `Program data:`). */
async function fetchReceipt(
  h: GateHarness,
  sig: string
): Promise<any | null> {
  const tx = await h.connection.getTransaction(sig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const logs = tx?.meta?.logMessages ?? [];
  const parser = new anchor.EventParser(
    h.program.programId,
    h.program.coder
  );
  for (const ev of parser.parseLogs(logs)) {
    if (ev.name === "paymentReceipt" || ev.name === "PaymentReceipt") {
      return ev.data;
    }
  }
  return null;
}

/** Asserta que `err` es el error de programa esperado (variante GateError). */
function expectGateErr(err: any, name: string): void {
  assert.ok(err, `se esperaba revert ${name} y la tx confirmó`);
  const code = err?.error?.errorCode?.code ?? err?.errorCode?.code;
  if (code) {
    assert.equal(code, name, `error esperado ${name}, vino ${code}`);
    return;
  }
  const s = JSON.stringify(err);
  assert.ok(
    s.includes(name),
    `error esperado ${name}, vino: ${s.slice(0, 400)}`
  );
}

describe("agentic-gate — S3: init_mandate + pay (CA-2/3/4)", () => {
  let h: GateHarness;
  let sas: SasContext;
  let configPda: PublicKey;

  let agentA: Keypair;
  let agentB: Keypair;
  let serviceX: Keypair;
  let serviceY: Keypair;
  let mint: PublicKey;
  let ataA: PublicKey;
  let ataB: PublicKey;
  let ataX: PublicKey;
  let ataY: PublicKey;
  let mandateA: PublicKey;
  let mandateB: PublicKey;
  let attA: PublicKey;

  before(async () => {
    h = await bootGate();
    sas = await bootstrapSas(h);
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      h.program.programId
    );

    agentA = fundedKeypair(h);
    agentB = fundedKeypair(h);
    serviceX = fundedKeypair(h);
    serviceY = fundedKeypair(h);

    mint = await createTestUsdc(h);
    // Config apunta al issuer/schema SAS REALES creados por bootstrap y al
    // mint USDC-test real (W1: `pay` exige ese mint en ambos token accounts).
    await h.program.methods
      .initializeConfig(
        h.payer.publicKey,
        sas.credential,
        sas.schema,
        mint,
        1
      )
      .rpc();

    ataA = await ata(h, mint, agentA.publicKey);
    ataB = await ata(h, mint, agentB.publicKey);
    ataX = await ata(h, mint, serviceX.publicKey);
    ataY = await ata(h, mint, serviceY.publicKey);
    await mintUsdc(h, mint, ataA, 20_000_000n); // 20 USDC a A
    await mintUsdc(h, mint, ataB, 20_000_000n); // 20 USDC a B

    // Identidad: A attested nivel 2 sin expiración; B NO attested (CA-4).
    attA = (await attest(h, sas, agentA.publicKey, 2, 0)).pda;

    // Autorización: mandato de A con {≤$5/tx, cap $10/día, solo X}; y de B
    // (el mandato existe — CA-4 falla por IDENTIDAD, no por falta de mandato).
    [mandateA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mandate"),
        h.payer.publicKey.toBuffer(),
        agentA.publicKey.toBuffer(),
      ],
      h.program.programId
    );
    [mandateB] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mandate"),
        h.payer.publicKey.toBuffer(),
        agentB.publicKey.toBuffer(),
      ],
      h.program.programId
    );
    await h.program.methods
      .initMandate(
        agentA.publicKey,
        USDC(5),
        USDC(10),
        [serviceX.publicKey],
        new BN(0)
      )
      .accountsPartial({
        mandate: mandateA,
        owner: h.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    await h.program.methods
      .initMandate(
        agentB.publicKey,
        USDC(5),
        USDC(10),
        [serviceX.publicKey],
        new BN(0)
      )
      .accountsPartial({
        mandate: mandateB,
        owner: h.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  after(async () => {
    await stopGate(h);
  });

  const payAccounts = (
    agent: Keypair,
    mandate: PublicKey,
    attestation: PublicKey,
    service: PublicKey,
    agentAta: PublicKey,
    serviceAta: PublicKey
  ) => ({
    agent: agent.publicKey,
    config: configPda,
    attestation,
    mandate,
    service,
    agentAta,
    serviceAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  });

  it("CA-2: init_mandate persiste la política con contadores en 0", async () => {
    const m = await h.program.account.mandate.fetch(mandateA);
    assert.equal(m.owner.toBase58(), h.payer.publicKey.toBase58());
    assert.equal(m.agent.toBase58(), agentA.publicKey.toBase58());
    assert.ok(m.maxPerTx.eq(USDC(5)));
    assert.ok(m.dailyCap.eq(USDC(10)));
    assert.ok(m.spentToday.isZero());
    assert.ok(m.totalSpent.isZero());
    assert.deepEqual(
      m.payeeWhitelist.map((p: PublicKey) => p.toBase58()),
      [serviceX.publicKey.toBase58()]
    );
    assert.ok(m.expiry.isZero());
    assert.isFalse(m.revoked);
  });

  it("CA-3: pay($0.50, X) confirma, transfiere exacto y emite recibo", async () => {
    const xBefore = await tokenBalance(h, ataX);
    const aBefore = await tokenBalance(h, ataA);

    const sig = await h.program.methods
      .pay(USDC(0.5), REF("INV-X-0001"))
      .accountsPartial(
        payAccounts(agentA, mandateA, attA, serviceX.publicKey, ataA, ataX)
      )
      .signers([agentA])
      .rpc();

    // Transfer exacta.
    assert.equal(
      await tokenBalance(h, ataX),
      xBefore + 500_000n
    );
    assert.equal(
      await tokenBalance(h, ataA),
      aBefore - 500_000n
    );

    // Contadores del mandato.
    const m = await h.program.account.mandate.fetch(mandateA);
    assert.ok(m.spentToday.eq(USDC(0.5)));
    assert.ok(m.totalSpent.eq(USDC(0.5)));
    assert.ok(m.dayIndex.gtn(0));

    // Recibo en los logs con los 7 campos (W1: incluye `mint`).
    const receipt = await fetchReceipt(h, sig);
    assert.isNotNull(receipt, "no se encontró PaymentReceipt en los logs");
    assert.equal(receipt.payer.toBase58(), agentA.publicKey.toBase58());
    assert.equal(receipt.payee.toBase58(), serviceX.publicKey.toBase58());
    assert.ok(receipt.amount.eq(USDC(0.5)));
    assert.equal(receipt.mint.toBase58(), mint.toBase58());
    assert.deepEqual(
      Array.from(receipt.service_ref ?? receipt.serviceRef),
      REF("INV-X-0001")
    );
    assert.equal(receipt.mandate.toBase58(), mandateA.toBase58());
    assert.ok(receipt.timestamp.gtn(0));
  });

  it("CA-4: pay de B (sin attestation) revierte AttestationMissing", async () => {
    const xBefore = await tokenBalance(h, ataX);
    const attB = await attestationPda(sas, agentB.publicKey); // inexistente

    let err: any = null;
    try {
      await h.program.methods
        .pay(USDC(0.5), REF("INV-B-0001"))
        .accountsPartial(
          payAccounts(agentB, mandateB, attB, serviceX.publicKey, ataB, ataX)
        )
        .signers([agentB])
        .rpc();
    } catch (e) {
      err = e;
    }
    expectGateErr(err, "AttestationMissing");

    // Atomicidad: sin transfer ni cambio de estado.
    assert.equal(await tokenBalance(h, ataX), xBefore);
    const m = await h.program.account.mandate.fetch(mandateB);
    assert.ok(m.spentToday.isZero());
  });
});

// ── S4 — Revocación + matriz de reverts CA-5..CA-12 ───────────────────────

interface AgentFixture {
  kp: Keypair;
  ata: PublicKey;
  mandate: PublicKey;
  attestation: PublicKey; // PDA esperada (puede no existir)
}

describe("agentic-gate — S4: matriz de reverts CA-5..CA-12", () => {
  let h: GateHarness;
  let sas: SasContext;
  let configPda: PublicKey;
  let mint: PublicKey;
  let serviceX: Keypair;
  let serviceY: Keypair;
  let ataX: PublicKey;
  let ataY: PublicKey;

  /** now() del ledger — el surfnet corre con clock real. */
  const now = async () => {
    const slot = await h.connection.getSlot();
    const t = await h.connection.getBlockTime(slot);
    return t ?? Math.floor(Date.now() / 1000);
  };

  const mandatePda = (agent: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("mandate"),
        h.payer.publicKey.toBuffer(),
        agent.toBuffer(),
      ],
      h.program.programId
    )[0];

  const payAccountsFor = (
    fx: AgentFixture,
    service: PublicKey,
    serviceAta: PublicKey,
    mandateOverride?: PublicKey,
    attestationOverride?: PublicKey,
    agentAtaOverride?: PublicKey
  ) => ({
    agent: fx.kp.publicKey,
    config: configPda,
    attestation: attestationOverride ?? fx.attestation,
    mandate: mandateOverride ?? fx.mandate,
    service,
    agentAta: agentAtaOverride ?? fx.ata,
    serviceAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  });

  const tryPay = async (
    fx: AgentFixture,
    amount: BN,
    service: PublicKey,
    serviceAta: PublicKey,
    opts?: {
      mandate?: PublicKey;
      attestation?: PublicKey;
      agentAta?: PublicKey;
      ref?: string;
    }
  ): Promise<{ sig?: string; err?: any }> => {
    try {
      const sig = await h.program.methods
        .pay(amount, REF(opts?.ref ?? "INV"))
        .accountsPartial(
          payAccountsFor(
            fx,
            service,
            serviceAta,
            opts?.mandate,
            opts?.attestation,
            opts?.agentAta
          )
        )
        .signers([fx.kp])
        .rpc();
      return { sig };
    } catch (e) {
      return { err: e };
    }
  };

  /**
   * Crea agente con ATA fondeada + mandato; `attestLevel=null` saltea la
   * attestation (agente huérfano). `sasCtx` permite emitir bajo issuer foráneo.
   */
  const setupAgent = async (
    attestLevel: number | null,
    attestationExpiry: number,
    opts: {
      maxPerTx: number;
      dailyCap: number;
      payees: PublicKey[];
      mandateExpiry: number;
      sasCtx?: SasContext;
    }
  ): Promise<AgentFixture> => {
    const kp = fundedKeypair(h);
    const ataAddr = await ata(h, mint, kp.publicKey);
    await mintUsdc(h, mint, ataAddr, 20_000_000n);
    const mandate = mandatePda(kp.publicKey);
    const ctx = opts.sasCtx ?? sas;
    const attestation = await attestationPda(ctx, kp.publicKey);
    if (attestLevel !== null) {
      await attest(h, ctx, kp.publicKey, attestLevel, attestationExpiry);
    }
    await h.program.methods
      .initMandate(
        kp.publicKey,
        USDC(opts.maxPerTx),
        USDC(opts.dailyCap),
        opts.payees,
        new BN(opts.mandateExpiry)
      )
      .accountsPartial({
        mandate,
        owner: h.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return { kp, ata: ataAddr, mandate, attestation };
  };

  // ── fixtures compartidos ──────────────────────────────────────────────
  let A: AgentFixture; // policy demo {≤$5, cap $10, solo X}
  let C: AgentFixture; // cap $0.75 — CA-10
  let D: AgentFixture; // attestation expira en ~5s — CA-8
  let E: AgentFixture; // mandato expira en ~5s — CA-9
  let F: AgentFixture; // attestation de issuer foráneo — CA-12

  before(async () => {
    h = await bootGate();
    sas = await bootstrapSas(h);
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      h.program.programId
    );

    serviceX = fundedKeypair(h);
    serviceY = fundedKeypair(h);
    mint = await createTestUsdc(h);

    // Config con issuer/schema SAS reales + mint USDC-test del gate (W1).
    await h.program.methods
      .initializeConfig(h.payer.publicKey, sas.credential, sas.schema, mint, 1)
      .rpc();

    ataX = await ata(h, mint, serviceX.publicKey);
    ataY = await ata(h, mint, serviceY.publicKey);

    const t0 = await now();
    A = await setupAgent(2, 0, {
      maxPerTx: 5,
      dailyCap: 10,
      payees: [serviceX.publicKey],
      mandateExpiry: 0,
    });
    C = await setupAgent(2, 0, {
      maxPerTx: 5,
      dailyCap: 0.75,
      payees: [serviceX.publicKey],
      mandateExpiry: 0,
    });
    D = await setupAgent(2, t0 + 5, {
      maxPerTx: 5,
      dailyCap: 10,
      payees: [serviceX.publicKey],
      mandateExpiry: 0,
    });
    E = await setupAgent(2, 0, {
      maxPerTx: 5,
      dailyCap: 10,
      payees: [serviceX.publicKey],
      mandateExpiry: t0 + 5,
    });
    // Issuer foráneo: mismo schema, credential distinto → PDA no coincide.
    const foreign = await bootstrapIssuer(h, "FOREIGN-ISSUER");
    F = await setupAgent(2, 0, {
      maxPerTx: 5,
      dailyCap: 10,
      payees: [serviceX.publicKey],
      mandateExpiry: 0,
      sasCtx: foreign,
    });
  });

  after(async () => {
    await stopGate(h);
  });

  it("CA-5a: pay($10) > max_per_tx revierte OverPerTxLimit", async () => {
    const xBefore = await tokenBalance(h, ataX);
    const { err } = await tryPay(A, USDC(10), serviceX.publicKey, ataX);
    expectGateErr(err, "OverPerTxLimit");
    assert.equal(await tokenBalance(h, ataX), xBefore);
  });

  it("CA-5b: pay($0.50, Y) con Y fuera de whitelist revierte PayeeNotWhitelisted", async () => {
    const yBefore = await tokenBalance(h, ataY);
    const { err } = await tryPay(A, USDC(0.5), serviceY.publicKey, ataY);
    expectGateErr(err, "PayeeNotWhitelisted");
    assert.equal(await tokenBalance(h, ataY), yBefore);
  });

  it("CA-13 (post-verify W1): pay con mint distinto al del gate revierte WrongMint", async () => {
    // Mint basura (mismo shape, 6 dec) + ATAs del agente y del servicio en él.
    const fakeMint = await createTestUsdc(h);
    const ataAFake = await ata(h, fakeMint, A.kp.publicKey);
    await mintUsdc(h, fakeMint, ataAFake, 20_000_000n);
    const ataXFake = await ata(h, fakeMint, serviceX.publicKey);

    const xBefore = await tokenBalance(h, ataX);
    const xFakeBefore = await tokenBalance(h, ataXFake);

    // (a) el agente paga desde su ATA del mint basura → WrongMint
    const r1 = await tryPay(A, USDC(0.5), serviceX.publicKey, ataX, {
      agentAta: ataAFake,
    });
    expectGateErr(r1.err, "WrongMint");

    // (b) el cobro va a una ATA del servicio en mint basura → WrongMint
    const r2 = await tryPay(A, USDC(0.5), serviceX.publicKey, ataXFake);
    expectGateErr(r2.err, "WrongMint");

    // Atomicidad: nada se movió en ninguno de los mints y el mandato no gastó.
    assert.equal(await tokenBalance(h, ataX), xBefore);
    assert.equal(await tokenBalance(h, ataXFake), xFakeBefore);
    const m = await h.program.account.mandate.fetch(A.mandate);
    assert.ok(m.spentToday.isZero());
  });

  it("CA-11: agente C firmando con el mandato de A revierte MandateBoundToOtherAgent", async () => {
    const xBefore = await tokenBalance(h, ataX);
    const { err } = await tryPay(C, USDC(0.5), serviceX.publicKey, ataX, {
      mandate: A.mandate,
    });
    expectGateErr(err, "MandateBoundToOtherAgent");
    assert.equal(await tokenBalance(h, ataX), xBefore);
  });

  it("CA-10: segundo pago supera el cap diario → OverDailyCap", async () => {
    // cap de C = $0.75 → 1er pago $0.50 confirma, 2do $0.50 excede.
    const r1 = await tryPay(C, USDC(0.5), serviceX.publicKey, ataX);
    assert.isUndefined(r1.err, `1er pago debió confirmar: ${r1.err}`);
    const xMid = await tokenBalance(h, ataX);

    const { err } = await tryPay(C, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(err, "OverDailyCap");
    assert.equal(await tokenBalance(h, ataX), xMid);
    const m = await h.program.account.mandate.fetch(C.mandate);
    assert.ok(m.spentToday.eq(USDC(0.5)));
  });

  it("CA-12: attestation de issuer foráneo revierte IssuerNotRecognized", async () => {
    const xBefore = await tokenBalance(h, ataX);
    // F pasa SU attestation (válida pero bajo otra credential) con su mandato.
    const { err } = await tryPay(F, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(err, "IssuerNotRecognized");
    assert.equal(await tokenBalance(h, ataX), xBefore);
  });

  it("revoke_mandate por no-owner revierte Unauthorized", async () => {
    const intruder = fundedKeypair(h);
    let err: any = null;
    try {
      await h.program.methods
        .revokeMandate()
        .accountsPartial({ mandate: A.mandate, owner: intruder.publicKey })
        .signers([intruder])
        .rpc();
    } catch (e) {
      err = e;
    }
    expectGateErr(err, "Unauthorized");
  });

  it("CA-6: revoke_mandate del owner → siguiente pay revierte MandateRevoked", async () => {
    await h.program.methods
      .revokeMandate()
      .accountsPartial({ mandate: A.mandate, owner: h.payer.publicKey })
      .rpc();
    const m = await h.program.account.mandate.fetch(A.mandate);
    assert.isTrue(m.revoked);

    const xBefore = await tokenBalance(h, ataX);
    const { err } = await tryPay(A, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(err, "MandateRevoked");
    assert.equal(await tokenBalance(h, ataX), xBefore);
  });

  it("close_mandate devuelve rent y permite re-init del mismo par", async () => {
    const lamBefore = await h.connection.getBalance(h.payer.publicKey);
    await h.program.methods
      .closeMandate()
      .accountsPartial({ mandate: A.mandate, owner: h.payer.publicKey })
      .rpc();

    const closed = await h.connection.getAccountInfo(A.mandate);
    assert.isNull(closed, "la cuenta mandate debió cerrarse");
    const lamAfter = await h.connection.getBalance(h.payer.publicKey);
    assert.isAbove(lamAfter, lamBefore, "el rent no volvió al owner");

    // Re-init (reparación de demo) — el PDA queda libre.
    await h.program.methods
      .initMandate(
        A.kp.publicKey,
        USDC(5),
        USDC(10),
        [serviceX.publicKey],
        new BN(0)
      )
      .accountsPartial({
        mandate: A.mandate,
        owner: h.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const m = await h.program.account.mandate.fetch(A.mandate);
    assert.isFalse(m.revoked);
    assert.ok(m.totalSpent.isZero());
  });

  it("CA-7: issuer cierra la attestation → pay revierte AttestationMissing", async () => {
    await revokeAttestation(h, sas, C.kp.publicKey);
    const gone = await fetchAttestationData(sas, C.attestation);
    assert.isNull(gone, "la attestation debió desaparecer");

    const xBefore = await tokenBalance(h, ataX);
    const { err } = await tryPay(C, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(err, "AttestationMissing");
    assert.equal(await tokenBalance(h, ataX), xBefore);
  });

  it("CA-8/CA-9: tras time-travel, attestation expirada → AttestationExpired y mandato expirado → MandateExpired", async () => {
    // Viaje determinista del clock del surfnet (+2 min > expiry T0+5s).
    const future = (await now()) + 120;
    h.surfnet.timeTravelToTimestamp(future * 1000);

    const xBefore = await tokenBalance(h, ataX);

    // D: attestation expirada, mandato vigente → falla identidad.
    const rD = await tryPay(D, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(rD.err, "AttestationExpired");

    // E: attestation sin expiración, mandato expirado → falla autorización.
    const rE = await tryPay(E, USDC(0.5), serviceX.publicKey, ataX);
    expectGateErr(rE.err, "MandateExpired");

    assert.equal(await tokenBalance(h, ataX), xBefore);
  });
});
