use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::PaymentSession;

#[derive(Accounts)]
pub struct FinalizePayment<'info> {
    #[account(mut)]
    pub payment_session: Account<'info, PaymentSession>,

    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> FinalizePayment<'info> {
    pub fn finalize(&mut self, success: bool, _bumps: &FinalizePaymentBumps) -> Result<()> {
        if success {
            self.payment_session.status = 1;
            // Transfer funds to merchant
        } else {
            self.payment_session.status = 2;
            // Optionally refund user
        }
        // Log metadata / emit event here
        Ok(())
    }
}
