use anchor_lang::{accounts::program, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token::{transfer_checked, Token, TransferChecked},
    token_interface::{Mint, TokenAccount},
};

use crate::{
    errors::MarketplaceError,
    states::{Listing, Marketplace},
};

#[derive(Account)]
pub struct List<'info>{
    pub nft: InterfaceAccount<'info,Mint>,


    #[account(
        init,
        payer = seller,
        space = 8+Listing::INIT_SPACE,
        seeds = [b"listing",
                 marketplace.key().as_ref(),
                 seller.key().as_ref(),
                 nft.key().as_ref(),
                 ],
                 bump
    )]
    pub listing:Account<'info,Listing>,

    #[account(
       init,
       payer=seller,
       associated_token::mint=nft,
       associated_token::authority=listing
    )]
    pub listing_token_Account: InterfaceAccount<'info,TokenAccount>,

    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = nft,
        associated_token::authority = seller,
        constraint = seller_token_Account.owner == seller.key()
    )]
    pub seller_token_Account: InterfaceAccount<'info,TokenAccount>,

    #[account(
        seeds = [b"marketplace"],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info,Marketplace>,


    pub collection_mint: InterfaceAccount<'info,Mint>,

    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            nft.key().as_ref(),
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection_mint.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection_mint.as_ref().unwrap().verified == true,
    )]
    pub metadata: Account<'info,MetadataAccount>,

  
    #[account(
        seeds = [
            b"metadata", 
            metadata_program.key().as_ref(),
            nft.key().as_ref(),
            b"edition"
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info,MasterEditionAccount>,

    pub metadata_program: Program<'info,Metadata>,

    pub token_program: Program<'info,Token>,

    pub associated_token_account: Program<'info,AssociatedToken>,

    pub system_program: Program<'info,System>,

}

impl <'info>ListNft<'info> {

}