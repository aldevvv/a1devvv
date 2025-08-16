'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Package, 
  ArrowLeft,
  Tag,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [removingItems, setRemovingItems] = useState<string[]>([]);

  // Handle remove with loading state
  const handleRemoveFromWishlist = async (productId: string) => {
    setRemovingItems([...removingItems, productId]);
    await removeFromWishlist(productId);
    setRemovingItems(removingItems.filter(id => id !== productId));
  };

  // Handle add to cart
  const handleAddToCart = async (product: any) => {
    await addToCart(product.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDiscountPercentage = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Add products you love to see them here</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/marketplace')}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground mt-1">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>
        
        {wishlist.length > 0 && (
          <button
            onClick={() => router.push('/marketplace')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            Continue Shopping
          </button>
        )}
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => {
            const product = item.product;
            const isRemoving = removingItems.includes(item.productId);
            
            return (
              <div 
                key={item.id}
                className={`group rounded-lg border overflow-hidden transition-all ${
                  isRemoving ? 'opacity-50' : 'hover:shadow-lg'
                } ${
                  theme === 'dark' 
                    ? 'bg-card border-border hover:border-primary/50' 
                    : 'bg-white border-gray-200 hover:border-primary/50'
                }`}
              >
                {/* Product Image */}
                <div className="relative aspect-video bg-muted">
                  {product.thumbnail ? (
                    <img 
                      src={product.thumbnail} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  {product.salePrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      -{getDiscountPercentage(product.price, product.salePrice)}%
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    disabled={isRemoving}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'bg-black/50 text-white hover:bg-black/70'
                        : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  {/* Category Badge */}
                  {product.categoryName && (
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-lg text-xs">
                      <span>{product.categoryIcon}</span>
                      <span>{product.categoryName}</span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <h3 
                    className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer group-hover:text-primary transition-colors"
                    onClick={() => router.push(`/marketplace/${product.slug}`)}
                  >
                    {product.name}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {product.summary || product.description}
                  </p>
                  
                  {/* Product Type and Fulfillment */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.type}
                    </span>
                    {product.fulfillment === 'AUTOMATIC' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                      }`}>
                        Instant Delivery
                      </span>
                    )}
                  </div>
                  
                  {/* Added Date */}
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Clock className="h-3 w-3 mr-1" />
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </div>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {product.salePrice ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(product.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/marketplace/${product.slug}`)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'border-border hover:bg-muted'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 inline mr-1" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      {/* Recommendations Section */}
      {wishlist.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You might also like</h2>
          <div className={`p-8 rounded-lg border text-center ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <p className="text-muted-foreground">Recommendations coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
