use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2");

/// Seed del PDA de configuración global del gate.
pub const CONFIG_SEED: &[u8] = b"config";
/// Seed del PDA de mandato: ["mandate", owner, agent].
pub const MANDATE_SEED: &[u8] = b"mandate";
/// Programa SAS oficial (Solana Attestation Service) en devnet.
/// Se consume SOLO por lectura de cuentas — INV-4: un único programa custom.
pub const SAS_PROGRAM_ID: Pubkey = pubkey!("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
/// Seed literal SAS para la PDA de attestation (verificado en sas-lib pdas.ts).
pub const SAS_ATTESTATION_SEED: &[u8] = b"attestation";
/// Discriminador u8 de la cuenta Attestation SAS — verificado empíricamente
/// contra el binario real de devnet (Credential=0, Schema=1, Attestation=2).
pub const SAS_ATTESTATION_DISCRIMINATOR: u8 = 2;
/// Tope de la whitelist de payees del mandato.
pub const MAX_PAYEES: usize = 8;
/// Segundos por día calendario UTC (day_index = unix_timestamp / 86400 — D6).
pub const SECS_PER_DAY: i64 = 86_400;

#[program]
pub mod agentic_gate {
    use super::*;

    /// Crea el GateConfig (PDA ["config"]) con el issuer/schema SAS confiables.
    /// Una sola instancia; `init` falla si ya existe.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin: Pubkey,
        sas_credential: Pubkey,
        sas_schema: Pubkey,
        min_level: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.sas_credential = sas_credential;
        config.sas_schema = sas_schema;
        config.min_level = min_level;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Rota issuer/schema/nivel mínimo — solo el admin registrado firma.
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        sas_credential: Pubkey,
        sas_schema: Pubkey,
        min_level: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.sas_credential = sas_credential;
        config.sas_schema = sas_schema;
        config.min_level = min_level;
        Ok(())
    }

    /// El owner crea el mandato que autoriza a `agent` a pagar dentro de la
    /// política (límites, whitelist, expiración). Contadores arrancan en 0.
    pub fn init_mandate(
        ctx: Context<InitMandate>,
        agent: Pubkey,
        max_per_tx: u64,
        daily_cap: u64,
        payees: Vec<Pubkey>,
        expiry: i64,
    ) -> Result<()> {
        require!(payees.len() <= MAX_PAYEES, GateError::TooManyPayees);

        let mandate = &mut ctx.accounts.mandate;
        mandate.owner = ctx.accounts.owner.key();
        mandate.agent = agent;
        mandate.max_per_tx = max_per_tx;
        mandate.daily_cap = daily_cap;
        mandate.spent_today = 0;
        mandate.day_index = -1; // sin ventana UTC activa todavía
        mandate.total_spent = 0;
        mandate.payee_whitelist = payees;
        mandate.expiry = expiry;
        mandate.revoked = false;
        mandate.bump = ctx.bumps.mandate;
        Ok(())
    }

    /// Pago gateado atómico: check identidad SAS + check autorización del
    /// mandato + actualización de contadores + transfer SPL + recibo.
    /// Cualquier `require!` falla → la tx entera revierte (INV-2).
    pub fn pay(ctx: Context<Pay>, amount: u64, service_ref: [u8; 16]) -> Result<()> {
        require!(amount > 0, GateError::InvalidAmount);
        let now = Clock::get()?.unix_timestamp;

        // ── IDENTIDAD (R-02) ────────────────────────────────────────────
        let att = &ctx.accounts.attestation;
        let config = &ctx.accounts.config;

        // 1. La cuenta debe pertenecer al programa SAS.
        require!(
            att.owner == &SAS_PROGRAM_ID,
            GateError::AttestationMissing
        );

        // 2. Re-derivación del PDA: ["attestation", credential, schema, agent].
        //    Amarra issuer (credential), schema y wallet del agente de una vez —
        //    una attestation de otro issuer/schema/wallet no produce esta PDA.
        let (expected_att, _bump) = Pubkey::find_program_address(
            &[
                SAS_ATTESTATION_SEED,
                config.sas_credential.as_ref(),
                config.sas_schema.as_ref(),
                ctx.accounts.agent.key().as_ref(),
            ],
            &SAS_PROGRAM_ID,
        );
        require!(att.key() == expected_att, GateError::IssuerNotRecognized);

        // 3. Layout verificado on-chain (sas-lib@1.0.10 + dump devnet):
        //    [0]      u8  discriminador de cuenta (Attestation = 2)
        //    [1..33]  nonce (32B) — wallet atestada
        //    [33..65] credential (32B)
        //    [65..97] schema (32B)
        //    [97..101] u32 LE data_len
        //    [101..]  data (data_len bytes; byte 0 = level:u8 del schema demo)
        //    +32      signer (32B)
        //    +8       expiry i64 LE
        //    +32      token_account (32B)
        let data = att.try_borrow_data()?;
        require!(data.len() >= 101, GateError::AttestationMissing);
        require!(
            data[0] == SAS_ATTESTATION_DISCRIMINATOR,
            GateError::AttestationMissing
        );
        let data_len = u32::from_le_bytes(data[97..101].try_into().unwrap()) as usize;
        require!(data_len >= 1, GateError::AttestationMissing);
        require!(
            data.len() >= 101 + data_len + 32 + 8,
            GateError::AttestationMissing
        );
        let level = data[101];
        let expiry_off = 101 + data_len + 32;
        let expiry =
            i64::from_le_bytes(data[expiry_off..expiry_off + 8].try_into().unwrap());
        drop(data);

        // 4/5. Expiración y nivel.
        require!(
            expiry == 0 || expiry > now,
            GateError::AttestationExpired
        );
        require!(
            level >= config.min_level,
            GateError::AttestationLevelTooLow
        );

        // ── AUTORIZACIÓN (R-03) ─────────────────────────────────────────
        let mandate = &mut ctx.accounts.mandate;

        require!(
            mandate.agent == ctx.accounts.agent.key(),
            GateError::MandateBoundToOtherAgent
        );
        require!(!mandate.revoked, GateError::MandateRevoked);
        require!(
            mandate.expiry == 0 || mandate.expiry > now,
            GateError::MandateExpired
        );
        require!(
            mandate
                .payee_whitelist
                .contains(&ctx.accounts.service.key()),
            GateError::PayeeNotWhitelisted
        );
        require!(amount <= mandate.max_per_tx, GateError::OverPerTxLimit);

        // Cap por día calendario UTC (D6).
        let day = now / SECS_PER_DAY;
        let spent = if mandate.day_index == day {
            mandate.spent_today
        } else {
            0
        };
        require!(
            spent
                .checked_add(amount)
                .ok_or(GateError::MathOverflow)?
                <= mandate.daily_cap,
            GateError::OverDailyCap
        );

        // ── EFECTOS (contadores antes del CPI — check-effects) ──────────
        mandate.day_index = day;
        mandate.spent_today = spent + amount;
        mandate.total_spent = mandate
            .total_spent
            .checked_add(amount)
            .ok_or(GateError::MathOverflow)?;

        // ── INTERACCIÓN: transfer SPL firmado por el agente (R-04) ──────
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.agent_ata.to_account_info(),
                    to: ctx.accounts.service_ata.to_account_info(),
                    authority: ctx.accounts.agent.to_account_info(),
                },
            ),
            amount,
        )?;

        // ── RECIBO observable (R-05): event-log, sin cuenta extra (D2) ──
        emit!(PaymentReceipt {
            payer: ctx.accounts.agent.key(),
            payee: ctx.accounts.service.key(),
            amount,
            service_ref,
            mandate: mandate.key(),
            timestamp: now,
        });
        Ok(())
    }

    /// El owner revoca el mandato — el próximo `pay` revierte MandateRevoked
    /// (beat 6). El mandato sigue existiendo (auditable por el dashboard).
    pub fn revoke_mandate(ctx: Context<RevokeMandate>) -> Result<()> {
        ctx.accounts.mandate.revoked = true;
        Ok(())
    }

    /// El owner cierra el mandato: devuelve el rent y permite re-init
    /// (reparación de demo — crea otro mandato limpio para el mismo agente).
    pub fn close_mandate(_ctx: Context<CloseMandate>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + GateConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, GateConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ GateError::Unauthorized,
    )]
    pub config: Account<'info, GateConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(agent: Pubkey)]
