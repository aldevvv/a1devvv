'use client';

import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  // Auto redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/');
    }
  }, [mounted, loading, user, router]);
  
  // Show loading while checking authentication or not mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex">
        <div className="w-48 bg-gray-200 animate-pulse"></div>
        <div className="flex-1 ml-48">
          <div className="h-16 bg-gray-200 animate-pulse"></div>
          <div className="p-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Don't render layout if user is not authenticated
  if (!user) {
    return null;
  }
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <Sidebar />
      <div className="ml-48">
        <Header />
        <main className={`p-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
