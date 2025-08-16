'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, ArrowLeft, Upload, Shield, Plus, Trash2,
  AlertCircle, CheckCircle, Key, FileText, Link, Settings, Zap, Clock, Box
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ProductFormData {
  title: string;
  thumbnailFile: File | null;
  categoryId: string;
  summary: string;
  description: string;
  priceIDR: number;
  status: 'DRAFT' | 'PUBLISHED';
  type: 'DIGITAL' | 'SERVICE';
  fulfillment: 'INSTANT' | 'MANUAL';
  productKind: 'KEYS' | 'SOURCE_CODE' | 'ACCESS_LINK' | 'DIGITAL_ACCOUNT';
  stockType: 'UNLIMITED' | 'STOCK_BASED';
  salePriceIDR: number;
  salePercent: number;
  saleDuration: '1_DAY' | '7_DAYS' | '14_DAYS' | '30_DAYS' | 'NEVER' | '';
  // Delivery configuration items based on productKind
  keys: string[];
  sourceFile: string;
  accessLinks: string[];
  digitalAccounts: string[];
  // UI helpers
  bulkInput: string;
  stockInputMethod: 'SINGLE' | 'BULK';
}

const initialFormData: ProductFormData = {
  title: '',
  thumbnailFile: null,
  categoryId: '',
  summary: '',
  description: '',
  priceIDR: 0,
  status: 'DRAFT',
  type: 'DIGITAL',
  fulfillment: 'INSTANT',
  productKind: 'KEYS',
  stockType: 'STOCK_BASED',
  salePriceIDR: 0,
  salePercent: 0,
  saleDuration: '',
  keys: [],
  sourceFile: '',
  accessLinks: [],
  digitalAccounts: [],
  bulkInput: '',
  stockInputMethod: 'SINGLE',
};

