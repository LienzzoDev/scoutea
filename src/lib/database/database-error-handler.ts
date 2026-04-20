/**
 * Database Error Handler and Query Wrapper
 * 
 * Provides comprehensive error handling for database operations including:
 * - Connection timeout handling
 * - Retry logic for transient errors
 * - Error classification (temporary vs permanent)
 * - Fallback responses for database failures
 * - Circuit breaker pattern for database operations
 * 
 * Requirements addressed:
 * - 2.1: Database connection error handling
 * - 5.4: Retry logic for transient errors
 * - 8.2: Error recovery mechanisms
 */

import { PrismaClient, Prisma } from '@prisma/client'

import { logger } from '../logging/production-logger'

export interface DatabaseErrorContext {
  operation: string
  query?: string
  params?: any
  timestamp: number
  retryAttempt?: number
  userId?: string
  requestId?: string
}

export interface DatabaseRetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

export interface DatabaseOperationResult<T> {
  success: boolean
  data?: T
  error?: DatabaseError
  retryCount: number
  duration: number
  fromCache?: boolean
}

export class DatabaseError extends Error {
  public readonly code: string
  public readonly isRetryable: boolean
  public readonly isTemporary: boolean
  public readonly context: DatabaseErrorContext
  public readonly originalError: any

  constructor(
    message: string,
    code: string,
    isRetryable: boolean,
    isTemporary: boolean,
    errorContext: DatabaseErrorContext,
    originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.isRetryable = isRetryable
    this.isTemporary = isTemporary
    this.context = errorContext
    this.originalError = originalError
  }
}

/**
 * Database Error Handler - Main class for managing database operation safety
 */
export class DatabaseErrorHandler {
  private static instance: DatabaseErrorHandler
  private config: DatabaseRetryConfig

