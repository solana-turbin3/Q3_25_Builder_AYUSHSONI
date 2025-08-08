import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { EscrowProvider } from './contexts/EscrowContext';
import Header from './components/Header';
import Hero from './components/Hero';
import EscrowForm from './components/EscrowForm';
import EscrowList from './components/EscrowList';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ArrowRight, Users, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  return (
    <EscrowProvider>
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
        <Header />
        
        {!publicKey ? (
          <>
            <Hero />
            
            {/* Features Section */}
            <section id="features" className="py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Why Choose <span className="gradient-text">Solana Escrow</span>?
                  </h2>
                  <p className="text-xl text-white/60 max-w-3xl mx-auto">
                    Built on Solana's high-performance blockchain for secure, fast, and cost-effective token escrow services.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="card text-center"
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mx-auto mb-6">
                      <Shield className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Secure Smart Contracts</h3>
                    <p className="text-white/60">
                      Audited smart contracts ensure your tokens are safe and transactions are executed exactly as intended.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="card text-center"
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-success-500/20 rounded-full mx-auto mb-6">
                      <Zap className="w-8 h-8 text-success-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
                    <p className="text-white/60">
                      Solana's high TPS ensures your escrow transactions are processed in milliseconds, not minutes.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="card text-center"
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-warning-500/20 rounded-full mx-auto mb-6">
                      <Lock className="w-8 h-8 text-warning-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Zero Trust</h3>
                    <p className="text-white/60">
                      No intermediaries needed. Direct peer-to-peer escrow execution with full transparency.
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-20 bg-white/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    How <span className="gradient-text">Escrow Works</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-3xl mx-auto">
                    Simple three-step process to secure your token transactions
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center w-20 h-20 bg-primary-500/20 rounded-full mx-auto mb-6">
                      <span className="text-2xl font-bold text-primary-400">1</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Create Escrow</h3>
                    <p className="text-white/60">
                      Set up your escrow with the tokens you want to trade and the conditions for completion.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center w-20 h-20 bg-success-500/20 rounded-full mx-auto mb-6">
                      <span className="text-2xl font-bold text-success-400">2</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Wait for Taker</h3>
                    <p className="text-white/60">
                      Your escrow is now visible to potential takers who can fulfill the conditions.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center w-20 h-20 bg-warning-500/20 rounded-full mx-auto mb-6">
                      <span className="text-2xl font-bold text-warning-400">3</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Complete or Refund</h3>
                    <p className="text-white/60">
                      Either the taker completes the escrow or you can refund your tokens at any time.
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <main className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mb-8 max-w-md mx-auto">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'create'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Create Escrow
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'manage'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Manage Escrows
                </button>
              </div>

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'create' ? <EscrowForm /> : <EscrowList />}
              </motion.div>
            </div>
          </main>
        )}

        {/* Footer */}
        <footer className="py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold">Solana Escrow</span>
              </div>
              <p className="text-white/60 mb-4">
                Secure token escrow service built on Solana blockchain
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-white/40">
                <span>© 2024 Solana Escrow</span>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </EscrowProvider>
  );
};

export default App;
