import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Scoutea - Web Scraping & Analytics",
  description: "Plataforma avanzada de web scraping y análisis de datos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider 
      localization={{
        locale: 'es-ES'
      }}
      appearance={{
        theme: shadcn,
        variables: {
          colorPrimary: '#f97316', // orange-500
          colorBackground: '#ffffff',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorInputBackground: '#ffffff',
          colorBorder: '#e2e8f0',
          colorInputText: '#1e293b',
          borderRadius: '0.5rem',
        }
      }}
    >
      
      <html lang="es">
        <body className={`${plusJakartaSans.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}