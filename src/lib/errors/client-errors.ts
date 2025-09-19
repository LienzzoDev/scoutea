'use client'

// src/lib/errors/client-errors.ts - MANEJO DE ERRORES EN CLIENTE
// 🎯 PROPÓSITO: Manejo consistente de errores en el frontend

import { useState, useEffect, useCallback } from 'react'

import { ErrorCode } from './api-errors'

// Interfaz para estado de error en cliente
export interface ClientErrorState {
  message: string
  code?: ErrorCode | string
  details?: any
  timestamp: Date
  context?: string
  severity: 'error' | 'warning' | 'info'
}

// Interfaz para respuesta de error de API
export interface APIErrorResponse {
  error: string
  code?: ErrorCode | string
  details?: any
  requestId?: string
  timestamp?: string
}

// Clase para manejo centralizado de errores en cliente
export class ClientErrorHandler {
  private static errors: Map<string, ClientErrorState> = new Map()
  private static listeners: Set<(_error: ClientErrorState) => void> = new Set()
  
  // Manejar errores de respuestas de API
  static async handleAPIResponse(response: Response, context?: string): Promise<any> {
    if (!response.ok) {
      let errorData: APIErrorResponse
      
      try {
        errorData = await response.json()
      } catch {
        // Si no se puede parsear JSON, crear error genérico
        errorData = {
          _error: `Error ${response.status}: ${response.statusText}`,
          code: this.getErrorCodeFromStatus(response.status)
        }
      }
      
      const _clientError = this.createClientError(
        errorData.error,
        errorData.code,
        errorData.details,
        context,
        this.getSeverityFromStatus(response.status)
      )
      
      this.logError(clientError)
      this.notifyListeners(clientError)
      
      throw clientError
    }
    
    return response.json()
  }
  
  // Manejar errores generales de JavaScript
  static handleError(
    __error: unknown, 
    context?: string,
    severity: ClientErrorState['severity'] = 'error'
  ): ClientErrorState {
    let message: string
    let code: string | undefined
    let details: any
    
    if (error instanceof Error) {
      message = error.message
      code = error.name
      details = { stack: error.stack }
    } else if (typeof _error === 'string') {
      message = error
    } else {
      message = 'Error desconocido'
      details = { originalError: error }
    }
    
    const _clientError = this.createClientError(message, code, details, context, severity)
    
    this.logError(clientError)
    this.notifyListeners(clientError)
    
    return clientError
  }
  
  // Crear objeto de error de cliente
  private static createClientError(
    message: string,
    code?: string,
    details?: unknown,
    context?: string,
    severity: ClientErrorState['severity'] = 'error'
  ): ClientErrorState {
    const errorState: ClientErrorState = {
      message,
      code,
      details,
      context,
      severity,
      timestamp: new Date()
    }
    
    // Almacenar error para debugging
    if (context) {
      this.errors.set(context, errorState)
    }
    
    return errorState
  }
  
