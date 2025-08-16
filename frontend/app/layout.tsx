import type { Metadata } from 'next'
import './(public)/globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'A1Dev',
  description: 'A1Dev Application - Next Generation Platform',
  icons: {
    icon: [
      { url: '/A1Dev Neon.png', sizes: '32x32', type: 'image/png' },
      { url: '/A1Dev White.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/A1Dev Neon.png',
    shortcut: '/A1Dev Neon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  expand={false}
                  duration={4000}
                />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}