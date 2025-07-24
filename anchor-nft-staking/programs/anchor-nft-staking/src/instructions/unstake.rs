use anchor_lang::{accounts::program, prelude::*};

#[derive(Accounts)]
pub struct Unstake<'info>{
  #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info,Mint>,
    
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
        mut,
        close = user,
        seeds = [b"stake",mint.key().as_ref(),config.key().as_ref()],
        bump,
    )]
    pub stake:Account<'info,StakeAccount>,

    pub system_program:Program<'info,System>,
    pub token_program:Program<'info,Token>,
    pub metadata_program:Program<'info,Metadata>,

}

impl <'info>Unstake<'info> {
    pub fn unstake(&mut self) -> Result<()>{
        let time_elapsed = ((Clock::get()?.unix_timestamp-self.stake.staked_at)/86400) as u32;
        require!(time_elapsed>self.config.freeze_period,StakeError::TimeElapsedError);
        self.config.points+=self_config.points_per_stake*time_elapsed;
        
        let program = self.token_program.to_account_info();

        todo!()
    }
}