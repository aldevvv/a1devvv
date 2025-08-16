// API service for frontend-backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

// Helper function to get auth headers
function getAuthHeaders() {
  // In a real app, you'd get the token from cookies or auth context
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${token}`,
  };
}

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle error responses
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          try {
            const jsonError = JSON.parse(errorData);
            errorMessage = jsonError.message || errorMessage;
          } catch {
            errorMessage = errorData || errorMessage;
          }
        }
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
      
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error(errorMessage);
    }

    // Handle successful responses
    if (response.status === 204) {
      return {} as T;
    }

    // Try to get response text first
    const responseText = await response.text();
    
    // If empty response, return empty object
    if (!responseText) {
      return {} as T;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(responseText);
    } catch {
      // If not JSON, return the text or empty object
      return (responseText as any) || ({} as T);
    }

  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Products API
export const productsApi = {
  // Admin endpoints
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    return apiRequest(`/admin/products?${searchParams.toString()}`);
  },
  
  getById: (id: string) => apiRequest(`/admin/products/${id}`),
  
  create: (data: any) => apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiRequest(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`/admin/products/${id}`, {
    method: 'DELETE',
  }),
  
  // Public marketplace endpoint (to be implemented in backend)
  getPublished: (params?: { category?: string; search?: string; sort?: string; minPrice?: number; maxPrice?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
    
    return apiRequest(`/products?${searchParams.toString()}`);
  },
};

// Categories API
export const categoriesApi = {
  getAll: (search?: string) => {
    const searchParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/admin/categories${searchParams}`);
  },
  
  getById: (id: string) => apiRequest(`/admin/categories/${id}`),
  
  create: (data: any) => apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`/admin/categories/${id}`, {
    method: 'DELETE',
  }),
  
  // Public endpoint for marketplace
  getPublic: () => apiRequest('/categories'),
};

// Promo Codes API
export const promoCodesApi = {
  getAll: (search?: string) => {
    const searchParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/admin/promos${searchParams}`);
  },
  
  getById: (id: string) => apiRequest(`/admin/promos/${id}`),
  
  create: (data: any) => apiRequest('/admin/promos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiRequest(`/admin/promos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`/admin/promos/${id}`, {
    method: 'DELETE',
  }),
  
  // Validate promo code
  validate: (code: string, items: any[]) => apiRequest('/checkout/apply-promo', {
    method: 'POST',
    body: JSON.stringify({ promoCode: code, items }),
  }),
};

