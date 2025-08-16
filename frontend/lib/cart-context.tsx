'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    priceIDR: number;
    salePriceIDR?: number;
    salePercent?: number;
    effectivePrice: number;
    thumbnailUrl: string;
    type: string;
    category?: {
      name: string;
      slug: string;
    };
  };
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

interface CartContextType {
  cart: CartData | null;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/cart`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        console.error('Failed to fetch cart');
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user, API_BASE]);

  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity }),
      });
      
      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Added to cart');
        return true;
      } else {
        toast.error('Failed to add to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Removed from cart');
        return true;
      } else {
        toast.error('Failed to remove from cart');
        return false;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
      return false;
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!user || quantity < 1) return false;

    try {
      const response = await fetch(`${API_BASE}/cart/${itemId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      
      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Cart updated');
        return true;
      } else {
        toast.error('Failed to update quantity');
        return false;
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      return false;
    }
  };

  // Clear cart
  const clearCart = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Cart cleared');
        return true;
      } else {
        toast.error('Failed to clear cart');
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      return false;
    }
  };

  // Check if product is in cart
  const isInCart = (productId: string): boolean => {
    if (!cart) return false;
    return cart.items.some(item => item.product.id === productId);
  };

  // Get cart count
  const getCartCount = (): number => {
    return cart?.totalItems || 0;
  };

  // Auto-fetch cart when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const refreshCart = fetchCart;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        isInCart,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
