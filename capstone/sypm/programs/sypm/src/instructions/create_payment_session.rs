use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct CreatePaymentSession<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Merchant wallet for validation
    pub merchant: UncheckedAccount<'info>,

    #[account(
        seeds = [b"merchant_registry", merchant.key().as_ref()],
        bump = merchant_registry.bump // Validate using stored bump
    )]
    pub merchant_registry: Account<'info, MerchantRegistry>,

    #[account(
        init,
        payer = user,
        space = 8 + PaymentSession::INIT_SPACE,
        seeds = [b"payment_session", user.key().as_ref()],
        bump
    )]
    pub payment_session: Account<'info, PaymentSession>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreatePaymentSession<'info> {
    pub fn create(
        &mut self,
        preferred_token: Pubkey,
        split_tokens: Vec<SplitToken>, // <- Updated parameter type
        total_requested: u64,
        bumps: &CreatePaymentSessionBumps,
    ) -> Result<()> {
        self.payment_session.set_inner(PaymentSession {
            user: self.user.key(),
            merchant: self.merchant.key(),
            preferred_token,
            split_tokens, // <- No conversion needed anymore
            total_requested,
            status: 0,
            bump: bumps.payment_session, // You should use ctx.bumps.payment_session here
        });

        Ok(())
    }
}