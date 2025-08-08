import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useEscrow } from '../contexts/EscrowContext';
import { Plus, Coins, ArrowRight } from 'lucide-react';

const EscrowForm: React.FC = () => {
  const { publicKey } = useWallet();
  const { createEscrow, loading } = useEscrow();
  
  const [mintA, setMintA] = useState('');
  const [mintB, setMintB] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const mintAPubkey = new PublicKey(mintA);
      const mintBPubkey = new PublicKey(mintB);
      const depositBN = new BN(parseFloat(depositAmount) * 1e6); // Assuming 6 decimals
      const receiveBN = new BN(parseFloat(receiveAmount) * 1e6);

      await createEscrow(mintAPubkey, mintBPubkey, depositBN, receiveBN);
      
      // Reset form
      setMintA('');
      setMintB('');
      setDepositAmount('');
      setReceiveAmount('');
    } catch (error) {
      console.error('Error creating escrow:', error);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-500/20 rounded-lg">
          <Plus className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Create New Escrow</h2>
          <p className="text-white/60">Set up a secure token escrow transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Token A Mint Address</label>
            <input
              type="text"
              value={mintA}
              onChange={(e) => setMintA(e.target.value)}
              placeholder="Enter mint address for token A"
              className="input-field w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Token B Mint Address</label>
            <input
              type="text"
              value={mintB}
              onChange={(e) => setMintB(e.target.value)}
              placeholder="Enter mint address for token B"
              className="input-field w-full"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Deposit Amount (Token A)</label>
            <div className="relative">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                className="input-field w-full pr-10"
                required
              />
              <Coins className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Receive Amount (Token B)</label>
            <div className="relative">
              <input
                type="number"
                value={receiveAmount}
                onChange={(e) => setReceiveAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                className="input-field w-full pr-10"
                required
              />
              <Coins className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 py-4">
          <div className="flex items-center space-x-2 text-white/60">
            <span>{depositAmount || '0'} Token A</span>
            <ArrowRight className="w-4 h-4" />
            <span>{receiveAmount || '0'} Token B</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !publicKey}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Escrow...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Create Escrow</span>
            </>
          )}
        </button>

        {!publicKey && (
          <p className="text-center text-warning-400 text-sm">
            Please connect your wallet to create an escrow
          </p>
        )}
      </form>
    </div>
  );
};

export default EscrowForm;
