'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, Edit, Trash2, Shield, Eye, DollarSign, AlertCircle, TrendingUp, ShoppingBag, Zap, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProducts, useDeleteProduct } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';


export default function AdminProductsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // API hooks
  const { data: apiProducts, loading, error, refetch } = useProducts({
    category: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchTerm
  });
  const deleteProductMutation = useDeleteProduct(() => {
    toast.success('Product deleted successfully!');
    refetch();
  });
  
  // Use only API data from backend
  const products = Array.isArray(apiProducts) ? apiProducts : [];

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredProducts = products.filter(product => {
    // Skip products with missing essential data
    if (!product || !product.title) return false;
    
    const matchesSearch = (product.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (product.status || '').toLowerCase() === filterStatus.toLowerCase();
    const matchesType = filterType === 'all' || (product.type || '').toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const handleStatusChange = async (productId: string | number, newStatus: 'PUBLISHED' | 'DRAFT') => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/products/${productId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success(`Product status updated to ${newStatus.toLowerCase()}`);
        refetch();
      } else {
        throw new Error('Failed to update product status');
      }
    } catch (error: any) {
      console.error('Status change error:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        // Convert to string for API call
        const id = productId.toString();
        await deleteProductMutation.mutate(id);
        // Refresh data after successful deletion
        refetch();
      } catch (error: any) {
        console.error('Delete product error:', error);
        // Show user-friendly error message
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          toast.error('Product not found or already deleted');
        } else {
          toast.error('Failed to delete product. Please try again.');
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
      case 'DRAFT':
        return theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      default:
        return theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DIGITAL':
        return theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800';
      case 'SERVICE':
        return theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800';
      default:
        return theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getProductKindColor = (productKind: string) => {
    switch (productKind) {
      case 'KEYS':
        return theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800';
      case 'SOURCE_CODE':
        return theme === 'dark' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-800';
      case 'ACCESS_LINK':
        return theme === 'dark' ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-800';
      case 'DIGITAL_ACCOUNT':
        return theme === 'dark' ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-100 text-pink-800';
      default:
        return theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableStock = (product: any) => {
    if (!product.deliveryCfg) return 'N/A';
    
    const { stockType, productKind, deliveryCfg } = product;
    
    if (stockType === 'UNLIMITED') {
      return '∞';
    }
    
    // For stock-based products, check the delivery configuration
    if (deliveryCfg) {
      switch (productKind) {
        case 'KEYS':
          return deliveryCfg.keys?.length || 0;
        case 'ACCESS_LINK':
          return deliveryCfg.accessLinks?.length || 0;
        case 'DIGITAL_ACCOUNT':
          return deliveryCfg.digitalAccounts?.length || 0;
        case 'SOURCE_CODE':
          return deliveryCfg.sourceFile ? 1 : 0;
        default:
          return 0;
      }
    }
    
    return 0;
  };

  const getSalePrice = (product: any) => {
    if (product.salePriceIDR && product.salePriceIDR > 0) {
      return product.salePriceIDR;
    }
    if (product.salePercent && product.salePercent > 0) {
      return Math.round(product.priceIDR * (1 - product.salePercent / 100));
    }
    return null;
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Products</h3>
          <p className="text-muted-foreground">Please wait while we fetch your products...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Products</h3>
          <p className="text-muted-foreground mb-4">{error || 'Failed to load products from server'}</p>
          <button
            onClick={() => refetch()}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            Try Again
          </button>
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
              <ShoppingBag className={`h-5 w-5 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Product Command Center</h1>
              <p className="text-xs text-muted-foreground">
                Total control over your product ecosystem
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/admin/products/create')}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-neon-blue text-black hover:bg-neon-blue/90 shadow-lg shadow-neon-blue/25'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              }`}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Product
            </button>
          </div>
        </div>
      </div>

      {/* Compact Stats Grid with futuristic design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20'
            : 'bg-card/90 border-blue-200 hover:border-blue-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Products</p>
              <p className="text-lg font-bold">{products.length}</p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className={`h-1 rounded-full mt-2 ${theme === 'dark' ? 'bg-blue-500/30' : 'bg-blue-200'}`}>
            <div className="h-1 bg-blue-500 rounded-full w-full animate-pulse"></div>
          </div>
        </div>

        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-green-500/20 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/20'
            : 'bg-card/90 border-green-200 hover:border-green-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Published</p>
              <p className="text-lg font-bold text-green-600">{products.filter(p => p.status === 'PUBLISHED').length}</p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <Zap className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className={`h-1 rounded-full mt-2 ${theme === 'dark' ? 'bg-green-500/30' : 'bg-green-200'}`}>
            <div 
              className="h-1 bg-green-500 rounded-full animate-pulse"
              style={{ width: `${products.length > 0 ? (products.filter(p => p.status === 'PUBLISHED').length / products.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/20'
            : 'bg-card/90 border-yellow-200 hover:border-yellow-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Draft</p>
              <p className="text-lg font-bold text-yellow-600">{products.filter(p => p.status === 'DRAFT').length}</p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
              <Edit className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <div className={`h-1 rounded-full mt-2 ${theme === 'dark' ? 'bg-yellow-500/30' : 'bg-yellow-200'}`}>
            <div 
              className="h-1 bg-yellow-500 rounded-full animate-pulse"
              style={{ width: `${products.length > 0 ? (products.filter(p => p.status === 'DRAFT').length / products.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className={`group p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
          theme === 'dark'
            ? 'bg-black border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20'
            : 'bg-card/90 border-purple-200 hover:border-purple-300 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Avg Price</p>
              <p className="text-sm font-bold text-purple-600">
                {formatCurrency(products.length > 0 ? products.reduce((sum, p) => sum + (getSalePrice(p) || p.priceIDR), 0) / products.length : 0)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>Analytics</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid - More compact */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column - Takes 2/3 width */}
        <div className="xl:col-span-2 space-y-4">
          {/* Products Table - Compact */}
          <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black border-border/50 hover:shadow-lg'
              : 'bg-card/90 border-gray-200 hover:shadow-lg'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold flex items-center">
                <div className={`p-1 rounded ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'} mr-2`}>
                  <Package className={`h-3 w-3 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
                </div>
                Products Overview
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 ${
                    theme === 'dark' ? 'text-neon-blue/70' : 'text-primary/70'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    }`}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                    theme === 'dark'
                      ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                      : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                    theme === 'dark'
                      ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                      : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="space-y-2">
                {filteredProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                      theme === 'dark' ? 'border-border/50 hover:border-neon-blue/30' : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {(product.title || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{product.title || 'Unnamed Product'}</p>
                            <p className="text-xs text-muted-foreground">{product.category?.name || 'No Category'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-right flex-shrink-0 ml-2">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(getSalePrice(product) || product.priceIDR)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            getStatusColor(product.status)
                          }`}>
                            {product.status}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          className={`p-1.5 rounded-md transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-card/80 text-muted-foreground hover:text-neon-blue' 
                              : 'hover:bg-gray-100 text-gray-500 hover:text-primary'
                          }`}
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        theme === 'dark' 
                          ? 'text-neon-blue hover:bg-neon-blue/10' 
                          : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      View {filteredProducts.length - 5} more products →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`inline-flex p-3 rounded-full mb-3 ${
                  theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'
                }`}>
                  <Package className={`h-6 w-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
                </div>
                <p className="text-sm text-muted-foreground">No products found</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Product Activity */}
        <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-black border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10'
            : 'bg-card/90 border-blue-200 hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center">
              <div className={`p-1 rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} mr-2`}>
                <TrendingUp className="h-3 w-3 text-blue-500" />
              </div>
              Recent Activity
            </h3>
          </div>
          
          <div className="space-y-2">
            {products.slice(0, 6).map((product, index) => (
              <div
                key={product.id}
                className={`p-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                  theme === 'dark' ? 'border-border/50 hover:border-blue-500/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {product.title || 'Unnamed Product'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDate(product.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-medium">
                      {formatCurrency(getSalePrice(product) || product.priceIDR)}
                    </p>
                    <p className={`text-xs ${
                      product.status === 'PUBLISHED' ? 'text-green-500' :
                      product.status === 'DRAFT' ? 'text-yellow-500' : 'text-gray-500'
                    }`}>
                      {product.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="text-center py-8">
                <div className={`inline-flex p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} mb-2`}>
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Table Section */}
      <div className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-card/50 border-border/50' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product Kind
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredProducts.map((product, index) => {
                const salePrice = getSalePrice(product);
                const availableStock = getAvailableStock(product);
                
                return (
                  <tr
                    key={product.id}
                    className={`group transition-all duration-200 hover:scale-[1.01] ${
                      theme === 'dark' 
                        ? 'hover:bg-card/80 hover:shadow-lg hover:shadow-neon-blue/5' 
                        : 'hover:bg-gray-50/80 hover:shadow-md'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-md ${
                          theme === 'dark' 
                            ? 'bg-gradient-to-br from-neon-blue/20 to-blue-600/20 text-neon-blue border border-neon-blue/30'
                            : 'bg-gradient-to-br from-primary/20 to-blue-600/20 text-primary border border-primary/30'
                        }`}>
                          {(product.title || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{product.title || 'Unnamed Product'}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        theme === 'dark' ? 'bg-card/50 text-muted-foreground' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.category?.name || 'No Category'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {salePrice ? (
                          <>
                            <div className={`text-sm font-bold ${
                              theme === 'dark' ? 'text-neon-blue' : 'text-primary'
                            }`}>
                              {formatCurrency(salePrice)}
                            </div>
                            <div className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.priceIDR)}
                            </div>
                            <div className="text-xs text-red-500 font-medium">
                              {product.salePercent ? `${product.salePercent}%` : Math.round(((product.priceIDR - salePrice) / product.priceIDR) * 100) + '%'} OFF
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium">
                            {formatCurrency(product.priceIDR)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        getTypeColor(product.type)
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        getProductKindColor(product.productKind)
                      }`}>
                        {product.productKind?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        getStatusColor(product.status)
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">
                          {availableStock}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {availableStock === '∞' ? 'unlimited' : typeof availableStock === 'number' ? 'units' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          className={`p-1.5 rounded border transition-all duration-200 hover:scale-110 ${
                            theme === 'dark'
                              ? 'border-border/50 hover:border-neon-blue/50 hover:bg-neon-blue/10 text-muted-foreground hover:text-neon-blue'
                              : 'border-gray-300 hover:border-primary/50 hover:bg-primary/10 text-gray-600 hover:text-primary'
                          }`}
                          title="Edit Product"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        
                        <select
                          value={product.status}
                          onChange={(e) => handleStatusChange(product.id, e.target.value as 'PUBLISHED' | 'DRAFT')}
                          className={`text-xs px-2 py-1 rounded border transition-all duration-200 focus:outline-none focus:ring-2 min-w-[80px] ${
                            theme === 'dark'
                              ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                              : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                          }`}
                        >
                          <option value="PUBLISHED">Published</option>
                          <option value="DRAFT">Draft</option>
                        </select>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className={`p-1.5 rounded border transition-all duration-200 hover:scale-110 ${
                            theme === 'dark'
                              ? 'border-border/50 hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-400'
                              : 'border-gray-300 hover:border-red-500/50 hover:bg-red-500/10 text-gray-600 hover:text-red-500'
                          }`}
                          title="Delete Product"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-3xl ${
                theme === 'dark' ? 'bg-gradient-to-r from-neon-blue/10 to-purple-500/10' : 'bg-gradient-to-r from-primary/10 to-purple-500/10'
              }`}></div>
              <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 ${
                theme === 'dark' ? 'bg-gradient-to-br from-neon-blue/20 to-purple-500/20' : 'bg-gradient-to-br from-primary/20 to-purple-500/20'
              }`}>
                <Package className={`h-12 w-12 ${
                  theme === 'dark' ? 'text-neon-blue' : 'text-primary'
                }`} />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">No Products Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                : 'Get started by creating your first product to begin building your catalog.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
              <button
                onClick={() => router.push('/admin/products/create')}
                className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-neon-blue to-neon-blue/80 text-black hover:from-neon-blue/90 hover:to-neon-blue/70'
                    : 'bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Product
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}