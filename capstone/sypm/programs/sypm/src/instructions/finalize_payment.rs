use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, transfer, Transfer, Mint};

use crate::error::ErrorCode;
use crate::state::*;

use crate::state::{PaymentSession, PaymentStatus};

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
    // original payer(optional signer for extra safety)
    #[account(mut)]
    pub user: Signer<'info>,

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
    pub fee_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = fee_vault_authority 
    )]
    pub fee_vault_ata: Account<'info, TokenAccount>,

    /// The preferred mint for the payment session
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

    pub jupiter_program: UncheckedAccount<'info>,
}

impl<'info> FinalizePayment<'info> {
    pub fn finalize_token(&mut self, jupiter_ix_datas: Vec<Vec<u8>>) -> Result<()> {
        // Sanity check already done in account validation
        let preferred_mint = &self.preferred_mint;

        // Get the payment session from self
        let payment_session = &self.payment_session;

        for (i, (mint_key, _raw_amount)) in payment_session.split_tokens.iter().enumerate() {
            // 1a) Escrow source ATA (owned by escrow_authority), and source mint
            // Note: In a real implementation, these would come from remaining_accounts
            // For now, we'll simulate the logic
            
            if *mint_key == preferred_mint.key() {
                // Direct transfer from escrow_source_ata -> payment_vault_ata
                // This would require the escrow accounts to be passed in remaining_accounts
                msg!("Direct transfer for preferred token: {}", mint_key);
            } else {
                // Swap via Jupiter CPI
                let ix_data = jupiter_ix_datas.get(i).ok_or(ErrorCode::MissingJupiterIx)?;
                msg!("Jupiter swap for token: {} with data length: {}", mint_key, ix_data.len());
                
                // In production, this would call real Jupiter CPI
                // For now, just log the swap attempt
            }
        }

        // === 2) At this point, `payment_vault_ata` holds the full amount in preferred token ===
        let vault_amt = self.payment_vault_ata.amount;

        // Slippage protection using total_requested from payment session
        if vault_amt < payment_session.total_requested {
            return Err(ErrorCode::InsufficientOutput.into());
        }

        // === 3) Fee calculation ===
        let fee: u64 = vault_amt
            .checked_mul(FEE_BPS as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DENOM)
            .ok_or(ErrorCode::MathOverflow)?;

        let to_merchant = vault_amt
            .checked_sub(fee)
            .ok_or(ErrorCode::MathOverflow)?;

        // === 4) Move funds (vault -> fee vault, merchant) ===
        // Note: In a real implementation, you would need to get the bump from ctx.bumps
        // For now, we'll use a placeholder
        let bump = 0; // This should come from ctx.bumps.escrow_authority
        let payment_session_key = payment_session.key();
        let seeds: &[&[u8]] = &[b"escrow", payment_session_key.as_ref(), &[bump]];
        let signer = &[seeds];

        // transfer fee
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

        // transfer remainder to merchant
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

        // === 5) Update status ===
        let session = &mut self.payment_session;
        session.status = PaymentStatus::Completed as u8;

        // Log payment completion
        msg!("Payment finalized: session={}, amount={}, fee={}, merchant={}", 
             payment_session_key, vault_amt, fee, to_merchant);

        Ok(())
    }
}
