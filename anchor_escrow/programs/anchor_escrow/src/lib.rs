pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("D5uvm16TNKJxfvcMj3mPpY5mBQSyWNJ3bHEXkHm4YEH5");

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn make(ctx:Context<Make>,seed:u64,deposit:u64,receive:u64) -> Result<()>{
        ctx.accounts.deposit(deposit)?;
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps)
    }
  
    pub fn refund(ctx:Context<Refund>) -> Result<()>{
        ctx.accounts.refund_and_close_vault()
    }

    pub fn take(ctx:Context<Take>,) -> Result<()>{
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw_and_close_vault()
    }
   
}
