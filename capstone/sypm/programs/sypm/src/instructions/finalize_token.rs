use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount,transfer,Transfer, Mint};

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
    pub merchant_registry: Account<'info,MerchantRegistry>,

    #[account(
        mut,
        constraint = payment_session.user == user.key() @ ErrorCode::Unauthorized,
        constraint = payment_session.merchant == merchant.key() @ErrorCode::MerchantMismatch,
        constraint = payment_session.preferred_token == preferred_mint.key() @ErrorCode::PreferredMismatch,
    )]
    pub payment_session: Account<'info, PaymentSession>,

  
    #[account(
        seeds = [b"escrow",payment_session.key().as_ref()],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = escrow_authority
    )]
    pub payment_vault_ata: Account<'info,TokenAccount>,


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
    pub fee_vault_ata: Account<'info,TokenAccount>,

    /// The preferred mint for the payment session
    pub preferred_mint: Account<'info, Mint>,
  
    #[account(
        mut,
        associated_token::mint = preferred_mint,
        associated_token::authority = merchant
    )]
    pub merchant_dest_ata: Account<'info,TokenAccount>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info,AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info,System>,

    pub jupiter_program: UncheckedAccount<'info>,

}

impl<'info> FinalizePayment<'info> {
    pub fn finalize_token(ctx: Context<FinalizePayment>, jupiter_ix_datas: Vec<Vec<u8>>) -> Result<()> {
    // Sanity
    require!(ctx.accounts.payment_session.status == (PaymentStatus::Pending as u8), ErrorCode::WrongStatus);

    let preferred_mint = &ctx.accounts.preferred_mint;
    let preferred_decimals = preferred_mint.decimals;

    let mut ra_cursor: usize = 0;

    for (i, (mint_key, raw_amount)) in ctx.accounts.payment_session.split_tokens.iter().enumerate() {
        // 1a) Escrow source ATA (owned by escrow_authority), and source mint
        let escrow_source_ata = ctx.remaining_accounts.get(ra_cursor).ok_or(ErrorCode::BadRouteAccounts)?;
        let source_mint_ai   = ctx.remaining_accounts.get(ra_cursor + 1).ok_or(ErrorCode::BadRouteAccounts)?;
        ra_cursor += 2;

        // Validate source mint
        require_keys_eq!(*source_mint_ai.key, *mint_key, ErrorCode::MintMismatch);

        if *mint_key == preferred_mint.key() {
            // Direct transfer from escrow_source_ata -> payment_vault_ata
            direct_transfer_from_escrow(
                &ctx,
                escrow_source_ata,
                &ctx.accounts.payment_vault_ata.to_account_info(),
                source_mint_ai,
                *raw_amount,
            )?;
        } else {
            // Swap via Jupiter CPI
    
            let ix_data = jupiter_ix_datas.get(i).ok_or(ErrorCode::MissingJupiterIx)?;
    
            let (route_len, payload) = parse_len_prefixed(ix_data)?;
            let route_slice_end = ra_cursor + route_len as usize;
            let route_accounts = &ctx.remaining_accounts[ra_cursor..route_slice_end];
            ra_cursor = route_slice_end;

            jupiter_swap_cpi(
                ctx.accounts.jupiter_program.to_account_info(),
                route_accounts,
                payload.clone(),
            )?;
        }
    }

    // === 2) At this point, `payment_vault_ata` holds the full amount in preferred token ===
    let vault_amt = ctx.accounts.payment_vault_ata.amount;

    // Optional: enforce minimum expected output (slippage protection at session level)
    require!(vault_amt >= ctx.accounts.payment_session.total_requested, ErrorCode::InsufficientOutput);

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
    let seeds: &[&[u8]] = &[b"escrow", ctx.accounts.payment_session.key().as_ref(), &[ctx.bumps["escrow_authority"]]];
    let signer = &[seeds];

    // transfer fee
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payment_vault_ata.to_account_info(),
                to: ctx.accounts.fee_vault_ata.to_account_info(),
                authority: ctx.accounts.escrow_authority.to_account_info(),
            },
            signer,
        ),
        fee,
    )?;

    // transfer remainder to merchant
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payment_vault_ata.to_account_info(),
                to: ctx.accounts.merchant_dest_ata.to_account_info(),
                authority: ctx.accounts.escrow_authority.to_account_info(),
            },
            signer,
        ),
        to_merchant,
    )?;

    // === 5) Update status ===
    let session = &mut ctx.accounts.payment_session;
    session.status = PaymentStatus::Completed as u8;

    Ok(())
}

/// Direct transfer from escrow ATA (source mint may differ) into the preferred `payment_vault_ata`.
fn direct_transfer_from_escrow<'info>(
    ctx: &Context<FinalizePayment<'info>>,
    escrow_source_ata: &AccountInfo<'info>,
    payment_vault_ata: &AccountInfo<'info>,
    source_mint_ai: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {

    let seeds: &[&[u8]] = &[b"escrow", ctx.accounts.payment_session.key().as_ref(), &[ctx.bumps["escrow_authority"]]];
    let signer = &[seeds];

    let cpi_accounts = Transfer {
        from: escrow_source_ata.clone(),
        to: payment_vault_ata.clone(),
        authority: ctx.accounts.escrow_authority.to_account_info(),
    };

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        ),
        amount,
    )
}

fn parse_len_prefixed(ix: &Vec<u8>) -> Result<(u16, Vec<u8>)> {
    require!(ix.len() >= 2, ErrorCode::BadIxData);
    let len = u16::from_le_bytes([ix[0], ix[1]]);
    require!(ix.len() >= (2 + len as usize), ErrorCode::BadIxData);
    Ok((len, ix[2..(2 + len as usize)].to_vec()))
}
}
