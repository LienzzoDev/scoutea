// src/lib/errors/error-handler.ts - MIDDLEWARE DE MANEJO DE ERRORES
// 🎯 PROPÓSITO: Manejo consistente y centralizado de errores en APIs

import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { APIError, ErrorCode, ErrorResponses } from './api-errors'

// Interfaz para contexto de error
export interface ErrorContext {
  userId?: string
  endpoint?: string
  method?: string
  requestId?: string
  userAgent?: string
  ip?: string
  timestamp?: Date
}

// Función principal para manejar errores de API
export function handleAPIError(
  __error: unknown, 
  context?: ErrorContext
): NextResponse {
  const timestamp = new Date()
  const requestId = context?.requestId || generateRequestId()
  
  // Crear contexto completo para logging
  const fullContext = {
    ...context,
    timestamp,
    requestId
  }
  
  // Log del error para monitoreo (siempre log, independiente del tipo)
  logError(error, fullContext)
  
  // Registrar en el monitor de errores si está disponible
  try {
    const { errorMonitor } = require('@/lib/monitoring/error-monitor')
    if (error instanceof APIError) {
      errorMonitor.recordError({
        code: error.code,
        message: error.message,
        endpoint: fullContext.endpoint,
        userId: fullContext.userId,
        statusCode: error.statusCode,
        __context: error.context || fullContext.endpoint,
        metadata: error.details
      })
    }
  } catch (monitorError) {
    // Si falla el monitor, no interrumpir el manejo del error principal
    console.warn('Failed to record error in monitor:', monitorError)
  }
  
  // Manejar diferentes tipos de errores
  if (error instanceof APIError) {
    return createErrorResponse(error, requestId)
  }
  
  // Errores de validación Zod
  if (error instanceof ZodError) {
    const apiError = new APIError(
      400,
      'Los datos proporcionados no son válidos',
      ErrorCode.VALIDATION_ERROR,
      formatZodErrors(error),
      fullContext.endpoint
    )
    return createErrorResponse(apiError, requestId)
  }
  
  // Errores de Prisma (base de datos)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const apiError = handlePrismaError(error, fullContext.endpoint)
    return createErrorResponse(apiError, requestId)
  }
  
  // Errores de conexión de Prisma
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const apiError = new APIError(
      503,
      'Error de conexión con la base de datos',
      ErrorCode.CONNECTION_ERROR,
      { originalError: error.message },
      fullContext.endpoint
    )
    return createErrorResponse(apiError, requestId)
  }
  
  // Errores de timeout de Prisma
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    const apiError = new APIError(
      500,
      'Error interno de base de datos',
      ErrorCode.DATABASE_ERROR,
      { originalError: error.message },
      fullContext.endpoint
    )
    return createErrorResponse(apiError, requestId)
  }
  
  // Errores de JavaScript estándar
  if (error instanceof Error) {
    // Errores específicos por mensaje
    if (error.message.includes('fetch')) {
      const apiError = new APIError(
        503,
        'Error de conexión con servicio externo',
        ErrorCode.EXTERNAL_API_ERROR,
        { originalError: error.message },
        fullContext.endpoint
      )
      return createErrorResponse(apiError, requestId)
    }
    
    if (error.message.includes('timeout')) {
      const apiError = new APIError(
        408,
        'La solicitud ha excedido el tiempo límite',
        ErrorCode.TIMEOUT_ERROR,
        { originalError: error.message },
        fullContext.endpoint
      )
      return createErrorResponse(apiError, requestId)
    }
    
    // Error genérico de JavaScript
    const apiError = new APIError(
      500,
      'Error interno del servidor',
      ErrorCode.INTERNAL_ERROR,
      { originalError: error.message },
      fullContext.endpoint
    )
    return createErrorResponse(apiError, requestId)
  }
  
  // Error completamente desconocido
  const apiError = new APIError(
    500,
    'Error interno del servidor',
    ErrorCode.INTERNAL_ERROR,
    { originalError: String(error) },
    fullContext.endpoint
  )
  return createErrorResponse(apiError, requestId)
}

