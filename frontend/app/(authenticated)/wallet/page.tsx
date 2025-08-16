'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign, Loader2, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Never';
      }
      return date.toLocaleDateString('en-US');
    } catch (error) {
      return 'Never';
    }
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
        return 'Marketplace Purchase';
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
    <div className="space-y-4 relative">
      {/* Futuristic background grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none"
           style={{ backgroundSize: '30px 30px' }}></div>

      {/* Compact Header with futuristic styling */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
              <Wallet className={`h-5 w-5 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Wallet Control Center</h1>
              <p className="text-xs text-muted-foreground">
                Manage your digital assets and transactions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTopUp}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-neon-blue text-black hover:bg-neon-blue/90 shadow-lg shadow-neon-blue/25'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              }`}
            >
              <Plus className="h-3 w-3 mr-1" />
              Top Up
            </button>
            <button
              onClick={handleWithdraw}
              className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                theme === 'dark'
                  ? 'border-border/50 hover:bg-card/80 text-muted-foreground'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Compact Balance & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Main Balance Card - Takes 2 columns */}
        <div className={`lg:col-span-2 group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
          theme === 'dark'
            ? 'bg-black border-neon-blue/30 hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/20'
            : 'bg-card/90 border-primary/30 hover:border-primary/50 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
                <Wallet className={`h-4 w-4 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
                <p className="text-xs text-muted-foreground">
                  Updated: {walletSummary ? formatDate(walletSummary.updatedAt) : 'Never'}
                </p>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`}>
              {formatCurrency(walletSummary?.balanceIDR || 0)}
            </div>
          </div>
          <div className={`h-1 rounded-full ${theme === 'dark' ? 'bg-neon-blue/30' : 'bg-primary/30'}`}>
            <div className={`h-1 rounded-full w-full animate-pulse ${theme === 'dark' ? 'bg-neon-blue' : 'bg-primary'}`}></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-green-500/20 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/20'
            : 'bg-card/90 border-green-200 hover:border-green-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Earned</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(walletStatistics?.totalEarned || 0)}</p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className={`h-1 rounded-full mt-2 ${theme === 'dark' ? 'bg-green-500/30' : 'bg-green-200'}`}>
            <div className="h-1 bg-green-500 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>

        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20'
            : 'bg-card/90 border-blue-200 hover:border-blue-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">This Month</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(walletStatistics?.thisMonth || 0)}</p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className={`h-1 rounded-full mt-2 ${theme === 'dark' ? 'bg-blue-500/30' : 'bg-blue-200'}`}>
            <div className="h-1 bg-blue-500 rounded-full w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - More compact */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column - Transaction History */}
        <div className="xl:col-span-2 space-y-4">
          <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black border-border/50 hover:shadow-lg'
              : 'bg-card/90 border-gray-200 hover:shadow-lg'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold flex items-center">
                <div className={`p-1 rounded ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'} mr-2`}>
                  <CreditCard className={`h-3 w-3 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
                </div>
                Transaction History
              </h3>
            </div>
            
            {ledgerHistory.length > 0 ? (
              <div className="space-y-2">
                {ledgerHistory.slice(0, 6).map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                      theme === 'dark' ? 'border-border/50 hover:border-neon-blue/30' : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-lg ${
                            ['TOPUP', 'REFUND'].includes(entry.kind)
                              ? theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                              : entry.kind === 'DEBIT'
                              ? theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                              : theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                          }`}>
                            {getLedgerIcon(entry.kind)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{getLedgerDescription(entry)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-sm font-medium ${
                          ['TOPUP', 'REFUND'].includes(entry.kind)
                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : entry.kind === 'DEBIT'
                            ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                            : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {['TOPUP', 'REFUND'].includes(entry.kind) ? '+' : entry.kind === 'DEBIT' ? '-' : ''}{formatCurrency(Math.abs(entry.amountIDR))}
                        </p>
                        <p className={`text-xs uppercase font-medium ${
                          ['TOPUP', 'REFUND'].includes(entry.kind) ? 'text-green-500' :
                          entry.kind === 'DEBIT' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {entry.kind}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {ledgerHistory.length > 6 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => router.push('/wallet/transactions')}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        theme === 'dark'
                          ? 'text-neon-blue hover:bg-neon-blue/10'
                          : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      View {ledgerHistory.length - 6} more transactions →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`inline-flex p-3 rounded-full mb-3 ${
                  theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'
                }`}>
                  <Wallet className={`h-6 w-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
                </div>
                <p className="text-sm font-medium mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground">Your wallet activity will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-black border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10'
            : 'bg-card/90 border-purple-200 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center">
              <div className={`p-1 rounded ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'} mr-2`}>
                <Zap className="h-3 w-3 text-purple-500" />
              </div>
              Quick Actions
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Quick Action Buttons */}
            <button
              onClick={handleTopUp}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-neon-blue/30 hover:border-neon-blue/50 hover:bg-neon-blue/10 text-neon-blue'
                  : 'border-primary/30 hover:border-primary/50 hover:bg-primary/10 text-primary'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Top Up Wallet</span>
            </button>

            <button
              onClick={handleWithdraw}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'border-border/50 hover:border-gray-600 hover:bg-card/80 text-muted-foreground'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-medium">Withdraw Funds</span>
            </button>

            {/* Additional Stats */}
            <div className="border-t border-border/50 pt-3 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-medium text-red-500">{formatCurrency(walletStatistics?.totalWithdrawn || 0)}</span>
                </div>
                <div className={`h-1 rounded-full ${theme === 'dark' ? 'bg-red-500/30' : 'bg-red-200'}`}>
                  <div className="h-1 bg-red-500 rounded-full w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}