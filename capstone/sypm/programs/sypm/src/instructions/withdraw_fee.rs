use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    // Fee vault authority PDA
    #[account(
        seeds=[b"fee_vault"],
        bump
    )]
    pub fee_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = fee_vault_authority
    )]
    pub fee_vault: Account<'info, TokenAccount>,

    // Token mint for the fee vault
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, anchor_lang::system_program::System>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, fee_vault_bump: u8) -> Result<()> {
        let seeds: &[&[u8]] = &[b"fee_vault", &[fee_vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.fee_vault.to_account_info(),
            to: self.admin_token_account.to_account_info(),
            authority: self.fee_vault_authority.to_account_info(), // Use fee_vault_authority PDA
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
