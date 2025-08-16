'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { FolderOpen, Search, Plus, Edit, Trash2, Shield, Eye, Hash, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCategories, useDeleteCategory } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// Mock categories data
const mockCategories = [
  {
    id: 1,
    name: 'Programming',
    slug: 'programming',
    description: 'Programming courses and tutorials for all skill levels',
    icon: '💻',
    isActive: true,
    productCount: 15,
    createdAt: '2024-10-15T10:30:00Z',
    updatedAt: '2024-10-25T14:30:00Z'
  },
  {
    id: 2,
    name: 'Design',
    slug: 'design',
    description: 'UI/UX design courses and creative workshops',
    icon: '🎨',
    isActive: true,
    productCount: 8,
    createdAt: '2024-10-12T09:15:00Z',
    updatedAt: '2024-10-24T16:45:00Z'
  },
  {
    id: 3,
    name: 'Marketing',
    slug: 'marketing',
    description: 'Digital marketing strategies and social media courses',
    icon: '📈',
    isActive: true,
    productCount: 12,
    createdAt: '2024-10-10T12:00:00Z',
    updatedAt: '2024-10-22T10:30:00Z'
  },
  {
    id: 4,
    name: 'Business',
    slug: 'business',
    description: 'Entrepreneurship and business development courses',
    icon: '💼',
    isActive: false,
    productCount: 5,
    createdAt: '2024-10-08T08:00:00Z',
    updatedAt: '2024-10-20T14:15:00Z'
  },
  {
    id: 5,
    name: 'Photography',
    slug: 'photography',
    description: 'Photography techniques and editing tutorials',
    icon: '📸',
    isActive: true,
    productCount: 7,
    createdAt: '2024-10-05T15:30:00Z',
    updatedAt: '2024-10-18T11:20:00Z'
  },
  {
    id: 6,
    name: 'Music',
    slug: 'music',
    description: 'Music production and instrument learning courses',
    icon: '🎵',
    isActive: false,
    productCount: 3,
    createdAt: '2024-10-03T13:45:00Z',
    updatedAt: '2024-10-16T09:10:00Z'
  }
];

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // API hooks
  const { data: apiCategories = [], loading, error, refetch } = useCategories(searchTerm);
  const deleteCategoryMutation = useDeleteCategory(() => {
    toast.success('Category deleted successfully!');
    refetch();
  });
  
  // Transform API data to match UI expectations
  const categories: Category[] = Array.isArray(apiCategories)
    ? (apiCategories as any[]).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || '📁',
        isActive: true, // Categories don't have isActive in backend, assume all active
        productCount: cat._count?.products || 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }))
    : [];

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredCategories: Category[] = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && category.isActive) ||
                         (filterStatus === 'inactive' && !category.isActive);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    if (category && category.productCount > 0) {
      toast.error('Cannot delete category with existing products');
      return;
    }
    
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategoryMutation.mutate(categoryId);
        refetch(); // Refresh the list after deletion
      } catch (error) {
        toast.error('Failed to delete category. Please try again.');
      }
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? (theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
      : (theme === 'dark' ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-800');
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
        {/* Backend Status Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Backend API endpoints are partially implemented. Some features may use mock data.
          </AlertDescription>
        </Alert>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage product categories
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/categories/create')}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
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
              <FolderOpen className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-semibold">{categories.length}</p>
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
              <p className="text-sm text-muted-foreground">Active Categories</p>
              <p className="text-2xl font-semibold">{categories.filter((c: Category) => c.isActive).length}</p>
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
              <Hash className={`h-5 w-5 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-semibold">{categories.reduce((sum: number, c: Category) => sum + c.productCount, 0)}</p>
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
              <FolderOpen className={`h-5 w-5 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Products</p>
              <p className="text-2xl font-semibold">
                {Math.round(categories.reduce((sum: number, c: Category) => sum + c.productCount, 0) / categories.length)}
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
                placeholder="Search categories..."
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
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category: Category) => (
          <div key={category.id} className={`p-6 rounded-lg border transition-all hover:shadow-lg ${
            theme === 'dark' ? 'bg-card border-border hover:border-primary/50' : 'bg-white border-gray-200 hover:border-primary/50'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{category.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">/{category.slug}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getStatusColor(category.isActive)
              }`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{category.productCount}</span> products
              </div>
              <div className="text-sm text-muted-foreground">
                Updated {formatDate(category.updatedAt)}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                  }`}
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={category.productCount > 0}
                  className={`p-2 rounded-lg transition-colors ${
                    category.productCount > 0
                      ? 'opacity-50 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                        : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                  }`}
                  title={category.productCount > 0 ? 'Cannot delete category with products' : 'Delete Category'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCategories.length === 0 && (
        <div className={`p-8 text-center rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No categories found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}