'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, Users, Settings, Package, Tag, Percent, ShoppingBag, History, FileText, Archive, ChevronDown, ChevronRight, Plus, Edit, List, Receipt, Shield, Activity, ShoppingCart, ClipboardList, HeadphonesIcon, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SidebarLink {
  name: string;
  href: string;
  Icon: any;
  hasSubmenu?: boolean;
  submenuItems?: Array<{
    name: string;
    href: string;
    Icon: any;
  }>;
}

const getSidebarLinks = (userRole: 'USER' | 'ADMIN'): SidebarLink[] => {
  const baseLinks = [
    { name: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard }
  ];

  if (userRole === 'USER') {
    return [
      ...baseLinks,
      { 
        name: 'Marketplace', 
        href: '/marketplace', 
        Icon: ShoppingBag,
        hasSubmenu: true,
        submenuItems: [
          { name: 'Browse', href: '/marketplace', Icon: ShoppingBag },
          { name: 'Order History', href: '/order-history', Icon: History }
        ]
      },
      { name: 'Wallet', href: '/wallet', Icon: Wallet }
    ];
  }

  if (userRole === 'ADMIN') {
    return [
      ...baseLinks,
      { 
        name: 'Products', 
        href: '/admin/products', 
        Icon: Package,
        hasSubmenu: true,
        submenuItems: [
          { name: 'All Products', href: '/admin/products', Icon: List },
          { name: 'Create Product', href: '/admin/products/create', Icon: Plus },
          { name: 'Edit Products', href: '/admin/products/edit', Icon: Edit }
        ]
      },
      { 
        name: 'Inventory', 
        href: '/admin/inventory', 
        Icon: Archive,
        hasSubmenu: true,
        submenuItems: [
          { name: 'Overview', href: '/admin/inventory', Icon: LayoutDashboard },
          { name: 'Sources', href: '/admin/inventory/sources', Icon: Archive },
          { name: 'Items', href: '/admin/inventory/items', Icon: Package }
        ]
      },
      { name: 'Categories', href: '/admin/categories', Icon: Tag },
      { name: 'Promo Codes', href: '/admin/promo-codes', Icon: Percent },
      { 
        name: 'Orders', 
        href: '/admin/orders', 
        Icon: ShoppingCart,
        hasSubmenu: true,
        submenuItems: [
          { name: 'Orders List', href: '/admin/orders', Icon: List },
          { name: 'Manual Requests', href: '/admin/orders/manual-requests', Icon: ClipboardList }
        ]
      },
      { name: 'Users', href: '/admin/users', Icon: Users },
      { name: 'Wallets', href: '/admin/wallets', Icon: Wallet },
      { name: 'Templates', href: '/admin/templates', Icon: FileText },
      { name: 'Invoices', href: '/admin/invoices', Icon: Receipt },
      { 
        name: 'Support', 
        href: '/admin/support', 
        Icon: HeadphonesIcon,
        hasSubmenu: true,
        submenuItems: [
          { name: 'Public', href: '/admin/support/public', Icon: MessageSquare }
        ]
      },
      { 
        name: 'Security', 
        href: '/admin/security', 
        Icon: Shield,
        hasSubmenu: true,
        submenuItems: [
          { name: 'Sessions', href: '/admin/security/sessions', Icon: Activity },
          { name: 'Audit Logs', href: '/admin/security/audit', Icon: FileText }
        ]
      }
    ];
  }

  return baseLinks;
};



interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // Don't render sidebar if user not authenticated or still loading
  if (loading || !user) {
    return null;
  }

  // Get sidebar links based on user role
  const userSidebarLinks = getSidebarLinks(user.role);
  
  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };
  
  return (
    <aside className={`fixed left-0 top-0 w-48 h-screen border-r flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${
      theme === 'dark'
        ? 'bg-black border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      {/* Logo section with close button for mobile */}
      <div className="h-14 flex items-center justify-center px-3 relative">
        <Link href="/dashboard" className="flex items-center justify-center flex-1" onClick={onClose}>
          <div className="relative w-12 h-12">
            <Image
              src={theme === 'dark' ? '/A1Dev White.png' : '/A1Dev Neon.png'}
              alt="A1Dev Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        
        {/* Close button for mobile - positioned absolutely */}
        {onClose && (
          <button
            onClick={onClose}
            className={`lg:hidden absolute right-4 p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Divider aligned with header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
      
      {/* Navigation with proper padding */}
      <div className="flex-1 p-3">
        <nav className="h-full">
          <ul className="space-y-1 pt-1">
            {userSidebarLinks.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href));
              const isExpanded = expandedMenus.includes(link.name);
              const hasActiveSubmenu = link.submenuItems?.some((subItem: any) =>
                pathname === subItem.href ||
                (subItem.href !== '/dashboard' && pathname.startsWith(subItem.href))
              );
              
              return (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * (userSidebarLinks.indexOf(link)) }}
                >
                  {link.hasSubmenu ? (
                    <div className="space-y-1">
                      {/* Main menu item with submenu toggle */}
                      <button
                        onClick={() => toggleSubmenu(link.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-all duration-300 relative overflow-hidden ${
                          isActive || hasActiveSubmenu
                            ? theme === 'dark'
                              ? 'text-white bg-gray-800/80 border border-gray-700/50'
                              : 'text-gray-900 bg-gray-100 border border-gray-200'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <link.Icon className="w-4 h-4 mr-2.5 flex-shrink-0" />
                          <span className="font-medium text-sm">{link.name}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </motion.div>
                      </button>
                      
                      {/* Submenu items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="ml-6 space-y-0.5"
                          >
                            {link.submenuItems?.map((subItem: any) => {
                              const isSubActive = pathname === subItem.href ||
                                (subItem.href !== '/dashboard' && pathname.startsWith(subItem.href));
                              
                              return (
                                <motion.div
                                  key={subItem.href}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                  <Link
                                    href={subItem.href}
                                    onClick={onClose}
                                    className={`flex items-center px-2.5 py-1.5 rounded-md text-xs transition-all duration-300 relative ${
                                      isSubActive
                                        ? theme === 'dark'
                                          ? 'text-white bg-gray-800/80 border border-gray-700/50'
                                          : 'text-gray-900 bg-gray-100 border border-gray-200'
                                        : theme === 'dark'
                                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="mr-2 text-gray-500">-</span>
                                    <span className="font-medium">{subItem.name}</span>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center px-2.5 py-2 rounded-md transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? theme === 'dark'
                            ? 'text-white bg-gray-800/80 border border-gray-700/50'
                            : 'text-gray-900 bg-gray-100 border border-gray-200'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`absolute inset-0 rounded-md ${
                            theme === 'dark'
                              ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/30'
                              : 'bg-gradient-to-r from-gray-100/80 to-gray-50/50'
                          }`}
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35
                          }}
                        />
                      )}
                      <motion.div
                        className="flex items-center relative z-10"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <link.Icon className="w-4 h-4 mr-2.5 flex-shrink-0" />
                        <span className="font-medium text-sm">{link.name}</span>
                      </motion.div>
                    </Link>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* Footer */}
      <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
}