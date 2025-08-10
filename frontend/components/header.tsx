'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function Header() {
  const { user, logout, loading } = useAuth();
  const { theme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Don't render header if user not authenticated or still loading
  if (loading || !user) {
    return null;
  }
  
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
    <header className={`sticky top-0 h-16 border-b pl-54 pr-6 flex items-center justify-end z-20 ${
      theme === 'dark'
        ? 'bg-black border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      {/* Right section with theme toggle and profile */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-opacity-80 ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-white'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
          >
            {/* Profile Photo */}
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            
            {/* Name & Email */}
            <div className="text-left">
              <div className="text-sm font-medium">{user.fullName || 'User'}</div>
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.email}
              </div>
            </div>
            
            {/* Dropdown Arrow */}
            <span className={`text-sm transition-transform duration-200 ${
              showDropdown ? 'rotate-180' : ''
            } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              ▼
            </span>
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            }`}>
              <div className="py-2">
                <Link
                  href="/dashboard/settings"
                  className={`flex items-center px-4 py-2 text-sm transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setShowDropdown(false)}
                >
                  <span className="mr-3">⚙️</span>
                  Settings
                </Link>
                
                <hr className={`my-2 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`} />
                
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left flex items-center px-4 py-2 text-sm transition-colors ${
                    theme === 'dark'
                      ? 'text-red-400 hover:bg-gray-800'
                      : 'text-red-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">🚪</span>
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