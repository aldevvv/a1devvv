'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import {
  CheckCircle, Package, CreditCard, Calendar, ArrowLeft,
  Download, Copy, ExternalLink, Loader2, AlertCircle,
  ShoppingBag, User, Hash, FileText, Eye
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { invoicesApi } from '@/lib/api';

interface OrderDetails {
  orderId: string;
  status: string;
  totalIDR: number;
  paymentMethod: string;
  createdAt: string;
  products: Array<{
    id: string;
    title: string;
    price: number;
    thumbnail?: string;
    quantity?: number;
  }>;
  user?: {
    fullName: string;
    email: string;
  };
  deliveryInfo?: {
    type: string;
    content: string;
  };
  deliveryItems?: Array<{
    type: string;
    content: string;
  }>;
}

export default function OrderDetailsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, message: string = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(message);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    try {
      const blob = await invoicesApi.downloadPDF(orderId);
      
      // Create a URL for the PDF blob
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePreviewInvoice = async () => {
    try {
      const response = await invoicesApi.getUserInvoiceHTML(orderId);
      const html = await response.text();
      
      // Open a new window with the invoice content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
      }
    } catch (error) {
      console.error('Failed to preview invoice:', error);
      toast.error('Failed to preview invoice');
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/checkout/order/${orderId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (response.status === 404) {
        toast.error('Order not found');
        router.push('/orders');
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      router.push('/orders');
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading order details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = order.status === 'PAID' || order.status === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <div className={`p-6 rounded-xl border flex items-center space-x-4 ${
          theme === 'dark' 
            ? 'bg-green-900/20 border-green-700/50' 
            : 'bg-green-50 border-green-200'
        }`}>
          <CheckCircle className={`h-8 w-8 flex-shrink-0 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`} />
          <div>
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-700'
            }`}>
              Order Successful!
            </h2>
            <p className={theme === 'dark' ? 'text-green-300' : 'text-green-600'}>
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/orders')}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-black'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{order.orderId}</span>
                <button
                  onClick={() => copyToClipboard(order.orderId)}
                  className={`p-1 rounded transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Copy className={`h-3 w-3 ${
                    copied ? 'text-green-500' : 'text-muted-foreground'
                  }`} />
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isSuccess
                  ? theme === 'dark'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                  : order.status === 'PENDING'
                    ? theme === 'dark'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-yellow-100 text-yellow-700'
                    : theme === 'dark'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-red-100 text-red-700'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Order Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Order Date</p>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(order.createdAt)}</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {order.paymentMethod === 'BALANCE' ? 'Wallet Balance' : 
                 order.paymentMethod === 'XENDIT' ? 'Xendit Payment' : 
                 order.paymentMethod}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <span className="text-xl font-bold">{formatCurrency(order.totalIDR)}</span>
          </div>

          {order.user && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Customer</p>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.user.fullName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Products ({order.products.length})
        </h3>
        
        <div className="space-y-4">
          {order.products.map((product) => (
            <div key={product.id} className="flex items-center space-x-4 pb-4 border-b last:border-0">
              {product.thumbnail ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="font-medium">{product.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Digital Product {product.quantity && product.quantity > 1 && `(Qty: ${product.quantity})`}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(product.price)}</p>
                {product.quantity && product.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">× {product.quantity}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Info - Only show if order is successful */}
      {isSuccess && ((order.deliveryItems && order.deliveryItems.length > 0) || order.deliveryInfo) && (
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Delivery Information
          </h3>
          
          {/* Show all delivery items if available */}
          {order.deliveryItems && order.deliveryItems.length > 0 ? (
            <div className="space-y-4">
              {order.deliveryItems.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  {item.type === 'LICENSE_KEY' && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        License Key {order.deliveryItems!.length > 1 ? `#${index + 1}` : ''}
                      </p>
                      <div className="flex items-start space-x-2">
                        <div className="flex-1">
                          <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-sm break-all overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.content, 'License key copied to clipboard')}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'ACCESS_LINK' && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Access Link {order.deliveryItems!.length > 1 ? `#${index + 1}` : ''}
                      </p>
                      <a
                        href={item.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <span>{item.content}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                  
                  {(item.type === 'FILE' || item.type === 'SOURCE_CODE') && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Source Code/File {order.deliveryItems!.length > 1 ? `#${index + 1}` : ''}
                      </p>
                      {item.content.startsWith('http') ? (
                        <div className="space-y-3">
                          <a
                            href={item.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download File</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <div className="flex items-start space-x-2">
                            <div className="flex-1">
                              <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-xs break-all overflow-x-auto">
                                {item.content}
                              </code>
                            </div>
                            <button
                              onClick={() => copyToClipboard(item.content, 'Download link copied to clipboard')}
                              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                              title="Copy download link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-2">
                          <div className="flex-1">
                            <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-sm break-all overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {item.content}
                            </code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.content, 'Content copied to clipboard')}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : order.deliveryInfo && (
            /* Fallback to single delivery info for backward compatibility */
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              {order.deliveryInfo.type === 'LICENSE_KEY' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">License Key</p>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-sm break-all overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {order.deliveryInfo.content}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.deliveryInfo!.content, 'License key copied to clipboard')}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {order.deliveryInfo.type === 'ACCESS_LINK' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Access Link</p>
                  <a
                    href={order.deliveryInfo.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span>{order.deliveryInfo.content}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
              
              {(order.deliveryInfo.type === 'FILE' || order.deliveryInfo.type === 'SOURCE_CODE') && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Source Code/File</p>
                  {order.deliveryInfo.content.startsWith('http') ? (
                    <div className="space-y-3">
                      <a
                        href={order.deliveryInfo.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download File</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <div className="flex items-start space-x-2">
                        <div className="flex-1">
                          <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-xs break-all overflow-x-auto">
                            {order.deliveryInfo.content}
                          </code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(order.deliveryInfo!.content, 'Download link copied to clipboard')}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                          title="Copy download link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <code className="block w-full p-3 rounded bg-black/10 dark:bg-white/10 font-mono text-sm break-all overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {order.deliveryInfo.content}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(order.deliveryInfo!.content, 'Content copied to clipboard')}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invoice Section - Only show for successful orders */}
      {isSuccess && (
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Invoice
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePreviewInvoice}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview Invoice
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push('/orders')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          View All Orders
        </button>
        
        {isSuccess && (
          <button
            onClick={() => router.push('/marketplace')}
            className="flex-1 py-3 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Continue Shopping
          </button>
        )}
      </div>
    </div>
  );
}
