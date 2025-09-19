// src/lib/errors/api-errors.ts - SISTEMA DE ERRORES ESTANDARIZADO
// 🎯 PROPÓSITO: Manejo consistente de errores en toda la aplicación


export enum ErrorCode {
  // Errores de validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Errores de recursos
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  TOURNAMENT_NOT_FOUND = 'TOURNAMENT_NOT_FOUND',
  COMPETITION_NOT_FOUND = 'COMPETITION_NOT_FOUND',
  REPORT_NOT_FOUND = 'REPORT_NOT_FOUND',
  SCOUT_NOT_FOUND = 'SCOUT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Errores de autenticación/autorización
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Errores de base de datos
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Errores de servidor
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Errores de rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Errores de integración externa
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  SCRAPING_ERROR = 'SCRAPING_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  CLERK_ERROR = 'CLERK_ERROR'
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: ErrorCode,
    public details?: unknown,
    public context?: string
  ) {
    super(message)
    this.name = 'APIError'
    
    // Mantener stack trace en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError)
    }
  }

  toJSON() {
    return {
      _error: this.message,
      code: this.code,
      details: this.details,
      _context: this.context,
      statusCode: this.statusCode
    }
  }
}

// Errores predefinidos más comunes
export const ErrorResponses = {
  // Errores de autenticación
  UNAUTHORIZED: new APIError(
    401, 
    'No autorizado. Debes iniciar sesión para acceder a este recurso.', 
    ErrorCode.UNAUTHORIZED
  ),
  
  FORBIDDEN: new APIError(
    403, 
    'Acceso denegado. No tienes permisos suficientes para realizar esta acción.', 
    ErrorCode.FORBIDDEN
  ),
  
  // Errores de recursos
  PLAYER_NOT_FOUND: new APIError(
    404, 
    'Jugador no encontrado. Verifica que el ID sea correcto.', 
    ErrorCode.PLAYER_NOT_FOUND
  ),
  
  TEAM_NOT_FOUND: new APIError(
    404, 
    'Equipo no encontrado. Verifica que el ID sea correcto.', 
    ErrorCode.TEAM_NOT_FOUND
  ),
  
  TOURNAMENT_NOT_FOUND: new APIError(
    404, 
    'Torneo no encontrado. Verifica que el ID sea correcto.', 
    ErrorCode.TOURNAMENT_NOT_FOUND
  ),
  
  COMPETITION_NOT_FOUND: new APIError(
    404, 
    'Competición no encontrada. Verifica que el ID sea correcto.', 
    ErrorCode.COMPETITION_NOT_FOUND
  ),
  
  REPORT_NOT_FOUND: new APIError(
    404, 
    'Reporte no encontrado. Verifica que el ID sea correcto.', 
    ErrorCode.REPORT_NOT_FOUND
  ),
  
  USER_NOT_FOUND: new APIError(
    404, 
    'Usuario no encontrado en la base de datos.', 
    ErrorCode.USER_NOT_FOUND
  ),
  
  // Errores de validación
  INVALID_INPUT: new APIError(
    400, 
    'Los datos proporcionados son inválidos. Revisa los campos requeridos.', 
    ErrorCode.INVALID_INPUT
  ),
  
  MISSING_REQUIRED_FIELD: new APIError(
    400, 
    'Faltan campos requeridos en la solicitud.', 
    ErrorCode.MISSING_REQUIRED_FIELD
  ),
  
  // Errores de base de datos
  DUPLICATE_ENTRY: new APIError(
    409, 
    'Ya existe un registro con estos datos. Usa valores únicos.', 
    ErrorCode.DUPLICATE_ENTRY
  ),
  
  DATABASE_ERROR: new APIError(
    500, 
    'Error en la base de datos. Inténtalo de nuevo más tarde.', 
    ErrorCode.DATABASE_ERROR
  ),
  
  // Errores de servidor
  INTERNAL_ERROR: new APIError(
    500, 
    'Error interno del servidor. El equipo técnico ha sido notificado.', 
    ErrorCode.INTERNAL_ERROR
  ),
  
  SERVICE_UNAVAILABLE: new APIError(
    503, 
    'Servicio temporalmente no disponible. Inténtalo de nuevo más tarde.', 
    ErrorCode.SERVICE_UNAVAILABLE
  ),
  
  // Errores de rate limiting
  RATE_LIMIT_EXCEEDED: new APIError(
    429, 
    'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.', 
    ErrorCode.RATE_LIMIT_EXCEEDED
  ),
  
  // Errores de servicios externos
  STRIPE_ERROR: new APIError(
    500, 
    'Error procesando el pago. Inténtalo de nuevo o contacta soporte.', 
    ErrorCode.STRIPE_ERROR
  ),
  
  SCRAPING_ERROR: new APIError(
    500, 
    'Error obteniendo datos externos. Inténtalo de nuevo más tarde.', 
    ErrorCode.SCRAPING_ERROR
  )
}

// Función para crear errores personalizados rápidamente
export function createAPIError(
  statusCode: number,
  message: string,
  code: ErrorCode,
  details?: unknown,
  context?: string
): APIError {
  return new APIError(statusCode, message, code, details, context)
}

// Funciones helper para errores comunes
export function notFoundError(resource: string, id?: string): APIError {
  const message = id 
    ? `${resource} con ID '${id}' no encontrado.`
    : `${resource} no encontrado.`
  
  return new APIError(404, message, ErrorCode.RESOURCE_NOT_FOUND, { resource, id })
}

export function validationError(message: string, details?: unknown): APIError {
  return new APIError(400, message, ErrorCode.VALIDATION_ERROR, details)
}

export function unauthorizedError(message?: string): APIError {
  return new APIError(
    401, 
    message || ErrorResponses.UNAUTHORIZED.message, 
    ErrorCode.UNAUTHORIZED
  )
}

export function forbiddenError(message?: string): APIError {
  return new APIError(
    403, 
    message || ErrorResponses.FORBIDDEN.message, 
    ErrorCode.FORBIDDEN
  )
}

export function duplicateError(resource: string, field?: string): APIError {
  const message = field 
    ? `Ya existe un ${resource} con este ${field}.`
    : `Ya existe un ${resource} con estos datos.`
  
  return new APIError(409, message, ErrorCode.DUPLICATE_ENTRY, { resource, field })
}

export function databaseError(operation: string, details?: unknown): APIError {
  return new APIError(
    500, 
    `Error en base de datos durante: ${operation}`, 
    ErrorCode.DATABASE_ERROR, 
    details
  )
}

export function externalServiceError(service: string, details?: unknown): APIError {
  return new APIError(
    500, 
    `Error en servicio externo: ${service}`, 
    ErrorCode.EXTERNAL_API_ERROR, 
    details
  )
}