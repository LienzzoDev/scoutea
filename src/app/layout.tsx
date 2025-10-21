import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/themes'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { ClerkErrorBoundary } from '@/components/auth/clerk-error-boundary'
import { clerkConfig } from '@/lib/clerk-config'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Scoutea - Web Scraping & Analytics',
  description: 'Plataforma avanzada de web scraping y análisis de datos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es' className='h-full overscroll-none' suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} h-full overscroll-none antialiased`} suppressHydrationWarning>
        <ClerkErrorBoundary>
          <ClerkProvider
            publishableKey={clerkConfig.publishableKey}
            localization={clerkConfig.localization}
            appearance={{
              baseTheme: shadcn,
              variables: clerkConfig.appearance.variables,
              elements: clerkConfig.appearance.elements,
            }}
          >
            {children}
          </ClerkProvider>
        </ClerkErrorBoundary>
      </body>
    </html>
  )
}