  // Obtener código de error basado en status HTTP
  private static getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 400: return ErrorCode.INVALID_INPUT
      case 401: return ErrorCode.UNAUTHORIZED
      case 403: return ErrorCode.FORBIDDEN
      case 404: return ErrorCode.RESOURCE_NOT_FOUND
      case 409: return ErrorCode.DUPLICATE_ENTRY
      case 429: return ErrorCode.RATE_LIMIT_EXCEEDED
      case 500: return ErrorCode.INTERNAL_ERROR
      case 503: return ErrorCode.SERVICE_UNAVAILABLE
      default: return ErrorCode.INTERNAL_ERROR
    }
  }
  
  // Obtener severidad basada en status HTTP
  private static getSeverityFromStatus(status: number): ClientErrorState['severity'] {
    if (status >= 500) return 'error'
    if (status >= 400) return 'warning'
    return 'info'
  }
  
  // Logging estructurado para desarrollo
  private static logError(__error: ClientErrorState): void {
    const logData = {
      timestamp: error.timestamp.toISOString(),
      _context: error.context,
      severity: error.severity,
      message: error.message,
      code: error.code,
      details: error.details,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    switch (error.severity) {
      case 'error':
        console.error('🚨 Client Error:', logData)
        break
      case 'warning':
        console.warn('⚠️ Client Warning:', logData)
        break
      case 'info':
        console.info('ℹ️ Client Info:', logData)
        break
    }
  }
  
  // Sistema de notificaciones para errores
  private static notifyListeners(__error: ClientErrorState): void {
    this.listeners.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })
  }
  
  // Suscribirse a errores
  static subscribe(listener: (_error: ClientErrorState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  // Obtener error por contexto
  static getError(__context: string): ClientErrorState | undefined {
    return this.errors.get(context)
  }
  
  // Limpiar error específico
  static clearError(__context: string): void {
    this.errors.delete(context)
  }
  
  // Limpiar todos los errores
  static clearAllErrors(): void {
    this.errors.clear()
  }
  
  // Obtener todos los errores actuales
  static getAllErrors(): ClientErrorState[] {
    return Array.from(this.errors.values())
  }
  
  // Verificar si hay errores
  static hasErrors(): boolean {
    return this.errors.size > 0
  }
  
  // Obtener errores por severidad
  static getErrorsBySeverity(severity: ClientErrorState['severity']): ClientErrorState[] {
    return this.getAllErrors().filter(error => error.severity === severity)
  }
}

// Hook personalizado para manejo de errores en React
export function useErrorHandler() {
  const [errors, setErrors] = useState<ClientErrorState[]>([])
  
  useEffect(() => {
    const unsubscribe = ClientErrorHandler.subscribe((error) => {
      setErrors(prev => [...prev, error])
    })
    
    return unsubscribe
  }, [])
  
  const handleError = useCallback((
    __error: unknown, 
    context?: string,
    severity: ClientErrorState['severity'] = 'error'
  ) => {
    return ClientErrorHandler.handleError(error, context, severity)
  }, [error])
  
  const handleAPIResponse = useCallback(async (response: Response, context?: string) => {
    return ClientErrorHandler.handleAPIResponse(response, context)
  }, [])
  
  const _clearError = useCallback((__context: string) => {
    ClientErrorHandler.clearError(context)
    setErrors(prev => prev.filter(error => error.context !== context))
  }, [error])
  
  const clearAllErrors = useCallback(() => {
    ClientErrorHandler.clearAllErrors()
    setErrors([])
  }, [])
  
  return {
    errors,
    handleError,
    handleAPIResponse,
    clearError,
    clearAllErrors,
    hasErrors: errors.length > 0
  }
}

// Función helper para hacer fetch con manejo de errores automático
export async function fetchWithErrorHandling(
  url: string, 
  options?: RequestInit,
  context?: string
): Promise<any> {
  try {
    const response = await fetch(url, options)
    return await ClientErrorHandler.handleAPIResponse(response, context)
  } catch (_error) {
    if (error instanceof ClientErrorState) {
      throw error
    }
    throw ClientErrorHandler.handleError(error, context)
  }
}

// Función para formatear mensajes de error para usuarios
export function formatErrorMessage(__error: ClientErrorState): string {
  // Mensajes más amigables para usuarios
  const userFriendlyMessages: Record<string, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Necesitas iniciar sesión para continuar',
    [ErrorCode.FORBIDDEN]: 'No tienes permisos para realizar esta acción',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'El recurso solicitado no existe',
    [ErrorCode.VALIDATION_ERROR]: 'Por favor revisa los datos ingresados',
    [ErrorCode.DUPLICATE_ENTRY]: 'Ya existe un registro con estos datos',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Demasiadas solicitudes, espera un momento',
    [ErrorCode.INTERNAL_ERROR]: 'Error interno, inténtalo de nuevo más tarde',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Servicio temporalmente no disponible'
  }
  
  if (error.code && userFriendlyMessages[error.code as ErrorCode]) {
    return userFriendlyMessages[error.code as ErrorCode]
  }
  
  return error.message
}

// Función para determinar si un error debe mostrarse al usuario
export function shouldShowErrorToUser(__error: ClientErrorState): boolean {
  // No mostrar errores de desarrollo o muy técnicos
  const hiddenCodes = [
    ErrorCode.INTERNAL_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.CONNECTION_ERROR
  ]
  
  if (error.code && hiddenCodes.includes(error.code as ErrorCode)) {
    return false
  }
  
  // No mostrar errores de severidad 'info'
  if (error.severity === 'info') {
    return false
  }
  
  return true
}