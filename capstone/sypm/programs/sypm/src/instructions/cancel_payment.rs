use anchor_lang::prelude::*;
use anchor_spl::token::{self,Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CancelPayment<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds=[b"payment_session",user.key().as_ref(),merchant.key().as_ref()],
        bump = payment_session.bump,
        constraint = payment_session.status == 0 @ ErrorCode::SessionNotPending
    )]
    pub payment_session: Account<'info,PaymentSession>,

    pub merchant: UncheckedAccount<'info>,

    #[account(mut)]
    pub escrow_vault: Account<'info,TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info,TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> CancelPayment<'info> {
    pub fn cancel(&mut self) -> Result<()> {
         // Transfer from escrow back to user
        let payment_session_key = self.payment_session.key();
        let seeds = &[
            b"escrow_vault",
            payment_session_key.as_ref(),
            &[self.payment_session.bump],
        ];

         let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.escrow_vault.to_account_info(),
            to: self.user_token_account.to_account_info(),
            authority: self.payment_session.to_account_info(), // PDA as authority
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token::transfer(cpi_ctx, self.escrow_vault.amount)?;

        self.payment_session.status = 2; // Cancelled
        Ok(())
    }
}
