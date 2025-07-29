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


    pub listing:Account<'info,Listing>,

    pub listing_token_Account: InterfaceAccount<'info,TokenAccount>,

    pub seller: Signer<'info>,

    pub seller_token_Account: InterfaceAccount<'info,TokenAccount>,

    pub marketplace: Account<'info,Marketplace>,

    pub collection_mint: InterfaceAccount<'info,Mint>,

    pub metadata: Account<'info,MetadataAccount>,


    pub master_edition: Account<'info,MasterEditionAccount>,

    pub metadata_program: Program<'info,Metadata>,

    pub token_program: Program<'info,Token>,

    pub associated_token_account: Program<'info,AssociatedToken>,

    pub system_program: Program<'info,System>,

}