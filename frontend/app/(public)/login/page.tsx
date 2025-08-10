'use client';

import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate form
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Call the actual backend login API
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: formData.email.includes('@') ? formData.email : undefined,
          username: !formData.email.includes('@') ? formData.email : undefined,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Welcome back! Login successful.', {
          description: `Hello ${data.user.fullName}! Redirecting to your dashboard...`,
        });
        
        // Refresh the user state to update navbar
        await refreshUser();
        
        // Redirect to dashboard after success
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        toast.error('Login failed', {
          description: data.message || 'Invalid email/username or password. Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'Unable to connect to the server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-br from-dark-surface via-background to-dark-elevated' : 'bg-gradient-to-br from-background via-accent to-muted'}`} />
        {theme === 'dark' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
        )}
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className={`relative p-8 rounded-2xl border ${theme === 'dark' ? 'bg-card/80 border-border/50 backdrop-blur-xl' : 'bg-card border-border'} shadow-2xl`}>
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className={theme === 'dark' ? 'text-neon-blue' : 'text-primary'}>
                  Welcome Back
                </span>
              </h1>
              <p className="text-muted-foreground">
                Sign in to your A1Dev account
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email or Username
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-neon-blue focus:ring-1 focus:ring-neon-blue'
                      : 'bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary'
                  } transition-colors`}
                  placeholder="Enter your email or username"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-neon-blue focus:ring-1 focus:ring-neon-blue'
                      : 'bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary'
                  } transition-colors`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className={`rounded border-border ${
                      theme === 'dark'
                        ? 'text-neon-blue focus:ring-neon-blue'
                        : 'text-primary focus:ring-primary'
                    } focus:ring-2 focus:ring-offset-0`}
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className={`text-sm ${
                    theme === 'dark'
                      ? 'text-neon-blue hover:text-neon-blue/80'
                      : 'text-primary hover:text-primary/80'
                  } transition-colors`}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-neon-blue text-background hover:bg-neon-blue/90 disabled:opacity-50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
                  window.location.href = `${API_BASE}/auth/github`;
                }}
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-accent text-sm font-medium text-foreground transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">GitHub</span>
              </button>

              <button 
                onClick={() => {
                  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
                  window.location.href = `${API_BASE}/auth/google`;
                }}
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-accent text-sm font-medium text-foreground transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/register"
                className={`font-medium ${
                  theme === 'dark'
                    ? 'text-neon-blue hover:text-neon-blue/80'
                    : 'text-primary hover:text-primary/80'
                } transition-colors`}
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
