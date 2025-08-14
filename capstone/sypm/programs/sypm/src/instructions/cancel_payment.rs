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

    // Escrow authority PDA
    #[account(
        seeds = [b"escrow", payment_session.key().as_ref()],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = escrow_authority
    )]
    pub escrow_vault: Account<'info,TokenAccount>,

    // Token mint for the escrow vault
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info,TokenAccount>,

    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, anchor_lang::system_program::System>,
}

impl<'info> CancelPayment<'info> {
    pub fn cancel(&mut self) -> Result<()> {
         // Transfer from escrow back to user using escrow_authority PDA
        let bump = self.payment_session.bump;
        let payment_session_key = self.payment_session.key();
        let seeds = &[
            b"escrow",
            payment_session_key.as_ref(),
            &[bump],
        ];

         let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.escrow_vault.to_account_info(),
            to: self.user_token_account.to_account_info(),
            authority: self.escrow_authority.to_account_info(), // Use escrow_authority PDA
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
