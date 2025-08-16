'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CreditCard, User, AlertCircle, Loader2, Plus, Minus, Hash
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

export default function AdjustBalancePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    // Generate auto reference when component mounts or adjustment type changes
    generateReference();
    fetchWalletDetails();
  }, [user, router, userId]);

  useEffect(() => {
    // Regenerate reference when adjustment type changes
    generateReference();
  }, [adjustmentType]);

  const generateReference = () => {
    // Generate reference dengan format: ADD-YYYYMMDD-RANDOM atau DEDUCT-YYYYMMDD-RANDOM
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = adjustmentType === 'add' ? 'ADD' : 'DEDUCT';
    const generatedRef = `${prefix}-${year}${month}${day}-${random}`;
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

  const calculateNewBalance = () => {
    if (!wallet || !amount) return wallet?.balanceIDR || 0;
    const amountNum = parseInt(amount);
    return adjustmentType === 'add' 
      ? wallet.balanceIDR + amountNum 
      : wallet.balanceIDR - amountNum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please enter a reason for adjustment');
      return;
    }
    
    const finalAmount = adjustmentType === 'deduct' ? -parseInt(amount) : parseInt(amount);
    
    if (wallet && wallet.balanceIDR + finalAmount < 0) {
      toast.error('Insufficient balance for this deduction');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.adminWallets.adjustBalance(userId, {
        amount: finalAmount,
        reason: reason.trim(),
        reference: reference // Use auto-generated reference
      });
      
      toast.success('Balance adjusted successfully!');
      router.push(`/admin/wallets/${userId}`);
    } catch (error: any) {
      console.error('Failed to adjust balance:', error);
      toast.error(error.message || 'Failed to adjust balance');
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

  const newBalance = calculateNewBalance();
  const isBalanceNegative = newBalance < 0;

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
          <h1 className="text-3xl font-bold">Adjust Balance</h1>
          <p className="text-muted-foreground mt-1">
            Add or deduct funds from user wallet
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

      {/* Adjustment Form */}
      <form onSubmit={handleSubmit} className={`p-6 rounded-lg border space-y-6 ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        {/* Adjustment Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('add')}
              className={`p-3 rounded-lg border transition-all flex items-center justify-center space-x-2 ${
                adjustmentType === 'add'
                  ? theme === 'dark'
                    ? 'bg-green-900/30 border-green-600 text-green-400'
                    : 'bg-green-50 border-green-500 text-green-700'
                  : theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add Funds</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('deduct')}
              className={`p-3 rounded-lg border transition-all flex items-center justify-center space-x-2 ${
                adjustmentType === 'deduct'
                  ? theme === 'dark'
                    ? 'bg-red-900/30 border-red-600 text-red-400'
                    : 'bg-red-50 border-red-500 text-red-700'
                  : theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
            >
              <Minus className="h-5 w-5" />
              <span className="font-medium">Deduct Funds</span>
            </button>
          </div>
        </div>

        {/* Amount */}
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
            <div className="mt-2 space-y-1">
              <p className={`text-sm ${
                isBalanceNegative 
                  ? 'text-red-500 font-medium' 
                  : 'text-muted-foreground'
              }`}>
                New balance will be: {formatCurrency(newBalance)}
              </p>
              {isBalanceNegative && (
                <p className="text-sm text-red-500">
                  ⚠️ Warning: This will result in a negative balance!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              adjustmentType === 'add' 
                ? "e.g., Refund for order #12345" 
                : "e.g., Penalty for policy violation"
            }
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                : 'bg-white border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            disabled={isSubmitting}
          />
        </div>

        {/* Reference */}
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

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || !amount || !reason.trim() || isBalanceNegative}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              !isSubmitting && amount && reason.trim() && !isBalanceNegative
                ? adjustmentType === 'add'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
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
                <CreditCard className="h-5 w-5 mr-2" />
                {adjustmentType === 'add' ? 'Add Funds' : 'Deduct Funds'}
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
          <ul className="list-disc list-inside space-y-1">
            <li>This action will immediately affect the user's wallet balance</li>
            <li>All adjustments are logged and cannot be reversed automatically</li>
            <li>Make sure to document the reason properly for audit purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
