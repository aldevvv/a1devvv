'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  emailVerifiedAt: string | null;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (showError = false) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Auto logout if token is invalid or expired
        if (response.status === 401 && user !== null) {
          if (showError) {
            toast.error('Session expired. Please login again.');
          }
          setUser(null);
          // Redirect to home page for expired sessions
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/';
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      toast.success('Logged out successfully');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      // Force logout even if API call fails
      setUser(null);
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    await fetchUser(true);
  };

  // Auto check authentication status periodically
  useEffect(() => {
    fetchUser();
    
    // Check authentication every 5 minutes
    const interval = setInterval(() => {
      fetchUser(true);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []); // Remove user dependency to prevent infinite loop

  // Check authentication when page becomes visible (user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUser(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Remove user dependency to prevent infinite loop

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};