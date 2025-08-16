'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { FileText, Eye, Download, Search, Filter, Calendar } from 'lucide-react';
import { invoicesApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface Invoice {
  orderId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Fetch invoices
  useEffect(() => {
    fetchInvoices();
  }, [currentPage]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await invoicesApi.getAll(itemsPerPage, offset) as any;
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
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

  const handleDownload = async (orderId: string, invoiceNumber: string) => {
    try {
      const response = await invoicesApi.getHTML(orderId);
      const html = await response.text();
      
      // Create a blob with the HTML content
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.html`;
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Loading invoices...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Invoice Management
        </h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Generate and manage invoices for completed orders
        </p>
      </div>

      {/* Filters */}
      <div className={`rounded-lg border p-6 mb-6 ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
          </div>
          
          <div className="relative">
            <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={fetchInvoices}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className={`rounded-lg border overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <tr>
                <th className={`text-left px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Invoice
                </th>
                <th className={`text-left px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Customer
                </th>
                <th className={`text-left px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Amount
                </th>
                <th className={`text-left px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Status
                </th>
                <th className={`text-left px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Date
                </th>
                <th className={`text-right px-6 py-4 font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr
                  key={invoice.orderId}
                  className={`border-b transition-colors ${
                    theme === 'dark' 
                      ? 'border-gray-800 hover:bg-gray-800/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {invoice.invoiceNumber}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Order: {invoice.orderId.slice(-8).toUpperCase()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {invoice.customerName}
                      </div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {invoice.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(invoice.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/invoices/${invoice.orderId}`}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-800'
                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDownload(invoice.orderId, invoice.invoiceNumber)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-green-400 hover:bg-gray-800'
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center">
            <FileText className={`w-16 h-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No invoices found
            </h3>
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Invoices will appear here when orders are completed'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={filteredInvoices.length < itemsPerPage}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}