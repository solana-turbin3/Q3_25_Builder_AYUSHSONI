use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Marketplace{
    pub admin: PubKey,


    pub fee_percentage: u8,

    pub bump: u8,

    pub treasury_bump: u8,
}