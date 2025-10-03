/**
 * Servicio de reintentos para webhooks fallidos
 * Implementa retry con backoff exponencial
 */

import { logger } from '../logging/production-logger'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number // en milisegundos
  maxDelay: number
  backoffMultiplier: number
}

export interface RetryableOperation<T> {
  operation: () => Promise<T>
  operationName: string
  context?: Record<string, any>
}

export class WebhookRetryService {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 30000, // 30 segundos
    backoffMultiplier: 2
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  static async executeWithRetry<T>(
    retryableOp: RetryableOperation<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<{ success: boolean; result?: T; error?: string; attempts: number }> {
    const finalConfig = { ...this.defaultConfig, ...config }
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        logger.info(`Executing ${retryableOp.operationName} - Attempt ${attempt}/${finalConfig.maxRetries}`, {
          ...retryableOp.context,
          attempt
        })

        const result = await retryableOp.operation()
        
        logger.info(`${retryableOp.operationName} succeeded on attempt ${attempt}`, {
          ...retryableOp.context,
          attempt
        })

        return {
          success: true,
          result,
          attempts: attempt
        }

      } catch (error) {
        lastError = error as Error
        
        logger.warn(`${retryableOp.operationName} failed on attempt ${attempt}`, {
          ...retryableOp.context,
          attempt,
          error: lastError.message,
          willRetry: attempt < finalConfig.maxRetries
        })

        // Si no es el último intento, esperar antes del siguiente
        if (attempt < finalConfig.maxRetries) {
          const delay = Math.min(
            finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
            finalConfig.maxDelay
          )
          
          logger.info(`Waiting ${delay}ms before retry`, {
            ...retryableOp.context,
            attempt,
            delay
          })
          
          await this.sleep(delay)
        }
      }
    }

    // Todos los intentos fallaron
    logger.error(`${retryableOp.operationName} failed after ${finalConfig.maxRetries} attempts`, lastError!, {
      ...retryableOp.context,
      maxRetries: finalConfig.maxRetries
    })

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attempts: finalConfig.maxRetries
    }
  }

  /**
   * Procesa un webhook de Stripe con reintentos
   */
  static async processStripeWebhookWithRetry(
    eventType: string,
    eventId: string,
    processor: () => Promise<any>
  ) {
    return this.executeWithRetry({
      operation: processor,
      operationName: 'stripe_webhook_processing',
      context: { eventType, eventId }
    }, {
      maxRetries: 5, // Más reintentos para webhooks críticos
      baseDelay: 2000, // 2 segundos inicial
      maxDelay: 60000 // 1 minuto máximo
    })
  }

  /**
   * Procesa un webhook de Clerk con reintentos
   */
  static async processClerkWebhookWithRetry(
    eventType: string,
    userId: string,
    processor: () => Promise<any>
  ) {
    return this.executeWithRetry({
      operation: processor,
      operationName: 'clerk_webhook_processing',
      context: { eventType, userId }
    })
  }

  /**
   * Utilidad para pausar la ejecución
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Verifica si un error es recuperable (debería reintentarse)
   */
  static isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /rate limit/i,
      /temporary/i,
      /503/,
      /502/,
      /500/
    ]

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || 
      pattern.test(error.name)
    )
  }
}