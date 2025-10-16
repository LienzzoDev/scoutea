// src/lib/errors/setup.ts - CONFIGURACIÓN INICIAL DEL SISTEMA DE ERRORES
// 🎯 PROPÓSITO: Inicializar todos los sistemas de manejo de errores

import { setupGlobalErrorHandling } from '../logging/logger'
import { logger } from '../logging/production-logger'
import { setupErrorMonitoring } from '../monitoring/error-monitor'


// Función principal para configurar todo el sistema de errores
export function setupErrorHandling(): void {
  logger.info('Configurando sistema de manejo de errores')
  
  try {
    // 1. Configurar logging global
    setupGlobalErrorHandling()
    logger.info('Logging global configurado')
    
    // 2. Configurar monitoreo de errores
    setupErrorMonitoring()
    logger.info('Monitoreo de errores configurado')
    
    // 3. Configurar interceptores para fetch (solo en cliente)
    if (typeof window !== 'undefined') {
      setupFetchInterceptor()
      logger.info('Interceptor de fetch configurado')
    }
    
    logger.info('Sistema de manejo de errores configurado exitosamente')
    
  } catch (_error) {
    console.error('❌ Error configurando sistema de manejo de errores:', error)
  }
}

// Configurar interceptor para fetch en el cliente
function setupFetchInterceptor(): void {
  const originalFetch = window.fetch
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const startTime = Date.now()
    const url = typeof input === 'string' ? input : input.toString()
    
    try {
      const response = await originalFetch(input, init)
      const duration = Date.now() - startTime
      
      // Log de request exitoso
      logger.apiCall(init?.method || 'GET', url.toString(), response.status, duration)
      
      return response
    } catch (_error) {
      const duration = Date.now() - startTime
      
      // Log de error de fetch
      console.error(`🚨 Fetch Error: ${init?.method || 'GET'} ${url} - Failed (${duration}ms)`, error)
      
      throw error
    }
  }
}

// Función para configurar en desarrollo
export function setupDevelopmentErrorHandling(): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  logger.debug('Configurando herramientas de desarrollo para errores')
  
  // Mostrar más detalles en consola
  if (typeof window !== 'undefined') {
    // Añadir información de errores al objeto global para debugging
    ;(window as any).__errorDebug = {
      getRecentErrors: () => {
        const { errorMonitor } = require('../monitoring/error-monitor')
        return errorMonitor.getRecentErrors(20)
      },
      getMetrics: () => {
        const { errorMonitor } = require('../monitoring/error-monitor')
        return errorMonitor.getMetrics()
      },
      clearErrors: () => {
        const { ClientErrorHandler } = require('./client-errors')
        ClientErrorHandler.clearAllErrors()
      }
    }
    
    logger.debug('Herramientas de debug disponibles en window.__errorDebug')
  }
}

// Función para configurar en producción
export function setupProductionErrorHandling(): void {
  if (process.env.NODE_ENV !== 'production') {
    return
  }
  
  logger.info('Configurando manejo de errores para producción')
  
  // En producción, configurar reportes automáticos
  // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
  
  // Configurar límites más estrictos
  const { logger } = require('../logging/logger')
  
  // Solo log de errores y warnings en producción
  logger.config = {
    ...logger.config,
    level: 2 // WARN y superior
  }
  
  logger.info('Configuración de producción aplicada')
}