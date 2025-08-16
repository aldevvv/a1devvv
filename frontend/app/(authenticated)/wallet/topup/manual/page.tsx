'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Building2, Smartphone, Copy, CheckCircle2, AlertCircle, Loader2, DollarSign, CreditCard, Camera, Info, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'ewallet';
  icon: any;
  accountNumber?: string;
  accountName?: string;
  instructions: string[];
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'bca',
    name: 'BCA Bank',
    type: 'bank',
    icon: Building2,
    accountNumber: '1234567890',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Open your BCA mobile banking or visit BCA ATM/branch',
      'Select "Transfer" and choose "To Other BCA Account"',
      'Enter the account number and verify recipient name',
      'Enter the exact amount as shown above',
      'Complete the transfer and save your receipt',
      'Upload the transfer receipt/screenshot as payment proof',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'bni',
    name: 'BNI Bank',
    type: 'bank',
    icon: Building2,
    accountNumber: '0987654321',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Open your BNI mobile banking or visit BNI ATM/branch',
      'Select "Transfer" and choose "To Other BNI Account"',
      'Enter the account number and verify recipient name',
      'Enter the exact amount as shown above',
      'Complete the transfer and save your receipt',
      'Upload the transfer receipt/screenshot as payment proof',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'mandiri',
    name: 'Mandiri Bank',
    type: 'bank',
    icon: Building2,
    accountNumber: '1122334455',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Open your Mandiri mobile banking or visit Mandiri ATM/branch',
      'Select "Transfer" and choose "To Other Mandiri Account"',
      'Enter the account number and verify recipient name',
      'Enter the exact amount as shown above',
      'Complete the transfer and save your receipt',
      'Upload the transfer receipt/screenshot as payment proof',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'bri',
    name: 'BRI Bank',
    type: 'bank',
    icon: Building2,
    accountNumber: '5566778899',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Open your BRI mobile banking or visit BRI ATM/branch',
      'Select "Transfer" and choose "To Other BRI Account"',
      'Enter the account number and verify recipient name',
      'Enter the exact amount as shown above',
      'Complete the transfer and save your receipt',
      'Upload the transfer receipt/screenshot as payment proof',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'ovo',
    name: 'OVO E-Wallet',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Open your OVO app and login to your account',
      'Select "Transfer" or "Send Money" from main menu',
      'Choose "To OVO Account" and enter phone number above',
      'Verify the recipient name matches exactly',
      'Enter the exact amount as shown above',
      'Complete the transfer and save confirmation screenshot',
      'Upload the payment confirmation screenshot',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'gopay',
    name: 'GoPay E-Wallet',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Open your Gojek app and access GoPay feature',
      'Select "Transfer" or "Send Money" from GoPay menu',
      'Choose "To GoPay Account" and enter phone number above',
      'Verify the recipient name matches exactly',
      'Enter the exact amount as shown above',
      'Complete the transfer and save confirmation screenshot',
      'Upload the payment confirmation screenshot',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'dana',
    name: 'DANA E-Wallet',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Open your DANA app and login to your account',
      'Select "Transfer" or "Send Money" from main menu',
      'Choose "To DANA Account" and enter phone number above',
      'Verify the recipient name matches exactly',
      'Enter the exact amount as shown above',
      'Complete the transfer and save confirmation screenshot',
      'Upload the payment confirmation screenshot',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay E-Wallet',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Open your Shopee app and access ShopeePay',
      'Select "Transfer" or "Send Money" from ShopeePay menu',
      'Choose "To ShopeePay Account" and enter phone number above',
      'Verify the recipient name matches exactly',
      'Enter the exact amount as shown above',
      'Complete the transfer and save confirmation screenshot',
      'Upload the payment confirmation screenshot',
      'Wait for verification (typically 1-15 minutes during business hours)'
    ]
  }
];

