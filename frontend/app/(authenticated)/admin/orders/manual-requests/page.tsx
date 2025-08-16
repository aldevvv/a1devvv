'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  Shield,
  Search,
  Mail,
  Eye,
  Send,
  Clock,
  CheckCircle,
  Package,
  User,
  Settings,
  AlertTriangle,
  FileText,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface ManualOrder {
  id: string;
  orderId: string;
  userId: string;
  totalIDR: number;
  status: string;
  paymentMethod: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

interface EmailFormData {
  senderName: string;
  senderEmail: string;
  subjectType: string;
  customSubject: string;
  contentType: string;
  customMessage: string;
  productDelivery: {
    keys: string[];
    sourceFileUrl: string;
    accessLinks: string[];
    digitalAccounts: string[];
    customContent: string;
  };
  additionalNotes: string;
}

const SUBJECT_OPTIONS = [
  { value: 'Order Delivered - Your Purchase is Ready', label: 'Order Delivered - Your Purchase is Ready' },
  { value: 'Product Access Information', label: 'Product Access Information' },
  { value: 'Digital Product Delivery', label: 'Digital Product Delivery' },
  { value: 'License Key & Activation Instructions', label: 'License Key & Activation Instructions' },
  { value: 'Account Access Details', label: 'Account Access Details' },
  { value: 'Download Ready - Your Files', label: 'Download Ready - Your Files' },
  { value: 'custom', label: 'Custom Subject' },
];

const CONTENT_TYPES = [
  { value: 'keys', label: 'License Keys', icon: <FileText className="h-4 w-4" /> },
  { value: 'source_code', label: 'Source Code', icon: <Package className="h-4 w-4" /> },
  { value: 'access_link', label: 'Access Links', icon: <Eye className="h-4 w-4" /> },
  { value: 'digital_account', label: 'Digital Accounts', icon: <User className="h-4 w-4" /> },
  { value: 'custom', label: 'Custom Content', icon: <Settings className="h-4 w-4" /> },
];

const SENDER_EMAIL_OPTIONS = [
  { value: 'support@a1dev.id', label: 'Support Team (support@a1dev.id)' },
  { value: 'fulfillment@a1dev.id', label: 'Fulfillment Team (fulfillment@a1dev.id)' },
  { value: 'orders@a1dev.id', label: 'Orders Department (orders@a1dev.id)' },
  { value: 'delivery@a1dev.id', label: 'Delivery Team (delivery@a1dev.id)' },
  { value: 'noreply@a1dev.id', label: 'No Reply (noreply@a1dev.id)' },
  { value: 'custom', label: 'Custom Email Address' },
];

export default function ManualRequestsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<ManualOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ManualOrder | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [emailForm, setEmailForm] = useState<EmailFormData>({
    senderName: 'A1Dev Support Team',
    senderEmail: 'support@a1dev.id',
    subjectType: 'Order Delivered - Your Purchase is Ready',
    customSubject: '',
    contentType: 'keys',
    customMessage: '',
    productDelivery: {
      keys: [''],
      sourceFileUrl: '',
      accessLinks: [''],
      digitalAccounts: [''],
      customContent: '',
    },
    additionalNotes: '',
  });

  const [selectedSenderEmail, setSelectedSenderEmail] = useState('support@a1dev.id');
  const [customSenderEmail, setCustomSenderEmail] = useState('');

  // Fetch manual requests
  const fetchManualRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/orders/manual-requests`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch manual requests');

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching manual requests:', error);
      toast.error('Failed to load manual requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchManualRequests();
    }
  }, [user]);

  const handleFulfillOrder = (order: ManualOrder) => {
    setSelectedOrder(order);
    setShowEmailForm(true);
  };

  const updateEmailField = (field: keyof EmailFormData, value: any) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
  };

  const updateProductDelivery = (field: keyof EmailFormData['productDelivery'], value: any) => {
    setEmailForm(prev => ({
      ...prev,
      productDelivery: { ...prev.productDelivery, [field]: value }
    }));
  };

  const addArrayItem = (field: 'keys' | 'accessLinks' | 'digitalAccounts') => {
    setEmailForm(prev => ({
      ...prev,
      productDelivery: {
        ...prev.productDelivery,
        [field]: [...prev.productDelivery[field], '']
      }
    }));
  };

  const updateArrayItem = (field: 'keys' | 'accessLinks' | 'digitalAccounts', index: number, value: string) => {
    setEmailForm(prev => ({
      ...prev,
      productDelivery: {
        ...prev.productDelivery,
        [field]: prev.productDelivery[field].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const removeArrayItem = (field: 'keys' | 'accessLinks' | 'digitalAccounts', index: number) => {
    setEmailForm(prev => ({
      ...prev,
      productDelivery: {
        ...prev.productDelivery,
        [field]: prev.productDelivery[field].filter((_, i) => i !== index)
      }
    }));
  };

  const previewEmail = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/orders/${selectedOrder.id}/fulfillment/preview`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailForm),
        }
      );

      if (!response.ok) throw new Error('Failed to generate preview');

      const preview = await response.json();
      setEmailPreview(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing email:', error);
      toast.error('Failed to generate email preview');
    }
  };

  const sendFulfillmentEmail = async () => {
    if (!selectedOrder) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/admin/orders/${selectedOrder.id}/fulfillment/send`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailForm),
        }
      );

      if (!response.ok) throw new Error('Failed to send fulfillment email');

      const result = await response.json();
      toast.success('Fulfillment email sent successfully!');
      
      // Refresh orders list and close modal
      fetchManualRequests();
      setShowEmailForm(false);
      setSelectedOrder(null);
      setShowPreview(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send fulfillment email');
    } finally {
      setSubmitting(false);
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
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" 
           style={{ backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <div className={`relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-card/80 text-muted-foreground hover:text-foreground'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-neon-blue/20' : 'bg-primary/20'}`}>
              <ClipboardList className={`h-6 w-6 ${theme === 'dark' ? 'text-neon-blue' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Manual Fulfillment Requests</h1>
              <p className="text-sm text-muted-foreground">
                Process orders that require manual fulfillment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`p-4 rounded-xl border backdrop-blur-sm ${
        theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Manual Requests</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-xl border backdrop-blur-sm overflow-hidden ${
        theme === 'dark' ? 'bg-black border-border/50' : 'bg-card/90 border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Order</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Date</th>
                <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className={`border-b ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <h3 className="font-semibold">All caught up!</h3>
                      <p className="text-sm text-muted-foreground">
                        No manual fulfillment requests at the moment
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      theme === 'dark' ? 'border-border/50' : 'border-gray-200'
                    }`}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{order.orderId}</p>
                        <p className="text-xs text-muted-foreground">ID: {order.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">
                          {order.user.fullName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{formatCurrency(order.totalIDR)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleFulfillOrder(order)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                            theme === 'dark'
                              ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Fulfill Order
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border ${
            theme === 'dark' ? 'bg-black border-border/50' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Fulfill Order: {selectedOrder.orderId}</h2>
                  <p className="text-sm text-muted-foreground">
                    Customer: {selectedOrder.user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailForm(false);
                    setShowPreview(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <h3 className="font-medium">Email Configuration</h3>
                  
                  {/* Sender Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-2">Sender Name</label>
                      <input
                        type="text"
                        value={emailForm.senderName}
                        onChange={(e) => updateEmailField('senderName', e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                            : 'bg-background border-gray-300 focus:border-primary'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2">Sender Email</label>
                      <select
                        value={selectedSenderEmail}
                        onChange={(e) => {
                          setSelectedSenderEmail(e.target.value);
                          if (e.target.value !== 'custom') {
                            updateEmailField('senderEmail', e.target.value);
                          }
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                            : 'bg-background border-gray-300 focus:border-primary'
                        }`}
                      >
                        {SENDER_EMAIL_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      {selectedSenderEmail === 'custom' && (
                        <input
                          type="email"
                          value={customSenderEmail}
                          onChange={(e) => {
                            setCustomSenderEmail(e.target.value);
                            updateEmailField('senderEmail', e.target.value);
                          }}
                          placeholder="Enter custom email (@a1dev.id)"
                          pattern=".*@a1dev\.id$"
                          className={`w-full mt-2 px-3 py-2 text-sm rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                              : 'bg-background border-gray-300 focus:border-primary'
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Subject</label>
                    <select
                      value={emailForm.subjectType}
                      onChange={(e) => updateEmailField('subjectType', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                          : 'bg-background border-gray-300 focus:border-primary'
                      }`}
                    >
                      {SUBJECT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {emailForm.subjectType === 'custom' && (
                      <input
                        type="text"
                        value={emailForm.customSubject}
                        onChange={(e) => updateEmailField('customSubject', e.target.value)}
                        placeholder="Enter custom subject"
                        className={`w-full mt-2 px-3 py-2 text-sm rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                            : 'bg-background border-gray-300 focus:border-primary'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Content Type</label>
                    <select
                      value={emailForm.contentType}
                      onChange={(e) => updateEmailField('contentType', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 focus:border-neon-blue'
                          : 'bg-background border-gray-300 focus:border-primary'
                      }`}
                    >
                      {CONTENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product Delivery Content */}
                  {emailForm.contentType === 'keys' && (
                    <div>
                      <label className="block text-xs font-medium mb-2">License Keys</label>
                      <div className="space-y-2">
                        {emailForm.productDelivery.keys.map((key, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) => updateArrayItem('keys', index, e.target.value)}
                              placeholder="Enter license key"
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                                theme === 'dark'
                                  ? 'bg-card/50 border-border/50'
                                  : 'bg-background border-gray-300'
                              }`}
                            />
                            <button
                              onClick={() => removeArrayItem('keys', index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('keys')}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          + Add Key
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom Message */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Custom Message (Optional)</label>
                    <textarea
                      value={emailForm.customMessage}
                      onChange={(e) => updateEmailField('customMessage', e.target.value)}
                      rows={3}
                      placeholder="Add custom message to email..."
                      className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50'
                          : 'bg-background border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      onClick={previewEmail}
                      className={`px-4 py-2 text-sm rounded-lg border font-medium ${
                        theme === 'dark'
                          ? 'bg-card/50 border-border/50 hover:bg-card/80'
                          : 'bg-background border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Preview
                    </button>
                    <button
                      onClick={sendFulfillmentEmail}
                      disabled={submitting}
                      className={`px-4 py-2 text-sm rounded-lg font-medium ${
                        theme === 'dark'
                          ? 'bg-neon-blue text-black hover:bg-neon-blue/90'
                          : 'bg-primary text-white hover:bg-primary/90'
                      } disabled:opacity-50`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? 'Sending...' : 'Send & Fulfill'}
                    </button>
                  </div>
                </div>

                {/* Preview Section */}
                <div>
                  <h3 className="font-medium mb-4">Email Preview</h3>
                  {showPreview && emailPreview ? (
                    <div className={`border rounded-lg ${theme === 'dark' ? 'border-border/50' : 'border-gray-200'}`}>
                      <div className={`p-3 border-b text-xs ${theme === 'dark' ? 'border-border/50 bg-card/30' : 'border-gray-200 bg-gray-50'}`}>
                        <div><strong>To:</strong> {emailPreview.to}</div>
                        <div><strong>From:</strong> {emailPreview.fromName} &lt;{emailPreview.from}&gt;</div>
                        <div><strong>Subject:</strong> {emailPreview.subject}</div>
                      </div>
                      <div className="p-4 max-h-96 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: emailPreview.html }} />
                      </div>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      theme === 'dark' ? 'border-border/50' : 'border-gray-300'
                    }`}>
                      <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click "Preview" to see how the email will look
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
