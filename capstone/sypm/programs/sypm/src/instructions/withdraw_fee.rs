use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds=[b"protocol_fee_vault"],
        bump
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, fee_vault_bump: u8) -> Result<()> {
        let seeds: &[&[u8]] = &[b"protocol_fee_vault", &[fee_vault_bump]];
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: self.fee_vault.to_account_info(),
            to: self.admin_token_account.to_account_info(),
            authority: self.fee_vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}
