'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Package, ArrowLeft, Shield, Loader2, Edit, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormData {
  title: string;
  thumbnailUrl: string;
  categoryId: string;
  summary: string;
  description: string;
  priceIDR: number;
  status: 'DRAFT' | 'PUBLISHED';
  type: 'DIGITAL' | 'SERVICE';
  fulfillment: 'INSTANT' | 'MANUAL';
  productKind: 'KEYS' | 'SOURCE_CODE' | 'ACCESS_LINK' | 'DIGITAL_ACCOUNT';
  stockType: 'UNLIMITED' | 'STOCK_BASED';
  keys: string[];
  sourceFile: string;
  accessLinks: string[];
  digitalAccounts: string[];
}

const initialFormData: ProductFormData = {
  title: '',
  thumbnailUrl: '',
  categoryId: '',
  summary: '',
  description: '',
  priceIDR: 0,
  status: 'DRAFT',
  type: 'DIGITAL',
  fulfillment: 'INSTANT',
  productKind: 'KEYS',
  stockType: 'STOCK_BASED',
  keys: [],
  sourceFile: '',
  accessLinks: [],
  digitalAccounts: [],
};

export default function EditProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [productNotFound, setProductNotFound] = useState(false);
  const [newItem, setNewItem] = useState('');

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setProductLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/products/${productId}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setProductNotFound(true);
            return;
          }
          throw new Error('Failed to fetch product');
        }

        const product = await response.json();
        const deliveryCfg = product.deliveryCfg || {};
        
        setFormData({
          title: product.title || '',
          thumbnailUrl: product.thumbnailUrl || '',
          categoryId: product.categoryId?.toString() || '',
          summary: product.summary || '',
          description: product.description || '',
          priceIDR: product.priceIDR || 0,
          status: product.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          type: product.type || 'DIGITAL',
          fulfillment: product.fulfillment || 'INSTANT',
          productKind: product.productKind || 'KEYS',
          stockType: product.stockType || 'STOCK_BASED',
          keys: deliveryCfg.keys || [],
          sourceFile: deliveryCfg.sourceFile || '',
          accessLinks: deliveryCfg.accessLinks || [],
          digitalAccounts: deliveryCfg.digitalAccounts || [],
        });

      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product data');
        router.push('/admin/products');
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/categories`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const addItem = () => {
    if (!newItem.trim()) return;
    
    const field = formData.productKind === 'KEYS' ? 'keys' :
                  formData.productKind === 'ACCESS_LINK' ? 'accessLinks' : 'digitalAccounts';
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof ProductFormData] as string[], newItem.trim()]
    }));
    setNewItem('');
  };

  const removeItem = (index: number) => {
    const field = formData.productKind === 'KEYS' ? 'keys' :
                  formData.productKind === 'ACCESS_LINK' ? 'accessLinks' : 'digitalAccounts';
    
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof ProductFormData] as string[]).filter((_, i) => i !== index)
    }));
  };

  const getCurrentItems = () => {
    return formData.productKind === 'KEYS' ? formData.keys :
           formData.productKind === 'ACCESS_LINK' ? formData.accessLinks : formData.digitalAccounts;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.priceIDR || formData.priceIDR < 1) {
      newErrors.priceIDR = 'Price must be at least 1 IDR';
    }

    if (formData.stockType === 'STOCK_BASED') {
      if (formData.productKind === 'KEYS' && formData.keys.length === 0) {
        newErrors.keys = 'At least one key is required';
      }
      if (formData.productKind === 'ACCESS_LINK' && formData.accessLinks.length === 0) {
        newErrors.accessLinks = 'At least one access link is required';
      }
      if (formData.productKind === 'DIGITAL_ACCOUNT' && formData.digitalAccounts.length === 0) {
        newErrors.digitalAccounts = 'At least one digital account is required';
      }
      if (formData.productKind === 'SOURCE_CODE' && !formData.sourceFile) {
        newErrors.sourceFile = 'Source file URL is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      const deliveryCfg: any = {
        productKind: formData.productKind,
        stockType: formData.stockType,
      };

      switch (formData.productKind) {
        case 'KEYS':
          if (formData.keys.length > 0) {
            deliveryCfg.keys = formData.keys;
          }
          break;
        case 'ACCESS_LINK':
          if (formData.accessLinks.length > 0) {
            deliveryCfg.accessLinks = formData.accessLinks;
          }
          break;
        case 'DIGITAL_ACCOUNT':
          if (formData.digitalAccounts.length > 0) {
            deliveryCfg.digitalAccounts = formData.digitalAccounts;
          }
          break;
        case 'SOURCE_CODE':
          if (formData.sourceFile) {
            deliveryCfg.sourceFile = formData.sourceFile;
          }
          break;
      }

      const submitData = {
        title: formData.title,
        thumbnailUrl: formData.thumbnailUrl,
        priceIDR: formData.priceIDR,
        status: formData.status,
        type: formData.type,
        fulfillment: formData.fulfillment,
        productKind: formData.productKind,
        stockType: formData.stockType,
        deliveryCfg: deliveryCfg,
        categoryId: formData.categoryId || undefined,
        summary: formData.summary || undefined,
        description: formData.description || undefined,
      };

      setIsSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/products/${productId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        toast.success('Product updated successfully!');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
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

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading Product</h3>
          <p className="text-muted-foreground">Please wait while we fetch the product data...</p>
        </div>
      </div>
    );
  }

  if (productNotFound) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
          <p className="text-muted-foreground">The product you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and inventory settings</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">Product Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
                placeholder="Enter product title"
              />
              {errors.title && (
                <div className="flex items-center space-x-2 mt-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{errors.title}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
              >
                <option value="">Select category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price (IDR) *</label>
              <input
                type="number"
                min="1"
                value={formData.priceIDR || ''}
                onChange={(e) => updateField('priceIDR', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
                placeholder="100000"
              />
              {errors.priceIDR && (
                <div className="flex items-center space-x-2 mt-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{errors.priceIDR}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product Kind</label>
              <select
                value={formData.productKind}
                onChange={(e) => updateField('productKind', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
              >
                <option value="KEYS">License Keys</option>
                <option value="ACCESS_LINK">Access Links</option>
                <option value="DIGITAL_ACCOUNT">Digital Accounts</option>
                <option value="SOURCE_CODE">Source Code</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fulfillment Type</label>
              <select
                value={formData.fulfillment}
                onChange={(e) => updateField('fulfillment', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
              >
                <option value="INSTANT">Instant (Automatic Delivery)</option>
                <option value="MANUAL">Manual (Admin Fulfillment)</option>
              </select>
              <p className="mt-1 text-sm text-muted-foreground">
                {formData.fulfillment === 'INSTANT' 
                  ? 'Buyers receive product immediately after payment' 
                  : 'Requires admin to manually fulfill orders'}
              </p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">Summary</label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
                placeholder="Brief product summary"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
                placeholder="Detailed product description"
              />
            </div>
          </div>
        </div>

        {/* Stock Management */}
        {formData.stockType === 'STOCK_BASED' && (
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Stock Management ({getCurrentItems().length} items)
            </h2>
            
            {/* Add new item */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={`Enter ${formData.productKind === 'KEYS' ? 'license key' : 
                            formData.productKind === 'ACCESS_LINK' ? 'access URL' : 'account details'}`}
                className="flex-1 px-4 py-2 rounded-lg border bg-background"
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Current items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getCurrentItems().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="font-mono text-sm">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {getCurrentItems().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Add some {formData.productKind.toLowerCase()} above.
              </div>
            )}

            {errors[formData.productKind.toLowerCase()] && (
              <div className="flex items-center space-x-2 mt-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{errors[formData.productKind.toLowerCase()]}</p>
              </div>
            )}
          </div>
        )}

        {/* Source Code URL for SOURCE_CODE products */}
        {formData.productKind === 'SOURCE_CODE' && (
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Source Code Configuration</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Source File URL</label>
              <input
                type="text"
                value={formData.sourceFile}
                onChange={(e) => updateField('sourceFile', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
                placeholder="Enter download URL or file access link"
              />
              {errors.sourceFile && (
                <div className="flex items-center space-x-2 mt-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{errors.sourceFile}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                This URL will be provided to customers after purchase
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                <span>Update Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}