'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const { theme } = useTheme();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();
  
  // Don't render header if user not authenticated or still loading
  if (loading || !user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);
  
  return (
    <header className={`sticky top-0 h-16 border-b px-4 lg:px-6 flex items-center justify-between lg:justify-end z-20 backdrop-blur supports-[backdrop-filter]:bg-background/95 ${
      theme === 'dark'
        ? 'bg-black/95 border-gray-800'
        : 'bg-white/95 border-gray-200'
    }`}>
      {/* Left section - Mobile menu button */}
      <div className="flex items-center lg:hidden">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Right section with theme toggle and profile */}
      <div className="flex items-center space-x-4">
        {/* Cart & Wishlist - Only for USER role */}
        {user.role === 'USER' && (
          <div className="flex items-center space-x-2">
            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
              }`}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>
            
            {/* Cart Button */}
            <Link
              href="/cart"
              className={`relative p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        )}
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-all duration-200"
          >
            {/* Profile Photo */}
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-neon-blue text-background'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {getInitials(user.fullName || user.email || 'User')}
              </div>
            )}
            
            {/* Name & Email - Hidden on small screens */}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium">{user.fullName || 'User'}</div>
              <div className="text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
            
            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className={`absolute right-0 mt-2 w-56 rounded-lg border shadow-lg ${
              theme === 'dark'
                ? 'bg-dark-surface border-border backdrop-blur-xl'
                : 'bg-card border-border'
            }`}>
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium">{user.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  className="flex items-center px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}