pub struct InitMandate<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 512,
        seeds = [MANDATE_SEED, owner.key().as_ref(), agent.as_ref()],
        bump
    )]
    pub mandate: Account<'info, Mandate>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Pay<'info> {
    /// El agente firma y paga — es la `nonce` de la attestation y el
    /// `agent` ligado por el mandato.
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, GateConfig>,

    /// CHECK: attestation SAS del agente. Se valida íntegramente en el cuerpo
    /// de `pay` (owner, re-derivación PDA, discriminador, expiry, level).
    pub attestation: UncheckedAccount<'info>,

    /// La PDA se deriva de los campos ALMACENADOS (owner, agent) — no del
    /// firmante — para que el check `mandate.agent == agent.key()` distinga
    /// a un agente ajeno como MandateBoundToOtherAgent (CA-11).
    #[account(
        mut,
        seeds = [MANDATE_SEED, mandate.owner.as_ref(), mandate.agent.as_ref()],
        bump = mandate.bump
    )]
    pub mandate: Account<'info, Mandate>,

    /// CHECK: wallet del servicio payee — solo identidad para la whitelist.
    pub service: UncheckedAccount<'info>,

    /// ATA del agente — debe pertenecer al firmante (paga desde su ATA).
    #[account(
        mut,
        constraint = agent_ata.owner == agent.key() @ GateError::AgentTokenMismatch
    )]
    pub agent_ata: Account<'info, TokenAccount>,

    /// ATA del servicio — debe pertenecer a la wallet `service` para que el
    /// check de whitelist cubra al destinatario REAL de los fondos.
    #[account(
        mut,
        constraint = service_ata.owner == service.key() @ GateError::ServiceTokenMismatch
    )]
    pub service_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RevokeMandate<'info> {
    #[account(
        mut,
        seeds = [MANDATE_SEED, mandate.owner.as_ref(), mandate.agent.as_ref()],
        bump = mandate.bump,
        has_one = owner @ GateError::Unauthorized,
    )]
    pub mandate: Account<'info, Mandate>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseMandate<'info> {
    #[account(
        mut,
        close = owner,
        seeds = [MANDATE_SEED, mandate.owner.as_ref(), mandate.agent.as_ref()],
        bump = mandate.bump,
        has_one = owner @ GateError::Unauthorized,
    )]
    pub mandate: Account<'info, Mandate>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// Configuración global del gate: a qué issuer SAS y schema confiar.