export default function CreateProductPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  // Form state management
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [singleItemInput, setSingleItemInput] = useState('');
  
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  const setFieldError = (field: keyof ProductFormData, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/categories`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
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

  // Add single item to stock
  const addSingleItem = () => {
    if (!singleItemInput.trim()) return;
    
    if (formData.productKind === 'KEYS') {
      setFormData(prev => ({
        ...prev,
        keys: [...prev.keys, singleItemInput.trim()]
      }));
    } else if (formData.productKind === 'ACCESS_LINK') {
      setFormData(prev => ({
        ...prev,
        accessLinks: [...prev.accessLinks, singleItemInput.trim()]
      }));
    } else if (formData.productKind === 'DIGITAL_ACCOUNT') {
      setFormData(prev => ({
        ...prev,
        digitalAccounts: [...prev.digitalAccounts, singleItemInput.trim()]
      }));
    }
    setSingleItemInput('');
  };

  // Remove item from stock
  const removeItem = (index: number, type: 'keys' | 'accessLinks' | 'digitalAccounts') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Process bulk input
  const processBulkInput = () => {
    const items = formData.bulkInput
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    if (formData.productKind === 'KEYS') {
      setFormData(prev => ({
        ...prev,
        keys: [...prev.keys, ...items],
        bulkInput: ''
      }));
    } else if (formData.productKind === 'ACCESS_LINK') {
      setFormData(prev => ({
        ...prev,
        accessLinks: [...prev.accessLinks, ...items],
        bulkInput: ''
      }));
    } else if (formData.productKind === 'DIGITAL_ACCOUNT') {
      setFormData(prev => ({
        ...prev,
        digitalAccounts: [...prev.digitalAccounts, ...items],
        bulkInput: ''
      }));
    }
  };

  // Generate slug from title with random suffix
  const generateSlug = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    return `${baseSlug}-${randomSuffix}`;
  };

  // Get available stock count
  const getAvailableStock = () => {
    if (formData.stockType === 'UNLIMITED') {
      return 999999;
    }
    
    switch (formData.productKind) {
      case 'KEYS':
        return formData.keys.length;
      case 'ACCESS_LINK':
        return formData.accessLinks.length;
      case 'DIGITAL_ACCOUNT':
        return formData.digitalAccounts.length;
      case 'SOURCE_CODE':
        return formData.sourceFile ? 1 : 0;
      default:
        return 0;
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      updateField('thumbnailFile', file);
    }
  };

  // Upload thumbnail to Supabase bucket
  const uploadThumbnail = async (file: File): Promise<string> => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('products-thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        if (error.message.includes('row-level security policy') || error.message.includes('policy')) {
          throw new Error('Storage permission denied. Please configure Supabase RLS policies for the products-thumbnails bucket.');
        }
        throw new Error('Failed to upload thumbnail: ' + error.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products-thumbnails')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload thumbnail error:', error);
      throw error;
    }
  };

  // Calculate sale dates based on duration
  const calculateSaleDates = (duration: string) => {
    const now = new Date();
    const startDate = now.toISOString();
    let endDate = null;

    switch (duration) {
      case '1_DAY':
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7_DAYS':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '14_DAYS':
        endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30_DAYS':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'NEVER':
        endDate = null; // No end date
        break;
      default:
        return { startDate: null, endDate: null };
    }

    return { startDate, endDate };
  };

  // Get sale duration display text
  const getSaleDurationText = (duration: string) => {
    const dates = calculateSaleDates(duration);
    if (!dates.startDate) return '';
    
    const start = new Date(dates.startDate);
    const end = dates.endDate ? new Date(dates.endDate) : null;
    
    if (duration === 'NEVER') {
      return `Starts: ${start.toLocaleDateString()} • Never ends`;
    } else if (end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return '';
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!formData.title.trim()) {
      setFieldError('title', 'Title is required');
      isValid = false;
    }

    if (!formData.thumbnailFile) {
      setFieldError('thumbnailFile', 'Thumbnail image is required');
      isValid = false;
    }

    if (!formData.priceIDR || formData.priceIDR < 1) {
      setFieldError('priceIDR', 'Price must be at least 1 IDR');
      isValid = false;
    }

    // Validate stock based on product kind
    if (formData.stockType === 'STOCK_BASED') {
      if (formData.productKind === 'KEYS' && formData.keys.length === 0) {
        setFieldError('keys', 'At least one key is required for stock-based key products');
        isValid = false;
      }
      if (formData.productKind === 'ACCESS_LINK' && formData.accessLinks.length === 0) {
        setFieldError('accessLinks', 'At least one access link is required for stock-based link products');
        isValid = false;
      }
      if (formData.productKind === 'DIGITAL_ACCOUNT' && formData.digitalAccounts.length === 0) {
        setFieldError('digitalAccounts', 'At least one digital account is required for stock-based account products');
        isValid = false;
      }
      if (formData.productKind === 'SOURCE_CODE' && !formData.sourceFile) {
        setFieldError('sourceFile', 'Source file URL is required for source code products');
        isValid = false;
      }
    }

    // Validate sale pricing
    if (formData.salePriceIDR && formData.salePercent) {
      setFieldError('salePriceIDR', 'Cannot set both sale price and sale percentage');
      setFieldError('salePercent', 'Cannot set both sale price and sale percentage');
      isValid = false;
    }

    if (formData.salePriceIDR && formData.salePriceIDR >= formData.priceIDR) {
      setFieldError('salePriceIDR', 'Sale price must be less than original price');
      isValid = false;
    }

    if (formData.salePercent && (formData.salePercent < 1 || formData.salePercent > 90)) {
      setFieldError('salePercent', 'Sale percentage must be between 1 and 90');
      isValid = false;
    }

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      // Upload thumbnail first
      let thumbnailUrl = '';
      if (formData.thumbnailFile) {
        toast.loading('Uploading thumbnail...');
        try {
          thumbnailUrl = await uploadThumbnail(formData.thumbnailFile);
          toast.dismiss();
        } catch (uploadError: any) {
          toast.dismiss();
          console.error('Thumbnail upload failed:', uploadError);
          
          if (uploadError.message?.includes('Storage permission denied') || uploadError.message?.includes('policy')) {
            toast.error('Upload failed: Storage permissions not configured. Creating product without thumbnail...');
          } else {
            toast.error('Thumbnail upload failed: ' + uploadError.message);
            return;
          }
        }
      }

      // Generate slug
      const slug = generateSlug(formData.title);

      // Build delivery configuration based on product kind
      const deliveryCfg: any = {
        productKind: formData.productKind,
        stockType: formData.stockType,
      };

      // Add product-specific data
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

      const submitData: any = {
        title: formData.title,
        slug: slug,
        thumbnailUrl: thumbnailUrl,
        priceIDR: formData.priceIDR,
        status: formData.status,
        type: formData.type,
        fulfillment: formData.fulfillment,
        productKind: formData.productKind,
        stockType: formData.stockType,
        deliveryCfg: deliveryCfg,
      };

      // Add optional fields
      if (formData.categoryId) submitData.categoryId = formData.categoryId;
      if (formData.summary) submitData.summary = formData.summary;
      if (formData.description) submitData.description = formData.description;
      
      // Handle sale/promo fields
      if (formData.salePriceIDR) submitData.salePriceIDR = formData.salePriceIDR;
      if (formData.salePercent) submitData.salePercent = formData.salePercent;
      
      // Calculate and add sale dates based on duration
      if (formData.saleDuration && (formData.salePriceIDR || formData.salePercent)) {
        const { startDate, endDate } = calculateSaleDates(formData.saleDuration);
        if (startDate) submitData.saleStartAt = startDate;
        if (endDate) submitData.saleEndAt = endDate;
      }

      // Submit product creation request
      setIsSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/products`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        toast.success('Product created successfully!');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product: ' + (error.message || 'Unknown error'));
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

  const availableStock = getAvailableStock();

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
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
              <Package className={`h-5 w-5 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Create New Product</h1>
              <p className="text-xs text-muted-foreground">
                Build your next product offering with advanced configuration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Configuration Status */}
      <div className={`p-3 rounded-xl border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}>
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold">
              {formData.productKind.replace('_', ' ')} • {formData.stockType === 'UNLIMITED' ? 'Unlimited Stock' : 'Stock-Based'}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.stockType === 'UNLIMITED'
                ? 'Unlimited deliveries available'
                : `${availableStock.toLocaleString()} items configured`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - More compact */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form sections grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left Column - Form */}
            <div className="xl:col-span-2 space-y-4">
            {/* Basic Information */}
            <div className={`p-4 rounded-xl border backdrop-blur-sm ${
              theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-1 rounded ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
                  <Package className={`h-3 w-3 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
                </div>
                <h3 className="text-sm font-semibold">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium mb-2">Product Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter a compelling product title"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    } ${
                      errors.title ? 'border-red-500/50 focus:ring-red-500/50' : ''
                    }`}
                  />
                  {errors.title && (
                    <div className="flex items-center space-x-2 mt-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-xs">{errors.title}</p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium mb-2">Thumbnail Image *</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                          theme === 'dark'
                            ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                            : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                        } ${
                          errors.thumbnailFile ? 'border-red-500/50 focus:ring-red-500/50' : ''
                        }`}
                      />
                      {formData.thumbnailFile && (
                        <div className="flex items-center space-x-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs">
                          <Upload className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-700 dark:text-green-400">{formData.thumbnailFile.name}</span>
                        </div>
                      )}
                    </div>
                    {errors.thumbnailFile && (
                      <div className="flex items-center space-x-2 text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <p className="text-xs">{errors.thumbnailFile}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateField('categoryId', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories?.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Price (IDR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.priceIDR > 0 ? formData.priceIDR : ''}
                    onChange={(e) => updateField('priceIDR', parseInt(e.target.value) || 0)}
                    placeholder="100,000"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    } ${
                      errors.priceIDR ? 'border-red-500/50 focus:ring-red-500/50' : ''
                    }`}
                  />
                  {errors.priceIDR && (
                    <div className="flex items-center space-x-2 mt-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-xs">{errors.priceIDR}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                    }`}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                    }`}
                  >
                    <option value="DIGITAL">Digital</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium mb-2">Summary</label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    placeholder="Brief product summary that captures attention"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    }`}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Detailed product description with features and benefits"
                    rows={3}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>

              {/* Product Configuration */}
              <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-1 rounded ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
                    <Settings className={`h-3 w-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <h3 className="text-sm font-semibold">Product Configuration</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Product Kind */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Product Kind</label>
                    <select
                      value={formData.productKind}
                      onChange={(e) => updateField('productKind', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                          : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                      }`}
                    >
                      <option value="KEYS">Keys (API Keys, License Keys)</option>
                      <option value="SOURCE_CODE">Source Code</option>
                      <option value="ACCESS_LINK">Access Links</option>
                      <option value="DIGITAL_ACCOUNT">Digital Accounts</option>
                    </select>
                  </div>
                  
                  {/* Fulfillment Type */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Fulfillment Type</label>
                    <select
                      value={formData.fulfillment}
                      onChange={(e) => updateField('fulfillment', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                          : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                      }`}
                    >
                      <option value="INSTANT">Instant (Automatic Delivery)</option>
                      <option value="MANUAL">Manual (Admin Fulfillment)</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formData.fulfillment === 'INSTANT' 
                        ? 'Buyers receive product immediately after payment' 
                        : 'Requires admin to manually fulfill orders'}
                    </p>
                  </div>

                  {/* Stock Type */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Stock Type</label>
                    <select
                      value={formData.stockType}
                      onChange={(e) => updateField('stockType', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                          : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                      }`}
                    >
                      <option value="STOCK_BASED">Stock-Based</option>
                      <option value="UNLIMITED">Unlimited</option>
                    </select>
                  </div>
                </div>

                {/* Stock Content Configuration */}
                {formData.stockType === 'STOCK_BASED' && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">Stock Items</h4>
                    
                    {/* Keys Configuration */}
                    {formData.productKind === 'KEYS' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={singleItemInput}
                            onChange={(e) => setSingleItemInput(e.target.value)}
                            placeholder="Enter API key, license key, etc."
                            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                              theme === 'dark'
                                ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                                : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={addSingleItem}
                            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                              theme === 'dark'
                                ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                        
                        {formData.keys.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.keys.map((key, index) => (
                              <div key={index} className={`flex items-center justify-between p-2 rounded border ${theme === 'dark' ? 'bg-card/30 border-border/50' : 'bg-gray-50 border-gray-200'}`}>
                                <span className="text-sm font-mono">{key}</span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(index, 'keys')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Access Links Configuration */}
                    {formData.productKind === 'ACCESS_LINK' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={singleItemInput}
                            onChange={(e) => setSingleItemInput(e.target.value)}
                            placeholder="Enter access link, invite URL, etc."
                            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                              theme === 'dark'
                                ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                                : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={addSingleItem}
                            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                              theme === 'dark'
                                ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                        
                        {formData.accessLinks.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.accessLinks.map((link, index) => (
                              <div key={index} className={`flex items-center justify-between p-2 rounded border ${theme === 'dark' ? 'bg-card/30 border-border/50' : 'bg-gray-50 border-gray-200'}`}>
                                <span className="text-sm font-mono truncate">{link}</span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(index, 'accessLinks')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Digital Accounts Configuration */}
                    {formData.productKind === 'DIGITAL_ACCOUNT' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={singleItemInput}
                            onChange={(e) => setSingleItemInput(e.target.value)}
                            placeholder="Enter account credentials, username:password, etc."
                            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                              theme === 'dark'
                                ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                                : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={addSingleItem}
                            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                              theme === 'dark'
                                ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                        
                        {formData.digitalAccounts.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.digitalAccounts.map((account, index) => (
                              <div key={index} className={`flex items-center justify-between p-2 rounded border ${theme === 'dark' ? 'bg-card/30 border-border/50' : 'bg-gray-50 border-gray-200'}`}>
                                <span className="text-sm font-mono">{account}</span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(index, 'digitalAccounts')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Source Code Configuration */}
                    {formData.productKind === 'SOURCE_CODE' && (
                      <div>
                        <label className="block text-xs font-medium mb-2">Source File URL</label>
                        <input
                          type="url"
                          value={formData.sourceFile}
                          onChange={(e) => updateField('sourceFile', e.target.value)}
                          placeholder="https://github.com/user/repo/archive/main.zip"
                          className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                              ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                              : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.stockType === 'UNLIMITED' && (
                  <div className={`mt-4 p-3 rounded-lg border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className={`text-xs ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                        <span className="font-semibold">Unlimited Stock:</span> This product can be delivered unlimited times.
                        Perfect for digital downloads, public access links, or services that don't require unique items per customer.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo/Sale Settings */}
              <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
              }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-1 rounded ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <AlertCircle className={`h-3 w-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h3 className="text-sm font-semibold">Promo Settings (Optional)</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2">Sale Price (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salePriceIDR === 0 ? '' : formData.salePriceIDR}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateField('salePriceIDR', 0);
                      } else {
                        updateField('salePriceIDR', parseInt(value) || 0);
                      }
                    }}
                    placeholder="Leave empty for no sale"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    } ${
                      errors.salePriceIDR ? 'border-red-500/50 focus:ring-red-500/50' : ''
                    }`}
                  />
                  {errors.salePriceIDR && (
                    <div className="flex items-center space-x-2 mt-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-xs">{errors.salePriceIDR}</p>
                    </div>
                  )}
                  {formData.salePriceIDR && formData.priceIDR && (
                    <div className="mt-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs">
                      <p className="text-green-700 dark:text-green-400">
                        {Math.round(((formData.priceIDR - formData.salePriceIDR) / formData.priceIDR) * 100)}% discount
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">Sale Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.salePercent === 0 ? '' : formData.salePercent}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateField('salePercent', 0);
                      } else {
                        updateField('salePercent', parseInt(value) || 0);
                      }
                    }}
                    placeholder="e.g., 25 for 25% off"
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground placeholder-muted-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground placeholder-gray-500'
                    } ${
                      errors.salePercent ? 'border-red-500/50 focus:ring-red-500/50' : ''
                    }`}
                  />
                  {errors.salePercent && (
                    <div className="flex items-center space-x-2 mt-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-xs">{errors.salePercent}</p>
                    </div>
                  )}
                  {formData.salePercent && formData.priceIDR && (
                    <div className="mt-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs">
                      <p className="text-green-700 dark:text-green-400">
                        Sale price: Rp {Math.round(formData.priceIDR * (1 - formData.salePercent / 100)).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium mb-2">Sale Duration</label>
                  <select
                    value={formData.saleDuration}
                    onChange={(e) => updateField('saleDuration', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-card/50 border-border/50 focus:border-neon-blue focus:ring-neon-blue/20 text-foreground'
                        : 'bg-background border-gray-300 focus:border-primary focus:ring-primary/20 text-foreground'
                    }`}
                  >
                    <option value="">Select sale duration</option>
                    <option value="1_DAY">1 Day</option>
                    <option value="7_DAYS">7 Days</option>
                    <option value="14_DAYS">14 Days</option>
                    <option value="30_DAYS">30 Days</option>
                    <option value="NEVER">Never End</option>
                  </select>

                  {/* Sale info display */}
                  <div className="mt-2">
                    {formData.saleDuration && (formData.salePriceIDR || formData.salePercent) && (
                      <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                        <p className="text-blue-700 dark:text-blue-400">
                          Sale period: {getSaleDurationText(formData.saleDuration)}
                        </p>
                      </div>
                    )}
                    {formData.saleDuration && (!formData.salePriceIDR && !formData.salePercent) && (
                      <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                        <p className="text-amber-700 dark:text-amber-400">
                          ⚠️ Set a sale price or percentage to activate this duration
                        </p>
                      </div>
                    )}
                    {(!formData.saleDuration) && (formData.salePriceIDR || formData.salePercent) && (
                      <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                        <p className="text-blue-700 dark:text-blue-400">
                          💡 Select a duration to schedule your sale period
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(formData.salePriceIDR || formData.salePercent) && (
                <div className={`mt-3 p-2 rounded border ${
                  theme === 'dark' ? 'bg-green-900/20 border-green-900/50' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-green-900 dark:text-green-300">
                        {formData.saleDuration ? 'Sale Configuration Ready' : 'Sale Price Set'}
                      </p>
                      <p className="text-green-800 dark:text-green-400 mt-0.5">
                        {formData.salePriceIDR > 0 && `Fixed sale price: Rp ${formData.salePriceIDR.toLocaleString('id-ID')}`}
                        {formData.salePercent > 0 && `${formData.salePercent}% discount applied`}
                        {formData.saleDuration ? ` • ${getSaleDurationText(formData.saleDuration)}` : ' • No duration set (sale won\'t activate)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
           </div>

           {/* Right Column - Preview */}
           <div className="xl:col-span-1 flex flex-col space-y-4">
              {/* Product Preview */}
              <div className={`p-4 rounded-xl border backdrop-blur-sm flex flex-col ${
                theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-1 rounded ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Package className={`h-3 w-3 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <h3 className="text-sm font-semibold">Product Preview</h3>
                </div>

                <div className="space-y-3">
                  {/* Thumbnail preview */}
                  <div className={`aspect-video rounded-lg border-2 border-dashed flex items-center justify-center ${
                    theme === 'dark' ? 'border-border/50 bg-card/30' : 'border-gray-300 bg-gray-50'
                  }`}>
                    {formData.thumbnailFile ? (
                      <img
                        src={URL.createObjectURL(formData.thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Package className={`h-8 w-8 mx-auto mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`} />
                        <p className="text-xs text-muted-foreground">Thumbnail preview</p>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="space-y-2">
                    <h4 className={`font-medium text-sm ${
                      formData.title ? '' : 'text-muted-foreground'
                    }`}>
                      {formData.title || 'Product Title'}
                    </h4>
                    
                    {formData.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {formData.summary}
                      </p>
                    )}

                    {/* Price display */}
                    <div className="flex items-center space-x-2">
                      {formData.priceIDR ? (
                        <>
                          {(formData.salePriceIDR > 0 || formData.salePercent > 0) ? (
                            <>
                              <span className={`text-sm font-bold ${
                                theme === 'dark' ? 'text-neon-blue' : 'text-primary'
                              }`}>
                                Rp {(
                                  formData.salePriceIDR ||
                                  Math.round(formData.priceIDR * (1 - formData.salePercent / 100))
                                ).toLocaleString('id-ID')}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                Rp {formData.priceIDR.toLocaleString('id-ID')}
                              </span>
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                              }`}>
                                -{formData.salePercent || Math.round(((formData.priceIDR - formData.salePriceIDR) / formData.priceIDR) * 100)}%
                              </span>
                            </>
                          ) : (
                            <span className={`text-sm font-bold ${
                              theme === 'dark' ? 'text-neon-blue' : 'text-primary'
                            }`}>
                              Rp {formData.priceIDR.toLocaleString('id-ID')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Price not set</span>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded border ${
                        formData.status === 'PUBLISHED'
                          ? theme === 'dark' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 border-green-200 text-green-700'
                          : theme === 'dark' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-700'
                      }`}>
                        {formData.status}
                      </span>
                      
                      <span className={`text-xs px-2 py-1 rounded border ${theme === 'dark' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>
                        {formData.type}
                      </span>
                      
                      <span className={`text-xs px-2 py-1 rounded border ${formData.fulfillment === 'INSTANT' ? (theme === 'dark' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 border-green-200 text-green-700') : (theme === 'dark' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700')}`}>
                        {formData.fulfillment === 'INSTANT' ? 'Instant Delivery' : 'Manual Fulfillment'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`p-4 rounded-xl border backdrop-blur-sm h-fit ${
                theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-1 rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <AlertCircle className={`h-3 w-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className="text-sm font-semibold">Configuration Summary</h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className={formData.title ? 'text-green-600' : 'text-red-500'}>
                      {formData.title ? '✓ Set' : '✗ Required'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thumbnail:</span>
                    <span className={formData.thumbnailFile ? 'text-green-600' : 'text-red-500'}>
                      {formData.thumbnailFile ? '✓ Uploaded' : '✗ Required'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className={formData.priceIDR > 0 ? 'text-green-600' : 'text-red-500'}>
                      {formData.priceIDR > 0 ? '✓ Set' : '✗ Required'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className={formData.categoryId ? 'text-green-600' : 'text-amber-600'}>
                      {formData.categoryId ? '✓ Selected' : '~ Optional'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock Config:</span>
                    <span className={availableStock > 0 || formData.stockType === 'UNLIMITED' ? 'text-green-600' : 'text-amber-600'}>
                      {availableStock > 0 || formData.stockType === 'UNLIMITED' ? '✓ Configured' : '~ Pending'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment:</span>
                    <span className={formData.fulfillment === 'INSTANT' ? 'text-blue-600' : 'text-purple-600'}>
                      {formData.fulfillment === 'INSTANT' ? '✓ Instant' : '✓ Manual'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale/Promo:</span>
                    <span className={(formData.salePriceIDR > 0 || formData.salePercent > 0) ? 'text-green-600' : 'text-amber-600'}>
                      {(formData.salePriceIDR > 0 || formData.salePercent > 0) ? '✓ Active' : '~ None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={`p-4 rounded-xl border backdrop-blur-sm relative z-10 ${
            theme === 'dark' ? 'bg-card/70 border-border/50' : 'bg-card/90 border-gray-200'
          }`}>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all duration-200 hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border/70'
                      : 'bg-background border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group relative px-6 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    theme === 'dark'
                      ? 'bg-neon-blue text-black hover:bg-neon-blue/90 shadow-lg shadow-neon-blue/25 hover:shadow-xl hover:shadow-neon-blue/30'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {isSubmitting ? (
                      <>
                        <div className={`w-3 h-3 border-2 rounded-full animate-spin ${
                          theme === 'dark' ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'
                        }`}></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3" />
                        <span>Create Product</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
}
