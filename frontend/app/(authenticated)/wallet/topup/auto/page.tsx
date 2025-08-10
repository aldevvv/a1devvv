'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Building2, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

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

    if (!amount || parseInt(amount) < 10000) {
      newErrors.amount = 'Minimum amount is IDR 10,000';
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
          <h1 className="text-3xl font-bold">Auto Top-up</h1>
          <p className="text-muted-foreground mt-1">
            Choose your preferred payment method
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Input */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Enter Amount</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  IDR
                </span>
                <input
                  type="text"
                  value={formatCurrency(amount)}
                  onChange={handleAmountChange}
                  placeholder="10.000"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border transition-colors ${
                    errors.amount
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Minimum: IDR 10,000 • Maximum: IDR 10,000,000
              </p>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Secure Payment via Xendit</p>
                  <p>You'll be redirected to Xendit's secure payment page where you can choose from various payment methods including credit cards, bank transfers, e-wallets, and more.</p>
                </div>
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className={`p-4 rounded-lg border flex items-start space-x-3 ${
              theme === 'dark' 
                ? 'bg-red-900/10 border-red-700/30' 
                : 'bg-red-50 border-red-200'
            }`}>
              <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
              <p className={`text-sm ${
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              }`}>
                {errors.general}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Amount to pay</span>
                <span className={`${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>
                  {amount ? `IDR ${formatCurrency(amount)}` : 'IDR 0'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment processing fees (if any) will be shown on the payment page.
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handleSubmit}
            disabled={!amount || isProcessing || parseInt(amount) < 10000}
            className={`w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
              !amount || isProcessing || parseInt(amount) < 10000
                ? theme === 'dark'
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Proceed to Payment</span>
            )}
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Secure Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>256-bit SSL encryption</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>PCI DSS compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Secured by Xendit</span>
          </div>
        </div>
      </div>
    </div>
  );
}