use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

pub const FEE_BPS: u64 = 10; // 0.1%
pub const BPS_DENOM: u64 = 10_000;