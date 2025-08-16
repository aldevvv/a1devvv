'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ArrowLeft, Download, Eye, Printer, FileText } from 'lucide-react';
import { invoicesApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  company: {
    name: string;
    address: string;
    email: string;
    website: string;
    logo: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  order: {
    id: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
  };
  items: Array<{
    id: string;
    productId: string;
    name: string;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  deliveryItems: Array<{
    type: string;
    value: string;
    metadata: any;
  }>;
  pricing: {
    subtotal: number;
    discount: number;
    discountPercent: number;
    promoCode?: string;
    total: number;
    currency: string;
  };
}

export default function InvoiceDetailPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const params = useParams();
  const orderId = params?.orderId as string;

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceHTML, setInvoiceHTML] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Fetch invoice data
  useEffect(() => {
    if (orderId) {
      fetchInvoiceData();
    }
  }, [orderId]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const response = await invoicesApi.getByOrderId(orderId) as any;
      setInvoiceData(response.invoice);
      setInvoiceHTML(response.html);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleDownload = () => {
    if (!invoiceHTML || !invoiceData) return;
    
    // Create a blob with the HTML content
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceData.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded successfully');
  };

  const handlePrint = () => {
    if (!invoiceHTML) return;
    
    // Open a new window with the invoice content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return theme === 'dark' 
          ? 'bg-green-900 text-green-300 border-green-700' 
          : 'bg-green-100 text-green-800 border-green-300';
      case 'paid':
        return theme === 'dark' 
          ? 'bg-blue-900 text-blue-300 border-blue-700' 
          : 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return theme === 'dark' 
          ? 'bg-gray-800 text-gray-300 border-gray-600' 
          : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Loading invoice...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <FileText className={`w-16 h-16 mx-auto mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Invoice not found
          </h3>
          <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
            The requested invoice could not be found.
          </p>
          <Link
            href="/admin/invoices"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/invoices"
              className={`inline-flex items-center gap-2 text-sm mb-4 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-purple-400'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </Link>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Invoice {invoiceData.invoiceNumber}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Order {invoiceData.order.id} • {formatDate(invoiceData.invoiceDate)}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showPreview
                  ? theme === 'dark'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-600 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handlePrint}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className={`rounded-lg border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Invoice Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Invoice Number
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.invoiceNumber}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Status
                </label>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoiceData.status)}`}>
                    {invoiceData.status}
                  </span>
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Order ID
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.order.id}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Payment Method
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.order.paymentMethod || 'Wallet Balance'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className={`rounded-lg border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Name
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.customer.name}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Email
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.customer.email}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Username
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.customer.username || 'N/A'}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Customer ID
                </label>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {invoiceData.customer.id}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className={`rounded-lg border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Items Purchased
            </h2>
            <div className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.name}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                      <p className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Items */}
          {invoiceData.deliveryItems.length > 0 && (
            <div className={`rounded-lg border p-6 ${
              theme === 'dark' 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Digital Delivery Items
              </h2>
              <div className="space-y-3">
                {invoiceData.deliveryItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium uppercase tracking-wide ${
                        theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <code className={`text-sm block p-2 rounded font-mono ${
                      theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-800'
                    }`}>
                      {item.value}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="lg:col-span-1">
          <div className={`rounded-lg border p-6 sticky top-6 ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Subtotal
                </span>
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {formatCurrency(invoiceData.pricing.subtotal)}
                </span>
              </div>
              
              {invoiceData.pricing.discount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>
                    Discount {invoiceData.pricing.promoCode && `(${invoiceData.pricing.promoCode})`}
                  </span>
                  <span>
                    -{formatCurrency(invoiceData.pricing.discount)}
                  </span>
                </div>
              )}
              
              <div className={`flex justify-between pt-3 border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <span className={`font-semibold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Total
                </span>
                <span className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {formatCurrency(invoiceData.pricing.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && invoiceHTML && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={invoiceHTML}
                className="w-full h-full min-h-[600px]"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}