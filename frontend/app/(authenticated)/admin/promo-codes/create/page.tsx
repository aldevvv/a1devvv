'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, AlertCircle, Percent, DollarSign, Calendar, Tag, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
}

export default function CreatePromoCodePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    kind: 'PERCENT',
    value: 0,
    startAt: '',
    endAt: '',
    minSubtotalIDR: 0,
    maxDiscountIDR: 0,
    usageLimit: 0,
    perUserLimit: 1,
    appliesTo: 'ORDER',
    isActive: true,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  // Fetch categories and products
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/products`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Promo code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Promo code must contain only uppercase letters and numbers';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    if (formData.kind === 'PERCENT' && formData.value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (formData.startAt && formData.endAt && new Date(formData.startAt) >= new Date(formData.endAt)) {
      newErrors.endAt = 'End date must be after start date';
    }

    if (formData.appliesTo === 'CATEGORY' && selectedCategories.length === 0) {
      newErrors.categories = 'Select at least one category';
    }

    if (formData.appliesTo === 'PRODUCT' && selectedProducts.length === 0) {
      newErrors.products = 'Select at least one product';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minSubtotalIDR: formData.minSubtotalIDR || null,
        maxDiscountIDR: formData.maxDiscountIDR || null,
        usageLimit: formData.usageLimit || null,
        perUserLimit: formData.perUserLimit || null,
        startAt: formData.startAt || null,
        endAt: formData.endAt || null,
        categoryIds: formData.appliesTo === 'CATEGORY' ? selectedCategories : [],
        productIds: formData.appliesTo === 'PRODUCT' ? selectedProducts : [],
      };

      const response = await fetch(`${API_BASE}/admin/promos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Promo code created successfully!');
        router.push('/admin/promo-codes');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Failed to create promo code:', error);
      toast.error('Failed to create promo code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Create Promo Code</h1>
          <p className="text-muted-foreground mt-1">
            Create a new discount code for your products
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo Code */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Promo Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER50"
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  errors.code
                    ? 'border-red-500 focus:border-red-500'
                    : theme === 'dark'
                      ? 'bg-background border-border focus:border-primary'
                      : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isActive}
                    onChange={() => setFormData({ ...formData, isActive: true })}
                    className="mr-2"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isActive}
                    onChange={() => setFormData({ ...formData, isActive: false })}
                    className="mr-2"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Discount Configuration */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Discount Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: 'PERCENT' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    formData.kind === 'PERCENT'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : theme === 'dark'
                        ? 'bg-background border-border hover:bg-muted'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Percent className="h-4 w-4 inline mr-2" />
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: 'FIXED' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    formData.kind === 'FIXED'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : theme === 'dark'
                        ? 'bg-background border-border hover:bg-muted'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Fixed Amount
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.kind === 'PERCENT' ? 'Percentage' : 'Amount'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                  min="0"
                  max={formData.kind === 'PERCENT' ? 100 : undefined}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    errors.value
                      ? 'border-red-500 focus:border-red-500'
                      : theme === 'dark'
                        ? 'bg-background border-border focus:border-primary'
                        : 'bg-white border-gray-300 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {formData.kind === 'PERCENT' ? '%' : 'IDR'}
                </span>
              </div>
              {errors.value && (
                <p className="text-red-500 text-sm mt-1">{errors.value}</p>
              )}
            </div>

            {/* Minimum Subtotal */}
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Order Amount</label>
              <input
                type="number"
                value={formData.minSubtotalIDR}
                onChange={(e) => setFormData({ ...formData, minSubtotalIDR: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="0 (no minimum)"
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-background border-border focus:border-primary'
                    : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave 0 for no minimum</p>
            </div>

            {/* Maximum Discount */}
            {formData.kind === 'PERCENT' && (
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Discount Amount</label>
                <input
                  type="number"
                  value={formData.maxDiscountIDR}
                  onChange={(e) => setFormData({ ...formData, maxDiscountIDR: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="0 (no maximum)"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-background border-border focus:border-primary'
                      : 'bg-white border-gray-300 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave 0 for no maximum</p>
              </div>
            )}
          </div>
        </div>

        {/* Validity Period */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Validity Period</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-background border-border focus:border-primary'
                    : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to start immediately</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  errors.endAt
                    ? 'border-red-500 focus:border-red-500'
                    : theme === 'dark'
                      ? 'bg-background border-border focus:border-primary'
                      : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              {errors.endAt && (
                <p className="text-red-500 text-sm mt-1">{errors.endAt}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiration</p>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Usage Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Total Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="0 (unlimited)"
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-background border-border focus:border-primary'
                    : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum total uses of this code</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Per User Limit</label>
              <input
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="1"
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-background border-border focus:border-primary'
                    : 'bg-white border-gray-300 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              />
              <p className="text-xs text-muted-foreground mt-1">How many times each user can use this code</p>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Applies To</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, appliesTo: 'ORDER' })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  formData.appliesTo === 'ORDER'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : theme === 'dark'
                      ? 'bg-background border-border hover:bg-muted'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Products
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, appliesTo: 'CATEGORY' })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  formData.appliesTo === 'CATEGORY'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : theme === 'dark'
                      ? 'bg-background border-border hover:bg-muted'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Tag className="h-4 w-4 inline mr-2" />
                Specific Categories
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, appliesTo: 'PRODUCT' })}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  formData.appliesTo === 'PRODUCT'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : theme === 'dark'
                      ? 'bg-background border-border hover:bg-muted'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Package className="h-4 w-4 inline mr-2" />
                Specific Products
              </button>
            </div>

            {/* Category Selection */}
            {formData.appliesTo === 'CATEGORY' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Categories <span className="text-red-500">*</span>
                </label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-muted-foreground text-sm">No categories available</p>
                  )}
                </div>
                {errors.categories && (
                  <p className="text-red-500 text-sm mt-1">{errors.categories}</p>
                )}
              </div>
            )}

            {/* Product Selection */}
            {formData.appliesTo === 'PRODUCT' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Products <span className="text-red-500">*</span>
                </label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span>{product.title}</span>
                    </label>
                  ))}
                  {products.length === 0 && (
                    <p className="text-muted-foreground text-sm">No products available</p>
                  )}
                </div>
                {errors.products && (
                  <p className="text-red-500 text-sm mt-1">{errors.products}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className={`px-6 py-2 rounded-lg border font-medium transition-colors ${
              theme === 'dark'
                ? 'border-border hover:bg-muted'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Promo Code'}
          </button>
        </div>
      </form>
    </div>
  );
}