// Orders API (to be implemented in backend)
export const ordersApi = {
  // Get user's order history
  getHistory: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    // TODO: Implement in backend - for now return mock data
    return Promise.resolve({
      orders: [],
      message: 'Order history endpoint not yet implemented in backend'
    });
  },
  
  getById: (id: string) => {
    // TODO: Implement in backend
    return Promise.resolve({
      order: null,
      message: 'Order details endpoint not yet implemented in backend'
    });
  },
  
  // Create order (checkout)
  create: (data: { items: any[]; promoCode?: string }) => {
    return apiRequest('/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Submit review for order item
  submitReview: (orderId: string, itemId: string, data: { rating: number; review?: string }) => {
    // TODO: Implement in backend
    return Promise.resolve({
      success: true,
      message: 'Review endpoint not yet implemented in backend'
    });
  },
};

// Checkout API
export const checkoutApi = {
  applyPromo: (data: { promoCode: string; items: any[] }) => {
    return apiRequest('/checkout/apply-promo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  confirm: (data: { items: any[]; promoCode?: string }) => {
    return apiRequest('/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Users API (for admin)
export const usersApi = {
  getAll: (search?: string) => {
    const searchParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/admin/users${searchParams}`);
  },
  
  getById: (id: string) => apiRequest(`/admin/users/${id}`),
  
  update: (id: string, data: any) => apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
};

// Wallets API (for admin)
export const walletsApi = {
  getAll: (search?: string) => {
    const searchParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/admin/wallets${searchParams}`);
  },
  
  getById: (id: string) => apiRequest(`/admin/wallets/${id}`),
  
  addBalance: (id: string, data: { amount: number; description: string }) => {
    return apiRequest(`/admin/wallets/${id}/add-balance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin Wallets API (extended)
export const adminWalletsApi = {
  getAll: (search?: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiRequest(`/admin/wallets?${params.toString()}`);
  },
  
  getStatistics: () => apiRequest('/admin/wallets/statistics'),
  
  getTopUpRequests: (status?: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiRequest(`/admin/wallets/topup-requests?${params.toString()}`);
  },
  
  getUserWallet: (userId: string) => apiRequest(`/admin/wallets/${userId}`),
  
  getUserLedger: (userId: string, page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiRequest(`/admin/wallets/${userId}/ledger?${params.toString()}`);
  },
  
  manualTopUp: (userId: string, data: { amount: number; description: string; reference?: string }) => {
    return apiRequest(`/admin/wallets/${userId}/manual-topup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  adjustBalance: (userId: string, data: { amount: number; reason: string; reference?: string }) => {
    return apiRequest(`/admin/wallets/${userId}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  approveTopUp: (paymentId: string, data: { notes?: string; approvedAmount?: number }) => {
    return apiRequest(`/admin/wallets/topup-proof/${paymentId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  rejectTopUp: (paymentId: string, data: { notes?: string }) => {
    return apiRequest(`/admin/wallets/topup-proof/${paymentId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  uploadTopUpProof: (paymentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/admin/wallets/upload-proof/${paymentId}`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

// Error types
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

// Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Billing API
export const billingApi = {
  createManualTopUp: (data: { 
    amountIDR: number;
  }) => {
    return apiRequest('/billing/topup/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  createAutoTopUp: (data: { amountIDR: number }) => {
    return apiRequest('/billing/topup/auto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getPaymentMethods: () => apiRequest('/billing/payment-methods'),
  
  getPaymentStatus: (paymentId: string) => apiRequest(`/billing/payment/${paymentId}`),
};

// Wishlist API
export const wishlistApi = {
  getAll: () => apiRequest('/wishlist'),
  
  add: (productId: string) => apiRequest('/wishlist/add', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  }),
  
  remove: (productId: string) => apiRequest(`/wishlist/remove/${productId}`, {
    method: 'DELETE',
  }),
  
  toggle: (productId: string) => apiRequest('/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  }),
  
  check: (productId: string) => apiRequest(`/wishlist/check/${productId}`),
  
  count: () => apiRequest('/wishlist/count'),
};

// Templates API
export const templatesApi = {
  getEmailTemplates: () => apiRequest('/admin/templates/email'),
  
  previewEmailTemplate: (type: 'verification' | 'reset-password', data?: { fullName?: string; url?: string }) => {
    const params = new URLSearchParams({ type });
    if (data) {
      params.append('data', JSON.stringify(data));
    }
    return apiRequest(`/admin/templates/email/preview?${params.toString()}`);
  },
};

// Invoices API
export const invoicesApi = {
  // Admin endpoints
  getAll: (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiRequest(`/admin/invoices?${params.toString()}`);
  },
  
  getByOrderId: (orderId: string) => apiRequest(`/admin/invoices/${orderId}`),
  
  getHTML: (orderId: string) => {
    return fetch(`${API_BASE_URL}/admin/invoices/${orderId}/html`, {
      credentials: 'include',
    });
  },

  // User endpoints
  getUserInvoice: (orderId: string) =>
    apiRequest<any>(`/orders/${orderId}/invoice`),
  
  getUserInvoiceHTML: (orderId: string) => {
    return fetch(`${API_BASE_URL}/orders/${orderId}/invoice/html`, {
      credentials: 'include',
    });
  },
  
  downloadPDF: (orderId: string) => {
    return fetch(`${API_BASE_URL}/orders/${orderId}/invoice/pdf`, {
      credentials: 'include',
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      return response.blob();
    });
  },
};

// Export default API object
export default {
  products: productsApi,
  categories: categoriesApi,
  promoCodes: promoCodesApi,
  orders: ordersApi,
  checkout: checkoutApi,
  users: usersApi,
  wallets: walletsApi,
  adminWallets: adminWalletsApi,
  billing: billingApi,
  wishlist: wishlistApi,
  templates: templatesApi,
  invoices: invoicesApi,
};
