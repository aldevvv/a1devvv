'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Heart, 
  Package, 
  Eye, 
  Grid, 
  List, 
  Plus,
  ShoppingBag,
  Award,
  Zap,
  Users,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMarketplaceProducts, usePublicCategories } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
    { id: 'all', name: 'All Categories', icon: '🏪' }
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState('all');
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    categories: 0,
    newThisWeek: 0
  });
  
  // API hooks
  const { data: apiProducts, loading, error } = useMarketplaceProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchTerm,
    sort: sortBy,
    minPrice: priceRange[0],
    maxPrice: priceRange[1]
  });
  const { data: apiCategories } = usePublicCategories();
  
  // Load products from API
  useEffect(() => {
    if (apiProducts && Array.isArray(apiProducts)) {
      setProducts(apiProducts);
      const wishlistedIds = apiProducts
        .filter(p => p.isWishlisted)
        .map(p => p.id);
      setWishlist(wishlistedIds);
      setFeaturedProducts(apiProducts.slice(0, 4));
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = apiProducts.filter(p => new Date(p.createdAt) > oneWeekAgo).length;
      
      setStats({
        total: apiProducts.length,
        categories: new Set(apiProducts.map(p => p.categoryId).filter(Boolean)).size,
        newThisWeek
      });
    }
  }, [apiProducts]);
  
  // Load categories from API
  useEffect(() => {
    if (apiCategories && Array.isArray(apiCategories)) {
      setCategories([
        { id: 'all', name: 'All Categories', icon: '🏪' },
        ...apiCategories
      ]);
    }
  }, [apiCategories]);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchesPrice = priceRange === 'all' || 
                          (priceRange === 'under-300k' && (product.salePrice || product.price) < 300000) ||
                          (priceRange === '300k-500k' && (product.salePrice || product.price) >= 300000 && (product.salePrice || product.price) <= 500000) ||
                          (priceRange === '500k-700k' && (product.salePrice || product.price) >= 500000 && (product.salePrice || product.price) <= 700000) ||
                          (priceRange === 'over-700k' && (product.salePrice || product.price) > 700000);
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.salePrice || a.price) - (b.salePrice || b.price);
        case 'price-high':
          return (b.salePrice || b.price) - (a.salePrice || a.price);
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return b.enrollmentCount - a.enrollmentCount;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            productId: String(productId),
            quantity: 1 
          }),
        }
      );

      if (response.ok) {
        setCart([...cart, productId]);
        toast.success('Added to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (productId: number | string) => {
    try {
      const response = await api.wishlist.toggle(String(productId));
      
      if (response.isWishlisted) {
        setWishlist([...wishlist, productId]);
        toast.success('Added to wishlist');
      } else {
        setWishlist(wishlist.filter(id => id !== productId));
        toast.success('Removed from wishlist');
      }
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isWishlisted: response.isWishlisted } : p
      ));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleViewProduct = (slug: string) => {
    router.push(`/marketplace/${slug}`);
  };

  const getDiscountPercentage = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Compact Header with Stats */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/20 border-cyan-500/20 shadow-lg shadow-cyan-500/10'
          : 'bg-white/90 border-cyan-500/20 shadow-lg'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-500/20'}`}>
              <ShoppingBag className={`h-5 w-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>Digital Marketplace</h1>
              <p className="text-xs text-gray-500">
                Discover premium digital products
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm font-bold text-cyan-500">{stats.total}</p>
              <p className="text-xs text-gray-500">Products</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-cyan-500">{stats.categories}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-cyan-500">{stats.newThisWeek}</p>
              <p className="text-xs text-gray-500">New</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/cart')}
              className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-black/50 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-400'
                  : 'bg-white/50 hover:bg-cyan-500/10 text-gray-600 hover:text-cyan-600'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {cart.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => router.push('/wishlist')}
              className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-black/50 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-400'
                  : 'bg-white/50 hover:bg-cyan-500/10 text-gray-600 hover:text-cyan-600'
              }`}
            >
              <Heart className="h-4 w-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Search and Filters */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
        theme === 'dark'
          ? 'bg-black/20 border-gray-800/50'
          : 'bg-white/70 border-gray-200/50'
      }`}>
        <div className="relative p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2.5 rounded-lg border-2 w-full transition-all duration-200 focus:scale-[1.02] focus:border-blue-500 focus:shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-900/80'
                      : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:bg-white'
                  }`}
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:border-blue-500 focus:shadow-lg ${
                  theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700/50 text-white'
                    : 'bg-white/80 border-gray-300/50 text-gray-900'
                }`}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2.5 rounded-lg border-2 transition-all duration-200 hover:scale-105 shadow-md ${
                  showFilters
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg'
                    : theme === 'dark'
                      ? 'bg-gray-800/60 border-gray-700/50 text-gray-300 hover:bg-gray-700/80'
                      : 'bg-white/80 border-gray-300/50 text-gray-700 hover:bg-gray-100/90'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className={`flex rounded-lg border-2 p-1 ${
                theme === 'dark' ? 'border-gray-700/50 bg-gray-900/50' : 'border-gray-300/50 bg-white/80'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:border-blue-500 focus:shadow-lg ${
                  theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700/50 text-white'
                    : 'bg-white/80 border-gray-300/50 text-gray-900'
                }`}
              >
                <option value="newest">🆕 Newest</option>
                <option value="popular">🔥 Popular</option>
                <option value="rating">⭐ Top Rated</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💎 Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600 text-sm">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Prices' },
                      { value: 'under-300k', label: 'Under Rp 300K' },
                      { value: '300k-500k', label: 'Rp 300K - 500K' },
                      { value: '500k-700k', label: 'Rp 500K - 700K' },
                      { value: 'over-700k', label: 'Over Rp 700K' }
                    ].map((range) => (
                      <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={priceRange === range.value}
                          onChange={(e) => setPriceRange(e.target.value)}
                          className="text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load products. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {!loading && products.length > 0 && (
        <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800/30 text-gray-400' : 'bg-gray-100/50 text-gray-600'
        }`}>
          <p className="text-sm font-medium">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          {searchTerm && (
            <p className="text-sm">
              Results for: <span className="font-medium text-blue-500">"{searchTerm}"</span>
            </p>
          )}
        </div>
      )}

      {/* Compact Products Display */}
      {!loading && (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "space-y-3"
        }>
        {filteredProducts.map((product) => {
          const mockRating = 4.2 + Math.random() * 0.8;
          const mockReviews = Math.floor(Math.random() * 150) + 10;
          const isNew = new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (viewMode === 'list') {
            return (
              <div key={product.id} className={`group relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-black/20 border-gray-800/50 hover:border-blue-500/50'
                  : 'bg-white/60 border-gray-200/50 hover:border-blue-500/50'
              }`}>
                <div className="relative flex p-3 gap-3">
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    {product.salePrice && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-xs font-bold">
                        -{getDiscountPercentage(product.price, product.salePrice)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-blue-500 transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1 mb-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= mockRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{mockRating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({mockReviews})</span>
                        </div>
                        
                        {product.salePrice ? (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-green-500">
                              {formatCurrency(product.salePrice)}
                            </div>
                            <div className="text-xs text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(product.price)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleToggleWishlist(product.id)}
                          className={`p-1.5 rounded transition-all duration-200 hover:scale-110 ${
                            wishlist.includes(product.id)
                              ? 'bg-red-500/90 text-white'
                              : 'bg-gray-200/60 text-gray-600 hover:bg-gray-300/80'
                          }`}
                        >
                          <Heart className={`h-3 w-3 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => handleViewProduct(product.slug)}
                          className="p-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Grid view (compact)
          return (
            <div key={product.id} className={`group relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
              theme === 'dark'
                ? 'bg-black/20 border-gray-800/50 hover:border-blue-500/50'
                : 'bg-white/60 border-gray-200/50 hover:border-blue-500/50'
            }`}>
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.salePrice && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{getDiscountPercentage(product.price, product.salePrice)}%
                    </div>
                  )}
                  {isNew && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      NEW
                    </div>
                  )}
                </div>
                
                {/* Wishlist Button */}
                <button
                  onClick={() => handleToggleWishlist(product.id)}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                    wishlist.includes(product.id)
                      ? 'bg-red-500/90 text-white'
                      : 'bg-black/30 text-white hover:bg-black/50'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {/* Product Info */}
              <div className="relative p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-500 transition-colors">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= mockRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{mockRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({mockReviews})</span>
                </div>
                
                {/* Price */}
                {product.salePrice ? (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-green-500">
                      {formatCurrency(product.salePrice)}
                    </div>
                    <div className="text-xs text-gray-500 line-through">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(product.price)}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleViewProduct(product.slug)}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50'
                        : 'border border-gray-300/50 bg-white/50 text-gray-700 hover:bg-gray-100/70'
                    }`}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={cart.includes(product.id)}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      cart.includes(product.id)
                        ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {cart.includes(product.id) ? 'Added' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm p-12 text-center ${
          theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
        }`}>
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold mb-3">No products found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Try adjusting your search terms or filters to discover amazing products.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setPriceRange('all');
            }}
            className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-600"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
