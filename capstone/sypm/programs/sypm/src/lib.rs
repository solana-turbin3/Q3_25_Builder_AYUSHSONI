#![allow(unexpected_cfgs)]
#![allow(deprecated)]

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod cpi;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("Bo7KK9TXMvoyL8EuBaoD3aWnRfXvaDzJV3sonBo7GguG");

#[program]
pub mod sypm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn cancel_payment(ctx: Context<CancelPayment>) -> Result<()> {
        ctx.accounts.cancel()
    }
 
    pub fn withdraw_fees(ctx: Context<Withdraw>, amount: u64, fee_vault_bump: u8) -> Result<()> {
        ctx.accounts.withdraw(amount, fee_vault_bump)
    }

    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        accepted_tokens: Vec<Pubkey>,
        fallback_token: Pubkey,
    ) -> Result<()> {
        ctx.accounts.register(accepted_tokens, fallback_token, &ctx.bumps)
    }

    pub fn create_payment_session(
        ctx: Context<CreatePaymentSession>,
        preferred_token: Pubkey,
        split_tokens: Vec<SplitToken>, // <- Use the struct instead of tuple
        total_requested: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            preferred_token, 
            split_tokens,
            total_requested,
            &ctx.bumps
        )
    }

    pub fn finalize_payment(
        ctx: Context<FinalizePayment>,
        jupiter_ix_datas: Vec<Vec<u8>>,
    ) -> Result<()> {
        ctx.accounts.finalize_token(jupiter_ix_datas, ctx.bumps.escrow_authority)
    }
}
