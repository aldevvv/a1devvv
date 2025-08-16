'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Wallet, TrendingUp, TrendingDown, Clock, 
  DollarSign, RefreshCw, User, Calendar, CreditCard,
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

interface WalletDetail {
  userId: string;
  balanceIDR: number;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    photoUrl?: string;
    createdAt: string;
  };
}

interface LedgerEntry {
  id: string;
  amountIDR: number;
  kind: 'TOPUP' | 'DEBIT' | 'ADJUST';
  description: string | {
    type?: string;
    notes?: string;
    orderId?: string;
    paymentId?: string;
    approvedBy?: string;
  };
  balanceIDR: number;
  reference?: string;
  createdAt: string;
}

export default function WalletDetailsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchWalletDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const walletResponse = await api.adminWallets.getUserWallet(userId);
      setWallet(walletResponse);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
      toast.error('Failed to load wallet details');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchLedger = useCallback(async () => {
    try {
      const ledgerResponse = await api.adminWallets.getUserLedger(userId, currentPage, limit);
      setLedger(ledgerResponse.data);
      setTotalPages(ledgerResponse.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    }
  }, [userId, currentPage]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    fetchWalletDetails();
    fetchLedger();
  }, [user, router, fetchWalletDetails, fetchLedger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (kind: string) => {
    switch (kind) {
      case 'TOPUP':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'DEBIT':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'ADJUST':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getDescription = (description: any): string => {
    // Debug log to see what we're dealing with
    console.log('Description type:', typeof description, 'Value:', description);
    
    if (!description) {
      return 'Transaction';
    }
    
    if (typeof description === 'string') {
      return description;
    }
    
    if (typeof description === 'object') {
      // Check if it's actually a React element or something else
      if (React.isValidElement(description)) {
        return 'Transaction';
      }
      
      // If it's an object with type field, show type and notes if available
      if ('type' in description && description.type) {
        const parts = [String(description.type)];
        if ('notes' in description && description.notes) {
          parts.push(`- ${String(description.notes)}`);
        }
        return parts.join(' ');
      }
      
      // For other objects, try to extract meaningful info
      if ('orderId' in description) {
        return `Order: ${String(description.orderId)}`;
      }
      
      if ('paymentId' in description) {
        return `Payment: ${String(description.paymentId)}`;
      }
      
      // Last resort - just return a default
      return 'Transaction';
    }
    
    return 'Transaction';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Wallet Not Found</h3>
          <p className="text-muted-foreground">The wallet you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/wallets')}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-black'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Wallet Details</h1>
            <p className="text-muted-foreground mt-1">
              View wallet information and transaction history
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/admin/wallets/${userId}/topup`)}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Manual Top-up
          </button>
          <button
            onClick={() => router.push(`/admin/wallets/${userId}/adjust`)}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Adjust Balance
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {wallet.user.photoUrl ? (
              <img
                src={wallet.user.photoUrl}
                alt={wallet.user.fullName}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{wallet.user.fullName}</h2>
              <p className="text-muted-foreground">{wallet.user.email}</p>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Joined {formatDate(wallet.user.createdAt)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet.balanceIDR)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {formatDate(wallet.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className={`rounded-lg border overflow-hidden ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${
              theme === 'dark' ? 'border-border bg-muted/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <tr>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-left p-4 font-semibold">Amount</th>
                <th className="text-left p-4 font-semibold">Balance After</th>
                <th className="text-left p-4 font-semibold">Reference</th>
                <th className="text-left p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">This wallet has no transaction history.</p>
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(entry.kind)}
                        <span className={`text-sm font-medium ${
                          entry.kind === 'TOPUP' || entry.kind === 'ADJUST' && entry.amountIDR > 0
                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {entry.kind}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {getDescription(entry.description)}
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${
                        entry.amountIDR > 0
                          ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                          : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {entry.amountIDR > 0 ? '+' : ''}{formatCurrency(entry.amountIDR)}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(entry.balanceIDR)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {entry.reference ? (
                        typeof entry.reference === 'string' 
                          ? entry.reference 
                          : (entry.reference as any).reference || (entry.reference as any).orderId || '-'
                      ) : '-'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
