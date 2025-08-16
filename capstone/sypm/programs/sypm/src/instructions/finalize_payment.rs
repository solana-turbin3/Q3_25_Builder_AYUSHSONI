#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, transfer, Transfer, Mint};

use crate::error::ErrorCode;
use crate::state::*;
use crate::constants::*;

#[event]
pub struct PaymentFinalized {
    pub session: Pubkey,
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub preferred_mint: Pubkey,
    pub gross_amount: u64,
    pub fee_amount: u64,
    pub net_to_merchant: u64,
}
 
#[derive(Accounts)]
pub struct FinalizePayment<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Merchant only for validation and PDA derivation
    pub merchant: UncheckedAccount<'info>,

    #[account(
        has_one = merchant @ ErrorCode::MerchantMismatch
    )]
    pub merchant_registry: Account<'info, MerchantRegistry>,

    #[account(
        mut,
        constraint = payment_session.user == user.key() @ ErrorCode::Unauthorized,
        constraint = payment_session.merchant == merchant.key() @ ErrorCode::MerchantMismatch,
        constraint = payment_session.preferred_token == preferred_mint.key() @ ErrorCode::PreferredMismatch,
        constraint = payment_session.status == (PaymentStatus::Pending as u8) @ ErrorCode::WrongStatus,
    )]
    pub payment_session: Account<'info, PaymentSession>,

    #[account(
        seeds = [b"escrow", payment_session.key().as_ref()],
        bump
    )]
    /// CHECK: PDA derived from payment_session
    pub escrow_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = escrow_authority
    )]
    pub payment_vault_ata: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"fee_vault"],
        bump
    )]
    /// CHECK: PDA derived from fee_vault seeds
    pub fee_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = fee_vault_authority 
    )]
    pub fee_vault_ata: Account<'info, TokenAccount>,

    pub preferred_mint: Account<'info, Mint>,
  
    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = merchant
    )]
    pub merchant_dest_ata: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    /// CHECK: Jupiter program for token swaps
    pub jupiter_program: UncheckedAccount<'info>,
}

impl<'info> FinalizePayment<'info> {
    pub fn finalize_token(&mut self, jupiter_ix_datas: Vec<Vec<u8>>, escrow_bump: u8) -> Result<()> {
        let preferred_mint = &self.preferred_mint;
        let payment_session = &self.payment_session;

        // Process each split token
        for (i, split_token) in payment_session.split_tokens.iter().enumerate() {
            if split_token.token == preferred_mint.key() {
                // Direct transfer for preferred token
                msg!("Direct transfer for preferred token: {}", split_token.token);
            } else {
                // Swap via Jupiter CPI
                let ix_data = jupiter_ix_datas.get(i).ok_or(ErrorCode::MissingJupiterIx)?;
                msg!("Jupiter swap for token: {} with data length: {}", split_token.token, ix_data.len());
            }
        }

        // Get vault amount after swaps
        let vault_amt = self.payment_vault_ata.amount;

        // Slippage protection
        if vault_amt < payment_session.total_requested {
            return Err(ErrorCode::InsufficientOutput.into());
        }

        // Fee calculation
        let fee: u64 = vault_amt
            .checked_mul(FEE_BPS as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DENOM)
            .ok_or(ErrorCode::MathOverflow)?;

        let to_merchant = vault_amt
            .checked_sub(fee)
            .ok_or(ErrorCode::MathOverflow)?;

        // Create signer seeds for escrow authority
        let payment_session_key = payment_session.key();
        let seeds: &[&[u8]] = &[
            b"escrow", 
            payment_session_key.as_ref(), 
            &[escrow_bump]
        ];
        let signer = &[seeds];

        // Transfer fee to fee vault
        transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.payment_vault_ata.to_account_info(),
                    to: self.fee_vault_ata.to_account_info(),
                    authority: self.escrow_authority.to_account_info(),
                },
                signer
            ),
            fee,
        )?;

        // Transfer remainder to merchant
        transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.payment_vault_ata.to_account_info(),
                    to: self.merchant_dest_ata.to_account_info(),
                    authority: self.escrow_authority.to_account_info(),
                },
                signer,
            ),
            to_merchant,
        )?;

        // Update payment session status
        let session = &mut self.payment_session;
        session.status = PaymentStatus::Completed as u8;

        // Emit event
        emit!(PaymentFinalized {
            session: payment_session_key,
            user: session.user,
            merchant: session.merchant,
            preferred_mint: preferred_mint.key(),
            gross_amount: vault_amt,
            fee_amount: fee,
            net_to_merchant: to_merchant,
        });

        msg!("Payment finalized: session={}, amount={}, fee={}, merchant={}", 
             payment_session_key, vault_amt, fee, to_merchant);

        Ok(())
    }
}