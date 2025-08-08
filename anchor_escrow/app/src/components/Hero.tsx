import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-success-900/20"></div>
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Secure Token Escrow</span>
              <br />
              <span className="text-white">on Solana</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Create, manage, and execute secure token escrows with zero trust. 
              Built on Solana for lightning-fast transactions and minimal fees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-8 py-3 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-lg px-8 py-3"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-500/20 rounded-lg mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure by Design</h3>
              <p className="text-white/60">
                Smart contracts ensure your tokens are safe until conditions are met
              </p>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-success-500/20 rounded-lg mx-auto mb-4">
                <Zap className="w-6 h-6 text-success-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-white/60">
                Solana's high-performance blockchain ensures instant transactions
              </p>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-warning-500/20 rounded-lg mx-auto mb-4">
                <Lock className="w-6 h-6 text-warning-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero Trust</h3>
              <p className="text-white/60">
                No intermediaries needed - direct peer-to-peer escrow execution
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
