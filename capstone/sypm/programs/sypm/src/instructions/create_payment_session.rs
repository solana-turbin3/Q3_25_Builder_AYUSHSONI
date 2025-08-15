use anchor_lang::prelude::*;

use crate::{MerchantRegistry, PaymentSession};


#[derive(Accounts)]
pub struct CreatePaymentSession<'info> {
   #[account(mut)]
   pub user: Signer<'info>,

   #[account(
    seeds = [b"merchant_registry",merchant.key().as_ref()],
    bump = merchant_registry.bump
   )]
   pub merchant_registry: Account<'info,MerchantRegistry>,

   #[account(
    init,
    payer = user,
    space = 8 + PaymentSession::INIT_SPACE,
    seeds = [b"payment_session",user.key().as_ref(),merchant.key().as_ref()],
    bump
   )]
   pub payment_session: Account<'info,PaymentSession>,

   /// CHECK: Merchant wallet
   pub merchant: UncheckedAccount<'info>,

   pub system_program: Program<'info,System>,
}

impl <'info> CreatePaymentSession<'info> {
    pub fn create(
        &mut self,
        preferred_token: Pubkey,
        split_tokens: Vec<(Pubkey, u64)>,
        total_requested: u64,
        bumps: &CreatePaymentSessionBumps,
    ) -> Result<()> {
        self.payment_session.set_inner(PaymentSession {
             user: self.user.key(),
             merchant: self.merchant.key(),
             preferred_token,
             split_tokens,
             total_requested,
             status: 0,
             bump: bumps.payment_session,
        });

        Ok(())  
    }
}