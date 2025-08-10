'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { Wallet, Search, Filter, TrendingUp, TrendingDown, DollarSign, Users, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock wallet data
const mockWallets = [
  {
    id: 1,
    userId: 1,
    userName: 'John Doe',
    userEmail: 'john@example.com',
    balance: 125000,
    totalEarned: 200000,
    totalWithdrawn: 75000,
    lastTransaction: '2024-10-25T14:30:00Z',
    status: 'active',
    transactionCount: 15
  },
  {
    id: 2,
    userId: 2,
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    balance: 89000,
    totalEarned: 150000,
    totalWithdrawn: 61000,
    lastTransaction: '2024-10-24T16:45:00Z',
    status: 'active',
    transactionCount: 12
  },
  {
    id: 3,
    userId: 3,
    userName: 'Admin User',
    userEmail: 'admin@a1dev.id',
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    lastTransaction: null,
    status: 'active',
    transactionCount: 0
  },
  {
    id: 4,
    userId: 4,
    userName: 'Bob Wilson',
    userEmail: 'bob@example.com',
    balance: 45000,
    totalEarned: 75000,
    totalWithdrawn: 30000,
    lastTransaction: '2024-10-23T11:15:00Z',
    status: 'active',
    transactionCount: 8
  }
];

export default function AdminWalletsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [wallets, setWallets] = useState(mockWallets);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = wallet.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  // Calculate totals
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalEarned = wallets.reduce((sum, wallet) => sum + wallet.totalEarned, 0);
  const totalWithdrawn = wallets.reduce((sum, wallet) => sum + wallet.totalWithdrawn, 0);
  const activeWallets = wallets.filter(wallet => wallet.balance > 0).length;

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
            Monitor and manage all user wallets
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <DollarSign className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <TrendingUp className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalEarned)}</p>
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
              <TrendingDown className={`h-5 w-5 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalWithdrawn)}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
            }`}>
              <Wallet className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Wallets</p>
              <p className="text-2xl font-semibold">{activeWallets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={`p-6 rounded-lg border ${
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
                <th className="text-left p-4 font-semibold">Current Balance</th>
                <th className="text-left p-4 font-semibold">Total Earned</th>
                <th className="text-left p-4 font-semibold">Total Withdrawn</th>
                <th className="text-left p-4 font-semibold">Transactions</th>
                <th className="text-left p-4 font-semibold">Last Activity</th>
                <th className="text-left p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{wallet.userName}</div>
                      <div className="text-sm text-muted-foreground">{wallet.userEmail}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">{formatCurrency(wallet.balance)}</div>
                  </td>
                  <td className="p-4">
                    <div className={`font-semibold ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatCurrency(wallet.totalEarned)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`font-semibold ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(wallet.totalWithdrawn)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        wallet.transactionCount > 10
                          ? theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                          : wallet.transactionCount > 5
                          ? theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                          : theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {wallet.transactionCount}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(wallet.lastTransaction)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        wallet.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm capitalize">{wallet.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredWallets.length === 0 && (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No wallets found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Platform Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{formatCurrency(totalBalance)}</div>
            <div className="text-sm text-muted-foreground">Total Platform Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{wallets.length}</div>
            <div className="text-sm text-muted-foreground">Total Wallets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {wallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
}