// Función para manejar errores específicos de Prisma
function handlePrismaError(__error: Prisma.PrismaClientKnownRequestError, endpoint?: string): APIError {
  switch (error.code) {
    case 'P2002':
      // Violación de constraint único
      const target = error.meta?.target as string[] | undefined
      const field = target?.[0] || 'campo'
      return new APIError(
        409,
        `Ya existe un registro con este ${field}`,
        ErrorCode.DUPLICATE_ENTRY,
        { 
          field,
          constraint: target,
          originalError: error.message 
        },
        endpoint
      )
    
    case 'P2025':
      // Registro no encontrado
      return new APIError(
        404,
        'El registro solicitado no existe',
        ErrorCode.RESOURCE_NOT_FOUND,
        { originalError: error.message },
        endpoint
      )
    
    case 'P2003':
      // Violación de foreign key
      return new APIError(
        400,
        'Referencia inválida a otro registro',
        ErrorCode.CONSTRAINT_VIOLATION,
        { originalError: error.message },
        endpoint
      )
    
    case 'P2014':
      // Violación de relación requerida
      return new APIError(
        400,
        'Faltan datos relacionados requeridos',
        ErrorCode.CONSTRAINT_VIOLATION,
        { originalError: error.message },
        endpoint
      )
    
    default:
      return new APIError(
        500,
        'Error en la base de datos',
        ErrorCode.DATABASE_ERROR,
        { 
          code: error.code,
          originalError: error.message 
        },
        endpoint
      )
  }
}

// Función para formatear errores de Zod de manera legible
function formatZodErrors(zodError: ZodError): any {
  return zodError.issues.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
    received: (error as any).received
  }))
}

// Función para crear respuesta de error consistente
function createErrorResponse(__error: APIError, requestId: string): NextResponse {
  const response: unknown = {
    error: error.message,
    code: error.code,
    requestId,
    timestamp: new Date().toISOString()
  }
  
  // Incluir detalles solo en desarrollo o para ciertos tipos de error
  if (process.env.NODE_ENV === 'development' || error.code === ErrorCode.VALIDATION_ERROR) {
    response.details = error.details
  }
  
  return NextResponse.json(response, { status: error.statusCode })
}

// Función para logging estructurado de errores
function logError(__error: unknown, __context: ErrorContext): void {
  const logData = {
    timestamp: context.timestamp?.toISOString(),
    requestId: context.requestId,
    userId: context.userId,
    endpoint: context.endpoint,
    method: context.method,
    userAgent: context.userAgent,
    ip: context.ip,
    _error: {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof APIError ? error.code : undefined,
      statusCode: error instanceof APIError ? error.statusCode : undefined
    }
  }
  
  // Log según el nivel de severidad
  if (error instanceof APIError) {
    if (error.statusCode >= 500) {
      console.error('🚨 API Error (Server):', JSON.stringify(logData, null, 2))
    } else if (error.statusCode >= 400) {
      console.warn('⚠️ API Error (Client):', JSON.stringify(logData, null, 2))
    } else {
      console.info('ℹ️ API Error (Info):', JSON.stringify(logData, null, 2))
    }
  } else {
    console.error('💥 Unexpected Error:', JSON.stringify(logData, null, 2))
  }
}

// Función para generar ID único de request
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Wrapper para funciones de API que maneja errores automáticamente
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (_error) {
      return handleAPIError(error, context as ErrorContext)
    }
  }
}

// Función helper para extraer contexto de Request
export function extractErrorContext(__request: Request): ErrorContext {
  const url = new URL(request.url)
  return {
    endpoint: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        undefined,
    requestId: generateRequestId()
  }
}

// Función para validar y manejar errores de autenticación
export function requireAuth(userId: string | null, context?: ErrorContext): asserts userId is string {
  if (!userId) {
    throw new APIError(
      401,
      ErrorResponses.UNAUTHORIZED.message,
      ErrorCode.UNAUTHORIZED,
      undefined,
      context?.endpoint
    )
  }
}

// Función para validar y manejar errores de autorización
export function requireRole(userRole: string | undefined, requiredRole: string, context?: ErrorContext): void {
  if (!userRole || userRole !== requiredRole) {
    throw new APIError(
      403,
      `Se requiere rol de ${requiredRole} para acceder a este recurso`,
      ErrorCode.FORBIDDEN,
      { userRole, requiredRole },
      context?.endpoint
    )
  }
}

// Función para validar parámetros requeridos
export function requireParam(param: unknown, paramName: string, context?: ErrorContext): asserts param is NonNullable<typeof param> {
  if (param === undefined || param === null || param === '') {
    throw new APIError(
      400,
      `El parámetro '${paramName}' es requerido`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      { paramName },
      context?.endpoint
    )
  }
}