/**
 * Production-safe logging system
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === LogLevel.ERROR || level === LogLevel.WARN
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    if (this.isDevelopment) {
      // Development: use console with colors and formatting
      const emoji = {
        [LogLevel.ERROR]: '❌',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.DEBUG]: '🐛'
      }[entry.level]

      console.log(`${emoji} [${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '')
    } else if (this.isProduction) {
      // Production: structured JSON logging for log aggregation
      console.log(JSON.stringify(entry))
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.output({
      ...this.formatMessage(LogLevel.ERROR, message, context),
      error
    })
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatMessage(LogLevel.WARN, message, context))
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatMessage(LogLevel.INFO, message, context))
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatMessage(LogLevel.DEBUG, message, context))
  }

  // API-specific logging methods
  apiCall(method: string, url: string, status?: number, duration?: number): void {
    this.info('API Call', {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined
    })
  }

  apiError(method: string, url: string, error: Error, status?: number): void {
    this.error('API Error', error, {
      method,
      url,
      status
    })
  }

  // Component lifecycle logging
  componentMount(component: string, props?: Record<string, unknown>): void {
    this.debug('Component Mount', { component, props })
  }

  componentError(component: string, error: Error, errorInfo?: Record<string, unknown>): void {
    this.error('Component Error', error, { component, errorInfo })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: Record<string, unknown>): void {
    this.info('Performance', {
      operation,
      duration: `${duration}ms`,
      ...context
    })
  }

  // Security logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, unknown>): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO
    this.output(this.formatMessage(level, `Security Event: ${event}`, context))
  }
}

// Export singleton instance
export const logger = new ProductionLogger()

// Export convenience functions
export const logError = (message: string, error?: Error, context?: Record<string, unknown>) => 
  logger.error(message, error, context)

export const logWarn = (message: string, context?: Record<string, unknown>) => 
  logger.warn(message, context)

export const logInfo = (message: string, context?: Record<string, unknown>) => 
  logger.info(message, context)

export const logDebug = (message: string, context?: Record<string, unknown>) => 
  logger.debug(message, context)