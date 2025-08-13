// programs/sypm/src/instructions/deposit_tokens.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, TransferChecked, Mint};
use crate::state::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"payment_session", user.key().as_ref(), merchant.key().as_ref()],
        bump = payment_session.bump,
        constraint = payment_session.status == 0 @ ErrorCode::SessionNotPending
    )]
    pub payment_session: Account<'info, PaymentSession>,

    /// CHECK: Merchant only for PDA derivation
    pub merchant: UncheckedAccount<'info>,

    // Escrow account (SPL token account owned by PDA)
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,

    // Token mint of the token being deposited
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> DepositTokens<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_accounts = TransferChecked {
            from: self.user_token_account.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.escrow_vault.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Transfer amount of token with correct decimals
        token::transfer_checked(cpi_ctx, amount, self.token_mint.decimals)?;

        Ok(())
    }
}


