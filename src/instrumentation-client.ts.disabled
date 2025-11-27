/**
 * Client-side Instrumentation
 *
 * This file configures Sentry for the client (browser) side.
 * This is the recommended approach for Next.js with Turbopack.
 *
 * Learn more: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Ignore common errors that don't need tracking
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Random plugins/extensions
    'ChunkLoadError',
  ],
});

// Export navigation instrumentation for Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
