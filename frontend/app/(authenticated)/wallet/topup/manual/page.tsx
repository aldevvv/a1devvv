'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Building2, Smartphone, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

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
    name: 'BCA',
    type: 'bank',
    icon: Building2,
    accountNumber: '1234567890',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Transfer ke rekening BCA di atas',
      'Masukkan jumlah yang tepat sesuai nominal',
      'Upload bukti transfer',
      'Tunggu verifikasi maksimal 15 menit'
    ]
  },
  {
    id: 'bni',
    name: 'BNI',
    type: 'bank',
    icon: Building2,
    accountNumber: '0987654321',
    accountName: 'PT A1DEVID TECHNOLOGY',
    instructions: [
      'Transfer ke rekening BNI di atas',
      'Masukkan jumlah yang tepat sesuai nominal',
      'Upload bukti transfer',
      'Tunggu verifikasi maksimal 15 menit'
    ]
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Kirim ke nomor OVO di atas',
      'Masukkan nominal yang tepat',
      'Screenshot bukti pembayaran',
      'Upload bukti transfer',
      'Tunggu verifikasi maksimal 15 menit'
    ]
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'ewallet',
    icon: Smartphone,
    accountNumber: '081234567890',
    accountName: 'A1DEVID TECHNOLOGY',
    instructions: [
      'Kirim ke nomor GoPay di atas',
      'Masukkan nominal yang tepat',
      'Screenshot bukti pembayaran',
      'Upload bukti transfer',
      'Tunggu verifikasi maksimal 15 menit'
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
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !selectedMethod || !paymentProof) return;

    setIsSubmitting(true);
    
    try {
      // Here you would upload the payment proof and create the topup request
      // For now, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to success page or show success message
      router.push('/wallet?success=topup');
    } catch (error) {
      console.error('Failed to submit topup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = amount && parseInt(amount) >= 10000 && selectedMethod && paymentProof;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Manual Top-up</h1>
          <p className="text-muted-foreground mt-1">
            Transfer via bank or e-wallet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Amount Input */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Enter Amount</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    IDR
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(amount)}
                    onChange={handleAmountChange}
                    placeholder="10.000"
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum: IDR 10,000 • Maximum: IDR 10,000,000
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod?.id === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-blue-900/30 border-blue-600'
                          : 'bg-blue-50 border-blue-500'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${
                        method.type === 'bank' 
                          ? 'text-blue-500' 
                          : 'text-green-500'
                      }`} />
                      <span className="font-medium">{method.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Payment Proof */}
          {selectedMethod && (
            <div className={`p-6 rounded-xl border ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Upload Payment Proof</h3>
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
                    className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    {paymentProof ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-sm font-medium">{paymentProof.name}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className={`h-8 w-8 mx-auto rounded-lg border flex items-center justify-center ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          📁
                        </div>
                        <p className="text-sm font-medium">Upload screenshot or photo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Payment Details */}
        {selectedMethod && (
          <div className="space-y-6">
            {/* Account Details */}
            <div className={`p-6 rounded-xl border ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              <div className="space-y-4">
                {selectedMethod.accountNumber && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {selectedMethod.type === 'bank' ? 'Account Number' : 'Phone Number'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2 rounded border text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-gray-100 border-gray-300'
                      }`}>
                        {selectedMethod.accountNumber}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedMethod.accountNumber!, 'account')}
                        className={`p-2 rounded border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {copiedField === 'account' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selectedMethod.accountName && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Name</label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2 rounded border text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-gray-100 border-gray-300'
                      }`}>
                        {selectedMethod.accountName}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedMethod.accountName!, 'name')}
                        className={`p-2 rounded border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {copiedField === 'name' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {amount && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Transfer Amount</label>
                    <div className="flex items-center space-x-2">
                      <code className={`flex-1 px-3 py-2 rounded border text-lg font-bold ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-green-400' 
                          : 'bg-gray-100 border-gray-300 text-green-600'
                      }`}>
                        IDR {formatCurrency(amount)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(amount, 'amount')}
                        className={`p-2 rounded border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {copiedField === 'amount' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transfer exact amount to avoid delays
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className={`p-6 rounded-xl border ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Instructions</h3>
              <ol className="space-y-2">
                {selectedMethod.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${
                      theme === 'dark' 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 px-6 rounded-lg font-semibold transition-all ${
                canSubmit && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Submit Payment Proof'}
            </button>
          </div>
        )}
      </div>

      {/* Warning Notice */}
      <div className={`p-4 rounded-lg border flex items-start space-x-3 ${
        theme === 'dark' 
          ? 'bg-yellow-900/10 border-yellow-700/30' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
          theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
        }`} />
        <div className={`text-sm ${
          theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
        }`}>
          <p className="font-medium mb-1">Important:</p>
          <p>Make sure to transfer the exact amount shown above. Different amounts may cause verification delays or rejection.</p>
        </div>
      </div>
    </div>
  );
}