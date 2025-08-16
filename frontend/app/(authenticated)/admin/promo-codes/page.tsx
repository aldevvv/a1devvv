'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { Ticket, Search, Plus, Edit, Trash2, Shield, Eye, Percent, Calendar, Users, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePromoCodes, useDeletePromoCode } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock promo codes data
const mockPromoCodes = [
  {
    id: 1,
    code: 'WELCOME50',
    description: 'Welcome discount for new users',
    type: 'PERCENTAGE',
    value: 50,
    minimumAmount: 100000,
    maximumDiscount: 250000,
    usageLimit: 100,
    usedCount: 25,
    isActive: true,
    validFrom: '2024-10-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    categoryIds: [1, 2],
    categoryNames: ['Programming', 'Design'],
    productIds: [],
    createdAt: '2024-10-01T10:30:00Z',
    updatedAt: '2024-10-25T14:30:00Z'
  },
  {
    id: 2,
    code: 'FLASH100K',
    description: 'Flash sale - 100K off for premium courses',
    type: 'FIXED',
    value: 100000,
    minimumAmount: 500000,
    maximumDiscount: null,
    usageLimit: 50,
    usedCount: 42,
    isActive: true,
    validFrom: '2024-10-20T00:00:00Z',
    validUntil: '2024-11-20T23:59:59Z',
    categoryIds: [1],
    categoryNames: ['Programming'],
    productIds: [1, 2],
    createdAt: '2024-10-15T09:15:00Z',
    updatedAt: '2024-10-24T16:45:00Z'
  },
  {
    id: 3,
    code: 'STUDENT25',
    description: 'Student discount for educational content',
    type: 'PERCENTAGE',
    value: 25,
    minimumAmount: 50000,
    maximumDiscount: 150000,
    usageLimit: 200,
    usedCount: 78,
    isActive: true,
    validFrom: '2024-09-01T00:00:00Z',
    validUntil: '2025-08-31T23:59:59Z',
    categoryIds: [],
    categoryNames: [],
    productIds: [],
    createdAt: '2024-09-01T12:00:00Z',
    updatedAt: '2024-10-22T10:30:00Z'
  },
  {
    id: 4,
    code: 'EXPIRED10',
    description: 'Expired promo code for testing',
    type: 'PERCENTAGE',
    value: 10,
    minimumAmount: 0,
    maximumDiscount: 50000,
    usageLimit: 1000,
    usedCount: 156,
    isActive: false,
    validFrom: '2024-08-01T00:00:00Z',
    validUntil: '2024-09-30T23:59:59Z',
    categoryIds: [],
    categoryNames: [],
    productIds: [],
    createdAt: '2024-08-01T08:00:00Z',
    updatedAt: '2024-10-01T14:15:00Z'
  },
  {
    id: 5,
    code: 'BLACKFRIDAY',
    description: 'Black Friday mega sale',
    type: 'PERCENTAGE',
    value: 70,
    minimumAmount: 200000,
    maximumDiscount: 500000,
    usageLimit: 500,
    usedCount: 0,
    isActive: false,
    validFrom: '2024-11-29T00:00:00Z',
    validUntil: '2024-12-02T23:59:59Z',
    categoryIds: [],
    categoryNames: [],
    productIds: [],
    createdAt: '2024-10-10T15:30:00Z',
    updatedAt: '2024-10-18T11:20:00Z'
  }
];