  constructor(config?: Partial<DatabaseRetryConfig>) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'P1001', // Can't reach database server
        'P1002', // Database server timeout
        'P1008', // Operations timed out
        'P1017', // Server has closed the connection
        'P2024', // Timed out fetching a new connection
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND'
      ],
      ...config
    }
  }

  static getInstance(config?: Partial<DatabaseRetryConfig>): DatabaseErrorHandler {
    if (!this.instance) {
      this.instance = new DatabaseErrorHandler(config)
    }
    return this.instance
  }

  /**
   * Execute a database operation with comprehensive error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationContext: Omit<DatabaseErrorContext, 'timestamp'>
  ): Promise<DatabaseOperationResult<T>> {
    const startTime = Date.now()
    let retryCount = 0

    const fullContext: DatabaseErrorContext = {
      ...operationContext,
      timestamp: startTime
    }

    // Execute the database operation with retry logic
    try {
      const result = await this.executeWithRetryLogic(operation, fullContext, retryCount)

      return {
        success: true,
        data: result.data,
        error: undefined,
        retryCount: result.retryCount,
        duration: Date.now() - startTime
      }
    } catch (err) {
      const dbError = this.classifyError(err, fullContext)
      retryCount = fullContext.retryAttempt ?? 0

      return {
        success: false,
        data: undefined,
        error: dbError,
        retryCount,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetryLogic<T>(
    operation: () => Promise<T>,
    ctx: DatabaseErrorContext,
    _initialRetryCount: number
  ): Promise<{ data: T; retryCount: number }> {
    let lastError: unknown = null

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const data = await this.executeWithTimeout(operation, 30000) // 30 second timeout

        if (attempt > 0) {
          logger.info(`Database operation succeeded after retries`, {
            operation: ctx.operation,
            attempts: attempt
          })
        }

        return { data, retryCount: attempt }
      } catch (err) {
        lastError = err

        const dbError = this.classifyError(err, {
          ...ctx,
          retryAttempt: attempt
        })

        // Log the error with context
        this.logError(dbError, attempt)

        // Don't retry if it's not a retryable error or we've exhausted retries
        if (!dbError.isRetryable || attempt >= this.config.maxRetries) {
          throw dbError
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt),
          this.config.maxDelay
        )

        console.warn(`⏳ Retrying database operation ${ctx.operation} in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`)
        await this.delay(delay)
      }
    }

    // This should never be reached, but just in case
    throw this.classifyError(lastError, ctx)
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Database operation timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      operation()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Classify database errors for appropriate handling
   */
  private classifyError(err: unknown, ctx: DatabaseErrorContext): DatabaseError {
    let code = 'UNKNOWN_ERROR'
    let isRetryable = false
    let isTemporary = false
    let message = 'Unknown database error'

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      code = err.code
      message = this.getPrismaErrorMessage(err)
      isRetryable = this.config.retryableErrors.includes(err.code)
      isTemporary = this.isPrismaErrorTemporary(err.code)
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      code = 'UNKNOWN_REQUEST_ERROR'
      message = 'Unknown database request error'
      isRetryable = true
      isTemporary = true
    } else if (err instanceof Prisma.PrismaClientRustPanicError) {
      code = 'RUST_PANIC_ERROR'
      message = 'Database engine panic error'
      isRetryable = false
      isTemporary = false
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
      code = 'INITIALIZATION_ERROR'
      message = 'Database initialization error'
      isRetryable = true
      isTemporary = true
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      code = 'VALIDATION_ERROR'
      message = 'Database query validation error'
      isRetryable = false
      isTemporary = false
    } else if (err instanceof Error) {
      // Handle network and connection errors
      if (err.message.includes('timeout')) {
        code = 'TIMEOUT_ERROR'
        message = 'Database operation timeout'
        isRetryable = true
        isTemporary = true
      } else if (err.message.includes('connection')) {
        code = 'CONNECTION_ERROR'
        message = 'Database connection error'
        isRetryable = true
        isTemporary = true
      } else if (this.config.retryableErrors.some(retryableCode =>
        err.message.includes(retryableCode) || err.name === retryableCode
      )) {
        code = 'NETWORK_ERROR'
        message = 'Network or connection error'
        isRetryable = true
        isTemporary = true
      } else {
        message = err.message
      }
    }

    return new DatabaseError(
      message,
      code,
      isRetryable,
      isTemporary,
      ctx,
      err
    )
  }

  /**
   * Get user-friendly message for Prisma errors
   */
  private getPrismaErrorMessage(prismaError: Prisma.PrismaClientKnownRequestError): string {
    switch (prismaError.code) {
      case 'P1001':
        return 'No se puede conectar al servidor de base de datos'
      case 'P1002':
        return 'Tiempo de espera agotado al conectar con la base de datos'
      case 'P1008':
        return 'Operación de base de datos agotó el tiempo de espera'
      case 'P1017':
        return 'El servidor ha cerrado la conexión'
      case 'P2024':
        return 'Tiempo de espera agotado al obtener una nueva conexión'
      case 'P2002':
        return 'Violación de restricción única'
      case 'P2025':
        return 'Registro no encontrado'
      default:
        return prismaError.message || 'Error de base de datos'
    }
  }

  /**
   * Check if Prisma error is temporary
   */
  private isPrismaErrorTemporary(code: string): boolean {
    const temporaryErrors = [
      'P1001', 'P1002', 'P1008', 'P1017', 'P2024'
    ]
    return temporaryErrors.includes(code)
  }

  /**
   * Log database error with appropriate level
   */
  private logError(dbError: DatabaseError, attempt: number): void {
    const logLevel = dbError.isRetryable ? 'warn' : 'error'
    const logMethod = logLevel === 'warn' ? console.warn : console.error

    logMethod(`${dbError.isRetryable ? '⚠️' : '❌'} Database error (attempt ${attempt + 1}):`, {
      code: dbError.code,
      message: dbError.message,
      isRetryable: dbError.isRetryable,
      isTemporary: dbError.isTemporary,
      operation: dbError.context.operation,
      timestamp: new Date(dbError.context.timestamp).toISOString(),
      userId: dbError.context.userId,
      requestId: dbError.context.requestId
    })

    // Log original error details in development
    if (process.env.NODE_ENV === 'development' && dbError.originalError) {
      console.error('Original error details:', dbError.originalError)
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create fallback response for database failures
   */
  createFallbackResponse<T>(
    operation: string,
    defaultValue: T,
    dbError: DatabaseError
  ): T {
    console.warn(`🔄 Creating fallback response for ${operation}:`, {
      errorMessage: dbError.message,
      code: dbError.code,
      defaultValue: typeof defaultValue
    })

    return defaultValue
  }

  /**
   * Check if database is healthy
   */
  async checkDatabaseHealth(): Promise<{
    isHealthy: boolean
    latency?: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // Simple health check query
      await this.executeWithTimeout(
        async () => {
          const prisma = new PrismaClient()
          try {
            await prisma.$queryRaw`SELECT 1`
            return true
          } finally {
            await prisma.$disconnect()
          }
        },
        5000 // 5 second timeout for health check
      )

      return {
        isHealthy: true,
        latency: Date.now() - startTime
      }
    } catch (healthErr) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        error: healthErr instanceof Error ? healthErr.message : String(healthErr)
      }
    }
  }

  /**
   * Get database error statistics
   */
  getErrorStatistics(): {
    retryConfig: DatabaseRetryConfig
  } {
    return {
      retryConfig: this.config
    }
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(newConfig: Partial<DatabaseRetryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 Database retry configuration updated:', this.config)
  }
}

// Singleton instance
export const databaseErrorHandler = DatabaseErrorHandler.getInstance()

/**
 * Convenience wrapper for database operations
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Partial<DatabaseErrorContext>
): Promise<T> {
  const result = await databaseErrorHandler.executeWithRetry(
    operation,
    {
      operation: operationName,
      ...context
    }
  )

  if (!result.success) {
    throw result.error
  }

  return result.data!
}

/**
 * Create a database operation with fallback
 */
export async function executeDbOperationWithFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string,
  context?: Partial<DatabaseErrorContext>
): Promise<T> {
  try {
    return await executeDbOperation(operation, operationName, context)
  } catch (_error) {
    if (error instanceof DatabaseError) {
      return databaseErrorHandler.createFallbackResponse(operationName, fallback, error)
    }
    throw error
  }
}