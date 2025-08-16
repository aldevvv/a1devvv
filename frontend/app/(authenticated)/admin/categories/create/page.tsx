'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateCategory, useFormState } from '@/hooks/useApi';

// Category form interface
interface CategoryFormData {
  name: string;
  description: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
};

export default function CreateCategoryPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  // Form state
  const { formData, errors, updateField, setFieldError, reset } = useFormState(initialFormData);
  
  // API hooks
  const createCategoryMutation = useCreateCategory(() => {
    toast.success('Category created successfully!');
    router.push('/admin/categories');
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!formData.name.trim()) {
      setFieldError('name', 'Category name is required');
      isValid = false;
    }

    if (formData.name.length > 100) {
      setFieldError('name', 'Category name must be less than 100 characters');
      isValid = false;
    }

    if (formData.description.length > 500) {
      setFieldError('description', 'Description must be less than 500 characters');
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
      const submitData: any = {
        name: formData.name,
        slug: generateSlug(formData.name), // Always auto-generate slug
      };

      // Add optional fields
      if (formData.description) submitData.description = formData.description;

      await createCategoryMutation.mutate(submitData);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Create New Category</h1>
          <p className="text-muted-foreground mt-1">
            Add a new category to organize your products
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-4">
            <FolderOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Category Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Category Name *</label>
              <input
                type="text"
                maxLength={100}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter category name"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formData.name.length}/100 characters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated slug: <span className="font-mono">{formData.name ? generateSlug(formData.name) : 'category-name'}</span>
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                rows={4}
                maxLength={500}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this category"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/500 characters</p>
            </div>
          </div>

          {/* Preview */}
          {(formData.name || formData.description) && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-medium mb-3">Preview</h3>
              <div className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-background border-border' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-xl">📁</div>
                  <div>
                    <h4 className="font-semibold">{formData.name || 'Category Name'}</h4>
                    <p className="text-sm text-muted-foreground">/{formData.name ? generateSlug(formData.name) : 'category-name'}</p>
                  </div>
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={createCategoryMutation.loading}
            className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-500'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500'
            }`}
          >
            {createCategoryMutation.loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Category
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}