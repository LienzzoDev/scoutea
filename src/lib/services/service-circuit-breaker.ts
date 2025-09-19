/**
 * Service-Level Circuit Breaker Implementation
 * 
 * Provides circuit breaker functionality specifically for service operations including:
 * - Database operation protection
 * - External API call protection
 * - Automatic recovery mechanisms
 * - Health checks for external dependencies
 * - Metrics collection for service reliability
 * - Graceful degradation strategies
 * 
 * Requirements addressed:
 * - 1.3: Circuit breaker pattern for repeated failures
 * - 4.2: Service health monitoring
 * - 5.3: Automatic recovery mechanisms
 */

export interface ServiceHealthMetrics {
  serviceName: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  averageResponseTime: number
  lastSuccessTime?: number
  lastFailureTime?: number
  circuitState: 'closed' | 'open' | 'half-open'
  consecutiveFailures: number
  uptime: number
  isHealthy: boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  recoveryTimeout: number // Time to wait before attempting recovery (ms)
  monitoringWindow: number // Time window for monitoring (ms)
  minimumThroughput: number // Minimum requests before considering error rate
  errorRateThreshold: number // Error rate threshold (0-1)
  healthCheckInterval: number // Health check interval (ms)
  maxRetries: number // Maximum retry attempts
  retryDelay: number // Delay between retries (ms)
}

export interface ServiceOperation<T> {
  name: string
  execute: () => Promise<T>
  fallback?: () => Promise<T>
  timeout?: number
  retryable?: boolean
}

export interface OperationResult<T> {
  success: boolean
  data?: T
  error?: Error
  executionTime: number
  retryCount: number
  fromFallback: boolean
  circuitState: 'closed' | 'open' | 'half-open'
}

/**
 * Service Circuit Breaker - Main class for protecting service operations
 */
export class ServiceCircuitBreaker {
  private serviceName: string
  private config: CircuitBreakerConfig
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private consecutiveFailures = 0
  private lastFailureTime = 0
  private lastSuccessTime = Date.now()
  private totalRequests = 0
  private successfulRequests = 0
  private failedRequests = 0
  private responseTimes: number[] = []
  private operationHistory: Array<{
    timestamp: number
    success: boolean
    responseTime: number
    operation: string
  }> = []
  private healthCheckInterval?: NodeJS.Timeout
  private startTime = Date.now()

  constructor(serviceName: string, _config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringWindow: 60000, // 1 minute
      minimumThroughput: 10,
      errorRateThreshold: 0.5, // 50%
      healthCheckInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      ...config
    }

    // Start health monitoring (only on client side)
    if (typeof window !== 'undefined') {
      this.startHealthMonitoring()
    }

