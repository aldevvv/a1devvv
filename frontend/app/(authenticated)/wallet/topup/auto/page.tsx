'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Building2, AlertCircle, CheckCircle2, Loader2, ExternalLink, DollarSign, Receipt, Shield, Zap } from 'lucide-react';

interface PaymentMethod {
  name: string;
  type: string;
  icon: string;
  description: string;
  fees: number;
  processing_time: string;
}

interface PaymentMethods {
  [key: string]: PaymentMethod;
}

export default function AutoTopupPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleBack = () => {
    router.back();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '' || parseInt(value) <= 10000000) {
      setAmount(value);
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const getMethodIcon = (iconType: string) => {
    switch (iconType) {
      case 'credit-card':
        return CreditCard;
      case 'smartphone':
        return Smartphone;
      case 'qr-code':
        return QrCode;
      case 'building-2':
        return Building2;
      default:
        return CreditCard;
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseInt(amount) < 5000) {
      newErrors.amount = 'Minimum amount is IDR 5,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setErrors({});
    
    try {
      const response = await fetch(`${API_BASE}/billing/topup/auto`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountIDR: parseInt(amount),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Redirect to Xendit checkout page
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          setErrors({ general: 'No payment URL received. Please try again.' });
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Payment failed. Please try again.' });
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setErrors({ general: 'Payment failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = amount ? parseInt(amount) : 0;


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
                Auto Top-up
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Instant payment via secure gateway
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === 'dark'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'bg-purple-100 text-purple-700 border border-purple-200'
          }`}>
            Instant Processing
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Enhanced Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Input Card with Futuristic Design */}
          <div className={`relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black/40 border-blue-500/20 shadow-lg shadow-blue-400/10'
              : 'bg-card/90 border-blue-300/20 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-1 rounded ${
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <span>Enter Top-up Amount</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Amount (IDR)
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    IDR
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(amount)}
                    onChange={handleAmountChange}
                    placeholder="10.000"
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                      errors.amount
                        ? theme === 'dark'
                          ? 'border-red-500/50 focus:border-red-400 bg-black/20 text-white placeholder-gray-400'
                          : 'border-red-500/50 focus:border-red-500 bg-white/80 text-gray-900'
                        : theme === 'dark'
                          ? 'bg-black/20 border-gray-700 focus:border-blue-400 text-white placeholder-gray-400'
                          : 'bg-white/80 border-gray-300 focus:border-blue-500 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                {errors.amount && (
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {errors.amount}
                  </p>
                )}
                <p className={`text-xs mt-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Min: IDR 5,000 • Max: IDR 10,000,000 • Instant processing
                </p>
              </div>
            </div>

            {/* Xendit Information Panel */}
            <div className={`mt-4 p-4 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-blue-50/80 border-blue-200/50'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-1 rounded ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <CheckCircle2 className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  <p className="font-semibold mb-2">Secure Payment Gateway by Xendit</p>
                  <p className="leading-relaxed">
                    You'll be redirected to Xendit's secure payment platform where you can choose from multiple payment options including:
                  </p>
                  <div className="mt-3 space-y-1">
                    <p>• Credit & Debit Cards (Visa, Mastercard, JCB)</p>
                    <p>• Bank Transfers (All major Indonesian banks)</p>
                    <p>• E-Wallets (OVO, GoPay, DANA, ShopeePay, LinkAja)</p>
                    <p>• Virtual Accounts & Retail Outlets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-black/40 border-red-500/20 shadow-lg shadow-red-400/10'
                : 'bg-card/90 border-red-300/20 shadow-lg'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-1 rounded ${
                  theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                }`}>
                  <AlertCircle className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-red-300' : 'text-red-700'
                }`}>
                  {errors.general}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Enhanced Summary & Actions */}
        <div className="space-y-6">
          {/* Payment Summary Card */}
          <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black/40 border-green-500/20 shadow-lg shadow-green-400/10'
              : 'bg-card/90 border-green-300/20 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-1 rounded ${
                theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <Receipt className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <span>Payment Summary</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Top-up Amount
                </span>
                <span className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>
                  {amount ? `IDR ${formatCurrency(amount)}` : 'IDR 0'}
                </span>
              </div>
              
              <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                theme === 'dark'
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-yellow-50/80 border-yellow-200/50'
              }`}>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
                }`}>
                  Processing fees (if applicable) will be displayed on the Xendit payment page
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Payment Button */}
          <button
            onClick={handleSubmit}
            disabled={!amount || isProcessing || parseInt(amount) < 5000}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm ${
              !amount || isProcessing || parseInt(amount) < 5000
                ? theme === 'dark'
                  ? 'bg-black/20 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200/60 border border-gray-300/30 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/80 hover:to-blue-500/80 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Payment...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <ExternalLink className="h-5 w-5" />
                <span>Proceed to Secure Payment</span>
              </span>
            )}
          </button>

          {/* Payment Methods Preview */}
          <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black/40 border-purple-500/20 shadow-lg shadow-purple-400/10'
              : 'bg-card/90 border-purple-300/20 shadow-lg'
          }`}>
            <h4 className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-1 rounded ${
                theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <CreditCard className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <span>Available Payment Methods</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded text-center text-xs ${
                theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100/80 text-gray-700'
              }`}>
                Cards
              </div>
              <div className={`p-2 rounded text-center text-xs ${
                theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100/80 text-gray-700'
              }`}>
                E-Wallets
              </div>
              <div className={`p-2 rounded text-center text-xs ${
                theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100/80 text-gray-700'
              }`}>
                Bank Transfer
              </div>
              <div className={`p-2 rounded text-center text-xs ${
                theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100/80 text-gray-700'
              }`}>
                Retail Outlets
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Security Information */}
      <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/40 border-green-500/20 shadow-lg shadow-green-400/10'
          : 'bg-card/90 border-green-300/20 shadow-lg'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <div className={`p-1 rounded ${
            theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
          }`}>
            <Shield className={`h-4 w-4 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <span>Security & Trust</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>256-bit SSL Encryption</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>PCI DSS Level 1 Compliant</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Bank-Grade Security</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Instant Transaction Processing</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>24/7 Fraud Monitoring</span>
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-green-300' : 'text-green-700'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Powered by Xendit Indonesia</span>
            </div>
          </div>
        </div>
        
        <div className={`mt-4 p-3 rounded-lg backdrop-blur-sm border ${
          theme === 'dark'
            ? 'bg-blue-500/10 border-blue-500/20'
            : 'bg-blue-50/80 border-blue-200/50'
        }`}>
          <p className={`text-xs text-center ${
            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
          }`}>
            Xendit is regulated by Bank Indonesia and complies with all Indonesian financial regulations
          </p>
        </div>
      </div>
    </div>
  );
}