export default function ManualTopupPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '' || parseInt(value) <= 10000000) {
      setAmount(value);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload an image file (JPEG, PNG, or WebP)');
        return;
      }
      
      setPaymentProof(file);
      toast.success('Payment proof selected');
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }
    
    const amountNum = parseInt(amount);
    if (amountNum < 5000) {
      toast.error('Minimum top-up amount is IDR 5,000');
      return;
    }
    
    if (amountNum > 10000000) {
      toast.error('Maximum top-up amount is IDR 10,000,000');
      return;
    }
    
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create manual top-up request
      const topUpResponse = await api.billing.createManualTopUp({
        amountIDR: amountNum,
      });
      
      // Upload payment proof if top-up request created successfully
      if (topUpResponse.paymentId) {
        try {
          await api.adminWallets.uploadTopUpProof(topUpResponse.paymentId, paymentProof);
        } catch (uploadError) {
          console.error('Failed to upload proof, but top-up request was created:', uploadError);
          // Don't fail the whole process if proof upload fails
        }
      }
      
      toast.success('Top-up request submitted successfully! Please wait for verification.');
      
      // Redirect to wallet page after short delay
      setTimeout(() => {
        router.push('/wallet?status=pending');
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to submit top-up:', error);
      
      // Show specific error message if available
      if (error.message) {
        toast.error(error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit top-up request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = amount && parseInt(amount) >= 5000 && selectedMethod && paymentProof;

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Modern Futuristic Header */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/40 border-neon-blue/20 shadow-lg shadow-neon-blue/10'
          : 'bg-card/90 border-primary/20 shadow-lg'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className={`p-2 rounded-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'hover:bg-neon-blue/10 text-gray-400 hover:text-neon-blue border border-neon-blue/20'
                  : 'hover:bg-primary/10 text-gray-600 hover:text-primary border border-primary/20'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Manual Top-up
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Bank transfer & e-wallet payments
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === 'dark'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            Manual Verification
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Input Card */}
          <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black/40 border-blue-500/20 shadow-lg shadow-blue-400/10'
              : 'bg-card/90 border-blue-300/20 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-1 rounded ${
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <span>Enter Amount</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Amount (IDR)
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    IDR
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(amount)}
                    onChange={handleAmountChange}
                    placeholder="10.000"
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                      theme === 'dark'
                        ? 'bg-black/20 border-gray-700 focus:border-blue-400 text-white placeholder-gray-400'
                        : 'bg-white/80 border-gray-300 focus:border-blue-500 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Min: IDR 5,000 • Max: IDR 10,000,000 • Must be multiples of IDR 1,000
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection Card */}
          <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-black/40 border-green-500/20 shadow-lg shadow-green-400/10'
              : 'bg-card/90 border-green-300/20 shadow-lg'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-1 rounded ${
                theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <CreditCard className={`h-4 w-4 ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <span>Select Payment Method</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod?.id === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`group p-4 rounded-lg border backdrop-blur-sm text-left transition-all duration-300 ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-400/20'
                          : 'bg-blue-50/80 border-blue-400/50 shadow-lg shadow-blue-400/20'
                        : theme === 'dark'
                          ? 'bg-black/20 border-gray-600/50 hover:border-gray-500/50 hover:bg-gray-800/20'
                          : 'bg-white/60 border-gray-300/50 hover:border-gray-400/50 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded transition-all duration-300 ${
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-blue-400/20'
                            : 'bg-blue-100'
                          : theme === 'dark'
                            ? 'bg-gray-700/50 group-hover:bg-gray-600/50'
                            : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          method.type === 'bank'
                            ? isSelected
                              ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                              : theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                            : isSelected
                              ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              : theme === 'dark' ? 'text-green-400' : 'text-green-500'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {method.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Payment Proof Card */}
          {selectedMethod && (
            <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-black/40 border-purple-500/20 shadow-lg shadow-purple-400/10'
                : 'bg-card/90 border-purple-300/20 shadow-lg'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <Camera className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <span>Upload Payment Proof</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label
                    htmlFor="payment-proof"
                    className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                      theme === 'dark'
                        ? 'border-gray-600/50 hover:border-purple-400/50 bg-black/20 hover:bg-purple-900/10'
                        : 'border-gray-300/50 hover:border-purple-400/50 bg-white/40 hover:bg-purple-50/50'
                    }`}
                  >
                    {paymentProof ? (
                      <div className="space-y-3">
                        <div className={`p-2 rounded-full w-fit mx-auto ${
                          theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                        }`}>
                          <CheckCircle2 className={`h-6 w-6 ${
                            theme === 'dark' ? 'text-green-400' : 'text-green-600'
                          }`} />
                        </div>
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {paymentProof.name}
                        </p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className={`w-12 h-12 mx-auto rounded-lg border-2 border-dashed flex items-center justify-center ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <Camera className={`h-6 w-6 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Upload payment screenshot
                          </p>
                          <p className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Payment Details & Actions */}
        {selectedMethod && (
          <div className="space-y-6">
            {/* Account Details Card */}
            <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-black/40 border-blue-500/20 shadow-lg shadow-blue-400/10'
                : 'bg-card/90 border-blue-300/20 shadow-lg'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <Info className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <span>Payment Details</span>
              </h3>
              
              <div className="space-y-4">
                {selectedMethod.accountNumber && (
                  <div>
                    <label className={`block text-xs font-medium mb-2 uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedMethod.type === 'bank' ? 'Account Number' : 'Phone Number'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono backdrop-blur-sm ${
                        theme === 'dark'
                          ? 'bg-black/20 border-gray-600/50 text-blue-300'
                          : 'bg-white/60 border-gray-300/50 text-blue-700'
                      }`}>
                        {selectedMethod.accountNumber}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedMethod.accountNumber!, 'account')}
                        className={`p-2.5 rounded-lg border transition-all duration-300 backdrop-blur-sm ${
                          copiedField === 'account'
                            ? theme === 'dark'
                              ? 'bg-green-500/20 border-green-400/50 text-green-400'
                              : 'bg-green-100/80 border-green-400/50 text-green-600'
                            : theme === 'dark'
                              ? 'bg-black/20 border-gray-600/50 hover:border-gray-500/50 text-gray-400 hover:text-white'
                              : 'bg-white/60 border-gray-300/50 hover:border-gray-400/50 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {copiedField === 'account' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selectedMethod.accountName && (
                  <div>
                    <label className={`block text-xs font-medium mb-2 uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Account Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono backdrop-blur-sm ${
                        theme === 'dark'
                          ? 'bg-black/20 border-gray-600/50 text-blue-300'
                          : 'bg-white/60 border-gray-300/50 text-blue-700'
                      }`}>
                        {selectedMethod.accountName}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedMethod.accountName!, 'name')}
                        className={`p-2.5 rounded-lg border transition-all duration-300 backdrop-blur-sm ${
                          copiedField === 'name'
                            ? theme === 'dark'
                              ? 'bg-green-500/20 border-green-400/50 text-green-400'
                              : 'bg-green-100/80 border-green-400/50 text-green-600'
                            : theme === 'dark'
                              ? 'bg-black/20 border-gray-600/50 hover:border-gray-500/50 text-gray-400 hover:text-white'
                              : 'bg-white/60 border-gray-300/50 hover:border-gray-400/50 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {copiedField === 'name' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {amount && (
                  <div>
                    <label className={`block text-xs font-medium mb-2 uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Transfer Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-3 rounded-lg border text-base font-bold font-mono backdrop-blur-sm ${
                        theme === 'dark'
                          ? 'bg-black/20 border-green-500/50 text-green-400'
                          : 'bg-white/60 border-green-400/50 text-green-600'
                      }`}>
                        IDR {formatCurrency(amount)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(amount, 'amount')}
                        className={`p-2.5 rounded-lg border transition-all duration-300 backdrop-blur-sm ${
                          copiedField === 'amount'
                            ? theme === 'dark'
                              ? 'bg-green-500/20 border-green-400/50 text-green-400'
                              : 'bg-green-100/80 border-green-400/50 text-green-600'
                            : theme === 'dark'
                              ? 'bg-black/20 border-gray-600/50 hover:border-gray-500/50 text-gray-400 hover:text-white'
                              : 'bg-white/60 border-gray-300/50 hover:border-gray-400/50 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {copiedField === 'amount' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
                    }`}>
                      ⚠️ Transfer exact amount to avoid verification delays
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions Card */}
            <div className={`relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-black/40 border-purple-500/20 shadow-lg shadow-purple-400/10'
                : 'bg-card/90 border-purple-300/20 shadow-lg'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <FileText className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <span>Payment Steps</span>
              </h3>
              
              <div className="space-y-3">
                {selectedMethod.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      theme === 'dark'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {index + 1}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm ${
                canSubmit && !isSubmitting
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/80 hover:to-purple-500/80 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                  : theme === 'dark'
                    ? 'bg-black/20 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200/60 border border-gray-300/30 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing Payment...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Submit Payment Proof</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">→</span>
                  </div>
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black/40 border-yellow-500/20 shadow-lg shadow-yellow-400/10'
          : 'bg-card/90 border-yellow-300/20 shadow-lg'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 p-1 rounded ${
            theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100'
          }`}>
            <AlertCircle className={`h-5 w-5 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
          </div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
          }`}>
            <p className="font-semibold mb-2">Important Verification Guidelines:</p>
            <div className="space-y-1">
              <p>• Transfer the <strong>exact amount</strong> shown above - any deviation may cause delays</p>
              <p>• Upload a <strong>clear screenshot</strong> of your payment confirmation</p>
              <p>• Verification typically takes <strong>1-15 minutes</strong> during business hours</p>
              <p>• Contact support if verification takes longer than expected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}