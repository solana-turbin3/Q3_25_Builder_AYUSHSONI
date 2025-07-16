use crate::error::AmmError;
use crate::state::Config;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config",config.seed.to_be_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info,Config>,
}

impl<'info>Update<'info>{
    pub fn lock(&mut self) -> Result<()>{
        require!(
            self.user.key() == self.config.authority.unwrap(),
            AmmError::InvalidAmount
        );
        self.config.locked = true;
        Ok(())
    }

    pub fn unlock(&mut self) -> Result<()>{
        require!(
            self.user.key() == self.config.authority.unwrap(),
            AmmError::InvalidAmount,
        );
        self.config.locked = false;
        Ok(())
    }
}