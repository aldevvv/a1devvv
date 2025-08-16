'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api, { ApiError } from '@/lib/api';

// Generic hook for API calls
export function useApi<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for products (admin)
export function useProducts(params?: { category?: string; status?: string; search?: string }) {
  return useApi(
    () => api.products.getAll(params),
    [params?.category, params?.status, params?.search]
  );
}

// Hook for marketplace products (user)
export function useMarketplaceProducts(params?: { 
  category?: string; 
  search?: string; 
  sort?: string; 
  minPrice?: number; 
  maxPrice?: number; 
}) {
  return useApi(
    () => api.products.getPublished(params),
    [params?.category, params?.search, params?.sort, params?.minPrice, params?.maxPrice]
  );
}

// Hook for categories
export function useCategories(search?: string) {
  return useApi(
    () => api.categories.getAll(search),
    [search]
  );
}

// Hook for public categories (marketplace)
export function usePublicCategories() {
  return useApi(() => api.categories.getPublic());
}

// Hook for promo codes (admin)
export function usePromoCodes(search?: string) {
  return useApi(
    () => api.promoCodes.getAll(search),
    [search]
  );
}

// Hook for order history (user)
export function useOrderHistory(params?: { status?: string; search?: string }) {
  return useApi(
    () => api.orders.getHistory(params),
    [params?.status, params?.search]
  );
}

// Hook for users (admin)
export function useUsers(search?: string) {
  return useApi(
    () => api.users.getAll(search),
    [search]
  );
}

// Hook for wallets (admin)
export function useWallets(search?: string) {
  return useApi(
    () => api.wallets.getAll(search),
    [search]
  );
}

// Hook for mutations (create, update, delete)
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(params);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  return { mutate, loading, error };
}

// Specific mutation hooks
export function useCreateProduct(onSuccess?: () => void) {
  return useMutation(
    (data: any) => api.products.create(data),
    onSuccess
  );
}

export function useUpdateProduct(onSuccess?: () => void) {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => api.products.update(id, data),
    onSuccess
  );
}

export function useDeleteProduct(onSuccess?: () => void) {
  return useMutation(
    (id: string) => api.products.delete(id),
    onSuccess
  );
}

export function useCreateCategory(onSuccess?: () => void) {
  return useMutation(
    (data: any) => api.categories.create(data),
    onSuccess
  );
}

export function useUpdateCategory(onSuccess?: () => void) {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => api.categories.update(id, data),
    onSuccess
  );
}

export function useDeleteCategory(onSuccess?: () => void) {
  return useMutation(
    (id: string) => api.categories.delete(id),
    onSuccess
  );
}

export function useCreatePromoCode(onSuccess?: () => void) {
  return useMutation(
    (data: any) => api.promoCodes.create(data),
    onSuccess
  );
}

export function useUpdatePromoCode(onSuccess?: () => void) {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => api.promoCodes.update(id, data),
    onSuccess
  );
}

export function useDeletePromoCode(onSuccess?: () => void) {
  return useMutation(
    (id: string) => api.promoCodes.delete(id),
    onSuccess
  );
}

export function useValidatePromoCode() {
  return useMutation(
    ({ code, items }: { code: string; items: any[] }) => api.promoCodes.validate(code, items)
  );
}

export function useCheckout(onSuccess?: () => void) {
  return useMutation(
    (data: { items: any[]; promoCode?: string }) => api.checkout.confirm(data),
    onSuccess
  );
}

export function useSubmitReview(onSuccess?: () => void) {
  return useMutation(
    ({ orderId, itemId, data }: { orderId: string; itemId: string; data: { rating: number; review?: string } }) => 
      api.orders.submitReview(orderId, itemId, data),
    onSuccess
  );
}

// Hook for handling form state
export function useFormState<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  return {
    formData,
    errors,
    updateField,
    setFieldError,
    clearErrors,
    reset,
    setFormData,
  };
}

// Hook for pagination
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// Hook for search and filter
export function useSearchAndFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  filterFn?: (item: T, filters: any) => boolean
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({});

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search
    if (searchTerm) {
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply custom filters
    if (filterFn) {
      result = result.filter(item => filterFn(item, filters));
    }

    return result;
  }, [items, searchTerm, filters, searchFields, filterFn]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    clearFilters,
    filteredItems,
  };
}