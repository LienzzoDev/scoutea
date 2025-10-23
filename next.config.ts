import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers configuration - disabled in development to avoid Server Actions issues
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isProduction = process.env.NODE_ENV === 'production'

    // Skip CSP in development to avoid Server Actions conflicts
    if (isDevelopment) {
      return []
    }

    // Production CSP configuration - Updated to include Sentry
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.com https://challenges.cloudflare.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "img-src 'self' data: https: blob: https://*.clerk.accounts.dev https://*.clerk.dev https://img.clerk.com https://logos-world.net https://flagcdn.com https://img.a.transfermarkt.technology https://tmssl.akamaized.net",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://api.clerk.com https://clerk.com https://challenges.cloudflare.com https://clerk-telemetry.com https://vercel.live https://*.ingest.sentry.io",
      "frame-src https://js.stripe.com https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
      "worker-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev",
      "child-src 'self' blob: https://*.clerk.accounts.dev https://*.clerk.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.dev",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
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
  // Disable ESLint and TypeScript checking during builds for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuración condicional de webpack solo cuando no se usa Turbopack
  ...(process.env.TURBOPACK !== '1' && {
    webpack: (config) => {
      // Configuración básica de webpack para evitar errores
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }

      return config
    }
  }),
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
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.a.transfermarkt.technology',
        port: '',
        pathname: '/portrait/**',
      },
      {
        protocol: 'https',
        hostname: 'tmssl.akamaized.net',
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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the Sentry DSN is configured in the environment variables before enabling this option.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,

  // Disable telemetry to reduce dependencies
  telemetry: false,

  // Skip source map upload if no auth token is available
  authToken: process.env.SENTRY_AUTH_TOKEN,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
