#![allow(unexpected_cfgs)]
#![allow(deprecated)]


use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
declare_id!("9oZwzT5yyovvva93nSPnoTs5coV993ymfRnT5LcMU4z7");

#[program]
pub mod anchor_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)
    }

    pub fn deposit(ctx: Context<Payment>,amount: u64) -> Result<()>{
        ctx.accounts.deposit(amount)
    } 

    pub fn withdraw(ctx: Context<Payment>,amount: u64) -> Result<()>{
        ctx.accounts.withdraw(amount)
    }

    pub fn close(ctx: Context<Close>) -> Result<()>{
        ctx.accounts.close()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        mut
    )]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = VaultState::INIT_SPACE,
        seeds = [b"state",user.key().as_ref()],
        bump,
    )]
    pub vault_state:Account<'info,VaultState>,

    #[account(
        mut,
        seeds = [b"vault",vault_state.key().as_ref()],
        bump
    )]
    pub vault:SystemAccount<'info>,

    pub system_program:Program<'info,System>

}

#[derive(Accounts)]
pub struct Payment<'info>{
    #[account(mut)]
    pub user:Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault",vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault:SystemAccount<'info>,
    
    #[account(
        seeds = [b"state",user.key().as_ref()],  
        bump = vault_state.state_bump
    )]
    pub vault_state:Account<'info,VaultState>,

    pub system_program:Program<'info,System>
}


impl<'info> Payment<'info> {

     pub fn deposit(&mut self, amount:u64) -> Result<()> {

        // require_eq!(ctx.accounts.vault.lamports(), 0, VaultError::VaultAlreadyExists);

        // require_gt!(amount, Rent::get()?.minimum_balance(0), VaultError::InvalidAmount);

        let cpi_program  = self.system_program.to_account_info();

        let cpi_accounts = Transfer{
            from: self.user.to_account_info(),
            to: self.vault.to_account_info()
        };

        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        transfer(cpi_ctx, amount)
     }

     pub fn withdraw(&mut self,amount:u64) -> Result<()> {

    //   require_neq!(ctx.accounts.vault.lamports(), 0, VaultError::InvalidAmount);

        let cpi_program  = self.system_program.to_account_info();

        let cpi_accounts = Transfer{
            from: self.vault.to_account_info(),
            to: self.user.to_account_info()
        };

        let seeds = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, amount)

     }
}

impl<'info> Initialize<'info>{
    pub fn initialize(&mut self, bumps:&InitializeBumps) -> Result<()>{

        let rent_exempt= Rent::get()?.minimum_balance(self.vault.to_account_info().data_len());
        
        let cpi_program  = self.system_program.to_account_info();

        let cpi_accounts = Transfer{
            from: self.user.to_account_info(),
            to: self.vault.to_account_info()
        };

        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        transfer(cpi_ctx, rent_exempt)?;

        self.vault_state.vault_bump = bumps.vault;
        self.vault_state.state_bump = bumps.vault_state;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
        close = user,
    )]
    pub vault_state: Account<'info, VaultState>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> Close<'info> {
    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        let seeds = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, self.vault.lamports())?;

        Ok(())
    }
}

#[account]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}

impl Space for VaultState {
    const INIT_SPACE: usize = 8+1*2;
}
