import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, Coins, Zap } from 'lucide-react';

const Header: React.FC = () => {
  const { publicKey } = useWallet();

  return (
    <header className="glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Solana Escrow</h1>
              <p className="text-sm text-white/60">Secure Token Escrow Service</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
              <Coins className="w-4 h-4" />
              <span>Features</span>
            </a>
            <a href="#how-it-works" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
              <Zap className="w-4 h-4" />
              <span>How it Works</span>
            </a>
            {publicKey && (
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>Connected</span>
              </div>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="btn-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
