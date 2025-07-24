use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::{
            FreezeDelegatedAccountCpi, FreezeDelegatedAccountCpiAccounts,
        },
        MasterEditionAccount,Metadata, MetadataAccount,
    },
   token::{approve,Approve,Mint,Token,TokenAccount},
};

use crate::{
    state::{StakeAccount,StakeConfig,UserAccount},
};

#[derive(Accounts)]
pub struct Stake<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info,Mint>,

    pub collection_mint:Account<'info,Mint>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub mint_ata: Account<'info,TokenAccount>,

    #[account(
        seeds= [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub metadata: Account<'info,MetadataAccount>,

    #[account(
        seeds= [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            b"edition"
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub edition: Account<'info,MetadataAccount>,

    #[account(
    seeds = [b"config"],
    bump = config.bump
   )]
   pub config:Account<'info,StakeConfig>,

   #[account(
    mut,
    seeds = [b"user",user.key().as_ref()],
    bump = user_account.bump
    )]
    pub user_account: Account<'info,UserAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake",mint.key().as_ref(),config.key().as_ref()],
        bump,
    )]
    pub stake:Account<'info,StakeAccount>,

    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>,
    pub metadata_program:Program<'info,Metadata>,

}

impl <'info>Stake<'info> {
    
}
