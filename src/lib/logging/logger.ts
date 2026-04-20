// src/lib/logging/logger.ts - SISTEMA DE LOGGING ESTRUCTURADO
// 🎯 PROPÓSITO: Logging consistente y monitoreo de errores

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration?: number
    memory?: number
    cpu?: number
  }
  request?: {
    method?: string
    url?: string
    userAgent?: string
    ip?: string
    headers?: Record<string, string>
  }
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  maxLogSize: number
  retentionDays: number
  sensitiveFields: string[]
}

// Configuración por defecto
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
  maxLogSize: 10 * 1024 * 1024, // 10MB
  retentionDays: 30,
  sensitiveFields: ['password', 'token', 'apiKey', 'secret', 'authorization']
}

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushInterval?: NodeJS.Timeout

  constructor(_config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ..._config }
    
    // Configurar flush automático cada 5 segundos
    if (typeof window === 'undefined') { // Solo en servidor
      this.flushInterval = setInterval(() => {
        this.flush()
      }, 5000)
    }
  }

  // Método principal de logging
  private log(level: LogLevel, message: string, context?: string, metadata?: unknown): void {
    // Filtrar por nivel
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: this.sanitizeMetadata(metadata)
    }

    // Añadir información de contexto si está disponible
    this.enrichLogEntry(entry)

    // Añadir al buffer
    this.logBuffer.push(entry)

    // Output inmediato para consola
    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }

    // Flush si el buffer está lleno
    if (this.logBuffer.length >= 100) {
      this.flush()
    }
  }

  // Métodos públicos por nivel
  debug(message: string, context?: string, metadata?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, metadata)
  }

  info(message: string, context?: string, metadata?: unknown): void {
    this.log(LogLevel.INFO, message, context, metadata)
  }

  warn(message: string, context?: string, metadata?: unknown): void {
    this.log(LogLevel.WARN, message, context, metadata)
  }

  error(message: string, context?: string, metadata?: unknown): void {
    this.log(LogLevel.ERROR, message, context, metadata)
  }

  critical(message: string, context?: string, metadata?: unknown): void {
    this.log(LogLevel.CRITICAL, message, context, metadata)
  }

  // Método específico para errores con stack trace
  logError(err: Error, context?: string, metadata?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message: err.message,
      context,
      metadata: this.sanitizeMetadata(metadata),
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: (err as Error & { code?: string }).code
      }
    }

    this.enrichLogEntry(entry)
    this.logBuffer.push(entry)

    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }
  }

  // Método para logging de performance
  logPerformance(
    operation: string, 
    duration: number, 
    context?: string, 
    metadata?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `Performance: ${operation}`,
      context,
      metadata: this.sanitizeMetadata(metadata),
      performance: {
        duration,
        memory: typeof process !== 'undefined' ? process.memoryUsage().heapUsed : undefined
      }
    }

    this.enrichLogEntry(entry)
    this.logBuffer.push(entry)

    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }
  }

  // Método para logging de requests HTTP
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: string,
    metadata?: unknown): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                 statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

    const meta = metadata as { userAgent?: string; ip?: string } | undefined
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${url} - ${statusCode}`,
      context: context ?? 'HTTP',
      metadata: this.sanitizeMetadata(metadata),
      request: {
        method,
        url,
        userAgent: meta?.userAgent,
        ip: meta?.ip
      },
      performance: {
        duration
      }
    }

    this.enrichLogEntry(entry)
    this.logBuffer.push(entry)

    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }
  }

  // Enriquecer entrada de log con contexto adicional
  private enrichLogEntry(entry: LogEntry): void {
    // Añadir ID de request si está disponible
    if (typeof globalThis !== 'undefined' && (globalThis as any).requestId) {
      entry.requestId = (globalThis as any).requestId
    }

    // Añadir información de usuario si está disponible
    if (typeof globalThis !== 'undefined' && (globalThis as any).userId) {
      entry.userId = (globalThis as any).userId
    }

    // Añadir información de sesión si está disponible
    if (typeof globalThis !== 'undefined' && (globalThis as any).sessionId) {
      entry.sessionId = (globalThis as any).sessionId
    }
  }

  // Sanitizar metadatos removiendo campos sensibles
  private sanitizeMetadata(metadata: unknown): Record<string, unknown> | undefined {
    if (!metadata || typeof metadata !== 'object') {
      return undefined
    }

    const sanitized = { ...(metadata as Record<string, unknown>) }

    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  // Output a consola con formato
  private outputToConsole(entry: LogEntry): void {
    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.CRITICAL]: 'CRITICAL'
    }

    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m' // Magenta
    }

    const reset = '\x1b[0m'
    const color = levelColors[entry.level]
    const levelName = levelNames[entry.level]

    const prefix = `${color}[${entry.timestamp}] ${levelName}${reset}`
    const context = entry.context ? ` [${entry.context}]` : ''
    const message = `${prefix}${context}: ${entry.message}`

    // Usar el método de console apropiado
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata || '')
        break
      case LogLevel.INFO:
        console.info(message, entry.metadata || '')
        break
      case LogLevel.WARN:
        console.warn(message, entry.metadata || '')
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.metadata || '')
        if (entry.error?.stack) {
          console.error('Stack trace:', entry.error.stack)
        }
        break
    }
  }

  // Flush del buffer de logs
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return
    }

    const logsToFlush = [...this.logBuffer]
    this.logBuffer = []

    // Enviar a endpoint remoto si está configurado
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ logs: logsToFlush })
        })
      } catch (flushError) {
        console.error('Failed to send logs to remote endpoint:', flushError)
      }
    }

    // Guardar en archivo si está configurado (solo servidor)
    if (this.config.enableFile && typeof window === 'undefined') {
      // Implementación de archivo se haría aquí
      // Por ahora solo log a consola
    }
  }

  // Limpiar recursos
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }

  // Obtener estadísticas de logging
  getStats(): {
    bufferSize: number
    totalLogged: number
    errorCount: number
    warningCount: number
  } {
    return {
      bufferSize: this.logBuffer.length,
      totalLogged: 0, // Se implementaría con contador
      errorCount: 0,  // Se implementaría con contador
      warningCount: 0 // Se implementaría con contador
    }
  }
}

// Instancia global del logger
export const logger = new Logger()

// Función helper para crear loggers con contexto
export function createLogger(logContext: string, config?: Partial<LoggerConfig>): Logger {
  const contextLogger = new Logger(config)

  // Wrapper que añade contexto automáticamente
  return {
    debug: (message: string, metadata?: unknown) => contextLogger.debug(message, logContext, metadata),
    info: (message: string, metadata?: unknown) => contextLogger.info(message, logContext, metadata),
    warn: (message: string, metadata?: unknown) => contextLogger.warn(message, logContext, metadata),
    error: (message: string, metadata?: unknown) => contextLogger.error(message, logContext, metadata),
    critical: (message: string, metadata?: unknown) => contextLogger.critical(message, logContext, metadata),
    logError: (err: Error, metadata?: unknown) => contextLogger.logError(err, logContext, metadata),
    logPerformance: (operation: string, duration: number, metadata?: unknown) =>
      contextLogger.logPerformance(operation, duration, logContext, metadata),
    logRequest: (method: string, url: string, statusCode: number, duration: number, metadata?: unknown) =>
      contextLogger.logRequest(method, url, statusCode, duration, logContext, metadata)
  } as Logger
}

// Types for Express-like request/response
interface ExpressRequest {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  ip?: string
  connection?: { remoteAddress?: string }
}

interface ExpressResponse {
  statusCode: number
  send: (body: unknown) => ExpressResponse
}

// Middleware para logging automático de requests
export function createRequestLogger() {
  return (req: ExpressRequest, res: ExpressResponse, next: () => void) => {
    const startTime = Date.now()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Añadir requestId al contexto global
    ;(globalThis as Record<string, unknown>).requestId = requestId

    // Log del request
    logger.info(`Incoming request: ${req.method} ${req.url}`, 'HTTP', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip ?? req.connection?.remoteAddress
    })

    // Interceptar la respuesta
    const originalSend = res.send.bind(res)
    res.send = function(body: unknown) {
      const duration = Date.now() - startTime

      logger.logRequest(
        req.method,
        req.url,
        res.statusCode,
        duration,
        'HTTP',
        {
          requestId,
          responseSize: typeof body === 'string' ? body.length : 0
        }
      )

      return originalSend(body)
    }

    next()
  }
}

// Función para logging de errores no capturados
export function setupGlobalErrorHandling(): void {
  // Errores no capturados en Node.js
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error) => {
      logger.critical('Uncaught Exception', 'GLOBAL', { errorMessage: error.message, stack: error.stack })
      process.exit(1)
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.critical('Unhandled Rejection', 'GLOBAL', { reason, promise })
    })
  }
  
  // Errores no capturados en browser
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.error('Global Error', 'BROWSER', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection', 'BROWSER', {
        reason: event.reason
      })
    })
  }
}