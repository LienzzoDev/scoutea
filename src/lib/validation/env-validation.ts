/**
 * Environment Variable Validation
 * 
 * Validates all environment variables at startup to ensure
 * the application has all required configuration.
 */

import { z } from 'zod'

import { logger } from '../logging/production-logger'

// Define the schema for all environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database - required in production, optional in development
  DATABASE_URL: process.env.NODE_ENV === 'production' 
    ? z.string().url('DATABASE_URL must be a valid URL')
    : z.string().url('DATABASE_URL must be a valid URL').optional(),
  
  // Clerk Authentication - always required
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // Stripe Payment - required in production, optional in development
  STRIPE_SECRET_KEY: process.env.NODE_ENV === 'production'
    ? z.string().min(1, 'STRIPE_SECRET_KEY is required')
    : z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NODE_ENV === 'production'
    ? z.string().min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    : z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // API Keys (if any)
  API_SECRET_KEY: z.string().optional(),
  
  // Redis (if used for caching)
  REDIS_URL: z.string().url().optional(),
  
  // Email service (if used)
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Security
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional(),
  ENABLE_DEBUG_LOGGING: z.string().transform(val => val === 'true').optional(),
  
  // Rate limiting
  RATE_LIMIT_ENABLED: z.string().default('true').transform(val => val === 'true'),
  
  // File upload
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val, 10)).optional(),
  
  // Cache settings
  CACHE_TTL: z.string().transform(val => parseInt(val, 10)).optional(),
})

// Infer the type from the schema
export type Env = z.infer<typeof envSchema>

// Validate and export environment variables
let env: Env

try {
  env = envSchema.parse(process.env)
  logger.info('Environment variables validated successfully')
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join('\n')
    
    logger.error('Environment variable validation failed', error, {
      errors: errorMessages
    })
    
    console.error('❌ Environment variable validation failed:')
    console.error(errorMessages)
    
    // In production, exit the process if env vars are invalid
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  } else {
    logger.error('Unexpected error during environment validation', error as Error)
    console.error('❌ Unexpected error during environment validation:', error)
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
  
  // Fallback for development
  env = {} as Env
}

// Export validated environment variables
export { env }

// Helper functions for common environment checks
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}

export function getDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    if (isDevelopment()) {
      console.warn('⚠️ DATABASE_URL is not configured in development')
      return 'postgresql://localhost:5432/dev'
    }
    throw new Error('DATABASE_URL is not configured')
  }
  return env.DATABASE_URL
}

export function getClerkKeys(): { publishable: string; secret: string } {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    throw new Error('Clerk keys are not properly configured')
  }
  
  return {
    publishable: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secret: env.CLERK_SECRET_KEY
  }
}

export function getStripeKeys(): { publishable: string; secret: string } {
  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !env.STRIPE_SECRET_KEY) {
    if (isDevelopment()) {
      console.warn('⚠️ Stripe keys are not configured in development')
      return {
        publishable: 'pk_test_development',
        secret: 'sk_test_development'
      }
    }
    throw new Error('Stripe keys are not properly configured')
  }
  
  return {
    publishable: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secret: env.STRIPE_SECRET_KEY
  }
}

export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function isAnalyticsEnabled(): boolean {
  return env.ENABLE_ANALYTICS === true && !!env.GOOGLE_ANALYTICS_ID
}

export function isDebugLoggingEnabled(): boolean {
  return env.ENABLE_DEBUG_LOGGING === true || isDevelopment()
}

export function isRateLimitEnabled(): boolean {
  return env.RATE_LIMIT_ENABLED === true
}

export function getMaxFileSize(): number {
  return env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
}

export function getCacheTTL(): number {
  return env.CACHE_TTL || 3600 // 1 hour default
}

// Validate specific environment requirements for different features
export function validateDatabaseConfig(): void {
  if (!env.DATABASE_URL) {
    if (isDevelopment()) {
      console.warn('⚠️ Database configuration incomplete in development')
      return
    }
    throw new Error('Database configuration is incomplete')
  }
  
  logger.info('Database configuration validated')
}

export function validateAuthConfig(): void {
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
    throw new Error('Authentication configuration is incomplete')
  }
  
  logger.info('Authentication configuration validated')
}

export function validatePaymentConfig(): void {
  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !env.STRIPE_SECRET_KEY) {
    if (isDevelopment()) {
      console.warn('⚠️ Payment configuration incomplete in development')
      return
    }
    throw new Error('Payment configuration is incomplete')
  }
  
  logger.info('Payment configuration validated')
}

// Initialize all required configurations
export function initializeEnvironment(): void {
  try {
    validateDatabaseConfig()
    validateAuthConfig()
    validatePaymentConfig()
    
    logger.info('All environment configurations initialized successfully')
  } catch (error) {
    logger.error('Environment initialization failed', error as Error)
    
    if (isProduction()) {
      throw error
    }
  }
}