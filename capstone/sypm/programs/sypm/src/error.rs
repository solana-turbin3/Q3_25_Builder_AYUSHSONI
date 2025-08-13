use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // existing error variants

    #[msg("Payment session is not pending.")]
    SessionNotPending,
}