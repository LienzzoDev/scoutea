/**
 * ⏱️ RATE LIMITER CON EXPONENTIAL BACKOFF
 *
 * Maneja rate limiting, exponential backoff y throttling adaptativo
 * para evitar ser detectado como ataque DDoS.
 */

interface RateLimiterConfig {
  maxRetriesPerRequest: number
  baseRetryDelay: number // en milisegundos
  maxRetryDelay: number // en milisegundos
  errorThresholdPercent: number // porcentaje de errores que activa slow mode
}

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  retries: number
  wasRateLimited: boolean
}

export class RateLimiter {
  private config: RateLimiterConfig
  private consecutiveRateLimits: number = 0
  private totalRequests: number = 0
  private totalErrors: number = 0
  private rateLimitCount: number = 0

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = {
      maxRetriesPerRequest: config?.maxRetriesPerRequest ?? 3,
      baseRetryDelay: config?.baseRetryDelay ?? 5000, // 5 segundos
      maxRetryDelay: config?.maxRetryDelay ?? 120000, // 2 minutos
      errorThresholdPercent: config?.errorThresholdPercent ?? 20,
    }
  }

  /**
   * Ejecuta una request con retry logic y exponential backoff
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<RetryResult<T>> {
    let lastError: string = ''
    let wasRateLimited = false

    for (let attempt = 0; attempt <= this.config.maxRetriesPerRequest; attempt++) {
      try {
        this.totalRequests++
        const result = await requestFn()

        // ✅ Success - resetear contador de rate limits consecutivos
        this.consecutiveRateLimits = 0

        return {
          success: true,
          data: result,
          retries: attempt,
          wasRateLimited: false
        }

      } catch (error) {
        this.totalErrors++
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        lastError = errorMsg

        // 🚨 Detectar rate limiting (HTTP 429)
        const isRateLimited = errorMsg.includes('429') ||
                             errorMsg.toLowerCase().includes('too many requests') ||
                             errorMsg.toLowerCase().includes('rate limit')

        if (isRateLimited) {
          wasRateLimited = true
          this.consecutiveRateLimits++
          this.rateLimitCount++

          console.warn(`⚠️ Rate limit detectado (${this.consecutiveRateLimits} consecutivos)`)

          // 🛑 Con demasiados rate limits consecutivos, dejar de reintentar y
          // devolver el fallo: el caller comprueba getConsecutiveRateLimits()
          // y pausa el job (lanzar aquí marcaría el job como "failed").
          if (this.consecutiveRateLimits >= 5) {
            return {
              success: false,
              error: 'Demasiados rate limits consecutivos (429)',
              retries: attempt,
              wasRateLimited: true
            }
          }
        } else {
          this.consecutiveRateLimits = 0
        }

        // ⛔ Errores permanentes: reintentar un 404/410 solo desperdicia
        // tiempo de backoff (~35s por URL muerta)
        const isPermanentError = /\b(404|410)\b/.test(errorMsg)
        if (isPermanentError) {
          return {
            success: false,
            error: lastError,
            retries: attempt,
            wasRateLimited: false
          }
        }

        // Si no quedan más reintentos, retornar error
        if (attempt === this.config.maxRetriesPerRequest) {
          return {
            success: false,
            error: lastError,
            retries: attempt,
            wasRateLimited
          }
        }

        // 📊 Calcular delay con exponential backoff
        const delay = this.calculateBackoffDelay(attempt, isRateLimited)

        console.log(`🔄 Reintento ${attempt + 1}/${this.config.maxRetriesPerRequest} en ${delay / 1000}s...`)

        if (onRetry) {
          onRetry(attempt + 1, delay)
        }

        // ⏳ Esperar antes del siguiente intento
        await this.sleep(delay)
      }
    }

    return {
      success: false,
      error: lastError,
      retries: this.config.maxRetriesPerRequest,
      wasRateLimited
    }
  }

  /**
   * Calcula el delay para el siguiente intento usando exponential backoff
   */
  private calculateBackoffDelay(attempt: number, isRateLimited: boolean): number {
    // Para rate limits, usar delays más largos
    const baseDelay = isRateLimited
      ? this.config.baseRetryDelay * 3  // 15 segundos base para rate limits
      : this.config.baseRetryDelay       // 5 segundos base para otros errores

    // Exponential backoff: 2^attempt * baseDelay
    let delay = baseDelay * Math.pow(2, attempt)

    // Agregar jitter aleatorio (±20%) para evitar patrones
    const jitter = delay * 0.2 * (Math.random() * 2 - 1)
    delay = delay + jitter

    // Limitar al máximo configurado
    return Math.min(delay, this.config.maxRetryDelay)
  }

  /**
   * Verifica si la tasa de errores está por encima del umbral
   */
  shouldEnterSlowMode(): boolean {
    if (this.totalRequests < 10) return false // No evaluar con pocas requests

    const errorRate = (this.totalErrors / this.totalRequests) * 100
    return errorRate >= this.config.errorThresholdPercent
  }

  /**
   * Obtiene las métricas actuales del rate limiter
   */
  getMetrics() {
    const errorRate = this.totalRequests > 0
      ? (this.totalErrors / this.totalRequests) * 100
      : 0

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate: Math.round(errorRate * 10) / 10, // 1 decimal
      rateLimitCount: this.rateLimitCount,
      consecutiveRateLimits: this.consecutiveRateLimits,
      shouldSlowDown: this.shouldEnterSlowMode()
    }
  }

  /**
   * Resetea las métricas del rate limiter
   */
  reset() {
    this.consecutiveRateLimits = 0
    this.totalRequests = 0
    this.totalErrors = 0
    this.rateLimitCount = 0
  }

  /**
   * Pausa la ejecución por el tiempo especificado
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtiene el número de rate limits consecutivos
   */
  getConsecutiveRateLimits(): number {
    return this.consecutiveRateLimits
  }
}

/**
 * 🎯 THROTTLER ADAPTATIVO
 *
 * Ajusta automáticamente la velocidad de scraping basándose
 * en la tasa de errores.
 */
export class AdaptiveThrottler {
  private baseMinDelay: number
  private baseMaxDelay: number
  private currentMultiplier: number = 1.0

  constructor(baseMinDelay: number, baseMaxDelay: number) {
    this.baseMinDelay = baseMinDelay
    this.baseMaxDelay = baseMaxDelay
  }

  /**
   * Ajusta el multiplicador basándose en la tasa de errores
   */
  adjustSpeed(errorRate: number) {
    if (errorRate > 50) {
      // Muy lento - errores críticos
      this.currentMultiplier = 3.0
    } else if (errorRate > 30) {
      // Lento - muchos errores
      this.currentMultiplier = 2.0
    } else if (errorRate > 15) {
      // Moderado - algunos errores
      this.currentMultiplier = 1.5
    } else {
      // Normal - pocos errores
      this.currentMultiplier = 1.0
    }
  }

  /**
   * Obtiene el delay actual ajustado
   */
  getCurrentDelays(): { min: number; max: number } {
    return {
      min: Math.round(this.baseMinDelay * this.currentMultiplier),
      max: Math.round(this.baseMaxDelay * this.currentMultiplier)
    }
  }

  /**
   * Obtiene el multiplicador actual
   */
  getMultiplier(): number {
    return this.currentMultiplier
  }

  /**
   * Resetea el throttler a velocidad normal
   */
  reset() {
    this.currentMultiplier = 1.0
  }
}
