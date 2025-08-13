use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("PaymentSession in wrong status")]
    WrongStatus,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Merchant mismatch")]
    MerchantMismatch,
    #[msg("Preferred token mismatch")]
    PreferredMismatch,
    #[msg("Insufficient output after swaps")]
    InsufficientOutput,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Missing or bad Jupiter route accounts")]
    BadRouteAccounts,
    #[msg("Missing Jupiter ix data")]
    MissingJupiterIx,
    #[msg("Mint account mismatch")]
    MintMismatch,
    #[msg("Bad instruction data")]
    BadIxData,
    #[msg("Session is not pending ")]
    SessionNotPending,
}
