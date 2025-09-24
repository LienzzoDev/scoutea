/**
 * Input Sanitization Functions
 * 
 * Provides comprehensive input sanitization to prevent XSS, injection attacks,
 * and other security vulnerabilities.
 */

import { logger } from '../logging/production-logger'

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;'
}

// SQL injection patterns to detect and block
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(--|\/\*|\*\/|;)/g,
  /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/gi,
  /(\b(XP_|SP_)\w+)/gi
]

// XSS patterns to detect and block
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi // Event handlers like onclick, onload, etc.
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi
]

export interface SanitizationOptions {
  allowHtml?: boolean
  maxLength?: number
  trimWhitespace?: boolean
  removeNullBytes?: boolean
  normalizeUnicode?: boolean
}

export interface SanitizationResult {
  sanitized: string
  wasModified: boolean
  threats: string[]
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match)
}

/**
 * Remove HTML tags from input
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Detect SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect XSS attempts
 */
export function detectXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(
  input: string,
  options: SanitizationOptions = {}
): SanitizationResult {
  const {
    allowHtml = false,
    maxLength = 10000,
    trimWhitespace = true,
    removeNullBytes = true,
    normalizeUnicode = true
  } = options

  let sanitized = input
  let wasModified = false
  const threats: string[] = []

  // Check for security threats first
  if (detectSqlInjection(sanitized)) {
    threats.push('SQL_INJECTION')
    logger.securityEvent('SQL injection attempt detected', 'high', { input: sanitized.substring(0, 100) })
  }

  if (detectXss(sanitized)) {
    threats.push('XSS')
    logger.securityEvent('XSS attempt detected', 'high', { input: sanitized.substring(0, 100) })
  }

  if (detectPathTraversal(sanitized)) {
    threats.push('PATH_TRAVERSAL')
    logger.securityEvent('Path traversal attempt detected', 'high', { input: sanitized.substring(0, 100) })
  }

  // If threats detected, return empty string or throw error
  if (threats.length > 0) {
    return {
      sanitized: '',
      wasModified: true,
      threats
    }
  }

  // Remove null bytes
  if (removeNullBytes && sanitized.includes('\0')) {
    sanitized = sanitized.replace(/\0/g, '')
    wasModified = true
  }

  // Normalize unicode
  if (normalizeUnicode) {
    const normalized = sanitized.normalize('NFC')
    if (normalized !== sanitized) {
      sanitized = normalized
      wasModified = true
    }
  }

  // Trim whitespace
  if (trimWhitespace) {
    const trimmed = sanitized.trim()
    if (trimmed !== sanitized) {
      sanitized = trimmed
      wasModified = true
    }
  }

  // Handle HTML
  if (!allowHtml) {
    const withoutHtml = stripHtml(sanitized)
    if (withoutHtml !== sanitized) {
      sanitized = withoutHtml
      wasModified = true
    }
  } else {
    const escaped = escapeHtml(sanitized)
    if (escaped !== sanitized) {
      sanitized = escaped
      wasModified = true
    }
  }

  // Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
    wasModified = true
  }

  return {
    sanitized,
    wasModified,
    threats
  }
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizationOptions = {}
): T {
  const sanitized = { ...obj }

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const result = sanitizeInput(value, options)
      if (result.threats.length > 0) {
        throw new Error(`Security threat detected in field ${key}: ${result.threats.join(', ')}`)
      }
      sanitized[key] = result.sanitized as T[Extract<keyof T, string>]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options) as T[Extract<keyof T, string>]
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeInput(item, options).sanitized
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>, options)
            : item
      ) as T[Extract<keyof T, string>]
    }
  }

  return sanitized
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email, { maxLength: 254, trimWhitespace: true })
  
  if (sanitized.threats.length > 0) {
    throw new Error('Invalid email format')
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized.sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized.sanitized.toLowerCase()
}

/**
 * Sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeInput(url, { maxLength: 2048, trimWhitespace: true })
  
  if (sanitized.threats.length > 0) {
    throw new Error('Invalid URL format')
  }

  // Only allow http and https protocols
  const urlRegex = /^https?:\/\/.+/i
  if (!urlRegex.test(sanitized.sanitized)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed')
  }

  return sanitized.sanitized
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  const sanitized = sanitizeInput(fileName, { maxLength: 255, trimWhitespace: true })
  
  if (sanitized.threats.length > 0) {
    throw new Error('Invalid file name')
  }

  // Remove dangerous characters
  const cleanFileName = sanitized.sanitized
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots

  if (cleanFileName.length === 0) {
    throw new Error('File name cannot be empty')
  }

  return cleanFileName
}

/**
 * Create a sanitization middleware for API routes
 */
export function createSanitizationMiddleware(options: SanitizationOptions = {}) {
  return function sanitizeRequestData<T extends Record<string, unknown>>(data: T): T {
    try {
      return sanitizeObject(data, options)
    } catch (error) {
      logger.securityEvent('Request sanitization failed', 'high', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: JSON.stringify(data).substring(0, 200)
      })
      throw error
    }
  }
}