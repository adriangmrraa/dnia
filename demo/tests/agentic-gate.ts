import * as anchor from "@anchor-lang/core";
import { assert } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { bootGate, fundSol, stopGate, GateHarness } from "./helpers/surfnet";

// S1 — gate del scaffold: GateConfig persiste los 4 campos y solo el admin rota.
// Los CAs CA-1..CA-12 se agregan en S2/S3/S4 sobre este mismo harness.
describe("agentic-gate — S1: config del gate", () => {
  let h: GateHarness;

  const sasCredential = Keypair.generate().publicKey;
  const sasSchema = Keypair.generate().publicKey;

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

  it("initialize_config persiste los 4 campos", async () => {
    const admin = h.payer.publicKey;

    await h.program.methods
      .initializeConfig(admin, sasCredential, sasSchema, 1)
      .rpc();

    const config = await h.program.account.gateConfig.fetch(configPda);
    assert.equal(config.admin.toBase58(), admin.toBase58());
    assert.equal(
      config.sasCredential.toBase58(),
      sasCredential.toBase58()
    );
    assert.equal(config.sasSchema.toBase58(), sasSchema.toBase58());
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
