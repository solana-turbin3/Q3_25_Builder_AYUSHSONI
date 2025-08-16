# SYPM - Solana Yield Payment Manager

A decentralized payment processing system built on Solana blockchain that enables merchants to accept multiple tokens and process payments through Jupiter aggregator for optimal token swaps.

## Overview

SYPM is a Solana program that provides a secure, efficient, and flexible payment processing solution for merchants. It supports multiple SPL tokens, automatic token conversion through Jupiter, and includes built-in fee collection mechanisms.

## Features

- **Multi-Token Support**: Accept USDC, SOL, BONK, and other SPL tokens
- **Automatic Token Conversion**: Jupiter integration for optimal token swaps
- **Escrow System**: Secure token holding during payment processing
- **Merchant Management**: Registration and validation system
- **Fee Collection**: Automated fee collection and withdrawal
- **Split Token Payments**: Support for complex payment structures
- **Security**: PDA-based account management and access control

## Architecture

The system consists of several key components:

- **Merchant Registry**: Stores merchant information and accepted tokens
- **Payment Sessions**: Manages individual payment transactions
- **Escrow System**: Securely holds tokens during processing
- **Jupiter Integration**: Handles token swaps and conversions
- **Fee Vault**: Collects and manages transaction fees

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Yarn](https://yarnpkg.com/) package manager
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sypm
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

4. Generate TypeScript types:
```bash
anchor build
```

## Configuration

1. Update the program ID in `lib.rs`:
```rust
declare_id!("your_program_id_here");
```

2. Configure your Solana cluster in `Anchor.toml`:
```toml
[provider]
cluster = "devnet" # or mainnet-beta
wallet = "~/.config/solana/id.json"
```

## Usage

### Program Initialization

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sypm } from "../target/types/sypm";

const program = anchor.workspace.sypm as Program<Sypm>;

// Initialize the program
await program.methods.initialize().rpc();
```

### Merchant Registration

```typescript
const [merchantRegistryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("merchant"), merchant.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .registerMerchant(acceptedTokens, fallbackToken)
  .accounts({
    merchant: merchant.publicKey,
    merchantRegistry: merchantRegistryPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([merchant])
  .rpc();
```

### Payment Session Creation

```typescript
const [paymentSessionPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("payment_session"), user.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .createPaymentSession(preferredToken, splitTokens, totalRequested)
  .accounts({
    user: user.publicKey,
    merchant: merchant.publicKey,
    merchantRegistry: merchantRegistryPda,
    paymentSession: paymentSessionPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

### Token Deposit

```typescript
await program.methods
  .depositTokens(amount)
  .accounts({
    user: user.publicKey,
    paymentSession: paymentSessionPda,
    merchant: merchant.publicKey,
    escrowAuthority: escrowAuthorityPda,
    escrowVault: escrowVaultAta,
    tokenMint: tokenMint,
    userTokenAccount: userTokenAccount,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

## Testing

Run the comprehensive test suite:

```bash
anchor test
```

The test suite covers:
- Program initialization
- Token creation and management
- Merchant registration
- Payment session creation
- Token escrow and deposit
- Payment finalization
- Fee collection and withdrawal
- Error handling and edge cases
- Security validation

## Project Structure

```
sypm/
├── programs/
│   └── sypm/
│       ├── src/
│       │   ├── instructions/
│       │   │   ├── initialize.rs
│       │   │   ├── register_merchant.rs
│       │   │   ├── create_payment_session.rs
│       │   │   ├── deposit_tokens.rs
│       │   │   ├── finalize_payment.rs
│       │   │   ├── withdraw_fee.rs
│       │   │   └── cancel_payment.rs
│       │   ├── state/
│       │   │   ├── merchant_registry.rs
│       │   │   └── payment_session.rs
│       │   ├── error.rs
│       │   └── lib.rs
│       └── Cargo.toml
├── tests/
│   └── sypm.ts
├── Anchor.toml
└── package.json
```

## Development

### Building

```bash
# Build the program
anchor build

# Build for production
anchor build --release
```

### Deploying

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta
```

### Upgrading

```bash
# Upgrade existing program
anchor upgrade <program_id> target/deploy/sypm.so --provider.cluster devnet
```

## Security Considerations

- All accounts use Program Derived Addresses (PDAs) for security
- Access control is enforced through signer validation
- Token transfers are validated through SPL token program
- Escrow accounts are protected by PDA derivation
- Fee collection is restricted to authorized admin accounts

## Error Handling

The program includes comprehensive error handling for:
- Invalid merchant registration
- Insufficient token balances
- Unauthorized access attempts
- Invalid payment session states
- Token transfer failures

## Contributing

We welcome contributions to improve SYPM. Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `anchor test`
6. Commit your changes: `git commit -m 'Add feature description'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

### Code Style

- Follow Rust coding conventions
- Use meaningful variable and function names
- Add comprehensive documentation
- Include error handling for edge cases
- Write tests for all new functionality

### Testing Requirements

- All new features must include tests
- Edge cases and error conditions must be covered
- Tests should be clear and maintainable
- Integration tests should verify the complete flow

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the test examples for usage patterns

## Roadmap

- Enhanced Jupiter integration for better swap rates
- Support for additional token standards
- Advanced fee structures and dynamic pricing
- Cross-chain payment capabilities
- Merchant analytics and reporting tools

## Acknowledgments

- Solana Labs for the blockchain infrastructure
- Anchor Framework for the development framework
- Jupiter Protocol for token swap aggregation
- SPL Token program for token standards

## Version History

- v0.1.0 - Initial release with core payment functionality
- Basic merchant registration and payment processing
- Multi-token support and escrow system
- Jupiter integration for token swaps
