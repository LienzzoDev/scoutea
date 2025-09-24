/**
 * Secure Cookie Configuration
 * 
 * Provides secure cookie settings with HttpOnly, Secure, and SameSite attributes
 * to prevent XSS, CSRF, and other cookie-based attacks.
 */

import { env, isProduction } from '../validation/env-validation'

export interface SecureCookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

// Default secure cookie configuration
export const DEFAULT_COOKIE_CONFIG: Required<SecureCookieOptions> = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  domain: undefined as any // Will be set based on environment
}

// Session cookie configuration
export const SESSION_COOKIE_CONFIG: SecureCookieOptions = {
  ...DEFAULT_COOKIE_CONFIG,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: 'lax'
}

// Authentication cookie configuration
export const AUTH_COOKIE_CONFIG: SecureCookieOptions = {
  ...DEFAULT_COOKIE_CONFIG,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: 'lax'
}

// CSRF token cookie configuration
export const CSRF_COOKIE_CONFIG: SecureCookieOptions = {
  ...DEFAULT_COOKIE_CONFIG,
  httpOnly: false, // CSRF tokens need to be accessible to JavaScript
  maxAge: 60 * 60 * 24, // 24 hours
  sameSite: 'strict'
}

// Preference cookie configuration (non-sensitive)
export const PREFERENCE_COOKIE_CONFIG: SecureCookieOptions = {
  httpOnly: false,
  secure: isProduction(),
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: '/'
}

/**
 * Get cookie configuration based on cookie type
 */
export function getCookieConfig(type: 'session' | 'auth' | 'csrf' | 'preference' | 'default'): SecureCookieOptions {
  switch (type) {
    case 'session':
      return SESSION_COOKIE_CONFIG
    case 'auth':
      return AUTH_COOKIE_CONFIG
    case 'csrf':
      return CSRF_COOKIE_CONFIG
    case 'preference':
      return PREFERENCE_COOKIE_CONFIG
    default:
      return DEFAULT_COOKIE_CONFIG
  }
}

/**
 * Create a secure cookie string
 */
export function createSecureCookie(
  name: string,
  value: string,
  options: SecureCookieOptions = {}
): string {
  const config = { ...DEFAULT_COOKIE_CONFIG, ...options }
  
  let cookieString = `${name}=${encodeURIComponent(value)}`
  
  if (config.maxAge) {
    cookieString += `; Max-Age=${config.maxAge}`
  }
  
  if (config.path) {
    cookieString += `; Path=${config.path}`
  }
  
  if (config.domain) {
    cookieString += `; Domain=${config.domain}`
  }
  
  if (config.secure) {
    cookieString += '; Secure'
  }
  
  if (config.httpOnly) {
    cookieString += '; HttpOnly'
  }
  
  if (config.sameSite) {
    cookieString += `; SameSite=${config.sameSite}`
  }
  
  return cookieString
}

/**
 * Parse cookie string into key-value pairs
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (!cookieString) return cookies
  
  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='))
    }
  })
  
  return cookies
}

/**
 * Create a cookie deletion string
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): string {
  let cookieString = `${name}=; Max-Age=0; Path=${path}`
  
  if (domain) {
    cookieString += `; Domain=${domain}`
  }
  
  return cookieString
}

/**
 * Validate cookie name and value
 */
export function validateCookie(name: string, value: string): boolean {
  // Cookie name validation (RFC 6265)
  const nameRegex = /^[a-zA-Z0-9!#$&-^_`|~]+$/
  if (!nameRegex.test(name)) {
    return false
  }
  
  // Cookie value validation (no control characters)
  const valueRegex = /^[^\x00-\x1F\x7F]*$/
  if (!valueRegex.test(value)) {
    return false
  }
  
  return true
}

/**
 * Cookie security headers for Next.js middleware
 */
export const COOKIE_SECURITY_HEADERS = {
  'Set-Cookie': [
    // Secure session configuration
    `__Secure-next-auth.session-token=; Path=/; Secure; HttpOnly; SameSite=lax`,
    `__Host-next-auth.csrf-token=; Path=/; Secure; HttpOnly; SameSite=strict`
  ]
}

/**
 * Get domain for cookie based on environment
 */
export function getCookieDomain(): string | undefined {
  if (isProduction()) {
    // Extract domain from APP_URL in production
    try {
      const url = new URL(env.NEXT_PUBLIC_APP_URL || '')
      return url.hostname
    } catch {
      return undefined
    }
  }
  
  // No domain restriction in development
  return undefined
}

/**
 * Cookie configuration for Clerk authentication
 */
export const CLERK_COOKIE_CONFIG = {
  secure: isProduction(),
  sameSite: 'lax' as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7 // 7 days
}

/**
 * Cookie configuration for Stripe
 */
export const STRIPE_COOKIE_CONFIG = {
  secure: isProduction(),
  sameSite: 'strict' as const,
  httpOnly: true,
  maxAge: 60 * 60 // 1 hour
}