    console.log(`🔧 Service Circuit Breaker initialized for ${serviceName}:`, this.config)
  }

  /**
   * Execute a service operation with circuit breaker protection
   */
  async execute<T>(operation: ServiceOperation<T>): Promise<OperationResult<T>> {
    const startTime = Date.now()
    this.totalRequests++

    // Check if circuit breaker allows execution
    if (!this.canExecute()) {
      console.warn(`⚠️ Circuit breaker ${this.state} - operation ${operation.name} blocked for service ${this.serviceName}`)
      
      // Try fallback if available
      if (operation.fallback) {
        try {
          const fallbackResult = await this.executeWithTimeout(
            operation.fallback,
            operation.timeout || 10000
          )
          
          return {
            success: true,
            data: fallbackResult,
            executionTime: Date.now() - startTime,
            retryCount: 0,
            fromFallback: true,
            circuitState: this.state
          }
        } catch (_fallbackError) {
          return {
            success: false,
            _error: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
            executionTime: Date.now() - startTime,
            retryCount: 0,
            fromFallback: true,
            circuitState: this.state
          }
        }
      }

      // No fallback available
      return {
        success: false,
        _error: new Error(`Service ${this.serviceName} is currently unavailable (circuit breaker ${this.state})`),
        executionTime: Date.now() - startTime,
        retryCount: 0,
        fromFallback: false,
        circuitState: this.state
      }
    }

    // Execute operation with retry logic
    let lastError: Error | null = null
    let retryCount = 0

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          operation.execute,
          operation.timeout || 30000
        )

        // Record success
        const executionTime = Date.now() - startTime
        this.recordSuccess(operation.name, executionTime)

        return {
          success: true,
          data: result,
          executionTime,
          retryCount: attempt,
          fromFallback: false,
          circuitState: this.state
        }

      } catch (_error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        retryCount = attempt

        // Don't retry if operation is not retryable or on last attempt
        if (!operation.retryable || attempt >= this.config.maxRetries) {
          break
        }

        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt)
        console.warn(`⏳ Retrying ${operation.name} in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`)
        await this.delay(delay)
      }
    }

    // All attempts failed
    const executionTime = Date.now() - startTime
    this.recordFailure(operation.name, lastError!, executionTime)

    // Try fallback if available
    if (operation.fallback) {
      try {
        const fallbackResult = await this.executeWithTimeout(
          operation.fallback,
          operation.timeout || 10000
        )
        
        console.warn(`⚠️ Operation ${operation.name} failed, using fallback for service ${this.serviceName}`)
        
        return {
          success: true,
          data: fallbackResult,
          executionTime: Date.now() - startTime,
          retryCount,
          fromFallback: true,
          circuitState: this.state
        }
      } catch (_fallbackError) {
        console.error(`❌ Both operation and fallback failed for ${operation.name} in service ${this.serviceName}`)
      }
    }

    return {
      success: false,
      _error: lastError!,
      executionTime,
      retryCount,
      fromFallback: false,
      circuitState: this.state
    }
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
        reject(new Error(`Operation timeout after ${timeoutMs}ms`))
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
   * Check if circuit breaker allows operation execution
   */
  private canExecute(): boolean {
    const now = Date.now()

    switch (this.state) {
      case 'closed':
        return true

      case 'open':
        // Check if recovery timeout has passed
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.state = 'half-open'
          console.log(`🔄 Circuit breaker for ${this.serviceName} transitioning to half-open state`)
          return true
        }
        return false

      case 'half-open':
        // Allow limited operations to test if service has recovered
        return true

      default:
        return false
    }
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(operationName: string, responseTime: number): void {
    this.successfulRequests++
    this.consecutiveFailures = 0
    this.lastSuccessTime = Date.now()
    this.responseTimes.push(responseTime)

    // Keep only recent response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-50)
    }

    // Add to operation history
    this.addToHistory(true, responseTime, operationName)

    // If we were in half-open state and got a success, close the circuit
    if (this.state === 'half-open') {
      this.state = 'closed'
      console.log(`✅ Circuit breaker for ${this.serviceName} closed - service recovered`)
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(operationName: string, __error: Error, responseTime: number): void {
    this.failedRequests++
    this.consecutiveFailures++
    this.lastFailureTime = Date.now()

    // Add to operation history
    this.addToHistory(false, responseTime, operationName)

    // Check if we should open the circuit breaker
    if (this.shouldOpenCircuit()) {
      this.state = 'open'
      console.warn(`⚠️ Circuit breaker for ${this.serviceName} opened due to ${this.consecutiveFailures} consecutive failures`)
    }
  }

  /**
   * Add operation to history for monitoring
   */
  private addToHistory(success: boolean, responseTime: number, operationName: string): void {
    const now = Date.now()
    
    this.operationHistory.push({
      timestamp: now,
      success,
      responseTime,
      operation: operationName
    })

    // Clean old entries outside monitoring window
    this.operationHistory = this.operationHistory.filter(
      entry => now - entry.timestamp <= this.config.monitoringWindow
    )
  }

  /**
   * Determine if circuit breaker should open
   */
  private shouldOpenCircuit(): boolean {
    // Check consecutive failures threshold
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      return true
    }

    // Check error rate within monitoring window
    const recentOperations = this.operationHistory.filter(
      entry => Date.now() - entry.timestamp <= this.config.monitoringWindow
    )

    if (recentOperations.length >= this.config.minimumThroughput) {
      const failures = recentOperations.filter(op => !op.success).length
      const errorRate = failures / recentOperations.length
      
      if (errorRate >= this.config.errorRateThreshold) {
        return true
      }
    }

    return false
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)

    console.log(`🔍 Health monitoring started for service ${this.serviceName}`)
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const metrics = this.getHealthMetrics()
    
    // Log health status if there are issues
    if (!metrics.isHealthy) {
      console.warn(`⚠️ Service ${this.serviceName} health check - unhealthy:`, {
        errorRate: metrics.errorRate,
        consecutiveFailures: metrics.consecutiveFailures,
        circuitState: metrics.circuitState
      })
    }

    // Auto-recovery logic
    if (this.state === 'open' && this.shouldAttemptRecovery()) {
      console.log(`🔄 Attempting auto-recovery for service ${this.serviceName}`)
      this.state = 'half-open'
    }
  }

  /**
   * Check if should attempt recovery
   */
  private shouldAttemptRecovery(): boolean {
    const now = Date.now()
    const timeSinceLastFailure = now - this.lastFailureTime
    
    // Only attempt recovery if enough time has passed
    return timeSinceLastFailure >= this.config.recoveryTimeout * 2
  }

  /**
   * Get comprehensive health metrics
   */
  getHealthMetrics(): ServiceHealthMetrics {
    const now = Date.now()
    const errorRate = this.totalRequests > 0 ? 
      this.failedRequests / this.totalRequests : 0

    const averageResponseTime = this.responseTimes.length > 0 ?
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length : 0

    const uptime = now - this.startTime

    // Determine if service is healthy
    const isHealthy = (
      this.state !== 'open' &&
      errorRate < this.config.errorRateThreshold &&
      this.consecutiveFailures < this.config.failureThreshold
    )

    return {
      serviceName: this.serviceName,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimal places
      averageResponseTime: Math.round(averageResponseTime),
      lastSuccessTime: this.lastSuccessTime,
      lastFailureTime: this.lastFailureTime || undefined,
      circuitState: this.state,
      consecutiveFailures: this.consecutiveFailures,
      uptime,
      isHealthy
    }
  }

  /**
   * Manually trigger recovery
   */
  triggerRecovery(): void {
    console.log(`🔄 Manual recovery triggered for service ${this.serviceName}`)
    this.state = 'closed'
    this.consecutiveFailures = 0
    this.lastSuccessTime = Date.now()
  }

  /**
   * Force circuit breaker to open (useful for maintenance)
   */
  forceOpen(): void {
    this.state = 'open'
    this.lastFailureTime = Date.now()
    console.log(`🚫 Circuit breaker for ${this.serviceName} forced to open state`)
  }

  /**
   * Reset all metrics and state
   */
  reset(): void {
    this.state = 'closed'
    this.consecutiveFailures = 0
    this.lastFailureTime = 0
    this.lastSuccessTime = Date.now()
    this.totalRequests = 0
    this.successfulRequests = 0
    this.failedRequests = 0
    this.responseTimes = []
    this.operationHistory = []
    this.startTime = Date.now()
    
    console.log(`🔄 Circuit breaker for ${this.serviceName} reset to initial state`)
  }

  /**
   * Stop health monitoring and cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }
    console.log(`🧹 Circuit breaker for ${this.serviceName} destroyed`)
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Service Circuit Breaker Manager - Manages multiple circuit breakers for different services
 */
