'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useCart } from '@/lib/cart-context';

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

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const [updating, setUpdating] = useState<string | null>(null);

  // Handle quantity update with loading state
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(itemId);
    await updateQuantity(itemId, newQuantity);
    setUpdating(null);
  };

  // Handle remove item with loading state
  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId);
    await removeFromCart(itemId);
    setUpdating(null);
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    await clearCart();
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // No need for useEffect since context handles fetching

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm animate-pulse ${
          theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
        }`}>
          <div className="px-6 py-4">
            <div className={`h-6 rounded w-32 mb-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-4 rounded w-48 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-xl border backdrop-blur-sm p-4 animate-pulse ${
                theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
              }`}>
                <div className="flex gap-4">
                  <div className={`w-20 h-20 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded w-3/4 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 rounded w-1/2 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-3 rounded w-1/4 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`rounded-xl border backdrop-blur-sm p-4 animate-pulse ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className={`h-5 rounded w-32 mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className="space-y-2">
              <div className={`h-3 rounded w-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-3 rounded w-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-4">
        {/* Empty Cart Header */}
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
          theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10"></div>
          <div className="relative px-6 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Your cart is currently empty
            </p>
          </div>
        </div>
        
        {/* Empty State */}
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm py-16 text-center ${
          theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          <div className="relative max-w-md mx-auto px-4">
            <div className="relative mb-6">
              <ShoppingCart className="mx-auto h-20 w-20 text-gray-400" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Discover amazing digital products in our marketplace.
            </p>
            
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-600"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modern Header */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black/40 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10"></div>
        
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Shopping Cart
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} ready for checkout
              </p>
            </div>
            <button
              onClick={handleClearCart}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-900/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enhanced Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className={`relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] ${
              theme === 'dark'
                ? 'bg-black/20 border-gray-800/50 hover:border-blue-500/30'
                : 'bg-white/60 border-gray-200/50 hover:border-blue-500/30'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
              
              <div className="relative p-4">
                <div className="flex gap-4">
                  {/* Enhanced Product Image */}
                  <Link href={`/marketplace/${item.product.slug}`}>
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      {item.product.thumbnailUrl ? (
                        <Image
                          src={item.product.thumbnailUrl}
                          alt={item.product.title}
                          fill
                          className="object-cover transition-transform duration-200 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Enhanced Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${item.product.slug}`}
                      className="block font-bold text-base hover:text-blue-500 transition-colors duration-200 line-clamp-1"
                    >
                      {item.product.title}
                    </Link>
                    
                    {item.product.summary && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.product.summary}
                      </p>
                    )}
                    
                    {item.product.category && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        theme === 'dark' ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-100/80 text-gray-600'
                      }`}>
                        {item.product.category.name}
                      </span>
                    )}

                    {/* Enhanced Price Display */}
                    <div className="mt-3">
                      {item.product.salePriceIDR ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {formatPrice(item.product.salePriceIDR)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product.priceIDR)}
                          </span>
                          {item.product.salePercent && (
                            <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full font-medium">
                              -{item.product.salePercent}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(item.product.priceIDR)}
                        </span>
                      )}
                    </div>

                    {/* Modern Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updating === item.id || item.quantity <= 1}
                          className={`p-1.5 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 ${
                            theme === 'dark'
                              ? 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50'
                              : 'border-gray-300/50 bg-white/50 text-gray-700 hover:bg-gray-100/70'
                          }`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-blue-600">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                          className={`p-1.5 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 hover:scale-110 ${
                            theme === 'dark'
                              ? 'border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50'
                              : 'border-gray-300/50 bg-white/50 text-gray-700 hover:bg-gray-100/70'
                          }`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(item.subtotal)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updating === item.id}
                          className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 ${
                            theme === 'dark'
                              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-900/30'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Order Summary */}
        <div className="lg:col-span-1">
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm sticky top-4 ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10"></div>
            
            <div className="relative p-5">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Items ({cart.totalItems})</span>
                  <span className="font-medium">{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    Free ✨
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Processing</span>
                  <span className="font-medium bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    Free ⚡
                  </span>
                </div>
              </div>

              <div className={`border-t pt-4 mb-6 ${
                theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
              }`}>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(cart.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/checkout?from=cart')}
                  className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-600 hover:to-purple-600"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/marketplace"
                  className={`block text-center py-2 text-sm font-medium transition-colors duration-200 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  Continue Shopping
                </Link>
              </div>
              
              {/* Security badges */}
              <div className="mt-5 pt-4 border-t border-gray-700/30">
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>Instant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span>Digital</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
