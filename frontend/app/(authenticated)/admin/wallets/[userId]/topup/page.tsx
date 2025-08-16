'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, TrendingUp, DollarSign, User, AlertCircle, Loader2, Hash
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

interface WalletDetail {
  userId: string;
  balanceIDR: number;
  user: {
    fullName: string;
    email: string;
    photoUrl?: string;
  };
}

export default function ManualTopUpPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    // Generate auto reference when component mounts
    generateReference();
    fetchWalletDetails();
  }, [user, router, userId]);

  const generateReference = () => {
    // Generate reference dengan format: TOPUP-YYYYMMDD-RANDOM
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedRef = `TOPUP-${year}${month}${day}-${random}`;
    setReference(generatedRef);
  };

  const fetchWalletDetails = async () => {
    try {
      setIsLoading(true);
      const walletResponse = await api.adminWallets.getUserWallet(userId);
      setWallet(walletResponse);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
      toast.error('Failed to load wallet details');
      router.push('/admin/wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatInputCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.adminWallets.manualTopUp(userId, {
        amount: parseInt(amount),
        description: description.trim(),
        reference: reference // Use auto-generated reference
      });
      
      toast.success('Top-up successful!');
      router.push(`/admin/wallets/${userId}`);
    } catch (error: any) {
      console.error('Failed to process top-up:', error);
      toast.error(error.message || 'Failed to process top-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push(`/admin/wallets/${userId}`)}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Manual Top-up</h1>
          <p className="text-muted-foreground mt-1">
            Add funds to user wallet
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {wallet.user.photoUrl ? (
              <img
                src={wallet.user.photoUrl}
                alt={wallet.user.fullName}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="font-semibold">{wallet.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{wallet.user.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-xl font-bold">{formatCurrency(wallet.balanceIDR)}</p>
          </div>
        </div>
      </div>

      {/* Top-up Form */}
      <form onSubmit={handleSubmit} className={`p-6 rounded-lg border space-y-6 ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (IDR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              IDR
            </span>
            <input
              type="text"
              value={formatInputCurrency(amount)}
              onChange={handleAmountChange}
              placeholder="0"
              className={`w-full pl-12 pr-4 py-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              disabled={isSubmitting}
            />
          </div>
          {amount && (
            <p className="text-sm text-muted-foreground mt-2">
              New balance will be: {formatCurrency(wallet.balanceIDR + parseInt(amount || '0'))}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Manual top-up by admin"
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                : 'bg-white border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Reference ID
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={reference}
              readOnly
              className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-gray-400'
                  : 'bg-gray-50 border-gray-300 text-gray-500'
              } cursor-not-allowed`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-generated reference for tracking purposes
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || !amount || !description.trim()}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              !isSubmitting && amount && description.trim()
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Add Funds
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/wallets/${userId}`)}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Warning Notice */}
      <div className={`p-4 rounded-lg border flex items-start space-x-3 ${
        theme === 'dark' 
          ? 'bg-yellow-900/10 border-yellow-700/30' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
        }`} />
        <div className={`text-sm ${
          theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
        }`}>
          <p className="font-medium mb-1">Important:</p>
          <p>This action will immediately add funds to the user's wallet. Make sure to verify the amount and have proper authorization before proceeding.</p>
        </div>
      </div>
    </div>
  );
}
