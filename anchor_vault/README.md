# Solana Vault - Anchor Program

A secure, decentralized vault implementation built on Solana using the Anchor framework. This project demonstrates how to create a personal vault system where users can safely deposit and withdraw SOL tokens with proper access controls and security measures.

##  Architecture Overview

This vault system consists of two main components:

1. **Vault State Account** - Stores metadata about the vault (bump seeds)
2. **Vault Account** - A Program Derived Address (PDA) that holds the actual SOL tokens

### Key Features

-  **Secure Access Control**: Only the vault owner can deposit/withdraw funds
-  **SOL Storage**: Direct SOL token storage using System Program transfers
-  **Cleanup**: Ability to close vaults and recover rent
-  **Comprehensive Testing**: Full test suite covering all operations

##  Implementation Details

### Program Structure

The program is built using Anchor framework and consists of four main instructions:

#### 1. Initialize Vault
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.initialize(&ctx.bumps)
}
```

**What it does:**
- Creates a new vault state account for the user
- Initializes a vault PDA to hold SOL tokens
- Transfers rent-exempt amount to the vault account
- Stores bump seeds for future operations

**Why this approach:**
- Uses PDAs to ensure deterministic account addresses
- Rent-exempt initialization prevents account deallocation
- Bump seeds are stored for secure signing in future operations

#### 2. Deposit SOL
```rust
pub fn deposit(ctx: Context<Payment>, amount: u64) -> Result<()> {
    ctx.accounts.deposit(amount)
}
```

**What it does:**
- Transfers SOL from user's wallet to the vault PDA
- Uses CPI (Cross-Program Invocation) to call System Program's transfer instruction

**Implementation Logic:**
```rust
let cpi_accounts = Transfer {
    from: self.user.to_account_info(),
    to: self.vault.to_account_info()
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
transfer(cpi_ctx, amount)
```

**Why CPI:**
- Leverages Solana's native System Program for secure token transfers
- Ensures atomic transactions
- Maintains Solana's security guarantees

#### 3. Withdraw SOL
```rust
pub fn withdraw(ctx: Context<Payment>, amount: u64) -> Result<()> {
    ctx.accounts.withdraw(amount)
}
```

**What it does:**
- Transfers SOL from vault PDA back to user's wallet
- Uses signed CPI with vault's bump seed for authorization

**Implementation Logic:**
```rust
let seeds = &[
    b"vault",
    self.vault_state.to_account_info().key.as_ref(),
    &[self.vault_state.vault_bump],
];
let signer_seeds = &[&seeds[..]];
let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
```

**Why signed CPI:**
- Vault PDA needs to sign the transfer (it owns the SOL)
- Uses stored bump seed to derive the correct signature
- Ensures only the program can move funds from the vault

#### 4. Close Vault
```rust
pub fn close(ctx: Context<Close>, amount: u64) -> Result<()> {
    ctx.accounts.close()
}
```

**What it does:**
- Transfers all remaining SOL from vault to user
- Closes the vault state account and recovers rent
- Destroys the vault PDA

**Why this is important:**
- Prevents rent waste by closing unused accounts
- Returns all funds to the user
- Cleans up on-chain state

### Account Structures

#### VaultState Account
```rust
#[account]
pub struct VaultState {
    pub vault_bump: u8,    // Bump seed for vault PDA
    pub state_bump: u8,    // Bump seed for state account
}
```

**Purpose:**
- Stores metadata needed for secure operations
- Bump seeds enable deterministic PDA derivation
- Minimal storage (2 bytes) to minimize rent costs

#### Account Validation

The program uses Anchor's account validation macros to ensure security:

```rust
#[account(
    seeds = [b"state", user.key().as_ref()],
    bump = vault_state.state_bump
)]
pub vault_state: Account<'info, VaultState>,
```

**Security Benefits:**
- Ensures correct account derivation
- Prevents unauthorized access
- Validates account ownership

##  Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- Rust and Cargo
- Solana CLI tools
- Anchor CLI

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd anchor_vault
```

2. **Install dependencies**
```bash
yarn install
```

3. **Build the program**
```bash
anchor build
```

4. **Run tests**
```bash
anchor test
```

### Configuration

The project is configured for local development in `Anchor.toml`:

```toml
[programs.localnet]
anchor_vault = "9oZwzT5yyovvva93nSPnoTs5coV993ymfRnT5LcMU4z7"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"
```

##  Testing

The test suite demonstrates all vault operations:

### Test Flow
1. **Initialize**: Creates a new vault for the test wallet
2. **Deposit**: Adds 2 SOL to the vault
3. **Withdraw**: Removes 1 SOL from the vault
4. **Close**: Closes the vault and recovers remaining funds

### Running Tests
```bash
# Run all tests
anchor test

# Run specific test
anchor test --skip-local-validator
```

##  Security Considerations

### Access Control
- Only the vault owner can perform operations
- PDA-based vault ensures deterministic addresses
- Bump seed validation prevents unauthorized access

### Fund Safety
- SOL is stored in program-controlled PDAs
- Withdrawals require proper signature derivation
- No direct fund access by external programs

### Rent Management
- Vault state accounts are rent-exempt
- Close instruction recovers rent when vault is no longer needed
- Prevents unnecessary rent expenditure

##  Deployment

### Local Development
```bash
# Start local validator
solana-test-validator

# Deploy to localnet
anchor deploy
```

### Mainnet Deployment
1. Update `Anchor.toml` cluster to `mainnet-beta`
2. Ensure sufficient SOL for deployment
3. Run `anchor deploy`

## 📊 Program ID

The program ID for this vault implementation is:
```
9oZwzT5yyovvva93nSPnoTs5coV993ymfRnT5LcMU4z7
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🔗 Resources

- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Program Derived Addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Cross-Program Invocation](https://docs.solana.com/developing/programming-model/calling-between-programs)

---

**Note**: This is a demonstration project. For production use, consider additional security measures, audits, and proper error handling.
