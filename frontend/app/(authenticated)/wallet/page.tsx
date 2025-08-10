'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WalletSummary {
  balanceIDR: number;
  updatedAt: string;
}

interface WalletStatistics {
  totalEarned: number;
  totalWithdrawn: number;
  thisMonth: number;
}

interface LedgerEntry {
  id: string;
  amountIDR: number;
  kind: 'TOPUP' | 'ADJUST' | 'REFUND' | 'DEBIT';
  reference: any;
  createdAt: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [walletStatistics, setWalletStatistics] = useState<WalletStatistics | null>(null);
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchWalletData = useCallback(async () => {
    try {
      console.log('Starting to fetch wallet data...');
      setIsLoading(true);
      
      // Fetch wallet summary
      console.log('Fetching wallet summary...');
      const summaryRes = await fetch(`${API_BASE}/wallet/summary`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Summary response status:', summaryRes.status);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        console.log('Summary data:', summaryData);
        setWalletSummary(summaryData);
      } else {
        console.error('Failed to fetch wallet summary:', summaryRes.status);
        // Set default wallet summary to prevent infinite loading
        setWalletSummary({ balanceIDR: 0, updatedAt: new Date().toISOString() });
      }

      // Fetch wallet statistics
      console.log('Fetching wallet statistics...');
      const statisticsRes = await fetch(`${API_BASE}/wallet/statistics`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Statistics response status:', statisticsRes.status);
      if (statisticsRes.ok) {
        const statisticsData = await statisticsRes.json();
        console.log('Statistics data:', statisticsData);
        setWalletStatistics(statisticsData);
      } else {
        console.error('Failed to fetch wallet statistics:', statisticsRes.status);
        setWalletStatistics({ totalEarned: 0, totalWithdrawn: 0, thisMonth: 0 });
      }

      // Fetch ledger history
      console.log('Fetching ledger history...');
      const ledgerRes = await fetch(`${API_BASE}/wallet/ledger?page=1&limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Ledger response status:', ledgerRes.status);
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        console.log('Ledger data:', ledgerData);
        setLedgerHistory(ledgerData.data || []);
      } else {
        console.error('Failed to fetch ledger history:', ledgerRes.status);
        setLedgerHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      // Set default values to prevent infinite loading
      setWalletSummary({ balanceIDR: 0, updatedAt: new Date().toISOString() });
      setWalletStatistics({ totalEarned: 0, totalWithdrawn: 0, thisMonth: 0 });
      setLedgerHistory([]);
      toast.error('Failed to connect to server');
    } finally {
      console.log('Finished fetching wallet data, setting loading to false');
      setIsLoading(false);
    }
  }, [API_BASE]);

  const handleTopUp = () => {
    router.push('/wallet/topup');
  };

  const handleWithdraw = () => {
    toast.info('Withdrawal feature coming soon!');
  };

  const getLedgerDescription = (entry: LedgerEntry) => {
    switch (entry.kind) {
      case 'TOPUP':
        return 'Wallet Top-up';
      case 'ADJUST':
        return 'Balance Adjustment';
      case 'REFUND':
        return 'Refund';
      case 'DEBIT':
        return 'Debit Transaction';
      default:
        return 'Transaction';
    }
  };

  const getLedgerIcon = (kind: string) => {
    switch (kind) {
      case 'TOPUP':
      case 'REFUND':
        return <ArrowDownLeft className={`h-4 w-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />;
      case 'DEBIT':
        return <ArrowUpRight className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />;
      default:
        return <CreditCard className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />;
    }
  };

  useEffect(() => {
    console.log('Wallet useEffect triggered, user:', user?.id);
    if (user?.id) {
      fetchWalletData();
    }
  }, [user?.id, fetchWalletData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading wallet data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Manage your earnings and transactions
          </p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/30'
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Wallet className={`h-6 w-6 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Current Balance</h2>
              <p className="text-sm text-muted-foreground">Available funds</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2">
            {formatCurrency(walletSummary?.balanceIDR || 0)}
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {walletSummary ? new Date(walletSummary.updatedAt).toLocaleDateString('id-ID') : 'Never'}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleTopUp}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Top Up</span>
          </button>
          
          <button
            onClick={handleWithdraw}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:bg-gray-800 text-gray-300'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <ArrowDownLeft className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-semibold">{formatCurrency(walletStatistics?.totalEarned || 0)}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <ArrowUpRight className={`h-5 w-5 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-xl font-semibold">{formatCurrency(walletStatistics?.totalWithdrawn || 0)}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <CreditCard className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-xl font-semibold">{formatCurrency(walletStatistics?.thisMonth || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className={`rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your latest wallet activity
          </p>
        </div>
        
        <div className="divide-y divide-border">
          {ledgerHistory.length > 0 ? (
            ledgerHistory.map((entry) => (
              <div key={entry.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    ['TOPUP', 'REFUND'].includes(entry.kind)
                      ? theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                      : entry.kind === 'DEBIT'
                      ? theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                      : theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    {getLedgerIcon(entry.kind)}
                  </div>
                  <div>
                    <p className="font-medium">{getLedgerDescription(entry)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    ['TOPUP', 'REFUND'].includes(entry.kind)
                      ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      : entry.kind === 'DEBIT'
                      ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {['TOPUP', 'REFUND'].includes(entry.kind) ? '+' : entry.kind === 'DEBIT' ? '-' : ''}{formatCurrency(Math.abs(entry.amountIDR))}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {entry.kind.toLowerCase()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Wallet className={`h-12 w-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-muted-foreground">Your wallet activity will appear here</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-border">
          <button className={`w-full py-2 px-4 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'border-gray-600 hover:bg-gray-800 text-gray-300'
              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}>
            View All Transactions
          </button>
        </div>
      </div>

    </div>
  );
}