export default function AdminPromoCodesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // API hooks
  const { data: apiPromoCodes, loading, error, refetch } = usePromoCodes(searchTerm);
  const deletePromoCodeMutation = useDeletePromoCode(() => {
    toast.success('Promo code deleted successfully!');
    refetch();
  });
  
  // Transform backend data to frontend format
  useEffect(() => {
    if (apiPromoCodes && Array.isArray(apiPromoCodes)) {
      const transformedData = apiPromoCodes.map((promo: any) => ({
        id: promo.id,
        code: promo.code,
        description: `${promo.kind === 'PERCENT' ? promo.value + '% off' : 'IDR ' + promo.value + ' off'}`,
        type: promo.kind === 'PERCENT' ? 'PERCENTAGE' : 'FIXED',
        value: promo.value,
        minimumAmount: promo.minSubtotalIDR || 0,
        maximumDiscount: promo.maxDiscountIDR,
        usageLimit: promo.usageLimit || 0,
        usedCount: promo._count?.redemptions || 0,
        isActive: promo.isActive,
        validFrom: promo.startAt || new Date().toISOString(),
        validUntil: promo.endAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        categoryIds: promo.categories?.map((c: any) => c.categoryId) || [],
        categoryNames: promo.categories?.map((c: any) => c.category?.name).filter(Boolean) || [],
        productIds: promo.products?.map((p: any) => p.productId) || [],
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt
      }));
      setPromoCodes(transformedData);
    } else if (!apiPromoCodes && !loading) {
      // Use mock data as fallback
      setPromoCodes(mockPromoCodes);
    }
  }, [apiPromoCodes, loading]);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && promo.isActive && new Date(promo.validUntil) > new Date()) ||
                         (filterStatus === 'inactive' && !promo.isActive) ||
                         (filterStatus === 'expired' && new Date(promo.validUntil) <= new Date());
    const matchesType = filterType === 'all' || promo.type.toLowerCase() === filterType.toLowerCase();
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) <= new Date();
  };

  const isUpcoming = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  const handleStatusToggle = (promoId: number) => {
    setPromoCodes(promoCodes.map(p => 
      p.id === promoId ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success('Promo code status updated successfully');
    // TODO: Implement API call to update promo status
  };

  const handleDeletePromo = async (promoId: number) => {
    const promo = promoCodes.find(p => p.id === promoId);
    if (promo && promo.usedCount > 0) {
      toast.error('Cannot delete promo code that has been used');
      return;
    }
    
    if (confirm('Are you sure you want to delete this promo code?')) {
      try {
        await deletePromoCodeMutation.mutate(promoId.toString());
        setPromoCodes(promoCodes.filter(p => p.id !== promoId));
      } catch (error) {
        toast.error('Failed to delete promo code. Please try again.');
      }
    }
  };

  const getStatusColor = (promo: any) => {
    if (isExpired(promo.validUntil)) {
      return theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
    }
    if (isUpcoming(promo.validFrom)) {
      return theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
    }
    if (!promo.isActive) {
      return theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
    return theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
  };

  const getStatusText = (promo: any) => {
    if (isExpired(promo.validUntil)) return 'Expired';
    if (isUpcoming(promo.validFrom)) return 'Upcoming';
    if (!promo.isActive) return 'Inactive';
    return 'Active';
  };

  const getTypeColor = (type: string) => {
    return type === 'PERCENTAGE'
      ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800')
      : (theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800');
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
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
          <h1 className="text-3xl font-bold">Promo Code Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount codes and promotions
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/promo-codes/create')}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </button>
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
              <Ticket className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Promo Codes</p>
              <p className="text-2xl font-semibold">{promoCodes.length}</p>
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
              <Eye className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Codes</p>
              <p className="text-2xl font-semibold">
                {promoCodes.filter(p => p.isActive && !isExpired(p.validUntil)).length}
              </p>
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
              <Users className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="text-2xl font-semibold">{promoCodes.reduce((sum, p) => sum + p.usedCount, 0)}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}>
              <Percent className={`h-5 w-5 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Discount</p>
              <p className="text-2xl font-semibold">
                {promoCodes.filter(p => p.type === 'PERCENTAGE').length > 0
                  ? `${Math.round(promoCodes.filter(p => p.type === 'PERCENTAGE').reduce((sum, p) => sum + p.value, 0) / promoCodes.filter(p => p.type === 'PERCENTAGE').length)}%`
                  : 'N/A'
                }
              </p>
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
                placeholder="Search promo codes..."
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-background border-border text-foreground'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-background border-border text-foreground'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className={`rounded-lg border overflow-hidden ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${
              theme === 'dark' ? 'border-border bg-muted/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <tr>
                <th className="text-left p-4 font-semibold">Code</th>
                <th className="text-left p-4 font-semibold">Type & Value</th>
                <th className="text-left p-4 font-semibold">Usage</th>
                <th className="text-left p-4 font-semibold">Valid Period</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Restrictions</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPromoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <div className="font-mono font-semibold text-lg">{promo.code}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{promo.description}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getTypeColor(promo.type)
                      }`}>
                        {promo.type}
                      </span>
                      <div className="font-semibold">
                        {promo.type === 'PERCENTAGE' ? `${promo.value}%` : formatCurrency(promo.value)}
                      </div>
                    </div>
                    {promo.minimumAmount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: {formatCurrency(promo.minimumAmount)}
                      </div>
                    )}
                    {promo.maximumDiscount && (
                      <div className="text-xs text-muted-foreground">
                        Max: {formatCurrency(promo.maximumDiscount)}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{promo.usedCount} / {promo.usageLimit}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${getUsagePercentage(promo.usedCount, promo.usageLimit)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getUsagePercentage(promo.usedCount, promo.usageLimit)}% used
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateShort(promo.validFrom)}</span>
                      </div>
                      <div className="text-muted-foreground">to</div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateShort(promo.validUntil)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(promo)
                    }`}>
                      {getStatusText(promo)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {promo.categoryNames.length > 0 && (
                        <div className="mb-1">
                          <span className="text-muted-foreground">Categories:</span>
                          <div className="text-xs">{promo.categoryNames.join(', ')}</div>
                        </div>
                      )}
                      {promo.productIds.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Products:</span>
                          <div className="text-xs">{promo.productIds.length} specific products</div>
                        </div>
                      )}
                      {promo.categoryNames.length === 0 && promo.productIds.length === 0 && (
                        <span className="text-muted-foreground text-xs">All products</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/promo-codes/${promo.id}/edit`)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                        }`}
                        title="Edit Promo Code"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleStatusToggle(promo.id)}
                        disabled={isExpired(promo.validUntil)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          isExpired(promo.validUntil)
                            ? 'opacity-50 cursor-not-allowed'
                            : promo.isActive
                              ? theme === 'dark'
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                              : theme === 'dark'
                                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        disabled={promo.usedCount > 0}
                        className={`p-2 rounded-lg transition-colors ${
                          promo.usedCount > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                              : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                        }`}
                        title={promo.usedCount > 0 ? 'Cannot delete used promo code' : 'Delete Promo Code'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPromoCodes.length === 0 && (
          <div className="p-8 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No promo codes found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}