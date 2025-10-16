import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Slow query threshold (1 second)
const SLOW_QUERY_THRESHOLD = 1000

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
}).$extends({
  name: 'slow-query-logger',
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = Date.now()
      const result = await query(args)
      const duration = Date.now() - start

      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn('🐌 Slow query detected:', {
          model,
          operation,
          duration: `${duration}ms`,
          args: JSON.stringify(args).slice(0, 200) + '...',
          timestamp: new Date().toISOString()
        })
      }

      return result
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Performance monitoring utilities
export const dbMetrics = {
  slowQueries: [] as Array<{ model: string; operation: string; duration: number; timestamp: Date }>,

  recordSlowQuery(model: string, operation: string, duration: number) {
    this.slowQueries.push({
      model,
      operation,
      duration,
      timestamp: new Date()
    })

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift()
    }
  },

  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  },

  clearMetrics() {
    this.slowQueries = []
  }
}
