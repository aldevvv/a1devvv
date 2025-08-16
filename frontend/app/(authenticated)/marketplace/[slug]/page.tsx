'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Star, 
  Package, 
  Shield, 
  Clock, 
  CheckCircle,
  Zap,
  Tag,
  AlertCircle,
  CreditCard,
  Lock,
  Key,
  Link2,
  File,
  Code,
  Users,
  MessageCircle,
  ThumbsUp,
  Award,
  Share2,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Database,
  Server,
  GitBranch,
  Info,
  Eye,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Delivery type icons and labels
const deliveryConfig = {
  LICENSE_KEY: { icon: Key, label: 'License Key' },
  ACCESS_LINK: { icon: Link2, label: 'Access Link' },
  FILE: { icon: File, label: 'Downloadable File' },
  SOURCE_CODE: { icon: Code, label: 'Source Code' }
};

export default function ProductDetailPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [saleExpired, setSaleExpired] = useState(false);

  // Fetch product details
  useEffect(() => {
    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);

  // Check cart and wishlist status
  useEffect(() => {
    if (product && user) {
      checkCartStatus();
      checkWishlistStatus();
    }
  }, [product, user]);

  // Calculate time left for sale
  const calculateTimeLeft = useCallback(() => {
    if (!product?.saleEndAt) return null;
    
    const endTime = new Date(product.saleEndAt).getTime();
    const now = new Date().getTime();
    const difference = endTime - now;
    
    if (difference <= 0) {
      setSaleExpired(true);
      return null;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, [product?.saleEndAt]);

  // Update countdown timer
  useEffect(() => {
    if (!product?.saleEndAt || !product?.salePriceIDR) return;
    
    const startTime = product.saleStartAt ? new Date(product.saleStartAt).getTime() : 0;
    const endTime = new Date(product.saleEndAt).getTime();
    const now = new Date().getTime();
    
    if (now < startTime || now > endTime) {
      setSaleExpired(true);
      return;
    }
    
    const time = calculateTimeLeft();
    setTimeLeft(time);
    
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      if (!newTime) {
        clearInterval(timer);
        setSaleExpired(true);
        fetchProductDetails();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [product?.saleEndAt, product?.salePriceIDR, product?.saleStartAt, calculateTimeLeft]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/products/${slug}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const productData = await response.json();
      setProduct(productData);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkCartStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/cart/check/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsInCart(data.isInCart);
        setCartQuantity(data.quantity);
      }
    } catch (err) {
      console.error('Error checking cart status:', err);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/wishlist/check/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsWishlisted(data.isWishlisted);
      }
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    }
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

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to add to cart');
      }

      setIsInCart(true);
      setCartQuantity(cartQuantity + 1);
      toast.success('Added to cart successfully!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setTogglingWishlist(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/wishlist/toggle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to update wishlist');
      }

      const data = await response.json();
      setIsWishlisted(data.isWishlisted);
      toast.success(data.isWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      console.error('Error updating wishlist:', err);
      toast.error('Failed to update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/checkout?productId=${product.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm animate-pulse ${
          theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
        }`}>
          <div className="relative px-6 py-8">
            <div className={`h-6 rounded w-64 mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
            <div className={`h-4 rounded w-96 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`aspect-video rounded-xl border backdrop-blur-sm animate-pulse ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}></div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-xl border backdrop-blur-sm p-6 animate-pulse ${
                theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
              }`}>
                <div className={`h-6 rounded w-3/4 mb-3 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 rounded w-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm py-16 text-center ${
        theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="relative max-w-md mx-auto px-4">
          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-3">Product Not Found</h2>
          <p className="text-gray-500 mb-6">
            {error || 'The product you are looking for does not exist.'}
          </p>
          
          <button
            onClick={() => router.push('/marketplace')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const DeliveryIcon = deliveryConfig[product.delivery as keyof typeof deliveryConfig]?.icon || Package;
  const deliveryLabel = deliveryConfig[product.delivery as keyof typeof deliveryConfig]?.label || product.delivery;
  const effectivePrice = (!saleExpired && product.salePriceIDR && timeLeft) 
    ? product.salePriceIDR 
    : product.priceIDR;

  return (
    <div className="space-y-4">
      {/* Compact Breadcrumb */}
      <div className={`relative overflow-hidden rounded-lg border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="relative px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/marketplace')}
              className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
              Marketplace
            </button>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <span className="text-gray-500">{product.category.name}</span>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="font-medium text-blue-600 truncate">
              {product.title}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column - Product Image & Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm aspect-square ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative w-full h-full">
              {product.thumbnailUrl ? (
                <img
                  src={product.thumbnailUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`relative overflow-hidden rounded-lg border backdrop-blur-sm p-3 ${
              theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
            }`}>
              <DeliveryIcon className="h-4 w-4 mb-2 text-blue-500" />
              <p className="text-xs font-medium">{deliveryLabel}</p>
              <p className="text-xs text-gray-500">Delivery Method</p>
            </div>

            <div className={`relative overflow-hidden rounded-lg border backdrop-blur-sm p-3 ${
              theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
            }`}>
              <Zap className="h-4 w-4 mb-2 text-green-500" />
              <p className="text-xs font-medium">
                {product.fulfillment === 'AUTOMATIC' ? 'Instant ⚡' : 'Manual'}
              </p>
              <p className="text-xs text-gray-500">Delivery Speed</p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className={`relative overflow-hidden rounded-lg border backdrop-blur-sm ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative p-4">
              <h3 className="font-medium mb-3 flex items-center text-blue-600">
                <Shield className="h-4 w-4 mr-2" />
                Buyer Protection
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Money Back Guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Product Details & Purchase */}
        <div className="lg:col-span-3 space-y-4">
          {/* Title and Category */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative p-6">
              {product.category && (
                <div className="flex items-center space-x-2 mb-3">
                  {product.category.icon && <span className="text-xl">{product.category.icon}</span>}
                  <span className="text-sm text-gray-500 font-medium">{product.category.name}</span>
                </div>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold mb-3 text-blue-600">
                {product.title}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">4.5</span>
                <span className="text-sm text-gray-500">(128 reviews)</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  theme === 'dark' ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-100/80 text-gray-600'
                }`}>
                  {product.type}
                </span>
                {product.fulfillment === 'AUTOMATIC' && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30">
                    ⚡ Instant Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price and Purchase */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative p-6">
              {/* Price Display */}
              <div className="mb-6">
                {product.salePriceIDR && !saleExpired && timeLeft ? (
                  <>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl lg:text-3xl font-bold text-green-500">
                        {formatCurrency(product.salePriceIDR)}
                      </span>
                      {product.salePercent && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          -{product.salePercent}%
                        </span>
                      )}
                    </div>
                    <div className="text-lg text-gray-500 line-through">
                      {formatCurrency(product.priceIDR)}
                    </div>
                  </>
                ) : (
                  <span className="text-2xl lg:text-3xl font-bold text-blue-600">
                    {formatCurrency(product.priceIDR)}
                  </span>
                )}
              </div>

              {/* Sale Timer */}
              {product.salePriceIDR && timeLeft && !saleExpired && (
                <div className={`p-4 rounded-lg mb-6 ${
                  theme === 'dark' ? 'bg-red-900/20 border border-red-900/50' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-600">Sale Ends In</span>
                    </div>
                    <span className="text-xs text-red-500 font-medium">
                      Save {formatCurrency(product.priceIDR - product.salePriceIDR)}!
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {timeLeft.days > 0 && (
                      <div className={`p-2 rounded ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                        <div className="text-lg font-bold text-red-600">{String(timeLeft.days).padStart(2, '0')}</div>
                        <div className="text-xs text-red-500">Days</div>
                      </div>
                    )}
                    <div className={`p-2 rounded ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                      <div className="text-lg font-bold text-red-600">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-xs text-red-500">Hours</div>
                    </div>
                    <div className={`p-2 rounded ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                      <div className="text-lg font-bold text-red-600">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-xs text-red-500">Mins</div>
                    </div>
                    <div className={`p-2 rounded ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                      <div className="text-lg font-bold text-red-600">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-xs text-red-500">Secs</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  Buy Now - {formatCurrency(effectivePrice)}
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={isInCart ? () => router.push('/cart') : handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 px-6 py-3 rounded-lg border font-medium transition-all duration-200 ${
                      addingToCart
                        ? 'opacity-50 cursor-not-allowed'
                        : isInCart
                          ? 'bg-green-500/20 border-green-500 text-green-600 hover:bg-green-500/30'
                          : theme === 'dark'
                            ? 'border-gray-700 hover:bg-gray-800/50'
                            : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 inline mr-2" />
                    {addingToCart ? 'Adding...' : isInCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={handleToggleWishlist}
                    disabled={togglingWishlist}
                    className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                      togglingWishlist
                        ? 'opacity-50 cursor-not-allowed'
                        : isWishlisted
                          ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                          : theme === 'dark'
                            ? 'border-gray-700 hover:bg-gray-800/50'
                            : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Payment Security */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Secure payment with</p>
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <Lock className="h-4 w-4 text-gray-400" />
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">
                About this product
              </h2>
              
              {product.summary && (
                <p className="text-gray-500 mb-4">{product.summary}</p>
              )}
              
              {product.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-3 text-blue-600">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          theme === 'dark' ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-100/80 text-gray-600'
                        }`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
            theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
          }`}>
            <div className="relative p-6">
              <h3 className="font-semibold mb-4 text-blue-600">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product ID</span>
                  <span className="font-mono text-xs">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span>{product.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span>{deliveryLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Added</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews - Compact */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black/20 border-gray-800/50' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-blue-600 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Customer Reviews
            </h2>
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              Write a Review
            </button>
          </div>
          
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">4.5</div>
              <div className="flex items-center justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">128 reviews</p>
            </div>
            
            <div className="col-span-2">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const percentage = rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : rating === 2 ? 2 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Sample Reviews - Limited to 2 for compactness */}
          <div className="space-y-4">
            {[
              {
                name: "John D.",
                avatar: "👨‍💻",
                rating: 5,
                date: "2024-01-15",
                comment: "Amazing product! The code quality is excellent and the documentation is very clear. Saved me weeks of development time.",
                helpful: 12,
                verified: true
              },
              {
                name: "Sarah M.",
                avatar: "👩‍🔬", 
                rating: 4,
                date: "2024-01-10",
                comment: "Good value for money. The setup was straightforward and it works as described.",
                helpful: 8,
                verified: true
              }
            ].map((review, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200 bg-white/50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{review.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.name}</span>
                        {review.verified && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{review.comment}</p>
                    
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                        <ThumbsUp className="h-3 w-3" />
                        <span>Helpful ({review.helpful})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50">
              View All Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
