/**
 * Next.js Instrumentation File
 *
 * TEMPORARILY DISABLED - Sentry integration disabled due to build conflicts
 *
 * This file is used to initialize Sentry on the server and edge runtime.
 * It's automatically loaded by Next.js during the application startup.
 *
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

// import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Sentry temporarily disabled - re-enable after resolving build issues
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   // Server-side initialization
  //   await import('../sentry.server.config')
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   // Edge runtime initialization (middleware, edge functions)
  //   await import('../sentry.edge.config')
  // }
}

export async function onRequestError(
  err: Error,
  request: {
    method?: string
    path?: string
    headers?: Record<string, string>
  }
) {
  // Sentry temporarily disabled - log to console instead
  console.error('Request error:', err, {
    method: request.method,
    path: request.path,
  })

  // Capture errors from nested React Server Components
  // Sentry.captureException(err, {
  //   contexts: {
  //     nextjs: {
  //       request: {
  //         method: request.method,
  //         path: request.path,
  //         headers: request.headers,
  //       },
  //     },
  //   },
  // })
}
