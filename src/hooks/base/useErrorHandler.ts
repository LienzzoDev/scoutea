'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface ErrorState {
  message: string
  code?: string
  status?: number
  details?: any
  timestamp: Date
  context?: string
  retryable?: boolean
}

export interface ErrorHandlerOptions {
  context?: string
  logErrors?: boolean
  showToast?: boolean
  retryable?: boolean
  onError?: (error: ErrorState) => void
}

export interface UseErrorHandlerReturn {
  errors: Record<string, ErrorState>
  hasError: (context?: string) => boolean
  getError: (context?: string) => ErrorState | null
  handleError: (error: unknown, options?: ErrorHandlerOptions) => ErrorState
  clearError: (context?: string) => void
  clearAllErrors: () => void
  retryLastAction: (context?: string) => void
  setRetryAction: (context: string, action: () => Promise<void>) => void
}

// Store global para acciones de retry
const retryActions = new Map<string, () => Promise<void>>()

/**
 * 🚀 HOOK DE MANEJO DE ERRORES CONSISTENTE
 * 
 * ✅ PROPÓSITO: Manejo estandarizado de errores en toda la aplicación
 * ✅ BENEFICIOS:
 *   - Formateo consistente de errores
 *   - Logging automático
 *   - Categorización de errores
 *   - Sistema de retry
 *   - Contextos múltiples
 *   - Integración con toast notifications
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errors, setErrors] = useState<Record<string, ErrorState>>({})
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  /**
   * 🔍 VERIFICAR SI HAY ERROR
   */
  const hasError = useCallback((context?: string): boolean => {
    if (context) {
      return context in errors
    }
    return Object.keys(errors).length > 0
  }, [errors])

  /**
   * 📋 OBTENER ERROR ESPECÍFICO
   */
  const getError = useCallback((context?: string): ErrorState | null => {
    if (context) {
      return errors[context] || null
    }
    
    // Si no se especifica contexto, devolver el primer error
    const firstKey = Object.keys(errors)[0]
    return firstKey ? errors[firstKey] : null
  }, [errors])

  /**
   * 🔧 FORMATEAR ERROR
   */
  const formatError = useCallback((error: unknown, options: ErrorHandlerOptions = {}): ErrorState => {
    const { context = 'general', retryable = false } = options
    
    let errorState: ErrorState = {
      message: 'Error desconocido',
      timestamp: new Date(),
      context,
      retryable
    }

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      errorState.message = error.message
      
      // Detectar errores de red
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorState.retryable = true
        errorState.code = 'NETWORK_ERROR'
      }
      
    } else if (typeof error === 'object' && error !== null) {
      // Error de API estructurado
      const apiError = error as any
      
      errorState = {
        ...errorState,
        message: apiError.message || apiError.error || 'Error de API',
        code: apiError.code,
        status: apiError.status,
        details: apiError.details,
        retryable: apiError.retryable || isRetryableStatus(apiError.status)
      }
      
    } else if (typeof error === 'string') {
      errorState.message = error
    }

    // Categorizar errores por código de estado
    if (errorState.status) {
      errorState.retryable = isRetryableStatus(errorState.status)
      
      // Mensajes más amigables para usuarios
      switch (errorState.status) {
        case 401:
          errorState.message = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          errorState.code = 'UNAUTHORIZED'
          break
        case 403:
          errorState.message = 'No tienes permisos para realizar esta acción.'
          errorState.code = 'FORBIDDEN'
          break
        case 404:
          errorState.message = 'El recurso solicitado no fue encontrado.'
          errorState.code = 'NOT_FOUND'
          break
        case 429:
          errorState.message = 'Demasiadas solicitudes. Por favor, espera un momento.'
          errorState.code = 'RATE_LIMITED'
          errorState.retryable = true
          break
        case 500:
          errorState.message = 'Error interno del servidor. Inténtalo más tarde.'
          errorState.code = 'INTERNAL_ERROR'
          errorState.retryable = true
          break
        case 503:
          errorState.message = 'Servicio temporalmente no disponible.'
          errorState.code = 'SERVICE_UNAVAILABLE'
          errorState.retryable = true
          break
      }
    }

    return errorState
  }, [])

  /**
   * ⚠️ MANEJAR ERROR
   */
  const handleError = useCallback((error: unknown, options: ErrorHandlerOptions = {}): ErrorState => {
    const { 
      context = 'general', 
      logErrors = true, 
      showToast = false,
      onError 
    } = options
    
    const errorState = formatError(error, options)

    // Actualizar estado solo si el componente está montado
    if (mountedRef.current) {
      setErrors(prev => ({
        ...prev,
        [context]: errorState
      }))
    }

    // Logging
    if (logErrors) {
      const logLevel = getLogLevel(errorState)
      const logData = {
        error: errorState,
        context,
        timestamp: errorState.timestamp.toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }

      switch (logLevel) {
        case 'error':
          console.error('❌ Error Handler:', logData)
          break
        case 'warn':
          console.warn('⚠️ Warning Handler:', logData)
          break
        case 'info':
          console.info('ℹ️ Info Handler:', logData)
          break
      }
    }

    // Toast notification (si está disponible)
    if (showToast && typeof window !== 'undefined') {
      // Aquí se podría integrar con una librería de toast
      // Por ahora, usar console para desarrollo
      console.log('🍞 Toast:', errorState.message)
    }

    // Callback personalizado
    if (onError) {
      try {
        onError(errorState)
      } catch (callbackError) {
        console.error('❌ Error in onError callback:', callbackError)
      }
    }

    return errorState
  }, [formatError])

  /**
   * 🧹 LIMPIAR ERROR ESPECÍFICO
   */
  const clearError = useCallback((context?: string): void => {
    if (!mountedRef.current) return
    
    if (context) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[context]
        return newErrors
      })
      
      // Limpiar acción de retry asociada
      retryActions.delete(context)
    } else {
      // Limpiar todos los errores
      setErrors({})
      retryActions.clear()
    }
  }, [])

  /**
   * 🧹 LIMPIAR TODOS LOS ERRORES
   */
  const clearAllErrors = useCallback((): void => {
    if (!mountedRef.current) return
    
    setErrors({})
    retryActions.clear()
  }, [])

  /**
   * 🔄 CONFIGURAR ACCIÓN DE RETRY
   */
  const setRetryAction = useCallback((context: string, action: () => Promise<void>): void => {
    retryActions.set(context, action)
  }, [])

  /**
   * 🔄 REINTENTAR ÚLTIMA ACCIÓN
   */
  const retryLastAction = useCallback(async (context?: string): Promise<void> => {
    const targetContext = context || 'general'
    const action = retryActions.get(targetContext)
    
    if (!action) {
      console.warn('⚠️ No retry action found for context:', targetContext)
      return
    }

    // Limpiar error antes de reintentar
    clearError(targetContext)

    try {
      await action()
    } catch (retryError) {
      // Si el retry falla, manejar el nuevo error
      handleError(retryError, { 
        context: targetContext,
        logErrors: true 
      })
    }
  }, [clearError, handleError])

  return {
    errors,
    hasError,
    getError,
    handleError,
    clearError,
    clearAllErrors,
    retryLastAction,
    setRetryAction
  }
}

