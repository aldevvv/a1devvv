'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, CreditCard, Calendar, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LedgerEntry {
  id: string;
  amountIDR: number;
  kind: 'TOPUP' | 'ADJUST' | 'REFUND' | 'DEBIT';
  reference: any;
  createdAt: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

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
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid';
    }
  };

  const fetchTransactions = useCallback(async (page = 1, limit = 20) => {
    try {
      setIsLoading(true);
      
      let url = `${API_BASE}/wallet/ledger?page=${page}&limit=${limit}`;
      if (filterType !== 'all') {
        url += `&kind=${filterType.toUpperCase()}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      console.log('Fetching transactions with URL:', url);

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transaction data received:', data);
        setLedgerHistory(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalTransactions(data.total || 0);
      } else {
        console.error('Failed to fetch transactions:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setLedgerHistory([]);
        setTotalPages(1);
        setTotalTransactions(0);
        if (response.status !== 404) {
          toast.error('Failed to load transactions');
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setLedgerHistory([]);
      setTotalPages(1);
      setTotalTransactions(0);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, filterType, searchTerm]);

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
    if (user?.id) {
      fetchTransactions(currentPage);
    }
  }, [user?.id, currentPage, fetchTransactions]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions(1);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    setCurrentPage(1);
  };

  // Trigger search when filter changes
  useEffect(() => {
    if (user?.id) {
      setCurrentPage(1);
      fetchTransactions(1);
    }
  }, [filterType, user?.id, fetchTransactions]);

  // Debounced search functionality
  useEffect(() => {
    if (user?.id && searchTerm.length === 0) {
      // If search term is cleared, fetch immediately
      setCurrentPage(1);
      fetchTransactions(1);
    }
  }, [searchTerm, user?.id, fetchTransactions]);

  if (isLoading && ledgerHistory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Futuristic background grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" 
           style={{ backgroundSize: '30px 30px' }}></div>

      {/* Compact Header */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-card/80 text-muted-foreground hover:text-neon-blue' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-primary'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
              <CreditCard className={`h-5 w-5 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Transaction History</h1>
              <p className="text-xs text-muted-foreground">
                Complete record of all wallet activities
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {totalTransactions} total transactions
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-border/50'
          : 'bg-card/90 border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              theme === 'dark' ? 'text-neon-blue/70' : 'text-primary/70'
            }`} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                  : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
              }`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                  : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
              }`}
            >
              <option value="all">All Types</option>
              <option value="topup">Top Up</option>
              <option value="debit">Purchases</option>
              <option value="refund">Refunds</option>
              <option value="adjust">Adjustments</option>
            </select>
            <button
              onClick={handleSearch}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-neon-blue text-black hover:bg-neon-blue/90 shadow-lg shadow-neon-blue/25'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              }`}
            >
              <Search className="h-3 w-3 mr-1" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-border/50'
          : 'bg-card/90 border-gray-200'
      }`}>
        {ledgerHistory.length > 0 ? (
          <div className="divide-y divide-border/50">
            <AnimatePresence>
              {ledgerHistory.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 transition-all duration-200 hover:scale-[1.01] ${
                    theme === 'dark' ? 'hover:bg-card/30' : 'hover:bg-gray-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        ['TOPUP', 'REFUND'].includes(entry.kind)
                          ? theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                          : entry.kind === 'DEBIT'
                          ? theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                          : theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                      }`}>
                        {getLedgerIcon(entry.kind)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {getLedgerDescription(entry)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </p>
                        {entry.reference && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {entry.id.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${
                        ['TOPUP', 'REFUND'].includes(entry.kind)
                          ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                          : entry.kind === 'DEBIT'
                          ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                          : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {['TOPUP', 'REFUND'].includes(entry.kind) ? '+' : entry.kind === 'DEBIT' ? '-' : ''}
                        {formatCurrency(Math.abs(entry.amountIDR))}
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
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`inline-flex p-4 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'
            }`}>
              <Wallet className={`h-8 w-8 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Your transaction history will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-black border-border/50'
            : 'bg-card/90 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'border-border/50 hover:bg-card/80 text-foreground disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'border-border/50 hover:bg-card/80 text-foreground disabled:hover:bg-transparent'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700 disabled:hover:bg-transparent'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}