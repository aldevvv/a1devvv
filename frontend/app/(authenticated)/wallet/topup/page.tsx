'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Building2, Smartphone, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Top Up Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Choose your preferred payment method
          </p>
        </div>
      </div>

      {/* Payment Method Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Top-up */}
        <div 
          onClick={handleManualTopup}
          className={`p-8 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-card border-border hover:border-blue-600/50 hover:bg-blue-900/10'
              : 'bg-white border-gray-200 hover:border-blue-500/50 hover:bg-blue-50/50'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Building2 className={`h-8 w-8 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Manual Top-up</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Transfer via bank or e-wallet. Payment verification usually takes 1-15 minutes.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Smartphone className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className="text-sm">E-Wallet (OVO, GoPay, DANA, ShopeePay)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className="text-sm">Bank Transfer (BCA, BNI, BRI, Mandiri)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <span className="text-sm">Processing time: 1-15 minutes</span>
                </div>
              </div>

              <div className="mt-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark' 
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  Lower Fees
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Top-up */}
        <div 
          onClick={handleAutoTopup}
          className={`p-8 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-card border-border hover:border-purple-600/50 hover:bg-purple-900/10'
              : 'bg-white border-gray-200 hover:border-purple-500/50 hover:bg-purple-50/50'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <CreditCard className={`h-8 w-8 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Auto Top-up</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Instant payment with credit or debit card. Processed immediately.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CreditCard className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <span className="text-sm">Credit Card (Visa, MasterCard)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <span className="text-sm">Debit Card</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className="text-sm">Processing time: Instant</span>
                </div>
              </div>

              <div className="mt-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  Instant Payment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notess */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-yellow-900/10 border-yellow-700/30' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <h4 className={`font-semibold mb-3 ${
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
        }`}>
          Important Notes
        </h4>
        <ul className={`space-y-2 text-sm ${
          theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
        }`}>
          <li>• Minimum top-up amount: IDR 10,000</li>
          <li>• Maximum top-up amount: IDR 10,000,000</li>
          <li>• Amount must be in multiples of IDR 1,000</li>
          <li>• Failed payments will be automatically refunded within 1-3 business days</li>
          <li>• For assistance, please contact our customer support</li>
        </ul>
      </div>
    </div>
  );
}