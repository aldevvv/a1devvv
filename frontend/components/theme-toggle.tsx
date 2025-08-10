'use client';

import { useTheme } from '@/lib/theme-context';
import React from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100 text-neon-blue' 
            : '-rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Glow effect for dark mode */}
      <div 
        className={`absolute inset-0 rounded-lg transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 opacity-100' 
            : 'opacity-0'
        }`}
      />
    </button>
  );
}

export function ThemeToggleMinimal() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {/* Sun Icon */}
      <svg
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`absolute h-4 w-4 transition-all duration-300 ${
          theme === 'dark' ? 'rotate-0 scale-100 text-neon-blue' : '-rotate-90 scale-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}