#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterMerchant<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,

    #[account(
    init,
    payer=merchant,
    seeds=[b"merchant",merchant.key().as_ref()],
    bump,
    space= 8 + MerchantRegistry::INIT_SPACE
  )]
    pub merchant_registry: Account<'info, MerchantRegistry>,

    pub system_program: Program<'info, System>,
}

impl<'info> RegisterMerchant<'info> {
    pub fn register(
        &mut self,
        accepted_tokens: Vec<Pubkey>,
        fallback_token: Pubkey,
        bumps: &RegisterMerchantBumps,
    ) -> Result<()> {
        self.merchant_registry.set_inner(MerchantRegistry {
            merchant: self.merchant.key(),
            accepted_tokens,
            fallback_token,
            bump: bumps.merchant_registry,
        });
        Ok(())
    }

}
