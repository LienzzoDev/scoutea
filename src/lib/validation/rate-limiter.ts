/**
 * Rate Limiter for API Endpoints
 * 
 * Provides rate limiting functionality to prevent abuse and DoS attacks:
 * - Token bucket algorithm for smooth rate limiting
 * - Different limits for different endpoints
 * - User-based and IP-based limiting
 * - Automatic cleanup of expired entries
 * - Configurable time windows and limits
 * 
 * Requirements addressed:
 * - 2.3: Rate limiting for API endpoints
 * - 2.4: DoS attack prevention
 */

import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests: boolean // Don't count successful requests
  skipFailedRequests: boolean // Don't count failed requests
  keyGenerator?: (_request: NextRequest, userId?: string) => string
  onLimitReached?: (___key: string, __request: NextRequest) => void
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

/**
 * Rate Limiter using token bucket algorithm
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig
  private cleanupInterval?: NodeJS.Timeout

  constructor(_config: RateLimitConfig) {
    this.config = config
    
    // Start cleanup interval (only on client side to avoid server-side intervals)
    if (typeof window !== 'undefined') {
      this.startCleanup()
    }
  }

  /**
   * Check if request is allowed
   */
  checkLimit(__request: NextRequest, userId?: string): RateLimitResult {
    const _key = this.config.keyGenerator 
      ? this.config.keyGenerator(request, userId)
      : this.defaultKeyGenerator(request, userId)
    
    const now = Date.now()
    const entry = this.store.get(key)

    // If no entry exists, create one
    if (!entry) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      })

      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // If window has expired, reset
    if (now >= entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      })

      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      if (this.config.onLimitReached) {
        this.config.onLimitReached(key, request)
      }

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    // Increment count
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Record a successful request (if configured to skip successful requests)
   */
  recordSuccess(__request: NextRequest, userId?: string): void {
    if (!this.config.skipSuccessfulRequests) {
      return
    }

    const _key = this.config.keyGenerator 
      ? this.config.keyGenerator(request, userId)
      : this.defaultKeyGenerator(request, userId)
    
    const entry = this.store.get(key)
    if (entry && entry.count > 0) {
      entry.count--
      this.store.set(key, entry)
    }
  }

  /**
   * Record a failed request (if configured to skip failed requests)
   */
  recordFailure(__request: NextRequest, userId?: string): void {
    if (!this.config.skipFailedRequests) {
      return
    }

    const _key = this.config.keyGenerator 
      ? this.config.keyGenerator(request, userId)
      : this.defaultKeyGenerator(request, userId)
    
    const entry = this.store.get(key)
    if (entry && entry.count > 0) {
      entry.count--
      this.store.set(key, entry)
    }
  }

  /**
   * Default key generator
   */
  private defaultKeyGenerator(__request: NextRequest, userId?: string): string {
    if (userId) {
      return `user:${userId}:${request.nextUrl.pathname}`
    }

    const ip = this.getClientIP(request)
    return `ip:${ip}:${request.nextUrl.pathname}`
  }

  /**
   * Get client IP address
   */
  private getClientIP(_request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP.trim()
    }
    
    return 'unknown'
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.windowMs)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key)
    }

    if (process.env.NODE_ENV === 'development' && keysToDelete.length > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Get current statistics
   */
  getStats(): {
    totalEntries: number
    activeEntries: number
    config: RateLimitConfig
  } {
    const now = Date.now()
    let activeEntries = 0

    for (const entry of this.store.values()) {
      if (now < entry.resetTime) {
        activeEntries++
      }
    }

    return {
      totalEntries: this.store.size,
      activeEntries,
      config: this.config
    }
  }

  /**
   * Reset all entries (useful for testing)
   */
  reset(): void {
    this.store.clear()
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    this.store.clear()
  }
}

/**
 * Rate Limiter Manager - Manages multiple rate limiters for different endpoints
 */
export class RateLimiterManager {
  private limiters = new Map<string, RateLimiter>()
  private defaultConfig: RateLimitConfig

  constructor(defaultConfig?: Partial<RateLimitConfig>) {
    this.defaultConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...defaultConfig
    }
  }

  /**
   * Create or get a rate limiter for a specific endpoint
   */
  getLimiter(endpoint: string, config?: Partial<RateLimitConfig>): RateLimiter {
    if (!this.limiters.has(endpoint)) {
      const limiterConfig = { ...this.defaultConfig, ...config }
      this.limiters.set(endpoint, new RateLimiter(limiterConfig))
    }
    
    return this.limiters.get(endpoint)!
  }

  /**
   * Check rate limit for a specific endpoint
   */
  checkLimit(
    endpoint: string, 
    __request: NextRequest, 
    userId?: string,
    config?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const limiter = this.getLimiter(endpoint, config)
    return limiter.checkLimit(request, userId)
  }

  /**
   * Get statistics for all limiters
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [endpoint, limiter] of this.limiters.entries()) {
      stats[endpoint] = limiter.getStats()
    }
    
    return stats
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.reset()
    }
  }

  /**
   * Destroy all limiters
   */
  destroy(): void {
    for (const limiter of this.limiters.values()) {
      limiter.destroy()
    }
    this.limiters.clear()
  }
}

// Predefined rate limit configurations for different endpoints
export const RateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true
  },

  // Moderate limits for search endpoints
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    skipSuccessfulRequests: false
  },

  // Generous limits for read operations
  read: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: false
  },

  // Strict limits for write operations
  write: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    skipSuccessfulRequests: false
  },

  // Very strict limits for admin operations
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 requests per 5 minutes
    skipSuccessfulRequests: false
  }
} as const

// Global rate limiter manager instance
let globalRateLimiterManager: RateLimiterManager | null = null

/**
 * Get the global rate limiter manager
 */
export function getRateLimiterManager(config?: Partial<RateLimitConfig>): RateLimiterManager {
  if (!globalRateLimiterManager) {
    globalRateLimiterManager = new RateLimiterManager(config)
  }
  return globalRateLimiterManager
}

/**
 * Reset the global rate limiter manager
 */
export function resetRateLimiterManager(): void {
  if (globalRateLimiterManager) {
    globalRateLimiterManager.destroy()
    globalRateLimiterManager = null
  }
}

/**
 * Convenience function to check rate limit
 */
export function checkRateLimit(
  endpoint: string,
  __request: NextRequest,
  userId?: string,
  config?: Partial<RateLimitConfig>
): RateLimitResult {
  const manager = getRateLimiterManager()
  return manager.checkLimit(endpoint, request, userId, config)
}

/**
 * Middleware helper for rate limiting
 */
export function createRateLimitMiddleware(
  endpoint: string,
  config?: Partial<RateLimitConfig>
) {
  return function rateLimitMiddleware(
    __request: NextRequest,
    userId?: string
  ): RateLimitResult {
    return checkRateLimit(endpoint, request, userId, config)
  }
}