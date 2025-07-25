use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct StakeConfig{
    pub points_per_stake:u8,
    pub max_stake: u8,
    pub freeze_periods:u8,
    pub reward_bump:u8,
    pub bump:u8,
}

