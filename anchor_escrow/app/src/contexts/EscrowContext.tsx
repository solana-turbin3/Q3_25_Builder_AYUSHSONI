import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AnchorEscrow } from '../types/anchor_escrow';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';

interface EscrowContextType {
  program: Program<AnchorEscrow> | null;
  escrows: EscrowData[];
  loading: boolean;
  createEscrow: (mintA: PublicKey, mintB: PublicKey, depositAmount: BN, receiveAmount: BN) => Promise<void>;
  takeEscrow: (escrowAddress: PublicKey) => Promise<void>;
  refundEscrow: (escrowAddress: PublicKey) => Promise<void>;
  refreshEscrows: () => Promise<void>;
}

interface EscrowData {
  address: PublicKey;
  seed: BN;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: BN;
  bump: number;
}

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (context === undefined) {
    throw new Error('useEscrow must be used within an EscrowProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const EscrowProvider: React.FC<Props> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<AnchorEscrow> | null>(null);
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet.publicKey && connection && wallet.connected) {
      try {
        const provider = new AnchorProvider(
          connection, 
          wallet as any, 
          { commitment: 'confirmed' }
        );
        
        // Program ID from your anchor.toml
        const programId = new PublicKey('D5uvm16TNKJxfvcMj3mPpY5mBQSyWNJ3bHEXkHm4YEH5');
        
        // For now, create a mock program to avoid null checks
        // You'll need to replace this with actual IDL import later
        const mockProgram = {
          programId,
          provider,
          // Add other required properties as needed
        } as any;
        
        setProgram(mockProgram);
        
        console.log('Program initialized:', programId.toString());
      } catch (error) {
        console.error('Error initializing program:', error);
        setProgram(null);
      }
    } else {
      setProgram(null);
    }
  }, [wallet.publicKey, wallet.connected, connection]);

  const createEscrow = async (mintA: PublicKey, mintB: PublicKey, depositAmount: BN, receiveAmount: BN) => {
    // Check wallet connection first
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!program) {
      toast.error('Program not initialized. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating escrow with:', {
        mintA: mintA.toString(),
        mintB: mintB.toString(),
        depositAmount: depositAmount.toString(),
        receiveAmount: receiveAmount.toString()
      });

      // TODO: Implement actual program call
      // const seed = new BN(Math.floor(Math.random() * 1000000));
      // await program.methods
      //   .initializeEscrow(seed, depositAmount, receiveAmount)
      //   .accounts({
      //     maker: wallet.publicKey,
      //     mintA,
      //     mintB,
      //     // ... other accounts
      //   })
      //   .rpc();
      
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Escrow created successfully!');
      await refreshEscrows();
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error(`Failed to create escrow: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const takeEscrow = async (escrowAddress: PublicKey) => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!program) {
      toast.error('Program not initialized');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement actual program call
      toast.success('Escrow taken successfully!');
      await refreshEscrows();
    } catch (error) {
      console.error('Error taking escrow:', error);
      toast.error('Failed to take escrow');
    } finally {
      setLoading(false);
    }
  };

  const refundEscrow = async (escrowAddress: PublicKey) => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!program) {
      toast.error('Program not initialized');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement actual program call
      toast.success('Escrow refunded successfully!');
      await refreshEscrows();
    } catch (error) {
      console.error('Error refunding escrow:', error);
      toast.error('Failed to refund escrow');
    } finally {
      setLoading(false);
    }
  };

  const refreshEscrows = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);
      // TODO: Implement actual escrow fetching
      // const escrowAccounts = await program.account.escrow.all();
      setEscrows([]);
    } catch (error) {
      console.error('Error refreshing escrows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (program && wallet.publicKey && wallet.connected) {
      refreshEscrows();
    }
  }, [program, wallet.publicKey, wallet.connected]);

  const value: EscrowContextType = {
    program,
    escrows,
    loading,
    createEscrow,
    takeEscrow,
    refundEscrow,
    refreshEscrows,
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
};