/**
 * 🔍 DETERMINAR SI UN STATUS ES REINTENTABLE
 */
function isRetryableStatus(status?: number): boolean {
  if (!status) return false
  
  // Errores de servidor (5xx) y algunos 4xx son reintentables
  return status >= 500 || status === 408 || status === 429
}

/**
 * 📊 DETERMINAR NIVEL DE LOG
 */
function getLogLevel(error: ErrorState): 'error' | 'warn' | 'info' {
  if (error.status) {
    if (error.status >= 500) return 'error'
    if (error.status >= 400) return 'warn'
  }
  
  if (error.code) {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'INTERNAL_ERROR':
        return 'error'
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
      case 'RATE_LIMITED':
        return 'warn'
      default:
        return 'info'
    }
  }
  
  return 'error'
}

/**
 * 🚀 HOOK SIMPLIFICADO PARA CASOS BÁSICOS
 */
export function useSimpleErrorHandler(context: string = 'general') {
  const { handleError, clearError, getError, hasError } = useErrorHandler()
  
  return {
    error: getError(context),
    hasError: hasError(context),
    setError: (error: unknown) => handleError(error, { context }),
    clearError: () => clearError(context)
  }
}

/**
 * 🔧 UTILIDADES PARA MANEJO DE ERRORES ESPECÍFICOS
 */
export const ErrorUtils = {
  /**
   * Crear error de validación
   */
  createValidationError: (message: string, details?: any): ErrorState => ({
    message,
    code: 'VALIDATION_ERROR',
    status: 400,
    details,
    timestamp: new Date(),
    retryable: false
  }),

  /**
   * Crear error de red
   */
  createNetworkError: (message: string = 'Error de conexión'): ErrorState => ({
    message,
    code: 'NETWORK_ERROR',
    timestamp: new Date(),
    retryable: true
  }),

  /**
   * Verificar si un error es de autenticación
   */
  isAuthError: (error: ErrorState): boolean => {
    return error.status === 401 || error.code === 'UNAUTHORIZED'
  },

  /**
   * Verificar si un error es de permisos
   */
  isPermissionError: (error: ErrorState): boolean => {
    return error.status === 403 || error.code === 'FORBIDDEN'
  },

  /**
   * Verificar si un error es de red
   */
  isNetworkError: (error: ErrorState): boolean => {
    return error.code === 'NETWORK_ERROR' || 
           (error.status !== undefined && error.status >= 500)
  }
}