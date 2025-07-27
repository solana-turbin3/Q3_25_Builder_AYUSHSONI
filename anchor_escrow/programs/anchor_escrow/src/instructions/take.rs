use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked,Mint,TokenAccount,TokenInterface,TransferChecked},
};
use crate::Escrow;

#[derive(Accounts)]
pub struct Take<'info>{
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    pub mint_a : InterfaceAccount<'info,Mint>,
    pub mint_b : InterfaceAccount<'info,Mint>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata_a : Box<InterfaceAccount<'info,TokenAccount>>,
 
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata_b : Box<InterfaceAccount<'info,TokenAccount>>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata_b : Box<InterfaceAccount<'info,TokenAccount>>,

    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = mint_a,
        has_one = mint_b,
        seeds = [b"escrow",maker.key().as_ref(),escrow.seed.to_be_bytes().as_ref()],
        bump,
    )]
    pub escrow : Account<'info,Escrow>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault : InterfaceAccount<'info,TokenAccount>,

    pub associated_token_program : Program<'info,AssociatedToken>,
    pub token_program : Interface<'info,TokenInterface>,
    pub system_program : Program<'info,System>,
}