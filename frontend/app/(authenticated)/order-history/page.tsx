'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { 
  Package, Search, Clock, CheckCircle, XCircle, AlertCircle, 
  Eye, Receipt, Loader2, ShoppingBag 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
}

interface Order {
  id: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promoCode?: string | null;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string | null;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      
      const response = await fetch(`${API_BASE}/orders?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, filterStatus, currentPage, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

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

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PROCESSING':
        return theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'FAILED':
        return theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
      default:
        return theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const totalSpent = orders
    .filter(order => order.status === 'PAID' || order.status === 'COMPLETED')
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const completedOrders = orders.filter(
    order => order.status === 'PAID' || order.status === 'COMPLETED'
  ).length;

  const handleViewDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-1">
            Track your purchases and access your digital products
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Package className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{orders.length}</p>
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
              <CheckCircle className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">{completedOrders}</p>
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
              <Receipt className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border w-full md:w-80 ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-background border-border text-foreground'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`p-6 rounded-lg border ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}>
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{order.orderId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ordered on {formatDate(order.createdAt)}
                      {order.completedAt && ` • Completed on ${formatDate(order.completedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(order.status)
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>Type: {item.productType}</span>
                          {item.salePrice ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(item.salePrice)} 
                              <span className="line-through text-muted-foreground ml-1">
                                {formatCurrency(item.price)}
                              </span>
                            </span>
                          ) : (
                            <span className="font-medium">{formatCurrency(item.price)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Payment: {order.paymentMethod.replace('_', ' ')}
                  {order.promoCode && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {order.promoCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {order.discountAmount > 0 && (
                      <div className="text-sm text-green-600">
                        Discount: -{formatCurrency(order.discountAmount)}
                      </div>
                    )}
                    <div className="text-lg font-semibold">
                      Total: {formatCurrency(order.finalAmount)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetails(order.orderId)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : "You haven't made any purchases yet."}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => router.push('/marketplace')}
              className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Marketplace
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}