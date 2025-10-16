/**
 * Request Sanitizer and Enhanced Validation
 * 
 * Provides comprehensive request sanitization and validation including:
 * - Input sanitization to prevent injection attacks
 * - Rate limiting validation
 * - Content type validation
 * - Request size validation
 * - SQL injection prevention
 * - XSS prevention
 * - CSRF protection helpers
 * 
 * Requirements addressed:
 * - 2.3: Request validation and sanitization
 * - 2.4: Injection attack prevention
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'

import { logger } from '../logging/production-logger'

export interface SanitizationConfig {
  maxStringLength: number
  maxArrayLength: number
  maxObjectDepth: number
  allowedHtmlTags: string[]
  blockedPatterns: RegExp[]
  maxRequestSize: number
  enableXSSProtection: boolean
  enableSQLInjectionProtection: boolean
}

export interface ValidationContext {
  requestId?: string
  userId?: string
  userAgent?: string
  ipAddress?: string
  timestamp: number
}

export interface SanitizationResult<T> {
  success: boolean
  data?: T
  errors: string[]
  warnings: string[]
  sanitized: boolean
  blocked: boolean
  context: ValidationContext
}

/**
 * Request Sanitizer - Main class for sanitizing and validating requests
 */
export class RequestSanitizer {
  private config: SanitizationConfig

