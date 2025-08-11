use anchor_lang::prelude::*;

#[account]
pub struct PaymentSession {
    pub user: Pubkey,  // 32
    pub merchant: Pubkey, // 32
    pub split_tokens: Vec<(Pubkey,u64)>, // 4 + ((32+8) × max_len) bytes
    pub status: u8,  // 1
    pub bump: u8,   // 1
}

impl Space for PaymentSession {
   const INIT_SPACE: usize = 32 + 32 + 4 + ((32 + 8) * 5) + 1 + 1;
}