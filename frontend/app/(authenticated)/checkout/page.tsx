'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Wallet, CreditCard, Shield, CheckCircle2, AlertCircle, Loader2, Tag, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  finalPrice: number;
  category: string;
  seller: string;
}

interface CheckoutPreview {
  product?: Product;
  items?: CartItem[];
  subtotal: number;
  walletBalance: number;
  canPayWithBalance: boolean;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

type PaymentMethod = 'balance' | 'xendit';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('balance');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  
  const productId = searchParams.get('productId');
  const fromCart = searchParams.get('from') === 'cart';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchCheckoutPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const endpoint = fromCart 
        ? `${API_BASE}/checkout/cart-preview`
        : `${API_BASE}/checkout/preview/${productId}`;
      
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
        
        // Default to Xendit if balance insufficient
        if (!data.canPayWithBalance) {
          setSelectedMethod('xendit');
        }
      } else {
        toast.error('Failed to load checkout details');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch checkout preview:', error);
      toast.error('Failed to load checkout details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, fromCart, productId, router]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    
    try {
      // Prepare items for promo validation
      const items = preview?.items 
        ? preview.items.map(item => ({
            productId: item.product.id,
            qty: item.quantity
          }))
        : preview?.product 
        ? [{ productId: preview.product.id, qty: 1 }]
        : [];

      const response = await fetch(`${API_BASE}/checkout/apply-promo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode,
          items
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscount(data.discount);
        toast.success(`Promo code applied! You saved ${formatCurrency(data.discount)}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Invalid promo code');
        setPromoCode('');
        setDiscount(0);
      }
    } catch (error) {
      console.error('Failed to apply promo:', error);
      toast.error('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const processCheckout = async () => {
    setIsProcessing(true);

    try {
      const endpoint = fromCart 
        ? `${API_BASE}/checkout/cart`
        : `${API_BASE}/checkout/single`;

      const payload = fromCart
        ? {
            productIds: preview?.items?.map(item => item.product.id) || [],
            paymentMethod: selectedMethod,
            promoCode: discount > 0 ? promoCode : undefined
          }
        : {
            productId: productId,
            paymentMethod: selectedMethod,
            promoCode: discount > 0 ? promoCode : undefined
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.redirectUrl) {
          if (selectedMethod === 'xendit') {
            // For Xendit, redirect to payment page
            toast.success('Redirecting to payment page...');
            window.location.href = data.redirectUrl;
          } else {
            // For balance payment, redirect to order confirmation
            toast.success('Payment successful!');
            router.push(data.redirectUrl);
          }
        } else {
          toast.success(data.message || 'Order processed successfully');
          router.push('/orders');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to process checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!productId && !fromCart) {
      toast.error('No product selected for checkout');
      router.push('/marketplace');
      return;
    }

    fetchCheckoutPreview();
  }, [productId, fromCart, fetchCheckoutPreview, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading checkout details...</span>
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const subtotal = preview.subtotal;
  const total = subtotal - discount;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-1">
            Complete your purchase
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Product Details & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Order Summary
            </h2>
            
            <div className="space-y-4">
              {preview.items ? (
                // Cart checkout
                preview.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    {item.product.thumbnail && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.product.category} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))
              ) : preview.product ? (
                // Single product checkout
                <div className="flex items-center space-x-4">
                  {preview.product.thumbnail && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={preview.product.thumbnail}
                        alt={preview.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{preview.product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {preview.product.category} • by {preview.product.seller}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(preview.product.finalPrice)}</p>
                    {preview.product.price !== preview.product.finalPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(preview.product.price)}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Promo Code */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Promo Code
            </h2>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                disabled={discount > 0 || isApplyingPromo}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  discount > 0
                    ? theme === 'dark'
                      ? 'bg-green-900/20 border-green-700/50 text-green-400'
                      : 'bg-green-50 border-green-200 text-green-700'
                    : theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                      : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <button
                onClick={discount > 0 ? () => { setPromoCode(''); setDiscount(0); } : applyPromoCode}
                disabled={isApplyingPromo || (!promoCode.trim() && discount === 0)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  discount > 0
                    ? theme === 'dark'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    : !promoCode.trim()
                      ? theme === 'dark'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isApplyingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : discount > 0 ? (
                  'Remove'
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            
            {discount > 0 && (
              <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-green-900/20 border border-green-700/50'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <CheckCircle2 className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-green-300' : 'text-green-700'
                }`}>
                  Promo applied! You save {formatCurrency(discount)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            
            <div className="space-y-3">
              {/* Balance Payment */}
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                selectedMethod === 'balance'
                  ? theme === 'dark'
                    ? 'bg-blue-900/20 border-blue-600'
                    : 'bg-blue-50 border-blue-500'
                  : theme === 'dark'
                    ? 'bg-card border-border hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="balance"
                  checked={selectedMethod === 'balance'}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                  disabled={!preview.canPayWithBalance}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 mr-2" />
                    <span className="font-medium">Wallet Balance</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current balance: {formatCurrency(preview.walletBalance)}
                  </p>
                  {!preview.canPayWithBalance && (
                    <p className="text-sm text-red-500 mt-1">
                      Insufficient balance (need {formatCurrency(total - preview.walletBalance)} more)
                    </p>
                  )}
                </div>
              </label>

              {/* Xendit Payment */}
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                selectedMethod === 'xendit'
                  ? theme === 'dark'
                    ? 'bg-blue-900/20 border-blue-600'
                    : 'bg-blue-50 border-blue-500'
                  : theme === 'dark'
                    ? 'bg-card border-border hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="xendit"
                  checked={selectedMethod === 'xendit'}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span className="font-medium">Credit/Debit Card & E-Wallet</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay with Xendit - Credit Card, Bank Transfer, E-Wallet
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Price Summary */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Promo Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={processCheckout}
              disabled={isProcessing || (selectedMethod === 'balance' && !preview.canPayWithBalance)}
              className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                isProcessing || (selectedMethod === 'balance' && !preview.canPayWithBalance)
                  ? theme === 'dark'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedMethod === 'xendit' ? (
                'Proceed to Payment'
              ) : (
                'Complete Purchase'
              )}
            </button>
          </div>

          {/* Security Info */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className={`h-5 w-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <h3 className="font-semibold">Secure Checkout</h3>
            </div>
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>SSL encrypted payment</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Buyer protection guaranteed</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Instant digital delivery</span>
              </li>
            </ul>
          </div>

          {/* Help Info */}
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-yellow-900/10 border-yellow-700/30' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <div className="text-sm">
                <p className={`font-medium mb-1 ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
                }`}>
                  Need help?
                </p>
                <p className={theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}>
                  Contact our support team if you have any questions about your purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
