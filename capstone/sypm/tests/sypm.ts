import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sypm } from "../target/types/sypm";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  createAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";

import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

describe("sypm", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.sypm as Program<Sypm>;
  
  // Test accounts
  const user = Keypair.generate();
  const merchant = Keypair.generate();
  const admin = Keypair.generate();
  
  // Test token mints
  let usdcMint: PublicKey;
  let solMint: PublicKey;
  let bonkMint: PublicKey;
  
  // Test token accounts
  let userUsdcAccount: PublicKey;
  let userSolAccount: PublicKey;
  let userBonkAccount: PublicKey;
  let merchantUsdcAccount: PublicKey;
  
  // PDAs
  let merchantRegistryPda: PublicKey;
  let paymentSessionPda: PublicKey;
  let escrowAuthorityPda: PublicKey;
  let feeVaultAuthorityPda: PublicKey;
  let paymentVaultAta: PublicKey;
  let feeVaultAta: PublicKey;

  beforeAll(async () => {
    // Airdrop SOL to test accounts
    const connection = anchor.getProvider().connection;
    await connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.requestAirdrop(merchant.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for airdrop confirmation
    await connection.confirmTransaction(await connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL));
    await connection.confirmTransaction(await connection.requestAirdrop(merchant.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL));
    await connection.confirmTransaction(await connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL));
  });

  it("Initialize program", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Program initialized:", tx);
  });

  it("Create test token mints", async () => {
    const connection = anchor.getProvider().connection;
    
    // Create USDC mint (6 decimals)
    usdcMint = await createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      6
    );
    console.log("USDC mint created:", usdcMint.toString());
    
    // Create SOL mint (9 decimals)
    solMint = await createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      9
    );
    console.log("SOL mint created:", solMint.toString());
    
    // Create BONK mint (5 decimals)
    bonkMint = await createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      5
    );
    console.log("BONK mint created:", bonkMint.toString());
  });

  it("Create token accounts", async () => {
    const connection = anchor.getProvider().connection;
    
    // Create user token accounts
    userUsdcAccount = await getAssociatedTokenAddress(usdcMint, user.publicKey);
    userSolAccount = await getAssociatedTokenAddress(solMint, user.publicKey);
    userBonkAccount = await getAssociatedTokenAddress(bonkMint, user.publicKey);
    
    // Create merchant USDC account
    merchantUsdcAccount = await getAssociatedTokenAddress(usdcMint, merchant.publicKey);
    
    // Create accounts
    await createAccount(connection, user, usdcMint, userUsdcAccount, user.publicKey);
    await createAccount(connection, user, solMint, userSolAccount, user.publicKey);
    await createAccount(connection, user, bonkMint, userBonkAccount, user.publicKey);
    await createAccount(connection, user, usdcMint, merchantUsdcAccount, merchant.publicKey);
    
    // Mint tokens to user
    await mintTo(connection, user, usdcMint, userUsdcAccount, user.publicKey, 1000000); // 1 USDC
    await mintTo(connection, user, solMint, userSolAccount, user.publicKey, 1000000000); // 1 SOL
    await mintTo(connection, user, bonkMint, userBonkAccount, user.publicKey, 100000000); // 1 BONK
    
    console.log("Token accounts created and funded");
  });

  it("Register merchant", async () => {
    const [merchantRegistryPdaKey, merchantRegistryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), merchant.publicKey.toBuffer()],
      program.programId
    );
    merchantRegistryPda = merchantRegistryPdaKey;
    
    const acceptedTokens = [usdcMint, solMint, bonkMint];
    const fallbackToken = usdcMint;
    
    const tx = await program.methods
      .registerMerchant(acceptedTokens, fallbackToken)
      .accounts({
        merchant: merchant.publicKey,
        merchantRegistry: merchantRegistryPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();
    
    console.log("Merchant registered:", tx);
    
    // Verify merchant registry
    const merchantRegistry = await program.account.merchantRegistry.fetch(merchantRegistryPda);
    console.log("Merchant registry:", {
      merchant: merchantRegistry.merchant.toString(),
      acceptedTokens: merchantRegistry.acceptedTokens.map(t => t.toString()),
      fallbackToken: merchantRegistry.fallbackToken.toString(),
      bump: merchantRegistry.bump
    });
  });

  it("Create payment session", async () => {
    const [paymentSessionPdaKey, paymentSessionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment_session"), user.publicKey.toBuffer(), merchant.publicKey.toBuffer()],
      program.programId
    );
    paymentSessionPda = paymentSessionPdaKey;
    
    const [escrowAuthorityPdaKey, escrowAuthorityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), paymentSessionPdaKey.toBuffer()],
      program.programId
    );
    escrowAuthorityPda = escrowAuthorityPdaKey;
    
    const [feeVaultAuthorityPdaKey, feeVaultAuthorityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_vault")],
      program.programId
    );
    feeVaultAuthorityPda = feeVaultAuthorityPdaKey;
    
    // Create payment vault ATA
    paymentVaultAta = await getAssociatedTokenAddress(usdcMint, escrowAuthorityPda);
    
    // Create fee vault ATA
    feeVaultAta = await getAssociatedTokenAddress(usdcMint, feeVaultAuthorityPda);
    
    const splitTokens = [
      [usdcMint, 500000], // 0.5 USDC
      [solMint, 500000000], // 0.5 SOL
      [bonkMint, 50000000] // 0.5 BONK
    ];
    
    const totalRequested = 1000000; // 1 USDC (merchant's preferred token)
    
    const tx = await program.methods
      .createPaymentSession(usdcMint, splitTokens, totalRequested)
      .accounts({
        user: user.publicKey,
        merchantRegistry: merchantRegistryPda,
        paymentSession: paymentSessionPda,
        merchant: merchant.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("Payment session created:", tx);
    
    // Verify payment session
    const paymentSession = await program.account.paymentSession.fetch(paymentSessionPda);
    console.log("Payment session:", {
      user: paymentSession.user.toString(),
      merchant: paymentSession.merchant.toString(),
      preferredToken: paymentSession.preferredToken.toString(),
      splitTokens: paymentSession.splitTokens.map(([mint, amount]) => [mint.toString(), amount.toString()]),
      totalRequested: paymentSession.totalRequested.toString(),
      status: paymentSession.status,
      bump: paymentSession.bump
    });
  });

  it("Deposit tokens to escrow", async () => {
    // Create escrow ATAs for each token
    const escrowUsdcAta = await getAssociatedTokenAddress(usdcMint, escrowAuthorityPda);
    const escrowSolAta = await getAssociatedTokenAddress(solMint, escrowAuthorityPda);
    const escrowBonkAta = await getAssociatedTokenAddress(bonkMint, escrowAuthorityPda);
    
    // Deposit USDC
    const tx1 = await program.methods
      .depositTokens(500000) // 0.5 USDC
      .accounts({
        user: user.publicKey,
        paymentSession: paymentSessionPda,
        merchant: merchant.publicKey,
        escrowAuthority: escrowAuthorityPda,
        escrowVault: escrowUsdcAta,
        tokenMint: usdcMint,
        userTokenAccount: userUsdcAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("USDC deposited:", tx1);
    
    // Deposit SOL
    const tx2 = await program.methods
      .depositTokens(500000000) // 0.5 SOL
      .accounts({
        user: user.publicKey,
        paymentSession: paymentSessionPda,
        merchant: merchant.publicKey,
        escrowAuthority: escrowAuthorityPda,
        escrowVault: escrowSolAta,
        tokenMint: solMint,
        userTokenAccount: userSolAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("SOL deposited:", tx2);
    
    // Deposit BONK
    const tx3 = await program.methods
      .depositTokens(50000000) // 0.5 BONK
      .accounts({
        user: user.publicKey,
        paymentSession: paymentSessionPda,
        merchant: merchant.publicKey,
        escrowAuthority: escrowAuthorityPda,
        tokenMint: bonkMint,
        userTokenAccount: userBonkAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("BONK deposited:", tx3);
  });

  it("Finalize payment (mock Jupiter)", async () => {
    // Mock Jupiter instruction data
    const jupiterIxDatas = [
      Buffer.from([0, 0]), // Mock swap data for SOL->USDC
      Buffer.from([0, 0]), // Mock swap data for BONK->USDC
    ];
    
    const tx = await program.methods
      .finalizePayment(jupiterIxDatas)
      .accounts({
        user: user.publicKey,
        merchant: merchant.publicKey,
        merchantRegistry: merchantRegistryPda,
        paymentSession: paymentSessionPda,
        escrowAuthority: escrowAuthorityPda,
        paymentVaultAta: paymentVaultAta,
        feeVaultAuthority: feeVaultAuthorityPda,
        feeVaultAta: feeVaultAta,
        preferredMint: usdcMint,
        merchantDestAta: merchantUsdcAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        jupiterProgram: TOKEN_PROGRAM_ID, // Mock Jupiter program
      })
      .remainingAccounts([
        // Mock escrow accounts and mints for remaining_accounts
        { pubkey: await getAssociatedTokenAddress(usdcMint, escrowAuthorityPda), isSigner: false, isWritable: true },
        { pubkey: usdcMint, isSigner: false, isWritable: false },
        { pubkey: await getAssociatedTokenAddress(solMint, escrowAuthorityPda), isSigner: false, isWritable: true },
        { pubkey: solMint, isSigner: false, isWritable: false },
        { pubkey: await getAssociatedTokenAddress(bonkMint, escrowAuthorityPda), isSigner: false, isWritable: true },
        { pubkey: bonkMint, isSigner: false, isWritable: false },
      ])
      .signers([user])
      .rpc();
    
    console.log("Payment finalized:", tx);
    
    // Verify payment session status
    const paymentSession = await program.account.paymentSession.fetch(paymentSessionPda);
    console.log("Payment session status:", paymentSession.status);
    
    // Check merchant balance
    const merchantBalance = await getAccount(anchor.getProvider().connection, merchantUsdcAccount);
    console.log("Merchant USDC balance:", merchantBalance.amount);
  });

  it("Withdraw fees", async () => {
    const adminUsdcAccount = await getAssociatedTokenAddress(usdcMint, admin.publicKey);
    
    // Create admin USDC account if it doesn't exist
    try {
      await getAccount(anchor.getProvider().connection, adminUsdcAccount);
    } catch {
      await createAccount(
        anchor.getProvider().connection,
        admin,
        usdcMint,
        adminUsdcAccount,
        admin.publicKey
      );
    }
    
    const [feeVaultAuthorityPdaKey, feeVaultAuthorityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_vault")],
      program.programId
    );
    
    const tx = await program.methods
      .withdrawFees(100000, feeVaultAuthorityBump) // Withdraw 0.1 USDC
      .accounts({
        admin: admin.publicKey,
        feeVaultAuthority: feeVaultAuthorityPda,
        feeVault: feeVaultAta,
        tokenMint: usdcMint,
        adminTokenAccount: adminUsdcAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    console.log("Fees withdrawn:", tx);
    
    // Check admin balance
    const adminBalance = await getAccount(anchor.getProvider().connection, adminUsdcAccount);
    console.log("Admin USDC balance:", adminBalance.amount);
  });

  it("Cancel payment (if needed)", async () => {
    // This test shows how to cancel a payment if needed
    // Note: The current payment session is already completed, so this would fail
    console.log("Cancel payment test skipped - payment already completed");
  });
});
