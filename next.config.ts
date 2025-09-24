import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers configuration
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // More permissive CSP for development, stricter for production
    const cspDirectives = [
      "default-src 'self'",
      isDevelopment 
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: localhost:*"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "img-src 'self' data: https: blob: https://*.clerk.accounts.dev https://*.clerk.dev https://img.clerk.com",
      isDevelopment
        ? "connect-src 'self' https: http: ws: wss: localhost:*"
        : "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://api.clerk.com https://clerk.com",
      "frame-src https://js.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "worker-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev",
      "child-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.dev",
      "frame-ancestors 'none'",
      ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
    ]

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ]
  },
  // Remove console.log statements in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    optimizePackageImports: [],
  },
  webpack: (config) => {
    // Configuración básica de webpack para evitar errores
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    
    return config
  },
  // Configuración para evitar problemas de caché
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Deshabilitar prerendering para páginas problemáticas
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.accounts.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clerk.dev',
        port: '',
        pathname: '/**',
      }
    ],
    deviceSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    imageSizes: [12, 16, 20, 24, 32, 40, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
