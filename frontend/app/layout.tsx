import type { Metadata } from 'next'
import './(public)/globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'A1Dev',
  description: 'A1Dev Application - Next Generation Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              expand={false}
              duration={4000}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}