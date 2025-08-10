'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const refreshWalletData = async () => {
    if (!user?.id) return;
    
    try {
      setIsRefreshing(true);
      const response = await fetch(`${API_BASE}/wallet/summary`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkPaymentStatus = async () => {
    const orderId = searchParams.get('orderId');
    if (!orderId || !user?.id) {
      setStatusMessage('No order ID found');
      return;
    }

    try {
      setIsCheckingStatus(true);
      setStatusMessage('Checking payment status...');
      
      const response = await fetch(`${API_BASE}/billing/payment/${orderId}/check-status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStatusMessage(result.message);
        
        // Refresh wallet data after status check
        if (result.status === 'SETTLEMENT') {
          setTimeout(() => {
            refreshWalletData();
          }, 1000);
        }
      } else {
        const errorData = await response.json();
        setStatusMessage(errorData.message || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setStatusMessage('Failed to check payment status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    refreshWalletData();
  }, [user?.id]);

  const formatCurrency = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleBack = () => {
    router.push('/wallet');
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
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-1">
            Your wallet top-up has been processed
          </p>
        </div>
      </div>

      {/* Success Message */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
              Payment Completed
            </h3>
            <p className="text-sm text-muted-foreground">
              Your payment has been successfully processed
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
        }`}>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-green-300' : 'text-green-700'
          }`}>
            <strong>What happens next:</strong>
          </p>
          <ul className={`text-sm mt-2 space-y-1 ${
            theme === 'dark' ? 'text-green-300' : 'text-green-700'
          }`}>
            <li>• Your wallet balance will be updated shortly</li>
            <li>• You will receive a confirmation email</li>
            <li>• The transaction will appear in your wallet history</li>
          </ul>
        </div>
      </div>

      {/* Current Balance */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Wallet Balance</h3>
          <button
            onClick={refreshWalletData}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isRefreshing
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="text-center py-6">
          {walletData ? (
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                IDR {formatCurrency(walletData.balanceIDR)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(walletData.lastUpdatedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading balance...</span>
            </div>
          )}
        </div>

        {walletData && walletData.balanceIDR === 0 && (
          <div className={`mt-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <strong>Balance still showing 0?</strong> This is normal for development mode. 
              In production, webhooks automatically update your balance when payment is confirmed. 
              For local testing, you may need to use a service like ngrok to receive webhooks, 
              or the balance will update when the next payment status check occurs.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => router.push('/wallet')}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Go to Wallet
        </button>
        <button
          onClick={() => router.push('/wallet/topup/auto')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium border transition-colors ${
            theme === 'dark'
              ? 'border-gray-600 hover:bg-gray-800 text-gray-300'
              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          Top-up Again
        </button>
      </div>
    </div>
  );
}