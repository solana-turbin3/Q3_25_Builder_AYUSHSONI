# Solana AMM (Automated Market Maker)

A decentralized automated market maker (AMM) built on Solana using the Anchor framework. This project implements a constant product AMM with liquidity provision, token swapping, and pool management capabilities.

##  Features

- **Liquidity Provision**: Add and remove liquidity to earn LP tokens
- **Token Swapping**: Swap between any two SPL tokens with automatic price discovery
- **Constant Product AMM**: Uses the x * y = k formula for price determination
- **Fee Collection**: Configurable trading fees for liquidity providers
- **Pool Management**: Lock/unlock pools and manage pool configuration
- **Slippage Protection**: Built-in slippage tolerance mechanisms
- **Solana Native**: Built on Solana for high performance and low fees

##  Architecture

### Core Components

- **Config Account**: Stores pool configuration including token mints, fees, and authority
- **LP Mint**: ERC-20 style token representing liquidity provider shares
- **Vaults**: Token accounts holding the actual token reserves
- **Constant Product Curve**: Mathematical model for price discovery and liquidity calculations

### Program Structure

```
programs/anchor-amm/
├── src/
│   ├── instructions/
│   │   ├── initialize.rs    # Pool initialization
│   │   ├── deposit.rs       # Add liquidity
│   │   ├── withdraw.rs      # Remove liquidity
│   │   ├── swap.rs          # Token swapping
│   │   └── update_locked.rs # Pool lock/unlock
│   ├── state/
│   │   └── mod.rs           # Account structures
│   ├── error.rs             # Custom error definitions
│   ├── constants.rs         # Program constants
│   └── lib.rs              # Main program entry point
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd anchor-amm
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

## Configuration

### Program ID
The program ID is declared in `lib.rs`:
```rust
declare_id!("zKEMUfo6DCa3uD1vRQ8eq5W4aA3akCdRAEMoKDNS9RP");
```

### Pool Configuration
Each pool is configured with:
- **Seed**: Unique identifier for the pool
- **Authority**: Optional admin address for pool management
- **Mint X & Y**: SPL token mints for the trading pair
- **Fee**: Trading fee percentage (basis points)
- **Locked Status**: Whether the pool is locked for trading

## Usage

### 1. Initialize a Pool

```typescript
const tx = await program.methods
  .initialize(seed, fee, authority)
  .accounts({
    initializer: wallet.publicKey,
    mintX: tokenXMint,
    mintY: tokenYMint,
    // ... other required accounts
  })
  .rpc();
```

### 2. Add Liquidity

```typescript
const tx = await program.methods
  .deposit(amount, maxX, maxY)
  .accounts({
    user: wallet.publicKey,
    // ... other required accounts
  })
  .rpc();
```

### 3. Swap Tokens

```typescript
const tx = await program.methods
  .swap(isX, amount, minAmount)
  .accounts({
    user: wallet.publicKey,
    // ... other required accounts
  })
  .rpc();
```

### 4. Remove Liquidity

```typescript
const tx = await program.methods
  .withdraw(amount, minX, minY)
  .accounts({
    user: wallet.publicKey,
    // ... other required accounts
  })
  .rpc();
```

### 5. Lock/Unlock Pool

```typescript
// Lock pool
const tx = await program.methods
  .lock()
  .accounts({
    user: authority.publicKey,
    config: poolConfig,
  })
  .rpc();

// Unlock pool
const tx = await program.methods
  .unlock()
  .accounts({
    user: authority.publicKey,
    config: poolConfig,
  })
  .rpc();
```

## Security Features

- **Slippage Protection**: Users can set minimum output amounts
- **Pool Locking**: Emergency stop mechanism for pool operations
- **Authority Controls**: Restricted access to administrative functions
- **Input Validation**: Comprehensive parameter validation and error handling

## Testing

Run the test suite:
```bash
anchor test
```

The test suite includes:
- Pool initialization tests
- Liquidity provision tests
- Token swapping tests
- Error handling tests

## Dependencies

- **Anchor Lang**: Solana program development framework
- **Anchor SPL**: SPL token program integrations
- **Constant Product Curve**: Mathematical library for AMM calculations

## Error Handling

The program includes comprehensive error handling for:
- Invalid amounts and parameters
- Slippage exceeded
- Pool locked states
- Insufficient balances
- Mathematical overflow/underflow

## Deployment

1. **Set your cluster**
   ```bash
   solana config set --url <cluster-url>
   ```

2. **Deploy the program**
   ```bash
   anchor deploy
   ```

3. **Update program ID** (if needed)
   ```bash
   anchor id
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is for educational and experimental purposes. Use at your own risk. The authors are not responsible for any financial losses incurred through the use of this software.

## 🔗 Links

- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [SPL Token Program](https://spl.solana.com/token)
- [Constant Product AMM](https://uniswap.org/whitepaper-v3.pdf)

