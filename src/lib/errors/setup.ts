// src/lib/errors/setup.ts - CONFIGURACIÓN INICIAL DEL SISTEMA DE ERRORES
// 🎯 PROPÓSITO: Inicializar todos los sistemas de manejo de errores

import { setupGlobalErrorHandling } from '../logging/logger'
import { setupErrorMonitoring } from '../monitoring/error-monitor'

// Función principal para configurar todo el sistema de errores
export function setupErrorHandling(): void {
  console.log('🔧 Configurando sistema de manejo de errores...')
  
  try {
    // 1. Configurar logging global
    setupGlobalErrorHandling()
    console.log('✅ Logging global configurado')
    
    // 2. Configurar monitoreo de errores
    setupErrorMonitoring()
    console.log('✅ Monitoreo de errores configurado')
    
    // 3. Configurar interceptores para fetch (solo en cliente)
    if (typeof window !== 'undefined') {
      setupFetchInterceptor()
      console.log('✅ Interceptor de fetch configurado')
    }
    
    console.log('🎉 Sistema de manejo de errores configurado exitosamente')
    
  } catch (error) {
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 Fetch: ${init?.method || 'GET'} ${url} - ${response.status} (${duration}ms)`)
      }
      
      return response
    } catch (error) {
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
  
  console.log('🔧 Configurando herramientas de desarrollo para errores...')
  
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
    
    console.log('🛠️ Herramientas de debug disponibles en window.__errorDebug')
  }
}

// Función para configurar en producción
export function setupProductionErrorHandling(): void {
  if (process.env.NODE_ENV !== 'production') {
    return
  }
  
  console.log('🔧 Configurando manejo de errores para producción...')
  
  // En producción, configurar reportes automáticos
  // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
  
  // Configurar límites más estrictos
  const { logger } = require('../logging/logger')
  
  // Solo log de errores y warnings en producción
  logger.config = {
    ...logger.config,
    level: 2 // WARN y superior
  }
  
  console.log('✅ Configuración de producción aplicada')
}