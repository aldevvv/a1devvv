'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Package,
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  SlidersHorizontal,
  Wallet,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderId: string;
  userId: string;
  totalIDR: number;
  status: string;
  paymentMethod: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  payment?: {
    id: string;
    provider: string;
    status: string;
  };
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'PAID', label: 'Paid', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
];

const PAYMENT_METHODS = [
  { value: 'BALANCE', label: 'Balance', icon: <Wallet className="h-3 w-3" /> },
  { value: 'XENDIT', label: 'Xendit', icon: <CreditCard className="h-3 w-3" /> },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/orders?${params}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [searchTerm, statusFilter, paymentMethodFilter]);

  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentMethodFilter('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'PAID':
        return <CheckCircle className="h-3 w-3" />;
      case 'DELIVERED':
        return <Package className="h-3 w-3" />;
      case 'FAILED':
        return <XCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <AlertCircle className="h-3 w-3" />;
      case 'REFUNDED':
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <div className="space-y-6 relative">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" 
           style={{ backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <div className={`relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-card/80 text-muted-foreground hover:text-foreground'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
              <ShoppingCart className={`h-6 w-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track all marketplace orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">{totalCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-xl font-bold">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">
                {orders.filter(o => o.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-xl font-bold">
                {orders.filter(o => o.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-xl border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                    : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                }`}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm rounded-lg border font-medium transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border/70'
                  : 'bg-background border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {(searchTerm || statusFilter || paymentMethodFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                    : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                }`}
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                    : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                }`}
              >
                <option value="">All Methods</option>
                <option value="BALANCE">Balance</option>
                <option value="XENDIT">Xendit</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className={`rounded-xl border backdrop-blur-sm overflow-hidden ${
        theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Order</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Payment</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Date</th>
                <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={`border-b ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      <h3 className="font-semibold">No orders found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter || paymentMethodFilter
                          ? 'Try adjusting your filters'
                          : 'Orders will appear here when customers make purchases'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      theme === 'dark' ? 'border-border/50' : 'border-gray-200'
                    }`}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{order.orderId}</p>
                        <p className="text-xs text-muted-foreground">ID: {order.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">
                          {order.user.firstName || order.user.lastName 
                            ? `${order.user.firstName} ${order.user.lastName}`.trim()
                            : 'Unknown User'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">{order.user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{formatCurrency(order.totalIDR)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{order.paymentMethod}</span>
                        {order.payment && (
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            order.payment.status === 'SETTLED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {order.payment.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className={`p-1 rounded hover:bg-muted-foreground/10 transition-colors`}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
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
          <div className={`px-4 py-3 border-t ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, totalCount)} of {totalCount} orders
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border/70'
                      : 'bg-background border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border/70'
                      : 'bg-background border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
