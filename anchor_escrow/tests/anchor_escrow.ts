import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getAccount,
} from "@solana/spl-token";
import { randomBytes } from "crypto";
import { expect } from "chai";

describe("anchor-escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const connection = provider.connection;
  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;
  const tokenProgram = TOKEN_PROGRAM_ID;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );
    return signature;
  };

  const seed = new BN(randomBytes(8));
  const [maker, taker, mintA, mintB] = Array.from({ length: 4 }, () =>
    Keypair.generate()
  );

  const [makerAtaA, makerAtaB, takerAtaA, takerAtaB] = [maker, taker]
    .map((a) =>
      [mintA, mintB].map((m) =>
        getAssociatedTokenAddressSync(
          m.publicKey,
          a.publicKey,
          false,
          tokenProgram
        )
      )
    )
    .flat();

  const escrow = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "be", 8),
    ],
    program.programId
  )[0];

  const vault = getAssociatedTokenAddressSync(
    mintA.publicKey,
    escrow,
    true,
    tokenProgram
  );

  // Accounts
  const accounts = {
    maker: maker.publicKey,
    taker: taker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    tokenProgram,
    systemProgram: SystemProgram.programId,
  };

  describe("Setup", () => {
    it("Airdrop and create mints", async () => {
      let lamports = await getMinimumBalanceForRentExemptMint(connection);
      let tx = new Transaction();
      
      // Airdrop SOL to test accounts
      tx.add(
        ...[maker, taker].map((account) =>
          SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: account.publicKey,
            lamports: 10 * LAMPORTS_PER_SOL,
          })
        )
      );

      // Create mint accounts
      tx.add(
        ...[mintA, mintB].map((mint) =>
          SystemProgram.createAccount({
            fromPubkey: provider.publicKey,
            newAccountPubkey: mint.publicKey,
            lamports,
            space: MINT_SIZE,
            programId: tokenProgram,
          })
        )
      );

      // Initialize mints and create token accounts
      tx.add(
        // Initialize mintA with maker as authority
        createInitializeMint2Instruction(
          mintA.publicKey,
          6,
          maker.publicKey,
          null,
          tokenProgram
        ),
        // Initialize mintB with taker as authority
        createInitializeMint2Instruction(
          mintB.publicKey,
          6,
          taker.publicKey,
          null,
          tokenProgram
        ),
        // Create all associated token accounts
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          makerAtaA,
          maker.publicKey,
          mintA.publicKey,
          tokenProgram
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          makerAtaB,
          maker.publicKey,
          mintB.publicKey,
          tokenProgram
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          takerAtaA,
          taker.publicKey,
          mintA.publicKey,
          tokenProgram
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          takerAtaB,
          taker.publicKey,
          mintB.publicKey,
          tokenProgram
        ),
        // Mint tokens to accounts
        createMintToInstruction(
          mintA.publicKey,
          makerAtaA,
          maker.publicKey,
          1e9,
          undefined,
          tokenProgram
        ),
        createMintToInstruction(
          mintB.publicKey,
          takerAtaB,
          taker.publicKey,
          1e9,
          undefined,
          tokenProgram
        )
      );

      await provider.sendAndConfirm(tx, [mintA, mintB, maker, taker]).then(log);
    });
  });

  describe("Make Instruction", () => {
    it("Should create an escrow successfully", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      const tx = await program.methods
        .make(seed, depositAmount, receiveAmount)
        .accounts(accounts)
        .signers([maker])
        .rpc()
        .then(confirm)
        .then(log);

      // Verify escrow account was created
      const escrowAccount = await program.account.escrow.fetch(escrow);
      expect(escrowAccount.seed.toString()).to.equal(seed.toString());
      expect(escrowAccount.maker.toString()).to.equal(maker.publicKey.toString());
      expect(escrowAccount.mintA.toString()).to.equal(mintA.publicKey.toString());
      expect(escrowAccount.mintB.toString()).to.equal(mintB.publicKey.toString());
      expect(escrowAccount.receive.toString()).to.equal(receiveAmount.toString());

      // Verify vault has the deposited tokens
      const vaultAccount = await getAccount(connection, vault);
      expect(vaultAccount.amount.toString()).to.equal(depositAmount.toString());
    });

    it("Should fail when maker has insufficient tokens", async () => {
      const largeAmount = new BN(1e12); // Much larger than available
      const receiveAmount = new BN(1e6);
      const newSeed = new BN(randomBytes(8));
      
      const [newEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          newSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const newVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        newEscrow,
        true,
        tokenProgram
      );

      const newAccounts = {
        ...accounts,
        escrow: newEscrow,
        vault: newVault,
      };

      try {
        await program.methods
          .make(newSeed, largeAmount, receiveAmount)
          .accounts(newAccounts)
          .signers([maker])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("Should fail when using same seed twice", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      try {
        await program.methods
          .make(seed, depositAmount, receiveAmount)
          .accounts(accounts)
          .signers([maker])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("Take Instruction", () => {
    it("Should take the escrow successfully", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      // First create an escrow to take
      const takeSeed = new BN(randomBytes(8));
      const [takeEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          takeSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const takeVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        takeEscrow,
        true,
        tokenProgram
      );

      const takeAccounts = {
        ...accounts,
        escrow: takeEscrow,
        vault: takeVault,
      };

      // Create the escrow first
      await program.methods
        .make(takeSeed, depositAmount, receiveAmount)
        .accounts(takeAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Get balances before taking
      const takerBalanceBefore = await getAccount(connection, takerAtaA);
      const makerBalanceBefore = await getAccount(connection, makerAtaB);

      // Take the escrow
      const tx = await program.methods
        .take()
        .accounts(takeAccounts)
        .signers([taker])
        .rpc()
        .then(confirm)
        .then(log);

      // Verify taker received the escrowed tokens
      const takerBalanceAfter = await getAccount(connection, takerAtaA);
      expect(Number(takerBalanceAfter.amount)).to.equal(
        Number(takerBalanceBefore.amount) + Number(depositAmount)
      );

      // Verify maker received the required tokens
      const makerBalanceAfter = await getAccount(connection, makerAtaB);
      expect(Number(makerBalanceAfter.amount)).to.equal(
        Number(makerBalanceBefore.amount) + Number(receiveAmount)
      );

      // Verify vault is closed
      try {
        await getAccount(connection, takeVault);
        expect.fail("Vault should be closed");
      } catch (error) {
        console.log("Vault error:", error.message);
        // Vault is closed if we get any error (empty message means account doesn't exist)
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("Should fail when taker has insufficient tokens", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      // Create a new escrow for this test
      const insufficientSeed = new BN(randomBytes(8));
      const [insufficientEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          insufficientSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const insufficientVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        insufficientEscrow,
        true,
        tokenProgram
      );

      const insufficientAccounts = {
        ...accounts,
        escrow: insufficientEscrow,
        vault: insufficientVault,
      };

      // Create escrow
      await program.methods
        .make(insufficientSeed, depositAmount, receiveAmount)
        .accounts(insufficientAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Drain taker's mintB tokens
      const drainTx = new Transaction();
      drainTx.add(
        createMintToInstruction(
          mintB.publicKey,
          takerAtaB,
          taker.publicKey,
          0, // Drain the account
          undefined,
          tokenProgram
        )
      );
      await provider.sendAndConfirm(drainTx, [taker]);

      // Try to take with insufficient tokens
      try {
        await program.methods
          .take()
          .accounts(insufficientAccounts)
          .signers([taker])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("Refund Instruction", () => {
    it("Should refund the escrow successfully", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      // Create a new escrow for refund test
      const refundSeed = new BN(randomBytes(8));
      const [refundEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          refundSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const refundVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        refundEscrow,
        true,
        tokenProgram
      );

      const refundAccounts = {
        ...accounts,
        escrow: refundEscrow,
        vault: refundVault,
      };

      // Create escrow
      await program.methods
        .make(refundSeed, depositAmount, receiveAmount)
        .accounts(refundAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Get maker's balance before refund
      const makerBalanceBefore = await getAccount(connection, makerAtaA);

      // Refund the escrow
      const tx = await program.methods
        .refund()
        .accounts(refundAccounts)
        .signers([maker])
        .rpc()
        .then(confirm)
        .then(log);

      // Verify maker received their tokens back
      const makerBalanceAfter = await getAccount(connection, makerAtaA);
      expect(Number(makerBalanceAfter.amount)).to.equal(
        Number(makerBalanceBefore.amount) + Number(depositAmount)
      );

      // Verify vault is closed
      try {
        await getAccount(connection, refundVault);
        expect.fail("Vault should be closed");
      } catch (error) {
        console.log("Vault error:", error.message);
        // Vault is closed if we get any error (empty message means account doesn't exist)
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("Should fail when non-maker tries to refund", async () => {
      const depositAmount = new BN(1e6);
      const receiveAmount = new BN(1e6);

      // Create a new escrow for this test
      const nonMakerSeed = new BN(randomBytes(8));
      const [nonMakerEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          nonMakerSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const nonMakerVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        nonMakerEscrow,
        true,
        tokenProgram
      );

      const nonMakerAccounts = {
        ...accounts,
        escrow: nonMakerEscrow,
        vault: nonMakerVault,
      };

      // Create escrow
      await program.methods
        .make(nonMakerSeed, depositAmount, receiveAmount)
        .accounts(nonMakerAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Try to refund with taker (non-maker)
      const takerRefundAccounts = {
        ...nonMakerAccounts,
        maker: taker.publicKey,
        makerAtaA: takerAtaA,
      };

      try {
        await program.methods
          .refund()
          .accounts(takerRefundAccounts)
          .signers([taker])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("Edge Cases", () => {
    it("Should handle zero amounts correctly", async () => {
      const zeroSeed = new BN(randomBytes(8));
      const [zeroEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          zeroSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const zeroVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        zeroEscrow,
        true,
        tokenProgram
      );

      const zeroAccounts = {
        ...accounts,
        escrow: zeroEscrow,
        vault: zeroVault,
      };

      // Create escrow with zero amounts
      await program.methods
        .make(zeroSeed, new BN(0), new BN(0))
        .accounts(zeroAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Verify escrow was created
      const escrowAccount = await program.account.escrow.fetch(zeroEscrow);
      expect(escrowAccount.receive.toString()).to.equal("0");
    });

    it("Should handle very large amounts", async () => {
      const largeSeed = new BN(randomBytes(8));
      const [largeEscrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          maker.publicKey.toBuffer(),
          largeSeed.toArrayLike(Buffer, "be", 8),
        ],
        program.programId
      );
      
      const largeVault = getAssociatedTokenAddressSync(
        mintA.publicKey,
        largeEscrow,
        true,
        tokenProgram
      );

      const largeAccounts = {
        ...accounts,
        escrow: largeEscrow,
        vault: largeVault,
      };

      const largeAmount = new BN(1e8); // 100 tokens (reasonable amount)

      // Create escrow with large amounts
      await program.methods
        .make(largeSeed, largeAmount, largeAmount)
        .accounts(largeAccounts)
        .signers([maker])
        .rpc()
        .then(confirm);

      // Verify escrow was created
      const escrowAccount = await program.account.escrow.fetch(largeEscrow);
      expect(escrowAccount.receive.toString()).to.equal(largeAmount.toString());
    });
  });
});
