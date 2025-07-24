use anchor_lang::prelude::*;

#[error_code]
pub enum StakeError {
   #[msg("Time has not elapsed for unstaking!")]
   TimeElapsedError,
}
