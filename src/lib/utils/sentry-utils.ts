/**
 * Sentry Utility Functions
 *
 * Helper functions for working with Sentry error tracking and monitoring.
 * Use these utilities to add context and capture errors consistently across the app.
 */

import * as Sentry from '@sentry/nextjs'

/**
 * Capture an error with additional context
 *
 * @example
 * ```typescript
 * try {
 *   await fetchPlayerData(playerId)
 * } catch (error) {
 *   captureErrorWithContext(error, {
 *     tags: { section: 'player-profile' },
 *     context: { playerId, userId }
 *   })
 * }
 * ```
 */
export function captureErrorWithContext(
  error: unknown,
  options?: {
    tags?: Record<string, string>
    context?: Record<string, unknown>
    level?: Sentry.SeverityLevel
    user?: { id: string; email?: string; username?: string }
  }
) {
  const { tags, context, level, user } = options || {}

  Sentry.withScope((scope) => {
    // Add tags for filtering in Sentry
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    // Add custom context
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>)
      })
    }

    // Set severity level
    if (level) {
      scope.setLevel(level)
    }

    // Set user information
    if (user) {
      scope.setUser(user)
    }

    Sentry.captureException(error)
  })
}

/**
 * Capture a message with context
 *
 * @example
 * ```typescript
 * captureMessageWithContext('User attempted unauthorized action', {
 *   level: 'warning',
 *   tags: { section: 'admin', action: 'delete-player' },
 *   context: { userId, playerId }
 * })
 * ```
 */
export function captureMessageWithContext(
  message: string,
  options?: {
    level?: Sentry.SeverityLevel
    tags?: Record<string, string>
    context?: Record<string, unknown>
  }
) {
  const { level = 'info', tags, context } = options || {}

  Sentry.withScope((scope) => {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>)
      })
    }

    Sentry.captureMessage(message, level)
  })
}

/**
 * Set user context for all subsequent events
 * Call this when user logs in or authentication state changes
 *
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   role: user.role
 * })
 * ```
 */
export function setUserContext(user: {
  id: string
  email?: string
  username?: string
  role?: string
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    // Add custom fields
    ...(user.role && { role: user.role }),
  })
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs are shown in the error context to help trace what happened before the error
 *
 * @example
 * ```typescript
 * addBreadcrumb({
 *   category: 'player',
 *   message: 'Fetching player stats',
 *   data: { playerId, period: '3m' }
 * })
 * ```
 */
export function addBreadcrumb(options: {
  category: string
  message: string
  level?: Sentry.SeverityLevel
  data?: Record<string, unknown>
}) {
  const { category, message, level = 'info', data } = options

  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Wrapper for API route error handling
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return await withSentryErrorHandling(
 *     async () => {
 *       const data = await fetchData()
 *       return NextResponse.json(data)
 *     },
 *     {
 *       tags: { route: '/api/players' },
 *       context: { method: 'GET' }
 *     }
 *   )
 * }
 * ```
 */
export async function withSentryErrorHandling<T>(
  handler: () => Promise<T>,
  options?: {
    tags?: Record<string, string>
    context?: Record<string, unknown>
  }
): Promise<T> {
  try {
    return await handler()
  } catch (error) {
    captureErrorWithContext(error, {
      tags: options?.tags,
      context: options?.context,
    })
    throw error
  }
}

/**
 * Start a Sentry transaction for performance monitoring
 *
 * @example
 * ```typescript
 * const transaction = startTransaction({
 *   name: 'Calculate Radar Metrics',
 *   op: 'calculation',
 *   tags: { playerId }
 * })
 *
 * try {
 *   // Do work
 *   await calculateMetrics()
 * } finally {
 *   transaction.finish()
 * }
 * ```
 */
export function startTransaction(options: {
  name: string
  op: string
  tags?: Record<string, string>
}) {
  const { name, op, tags } = options

  const transaction = Sentry.startTransaction({
    name,
    op,
  })

  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      transaction.setTag(key, value)
    })
  }

  return transaction
}
