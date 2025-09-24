import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/themes'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { ClerkErrorBoundary } from '@/components/auth/clerk-error-boundary'
import { ClerkLoadingState } from '@/components/auth/clerk-loading-state'
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
    <html lang='es'>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <ClerkErrorBoundary>
          <ClerkProvider
            publishableKey={clerkConfig.publishableKey}
            localization={clerkConfig.localization}
            appearance={{
              theme: shadcn,
              variables: clerkConfig.appearance.variables,
              elements: clerkConfig.appearance.elements,
            }}
          >
            <ClerkLoadingState>{children}</ClerkLoadingState>
          </ClerkProvider>
        </ClerkErrorBoundary>
      </body>
    </html>
  )
}