export class ServiceCircuitBreakerManager {
  private circuitBreakers = new Map<string, ServiceCircuitBreaker>()
  private defaultConfig: Partial<CircuitBreakerConfig>

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = defaultConfig || {}
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): ServiceCircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreakerConfig = { ...this.defaultConfig, ...config }
      this.circuitBreakers.set(serviceName, new ServiceCircuitBreaker(serviceName, circuitBreakerConfig))
    }
    
    return this.circuitBreakers.get(serviceName)!
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeOperation<T>(
    serviceName: string,
    operation: ServiceOperation<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<OperationResult<T>> {
    const circuitBreaker = this.getCircuitBreaker(serviceName, config)
    return await circuitBreaker.execute(operation)
  }

  /**
   * Get health metrics for all services
   */
  getAllHealthMetrics(): Record<string, ServiceHealthMetrics> {
    const metrics: Record<string, ServiceHealthMetrics> = {}
    
    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      metrics[serviceName] = circuitBreaker.getHealthMetrics()
    }
    
    return metrics
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalServices: number
    healthyServices: number
    unhealthyServices: number
    overallHealthy: boolean
    services: Record<string, ServiceHealthMetrics>
  } {
    const services = this.getAllHealthMetrics()
    const totalServices = Object.keys(services).length
    const healthyServices = Object.values(services).filter(s => s.isHealthy).length
    const unhealthyServices = totalServices - healthyServices

    return {
      totalServices,
      healthyServices,
      unhealthyServices,
      overallHealthy: unhealthyServices === 0,
      services
    }
  }

  /**
   * Trigger recovery for all services
   */
  triggerRecoveryAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.triggerRecovery()
    }
    console.log('🔄 Recovery triggered for all services')
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset()
    }
    console.log('🔄 All circuit breakers reset')
  }

  /**
   * Destroy all circuit breakers
   */
  destroy(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.destroy()
    }
    this.circuitBreakers.clear()
    console.log('🧹 All circuit breakers destroyed')
  }
}

// Global service circuit breaker manager
let globalServiceCircuitBreakerManager: ServiceCircuitBreakerManager | null = null

/**
 * Get the global service circuit breaker manager
 */
export function getServiceCircuitBreakerManager(config?: Partial<CircuitBreakerConfig>): ServiceCircuitBreakerManager {
  if (!globalServiceCircuitBreakerManager) {
    globalServiceCircuitBreakerManager = new ServiceCircuitBreakerManager(config)
  }
  return globalServiceCircuitBreakerManager
}

/**
 * Reset the global service circuit breaker manager
 */
export function resetServiceCircuitBreakerManager(): void {
  if (globalServiceCircuitBreakerManager) {
    globalServiceCircuitBreakerManager.destroy()
    globalServiceCircuitBreakerManager = null
  }
}

/**
 * Convenience function to execute a service operation with circuit breaker protection
 */
export async function executeServiceOperation<T>(
  serviceName: string,
  operation: ServiceOperation<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<OperationResult<T>> {
  const manager = getServiceCircuitBreakerManager()
  return await manager.executeOperation(serviceName, operation, config)
}

/**
 * Predefined service configurations
 */
export const ServiceConfigs = {
  database: {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    errorRateThreshold: 0.3,
    maxRetries: 3,
    retryDelay: 1000
  },
  
  externalAPI: {
    failureThreshold: 3,
    recoveryTimeout: 60000,
    errorRateThreshold: 0.5,
    maxRetries: 2,
    retryDelay: 2000
  },
  
  cache: {
    failureThreshold: 10,
    recoveryTimeout: 15000,
    errorRateThreshold: 0.7,
    maxRetries: 1,
    retryDelay: 500
  }
} as const