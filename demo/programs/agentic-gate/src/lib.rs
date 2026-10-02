use anchor_lang::prelude::*;

declare_id!("D8pcKtezTzhVA6fw2SLpyFP5wY1DfUiPJCVmeqqX1xG2");

/// Seed del PDA de configuración global del gate.
pub const CONFIG_SEED: &[u8] = b"config";

/// Programa SAS oficial (Solana Attestation Service) en devnet.
/// Se consume SOLO por lectura de cuentas — INV-4: un único programa custom.
pub const SAS_PROGRAM_ID: Pubkey = pubkey!("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

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

/// Errores del gate — se completan en S3/S4 con la matriz de reverts.
#[error_code]
pub enum GateError {
    #[msg("El firmante no es el admin registrado en GateConfig")]
    Unauthorized,
}
