'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    summary: string;
    price: number;
    salePrice: number | null;
    salePercent: number | null;
    categoryId: string;
    categoryName: string | null;
    categoryIcon: string;
    status: string;
    type: string;
    productKind: string;
    thumbnail: string;
    fulfillment: string;
    createdAt: string;
    updatedAt: string;
  };
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  // Fetch wishlist data
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/wishlist`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else {
        console.error('Failed to fetch wishlist');
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [user, API_BASE]);

  // Add item to wishlist
  const addToWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });
      
      if (response.ok) {
        await fetchWishlist(); // Refresh wishlist data
        toast.success('Added to wishlist');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          toast.error('Product already in wishlist');
        } else {
          toast.error(errorData.message || 'Failed to add to wishlist');
        }
        return false;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`${API_BASE}/wishlist/remove/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchWishlist(); // Refresh wishlist data
        toast.success('Removed from wishlist');
        return true;
      } else {
        toast.error('Failed to remove from wishlist');
        return false;
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  };

  // Toggle wishlist (add if not exists, remove if exists)
  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchWishlist(); // Refresh wishlist data
        
        if (result.action === 'added') {
          toast.success('Added to wishlist');
        } else {
          toast.success('Removed from wishlist');
        }
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update wishlist');
        return false;
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
      return false;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => item.productId === productId);
  };

  // Get wishlist count
  const getWishlistCount = (): number => {
    return wishlist.length;
  };

  // Auto-fetch wishlist when user changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const refreshWishlist = fetchWishlist;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
        isInWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
