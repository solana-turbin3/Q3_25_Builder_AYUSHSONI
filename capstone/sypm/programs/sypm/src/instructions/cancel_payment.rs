use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};


#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawFees<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.fee_vault.to_account_info(),
            to: self.admin_token_account.to_account_info(),
            authority: self.admin.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
