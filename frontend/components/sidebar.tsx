'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Users, Settings } from 'lucide-react';
import Image from 'next/image';

const getSidebarLinks = (userRole: 'USER' | 'ADMIN') => {
  const baseLinks = [
    { name: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard }
  ];

  if (userRole === 'USER') {
    return [
      ...baseLinks,
      { name: 'Wallet', href: '/wallet', Icon: Wallet }
    ];
  }

  if (userRole === 'ADMIN') {
    return [
      ...baseLinks,
      { name: 'Users', href: '/admin/users', Icon: Users },
      { name: 'Wallets', href: '/admin/wallets', Icon: Wallet }
    ];
  }

  return baseLinks;
};



export function Sidebar() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  
  // Don't render sidebar if user not authenticated or still loading
  if (loading || !user) {
    return null;
  }

  // Get sidebar links based on user role
  const userSidebarLinks = getSidebarLinks(user.role);
  
  return (
    <aside className={`fixed left-0 top-0 w-48 h-screen border-r flex flex-col z-10 ${
      theme === 'dark'
        ? 'bg-black border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      {/* Logo section - exactly 64px height to match header */}
      <div className="h-16 flex items-center justify-center px-4">
        <Link href="/dashboard" className="flex items-center justify-center">
          <div className="relative w-12 h-12">
            <Image
              src={theme === 'dark' ? '/A1dev White.png' : '/A1dev Color.png'}
              alt="A1Dev Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>
      
      {/* Divider aligned with header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
      
      {/* Navigation with proper padding */}
      <div className="flex-1 p-4">
        <nav className="h-full">
          <ul className="space-y-2 pt-2">
            {userSidebarLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href));
              
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-primary'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <link.Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* Footer */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
}