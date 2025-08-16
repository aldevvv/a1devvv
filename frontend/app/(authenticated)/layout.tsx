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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Auto redirect if not authenticated
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/');
    }
  }, [mounted, loading, user, router]);
  
  // Show loading while checking authentication or not mounted
  if (!mounted || loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Sidebar skeleton - Hidden on mobile */}
        <div className={`hidden lg:block fixed left-0 top-0 h-full w-56 ${
          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } border-r`}>
          <div className="p-4">
            <div className={`h-8 rounded animate-pulse mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            }`}></div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-10 rounded animate-pulse ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="lg:ml-56">
          {/* Header skeleton */}
          <div className={`h-16 border-b px-4 lg:px-6 flex items-center justify-between ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`h-6 w-6 rounded animate-pulse lg:hidden ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            }`}></div>
            <div className={`h-6 w-32 rounded animate-pulse hidden lg:block ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            }`}></div>
            <div className={`h-8 w-8 rounded-full animate-pulse ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            }`}></div>
          </div>
          
          {/* Content skeleton */}
          <main className={`p-4 lg:p-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
            <div className="space-y-6">
              {/* Header section skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className={`h-8 w-48 rounded animate-pulse mb-2 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}></div>
                  <div className={`h-4 w-64 rounded animate-pulse ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}></div>
                </div>
                <div className={`h-10 w-32 rounded animate-pulse ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}></div>
              </div>
              
              {/* Stats grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-32 rounded-lg animate-pulse ${
                    theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                  } border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="p-4 lg:p-6">
                      <div className={`h-4 w-20 rounded animate-pulse mb-3 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-8 w-16 rounded animate-pulse ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Two column content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className={`rounded-lg border p-4 lg:p-6 ${
                    theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`h-6 w-32 rounded animate-pulse mb-6 ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    }`}></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className={`h-20 rounded animate-pulse ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                        }`}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="lg:ml-56">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={`p-4 lg:p-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
