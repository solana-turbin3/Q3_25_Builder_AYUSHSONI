use anchor_lang::prelude::*;

#[account]
pub struct MerchantRegistry {
  pub merchant: Pubkey,  // 32
  pub accepted_tokens: Vec<Pubkey>, // 4 + (32 × max_len) bytes
  pub fallback_token: Pubkey, // 32
  pub bump: u8, // 1
}

impl Space for MerchantRegistry {
    const INIT_SPACE: usize = 8 + 32 + 4 + (32 * 5) + 32 + 1;
}