#[account]
#[derive(InitSpace)]
pub struct GateConfig {
    /// Quien puede rotar issuer/schema/nivel (humano operador del gate).
    pub admin: Pubkey,
    /// Credential PDA del issuer SAS confiable (mock issuer en la demo).
    pub sas_credential: Pubkey,
    /// Schema PDA esperado ("agentic-dni-human-verified" v1).
    pub sas_schema: Pubkey,
    /// Nivel mínimo exigido en attestation.data.level.
    pub min_level: u8,
    /// Bump del PDA ["config"].
    pub bump: u8,
}

/// Mandato owner→agent: política de gasto + contadores + whitelist.
#[account]
#[derive(InitSpace)]
pub struct Mandate {
    /// Humano dueño — único que crea/revoca/cierra.
    pub owner: Pubkey,
    /// Wallet del agente ligado (un mandato por par owner-agente).
    pub agent: Pubkey,
    /// Tope por transacción en unidades base USDC (6 dec) — R-03.
    pub max_per_tx: u64,
    /// Tope por día calendario UTC — D6.
    pub daily_cap: u64,
    /// Gasto acumulado de la ventana UTC activa.
    pub spent_today: u64,
    /// `unix_timestamp / 86400` de la ventana activa (-1 = ninguna).
    pub day_index: i64,
    /// Acumulado histórico (legibilidad del dashboard).
    pub total_spent: u64,
    /// Payees (wallets de servicios) autorizados — R-03, cap 8.
    #[max_len(8)]
    pub payee_whitelist: Vec<Pubkey>,
    /// `0` = sin expiración; si no, se exige `> now`.
    pub expiry: i64,
    /// Revocación del owner — beat 6.
    pub revoked: bool,
    /// Bump del PDA.
    pub bump: u8,
}

/// Recibo observable del pago — event-log (D2), parseable desde `Program data:`.
#[event]
pub struct PaymentReceipt {
    /// Wallet del agente pagador.
    pub payer: Pubkey,
    /// Wallet del servicio cobrador.
    pub payee: Pubkey,
    /// Monto en unidades base USDC.
    pub amount: u64,
    /// Referencia de factura/servicio (16B) provista por el pagador.
    pub service_ref: [u8; 16],
    /// PDA del mandato usado (vínculo semántico para el dashboard).
    pub mandate: Pubkey,
    /// `unix_timestamp` del pago.
    pub timestamp: i64,
}

/// Errores del gate — una variante por motivo de revert (distinguibles en
/// logs/explorer/dashboard, R-02/R-03/CA-4..CA-12).
#[error_code]
pub enum GateError {
    #[msg("El firmante no es el admin registrado en GateConfig")]
    Unauthorized,
    #[msg("El monto debe ser mayor a cero")]
    InvalidAmount,
    #[msg("No existe una attestation SAS válida para esta wallet")]
    AttestationMissing,
    #[msg("La attestation no proviene del issuer/schema/wallet configurados")]
    IssuerNotRecognized,
    #[msg("La attestation SAS está expirada")]
    AttestationExpired,
    #[msg("El nivel de la attestation es inferior al mínimo configurado")]
    AttestationLevelTooLow,
    #[msg("El mandato pertenece a otro agente")]
    MandateBoundToOtherAgent,
    #[msg("El mandato fue revocado por su owner")]
    MandateRevoked,
    #[msg("El mandato está expirado")]
    MandateExpired,
    #[msg("El payee no está en la whitelist del mandato")]
    PayeeNotWhitelisted,
    #[msg("El monto excede el tope por transacción del mandato")]
    OverPerTxLimit,
    #[msg("El monto excede el cap diario restante del mandato")]
    OverDailyCap,
    #[msg("Desbordamiento aritmético")]
    MathOverflow,
    #[msg("La whitelist excede el máximo de 8 payees")]
    TooManyPayees,
    #[msg("El token account origen no pertenece al agente")]
    AgentTokenMismatch,
    #[msg("El token account destino no pertenece al servicio")]
    ServiceTokenMismatch,
}
