'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailChangePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Missing token.');
      return;
    }

    const verifyEmailChange = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/verify-email-change`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email changed successfully!');
          toast.success('Email changed successfully!');
          
          // Redirect to settings page after 3 seconds
          setTimeout(() => {
            router.push('/settings');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email change');
          toast.error(data.message || 'Failed to verify email change');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email change. Please try again.');
        toast.error('Failed to verify email change');
      }
    };

    verifyEmailChange();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-md p-8 rounded-lg border text-center ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' && 'Verifying Email Change'}
          {status === 'success' && 'Email Changed Successfully'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {status === 'loading' && 'Please wait while we verify your email change...'}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>

        {/* Action Buttons */}
        {status === 'success' && (
          <div className="space-y-3">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              You will be redirected to settings in a moment...
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Settings Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/settings')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Settings
            </button>
            <button
              onClick={() => window.location.reload()}
              className={`w-full px-4 py-2 border rounded-md transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}