// src/lib/monitoring/error-monitor.ts - MONITOREO DE ERRORES
// 🎯 PROPÓSITO: Sistema de monitoreo y alertas para errores

import { ErrorCode } from '../errors/api-errors'
import { logger } from '../logging/logger'

export interface ErrorMetrics {
  totalErrors: number
  errorsByCode: Record<ErrorCode, number>
  errorsByEndpoint: Record<string, number>
  errorsByUser: Record<string, number>
  errorRate: number
  averageResponseTime: number
  lastErrors: ErrorEvent[]
}

export interface ErrorEvent {
  id: string
  timestamp: Date
  code: ErrorCode
  message: string
  endpoint?: string
  userId?: string
  statusCode: number
  context?: string
  metadata?: any
}

export interface AlertRule {
  id: string
  name: string
  condition: (metrics: ErrorMetrics) => boolean
  action: (metrics: ErrorMetrics) => void
  enabled: boolean
  cooldown: number // minutes
  lastTriggered?: Date
}

class ErrorMonitor {
  private errors: ErrorEvent[] = []
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCode: {} as Record<ErrorCode, number>,
    errorsByEndpoint: {},
    errorsByUser: {},
    errorRate: 0,
    averageResponseTime: 0,
    lastErrors: []
  }
  private alertRules: AlertRule[] = []
  private metricsInterval?: NodeJS.Timeout

  constructor() {
    this.setupDefaultAlerts()
    this.startMetricsCollection()
  }

  // Registrar un nuevo error
  recordError(__error: {
    code: ErrorCode
    message: string
    endpoint?: string
    userId?: string
    statusCode: number
    context?: string
    metadata?: any
  }): void {
    const errorEvent: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...error
    }

    this.errors.push(errorEvent)
    this.updateMetrics()
    this.checkAlerts()

    // Log del error
    logger.error(`Error recorded: ${error.message}`, 'ErrorMonitor', {
      errorId: errorEvent.id,
      code: error.code,
      endpoint: error.endpoint,
      userId: error.userId,
      statusCode: error.statusCode
    })
  }

  // Actualizar métricas
  private updateMetrics(): void {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Filtrar errores de la última hora
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo)
    
    this.metrics = {
      totalErrors: recentErrors.length,
      errorsByCode: this.groupBy(recentErrors, 'code'),
      errorsByEndpoint: this.groupBy(recentErrors, 'endpoint'),
      errorsByUser: this.groupBy(recentErrors, 'userId'),
      errorRate: recentErrors.length / 60, // errores por minuto
      averageResponseTime: 0, // Se calcularía con datos de performance
      lastErrors: recentErrors.slice(-10)
    }
  }

  // Agrupar errores por campo
  private groupBy(errors: ErrorEvent[], field: keyof ErrorEvent): Record<string, number> {
    return errors.reduce((acc, error) => {
      const _key = String(error[field] || 'unknown')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Configurar alertas por defecto
  private setupDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'Alta tasa de errores',
        condition: (metrics) => metrics.errorRate > 10,
        action: (metrics) => this.sendAlert('high_error_rate', metrics),
        enabled: true,
        cooldown: 15
      },
      {
        id: 'critical_errors',
        name: 'Errores críticos',
        condition: (metrics) => (metrics.errorsByCode[ErrorCode.INTERNAL_ERROR] || 0) > 5,
        action: (metrics) => this.sendAlert('critical_errors', metrics),
        enabled: true,
        cooldown: 5
      },
      {
        id: 'auth_failures',
        name: 'Fallos de autenticación',
        condition: (metrics) => (metrics.errorsByCode[ErrorCode.UNAUTHORIZED] || 0) > 20,
        action: (metrics) => this.sendAlert('auth_failures', metrics),
        enabled: true,
        cooldown: 10
      }
    ]
  }

  // Verificar alertas
  private checkAlerts(): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Verificar cooldown
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldown * 60 * 1000)
        if (new Date() < cooldownEnd) continue
      }

      // Verificar condición
      if (rule.condition(this.metrics)) {
        rule.action(this.metrics)
        rule.lastTriggered = new Date()
      }
    }
  }

  // Enviar alerta
  private sendAlert(type: string, metrics: ErrorMetrics): void {
    logger.critical(`Alert triggered: ${type}`, 'ErrorMonitor', {
      alertType: type,
      metrics: {
        totalErrors: metrics.totalErrors,
        errorRate: metrics.errorRate,
        topErrors: Object.entries(metrics.errorsByCode)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      }
    })

    // Aquí se podría integrar con servicios de notificación
    // como Slack, email, SMS, etc.
  }

  // Iniciar recolección de métricas
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics()
      this.cleanOldErrors()
    }, 60000) // Cada minuto
  }

  // Limpiar errores antiguos
  private cleanOldErrors(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.errors = this.errors.filter(e => e.timestamp > oneDayAgo)
  }

  // Obtener métricas actuales
  getMetrics(): ErrorMetrics {
    return { ...this.metrics }
  }

  // Obtener errores recientes
  getRecentErrors(limit: number = 50): ErrorEvent[] {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Añadir regla de alerta personalizada
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.alertRules.push({ ...rule, id })
    return id
  }

  // Habilitar/deshabilitar alerta
  toggleAlert(id: string, enabled: boolean): void {
    const rule = this.alertRules.find(r => r.id === id)
    if (rule) {
      rule.enabled = enabled
    }
  }

  // Obtener estadísticas de salud del sistema
  getHealthStats(): {
    status: 'healthy' | 'warning' | 'critical'
    errorRate: number
    uptime: number
    lastError?: ErrorEvent
  } {
    const errorRate = this.metrics.errorRate
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (errorRate > 20) {
      status = 'critical'
    } else if (errorRate > 5) {
      status = 'warning'
    }

    return {
      status,
      errorRate,
      uptime: process.uptime?.() || 0,
      lastError: this.errors[this.errors.length - 1]
    }
  }

  // Limpiar recursos
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
  }
}

// Instancia global del monitor
export const errorMonitor = new ErrorMonitor()

// Función para integrar con el sistema de errores
export function setupErrorMonitoring(): void {
  // Integrar con el logger para capturar errores automáticamente
  const originalLogError = logger.logError
  logger.logError = function(__error: Error, context?: string, metadata?: unknown) {
    // Llamar al método original
    originalLogError.call(this, error, context, metadata)
    
    // Registrar en el monitor
    errorMonitor.recordError({
      code: (error as any).code || ErrorCode.INTERNAL_ERROR,
      message: error.message,
      endpoint: metadata?.endpoint,
      userId: metadata?.userId,
      statusCode: (error as any).statusCode || 500,
      context,
      metadata
    })
  }
}