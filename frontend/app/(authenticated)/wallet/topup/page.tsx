'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Smartphone, Clock, Zap, DollarSign, Timer, Info } from 'lucide-react';

export default function TopupPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleManualTopup = () => {
    router.push('/wallet/topup/manual');
  };

  const handleAutoTopup = () => {
    router.push('/wallet/topup/auto');
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Modern Futuristic Header */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/40 border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className={`p-2 rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'hover:bg-neon-blue/10 text-gray-400 hover:text-neon-blue border border-neon-blue/20'
                  : 'hover:bg-primary/10 text-gray-600 hover:text-primary border border-primary/20'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Wallet Top-up
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Choose your preferred payment method
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === 'dark'
              ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            Secure Payment
          </div>
        </div>
      </div>

      {/* Payment Method Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Top-up Card */}
        <div
          onClick={handleManualTopup}
          className={`group relative p-6 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
            theme === 'dark'
              ? 'bg-black/40 border-green-500/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-400/20'
              : 'bg-card/90 border-green-300/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-400/20'
          }`}
        >
          {/* Gradient background overlay */}
          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-green-900/10 via-transparent to-blue-900/10'
              : 'bg-gradient-to-br from-green-50/50 via-transparent to-blue-50/50'
          }`} />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-green-500/10 group-hover:bg-green-500/20'
                  : 'bg-green-100 group-hover:bg-green-200'
              }`}>
                <Building2 className={`h-6 w-6 transition-all duration-300 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                theme === 'dark'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                Lower Fees
              </div>
            </div>

            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Manual Top-up
            </h3>
            
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Bank transfer & e-wallet options with manual verification
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <Smartphone className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  E-Wallets & Bank Transfer
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100'
                }`}>
                  <Timer className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  1-15 minutes processing
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <DollarSign className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Minimal fees
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Top-up Card */}
        <div
          onClick={handleAutoTopup}
          className={`group relative p-6 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
            theme === 'dark'
              ? 'bg-black/40 border-purple-500/20 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-400/20'
              : 'bg-card/90 border-purple-300/20 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-400/20'
          }`}
        >
          {/* Gradient background overlay */}
          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10'
              : 'bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50'
          }`} />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-purple-500/10 group-hover:bg-purple-500/20'
                  : 'bg-purple-100 group-hover:bg-purple-200'
              }`}>
                <CreditCard className={`h-6 w-6 transition-all duration-300 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                theme === 'dark'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                Instant
              </div>
            </div>

            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Auto Top-up
            </h3>
            
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Instant payment via credit/debit cards & more
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <CreditCard className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Credit & Debit Cards
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <Zap className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Instant processing
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <Building2 className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Powered by Xendit
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information Panel */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/40 border-yellow-500/20 shadow-lg shadow-yellow-400/10'
          : 'bg-card/90 border-yellow-300/20 shadow-lg'
      }`}>
        <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
        }`}>
          <div className={`p-1 rounded ${
            theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100'
          }`}>
            <Info className={`h-4 w-4 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
            }`} />
          </div>
          <span>Payment Guidelines</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Minimum amount: <strong>IDR 5,000</strong></span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Maximum amount: <strong>IDR 10,000,000</strong></span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Amount must be in multiples of IDR 1,000</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Failed payments auto-refunded within 1-3 days</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>24/7 customer support available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}