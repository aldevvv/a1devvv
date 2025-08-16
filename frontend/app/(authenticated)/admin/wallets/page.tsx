'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, Search, TrendingUp, TrendingDown, DollarSign, Users, Shield, 
  Plus, Edit, Eye, Clock, CheckCircle, XCircle, Upload, AlertCircle,
  RefreshCw, FileText, CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

interface WalletData {
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
  _count: {
    ledger: number;
  };
  lastTransaction?: {
    amountIDR: number;
    kind: string;
    createdAt: string;
  };
}

interface WalletStats {
  totalBalance: number;
  totalUsers: number;
  totalTopUps: {
    amount: number;
    count: number;
  };
  totalDebits: {
    amount: number;
    count: number;
  };
  todayTopUps: {
    amount: number;
    count: number;
  };
  pendingTopUps: number;
}

interface TopUpRequest {
  id: string;
  userId: string;
  orderId: string;
  grossIDR: number;
  status: string;
  method: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    photoUrl?: string;
  };
  proofUrl?: string;
  uploadedAt?: string;
  bankName?: string;
  accountName?: string;
  transferDate?: string;
}

export default function AdminWalletsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallets' | 'topup-requests'>('wallets');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Fetch wallets data
  const fetchWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.adminWallets.getAll(searchTerm, currentPage, limit);
      setWallets(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.adminWallets.getStatistics();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, []);

  // Fetch top-up requests
  const fetchTopUpRequests = useCallback(async () => {
    try {
      const response = await api.adminWallets.getTopUpRequests('PENDING');
      setTopUpRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch top-up requests:', error);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    fetchWallets();
    fetchStats();
    fetchTopUpRequests();
  }, [user, router, fetchWallets, fetchStats, fetchTopUpRequests]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const handleApproveTopUp = async (paymentId: string) => {
    try {
      await api.adminWallets.approveTopUp(paymentId, { notes: 'Approved by admin' });
      toast.success('Top-up approved');
      fetchTopUpRequests();
      fetchWallets();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve top-up');
    }
  };

  const handleRejectTopUp = async (paymentId: string, notes: string) => {
    try {
      await api.adminWallets.rejectTopUp(paymentId, { notes });
      toast.success('Top-up rejected');
      fetchTopUpRequests();
    } catch (error) {
      toast.error('Failed to reject top-up');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all user wallets and top-up requests
          </p>
        </div>
        <button
          onClick={() => {
            fetchWallets();
            fetchStats();
            fetchTopUpRequests();
          }}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <DollarSign className={`h-4 w-4 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(stats.totalBalance)}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Users className={`h-4 w-4 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-lg font-semibold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-4 w-4 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Total Top-ups</p>
                <p className="text-lg font-semibold">{formatCurrency(stats.totalTopUps.amount)}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <TrendingDown className={`h-4 w-4 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Total Debits</p>
                <p className="text-lg font-semibold">{formatCurrency(stats.totalDebits.amount)}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <CreditCard className={`h-4 w-4 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Today's Top-ups</p>
                <p className="text-lg font-semibold">{formatCurrency(stats.todayTopUps.amount)}</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <div>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
                <p className="text-lg font-semibold">{stats.pendingTopUps}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'wallets'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Wallets
        </button>
        <button
          onClick={() => setActiveTab('topup-requests')}
          className={`pb-2 px-1 font-medium transition-colors relative ${
            activeTab === 'topup-requests'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Top-up Requests
          {stats && stats.pendingTopUps > 0 && (
            <span className="absolute -top-1 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {stats.pendingTopUps}
            </span>
          )}
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'wallets' ? (
        <>
          {/* Search */}
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border w-full md:w-80 ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* Wallets Table */}
          <div className={`rounded-lg border overflow-hidden ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${
                  theme === 'dark' ? 'border-border bg-muted/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <tr>
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">Balance</th>
                    <th className="text-left p-4 font-semibold">Transactions</th>
                    <th className="text-left p-4 font-semibold">Last Transaction</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Loading wallets...</p>
                      </td>
                    </tr>
                  ) : wallets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No wallets found</h3>
                        <p className="text-muted-foreground">Try adjusting your search criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet) => (
                      <tr key={wallet.userId} className="hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {wallet.user.photoUrl ? (
                              <img
                                src={wallet.user.photoUrl}
                                alt={wallet.user.fullName}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{wallet.user.fullName}</div>
                              <div className="text-sm text-muted-foreground">{wallet.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">{formatCurrency(wallet.balanceIDR)}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            wallet._count.ledger > 10
                              ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                              : wallet._count.ledger > 5
                              ? theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                              : theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {wallet._count.ledger}
                          </span>
                        </td>
                        <td className="p-4">
                          {wallet.lastTransaction ? (
                            <div className="text-sm">
                              <div className={`font-medium ${
                                wallet.lastTransaction.kind === 'TOPUP' || wallet.lastTransaction.kind === 'ADJUST'
                                  ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                  : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                              }`}>
                                {wallet.lastTransaction.kind === 'TOPUP' ? '+' : wallet.lastTransaction.kind === 'DEBIT' ? '-' : ''}
                                {formatCurrency(Math.abs(wallet.lastTransaction.amountIDR))}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(wallet.lastTransaction.createdAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No transactions</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/wallets/${wallet.userId}`)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                              }`}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/wallets/${wallet.userId}/topup`)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-green-900/30 text-green-400 hover:text-green-300'
                                  : 'hover:bg-green-100 text-green-600 hover:text-green-700'
                              }`}
                              title="Manual Top-up"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/wallets/${wallet.userId}/adjust`)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300'
                                  : 'hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                              }`}
                              title="Adjust Balance"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
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
        </>
      ) : (
        /* Top-up Requests Tab */
        <div className={`rounded-lg border overflow-hidden ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                theme === 'dark' ? 'border-border bg-muted/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <tr>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Amount</th>
                  <th className="text-left p-4 font-semibold">Method</th>
                  <th className="text-left p-4 font-semibold">Proof</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topUpRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No pending top-up requests</h3>
                      <p className="text-muted-foreground">All top-up requests have been processed.</p>
                    </td>
                  </tr>
                ) : (
                  topUpRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {request.user.photoUrl ? (
                            <img
                              src={request.user.photoUrl}
                              alt={request.user.fullName}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{request.user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{request.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{formatCurrency(request.grossIDR)}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm capitalize">{request.method.replace('_', ' ')}</span>
                      </td>
                      <td className="p-4">
                        {request.proofUrl ? (
                          <a
                            href={request.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center text-sm ${
                              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Proof
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">No proof</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'PENDING'
                            ? theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                            : request.status === 'SETTLED'
                            ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            : theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {request.status === 'PENDING' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproveTopUp(request.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-green-900/30 text-green-400 hover:text-green-300'
                                  : 'hover:bg-green-100 text-green-600 hover:text-green-700'
                              }`}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('Rejection reason:');
                                if (notes) handleRejectTopUp(request.id, notes);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                              }`}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
