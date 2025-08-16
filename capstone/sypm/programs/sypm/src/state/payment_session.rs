use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PaymentSession {
    pub user: Pubkey,           // 32
    pub merchant: Pubkey,       // 32
    pub preferred_token: Pubkey, // 32
    #[max_len(5)] // Specify max length for the vector
    pub split_tokens: Vec<SplitToken>, // 4 + (40 × 5) bytes
    pub total_requested: u64,   // 8
    pub status: u8,            // 1
    pub bump: u8,             // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct SplitToken {
    pub token: Pubkey,   // 32 bytes
    pub amount: u64,     // 8 bytes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PaymentStatus {
    Pending = 0,
    Completed = 1,
    Cancelled = 2,
}