  constructor(config?: Partial<SanitizationConfig>) {
    this.config = {
      maxStringLength: 10000,
      maxArrayLength: 1000,
      maxObjectDepth: 10,
      allowedHtmlTags: [], // No HTML allowed by default
      blockedPatterns: [
        // SQL Injection patterns
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /('|(\\')|(;)|(--)|(\|)|(\*)|(%)|(\+)|(=))/,
        
        // XSS patterns
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/i,
        /on\w+\s*=/i,
        
        // Path traversal
        /\.\.\//,
        /\.\.\\/,
        
        // Command injection
        /[;&|`$(){}[\]]/,
        
        // LDAP injection
        /[()&|!]/,
        
        // NoSQL injection
        /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex/i
      ],
      maxRequestSize: 1024 * 1024, // 1MB
      enableXSSProtection: true,
      enableSQLInjectionProtection: true,
      ...config
    }
  }

  /**
   * Sanitize and validate a complete request
   */
  async sanitizeRequest<T>(
    __request: NextRequest,
    schema: z.ZodSchema<T>,
    context?: Partial<ValidationContext>
  ): Promise<SanitizationResult<T>> {
    const fullContext: ValidationContext = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: context?.userId,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ipAddress: this.getClientIP(request),
      timestamp: Date.now(),
      ...context
    }

    const result: SanitizationResult<T> = {
      success: false,
      errors: [],
      warnings: [],
      sanitized: false,
      blocked: false,
      _context: fullContext
    }

    try {
      // 1. Validate request size
      const sizeValidation = await this.validateRequestSize(request)
      if (!sizeValidation.valid) {
        result.errors.push(sizeValidation.error!)
        result.blocked = true
        return result
      }

      // 2. Validate content type
      const contentTypeValidation = this.validateContentType(request)
      if (!contentTypeValidation.valid) {
        result.errors.push(contentTypeValidation.error!)
        result.blocked = true
        return result
      }

      // 3. Extract and sanitize request data
      let rawData: any
      try {
        if (request.method === 'GET') {
          rawData = this.extractQueryParams(request)
        } else {
          rawData = await request.json()
        }
      } catch (_error) {
        result.errors.push('Invalid request format or malformed JSON')
        result.blocked = true
        return result
      }

      // 4. Sanitize the data
      const sanitizationResult = this.sanitizeData(rawData)
      result.sanitized = sanitizationResult.sanitized
      result.warnings.push(...sanitizationResult.warnings)

      if (sanitizationResult.blocked) {
        result.errors.push(...sanitizationResult.errors)
        result.blocked = true
        return result
      }

      // 5. Validate against schema
      try {
        const validatedData = schema.parse(sanitizationResult.data)
        result.success = true
        result.data = validatedData
        return result
      } catch (_error) {
        if (error instanceof z.ZodError) {
          result.errors.push(...(error.errors || []).map(err => 
            `${(err.path || []).join('.')}: ${err.message || 'Validation error'}`
          ))
        } else {
          result.errors.push('Schema validation failed')
        }
        return result
      }

    } catch (_error) {
      result.errors.push(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Sanitize data recursively
   */
  private sanitizeData(
    data: unknown,
    depth: number = 0
  ): {
    data: any
    sanitized: boolean
    blocked: boolean
    errors: string[]
    warnings: string[]
  } {
    const result = {
      data: data,
      sanitized: false,
      blocked: false,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Check depth limit
    if (depth > this.config.maxObjectDepth) {
      result.errors.push(`Object depth exceeds maximum allowed (${this.config.maxObjectDepth})`)
      result.blocked = true
      return result
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data)
    }

    if (Array.isArray(data)) {
      if (data.length > this.config.maxArrayLength) {
        result.errors.push(`Array length exceeds maximum allowed (${this.config.maxArrayLength})`)
        result.blocked = true
        return result
      }

      const sanitizedArray = []
      let arraySanitized = false

      for (const item of data) {
        const itemResult = this.sanitizeData(item, depth + 1)
        
        if (itemResult.blocked) {
          result.errors.push(...itemResult.errors)
          result.blocked = true
          return result
        }

        sanitizedArray.push(itemResult.data)
        if (itemResult.sanitized) {
          arraySanitized = true
        }
        result.warnings.push(...itemResult.warnings)
      }

      result.data = sanitizedArray
      result.sanitized = arraySanitized
      return result
    }

    if (data && typeof data === 'object') {
      const sanitizedObject: unknown = {}
      let objectSanitized = false

      for (const [key, value] of Object.entries(data)) {
        // Sanitize the key
        const keyResult = this.sanitizeString(key)
        if (keyResult.blocked) {
          result.errors.push(`Object key blocked: ${key}`)
          result.blocked = true
          return result
        }

        // Sanitize the value
        const valueResult = this.sanitizeData(value, depth + 1)
        if (valueResult.blocked) {
          result.errors.push(...valueResult.errors)
          result.blocked = true
          return result
        }

        sanitizedObject[keyResult.data] = valueResult.data
        
        if (keyResult.sanitized || valueResult.sanitized) {
          objectSanitized = true
        }
        
        result.warnings.push(...keyResult.warnings, ...valueResult.warnings)
      }

      result.data = sanitizedObject
      result.sanitized = objectSanitized
      return result
    }

    // For primitive types (number, boolean, null), return as-is
    return result
  }

  /**
   * Sanitize string values
   */
  private sanitizeString(str: string): {
    data: string
    sanitized: boolean
    blocked: boolean
    errors: string[]
    warnings: string[]
  } {
    const result = {
      data: str,
      sanitized: false,
      blocked: false,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Check length
    if (str.length > this.config.maxStringLength) {
      result.errors.push(`String length exceeds maximum allowed (${this.config.maxStringLength})`)
      result.blocked = true
      return result
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(str)) {
        result.errors.push(`String contains blocked pattern: ${pattern.source}`)
        result.blocked = true
        return result
      }
    }

    let sanitized = str

    // XSS Protection
    if (this.config.enableXSSProtection) {
      const originalLength = sanitized.length
      sanitized = this.sanitizeXSS(sanitized)
      if (sanitized.length !== originalLength) {
        result.sanitized = true
        result.warnings.push('XSS patterns removed from string')
      }
    }

    // SQL Injection Protection
    if (this.config.enableSQLInjectionProtection) {
      const originalSanitized = sanitized
      sanitized = this.sanitizeSQLInjection(sanitized)
      if (sanitized !== originalSanitized) {
        result.sanitized = true
        result.warnings.push('SQL injection patterns sanitized')
      }
    }

    // Normalize whitespace
    const normalizedSanitized = sanitized.trim().replace(/\s+/g, ' ')
    if (normalizedSanitized !== sanitized) {
      result.sanitized = true
      result.warnings.push('Whitespace normalized')
    }

    result.data = normalizedSanitized
    return result
  }

  /**
   * Sanitize XSS patterns
   */
  private sanitizeXSS(str: string): string {
    return str
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove style attributes that could contain expressions
      .replace(/style\s*=\s*["'][^"']*["']/gi, '')
      // Encode HTML entities
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Sanitize SQL injection patterns
   */
  private sanitizeSQLInjection(str: string): string {
    return str
      // Remove SQL comments
      .replace(/--.*$/gm, '')
      .replace(/\/\*.*?\*\//gs, '')
      // Escape single quotes
      .replace(/'/g, "''")
      // Remove or escape dangerous characters
      .replace(/[;\\]/g, '')
  }

  /**
   * Validate request size
   */
  private async validateRequestSize(__request: NextRequest): Promise<{
    valid: boolean
    error?: string
  }> {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      if (size > this.config.maxRequestSize) {
        return {
          valid: false,
          _error: `Request size (${size} bytes) exceeds maximum allowed (${this.config.maxRequestSize} bytes)`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate content type
   */
  private validateContentType(_request: NextRequest): {
    valid: boolean
    error?: string
  } {
    const contentType = request.headers.get('content-type')
    
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!contentType) {
        return {
          valid: false,
          _error: 'Content-Type header is required for non-GET requests'
        }
      }

      const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ]

      const isAllowed = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type)
      )

      if (!isAllowed) {
        return {
          valid: false,
          _error: `Content-Type '${contentType}' is not allowed`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Extract query parameters safely
   */
  private extractQueryParams(_request: NextRequest): Record<string, string> {
    const params: Record<string, string> = {}
    const url = new URL(request.url)
    
    for (const [key, value] of url.searchParams.entries()) {
      // Limit parameter name and value length
      if (key.length <= 100 && value.length <= 1000) {
        params[key] = value
      }
    }
    
    return params
  }

  /**
   * Get client IP address safely
   */
  private getClientIP(__request: NextRequest): string {
    // Check various headers for IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP.trim()
    }
    
    if (clientIP) {
      return clientIP.trim()
    }
    
    return 'unknown'
  }

  /**
   * Create rate limiting key for the request
   */
  createRateLimitKey(__request: NextRequest, userId?: string): string {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    if (userId) {
      return `user:${userId}`
    }
    
    // Create a hash of IP + User Agent for anonymous users
    return `ip:${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 10)}`
  }

  /**
   * Validate request headers for security
   */
  validateSecurityHeaders(__request: NextRequest): {
    valid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []
    
    // Check for suspicious user agents
    const userAgent = request.headers.get('user-agent')
    if (!userAgent) {
      warnings.push('Missing User-Agent header')
    } else if (userAgent.length > 500) {
      errors.push('User-Agent header too long')
    }
    
    // Check for suspicious referer
    const referer = request.headers.get('referer')
    if (referer && referer.length > 1000) {
      errors.push('Referer header too long')
    }
    
    // Check for CSRF token in non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const csrfToken = request.headers.get('x-csrf-token')
      if (!csrfToken) {
        warnings.push('Missing CSRF token')
      }
    }
    
    return {
      valid: errors.length === 0,
      warnings,
      errors
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: 'blocked' | 'sanitized' | 'warning',
    details: {
      requestId: string
      userId?: string
      ipAddress: string
      userAgent: string
      reason: string
      data?: any
    }
  ): void {
    const severity = event === 'blocked' ? 'high' : event === 'warning' ? 'medium' : 'low'
    logger.securityEvent(event, severity, details)
  }
}

// Singleton instance
let sanitizerInstance: RequestSanitizer | null = null

/**
 * Get the global request sanitizer instance
 */
export function getRequestSanitizer(config?: Partial<SanitizationConfig>): RequestSanitizer {
  if (!sanitizerInstance) {
    sanitizerInstance = new RequestSanitizer(config)
  }
  return sanitizerInstance
}

/**
 * Reset the sanitizer instance (useful for testing)
 */
export function resetRequestSanitizer(): void {
  sanitizerInstance = null
}

/**
 * Convenience function to sanitize a request
 */
export async function sanitizeRequest<T>(
  __request: NextRequest,
  schema: z.ZodSchema<T>,
  context?: Partial<ValidationContext>
): Promise<SanitizationResult<T>> {
  const sanitizer = getRequestSanitizer()
  return await sanitizer.sanitizeRequest(request, schema, context)
}

/**
 * Middleware helper for request sanitization
 */
export function createSanitizationMiddleware(config?: Partial<SanitizationConfig>) {
  const sanitizer = new RequestSanitizer(config)
  
  return async function sanitizationMiddleware<T>(
    __request: NextRequest,
    schema: z.ZodSchema<T>,
    context?: Partial<ValidationContext>
  ): Promise<SanitizationResult<T>> {
    return await sanitizer.sanitizeRequest(request, schema, context)
  }
}