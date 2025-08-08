import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEscrow } from '../contexts/EscrowContext';
import { PublicKey } from '@solana/web3.js';
import { Clock, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

const EscrowList: React.FC = () => {
  const { publicKey } = useWallet();
  const { escrows, loading, takeEscrow, refundEscrow, refreshEscrows } = useEscrow();

  const handleTakeEscrow = async (escrowAddress: PublicKey) => {
    try {
      await takeEscrow(escrowAddress);
    } catch (error) {
      console.error('Error taking escrow:', error);
    }
  };

  const handleRefundEscrow = async (escrowAddress: PublicKey) => {
    try {
      await refundEscrow(escrowAddress);
    } catch (error) {
      console.error('Error refunding escrow:', error);
    }
  };

  const formatAddress = (address: PublicKey) => {
    return `${address.toString().slice(0, 4)}...${address.toString().slice(-4)}`;
  };

  const formatAmount = (amount: any) => {
    return (parseFloat(amount.toString()) / 1e6).toFixed(6);
  };

  if (!publicKey) {
    return (
      <div className="card text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-secondary-500/20 rounded-full mx-auto mb-4">
          <Clock className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-white/60">
          Connect your wallet to view and manage your escrows
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Escrows</h2>
          <p className="text-white/60">Manage your active escrow transactions</p>
        </div>
        <button
          onClick={refreshEscrows}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading escrows...</p>
        </div>
      ) : escrows.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex items-center justify-center w-16 h-16 bg-secondary-500/20 rounded-full mx-auto mb-4">
            <Clock className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Escrows Found</h3>
          <p className="text-white/60">
            You don't have any active escrows. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {escrows.map((escrow, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Escrow #{index + 1}</h3>
                    <p className="text-sm text-white/60">
                      Created by {formatAddress(escrow.maker)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`https://explorer.solana.com/address/${escrow.address.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-white/60 mb-1">Token A</p>
                  <p className="font-mono text-sm">{formatAddress(escrow.mintA)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Token B</p>
                  <p className="font-mono text-sm">{formatAddress(escrow.mintB)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Receive Amount</p>
                  <p className="font-semibold">{formatAmount(escrow.receive)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-1">Status</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-500/20 text-success-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                {publicKey.toString() === escrow.maker.toString() ? (
                  <button
                    onClick={() => handleRefundEscrow(escrow.address)}
                    className="btn-warning flex-1 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refund</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTakeEscrow(escrow.address)}
                    className="btn-success flex-1 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Take Escrow</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EscrowList;
