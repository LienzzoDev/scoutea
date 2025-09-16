// src/lib/errors/index.ts - EXPORTACIONES CENTRALIZADAS
// 🎯 PROPÓSITO: Punto único de importación para manejo de errores

// Clases y tipos de errores
export {
  APIError,
  ErrorCode,
  ErrorResponses,
  createAPIError,
  notFoundError,
  validationError,
  unauthorizedError,
  forbiddenError,
  duplicateError,
  databaseError,
  externalServiceError
} from './api-errors'

// Middleware y utilidades de manejo
export {
  handleAPIError,
  withErrorHandler,
  extractErrorContext,
  requireAuth,
  requireRole,
  requireParam,
  type ErrorContext
} from './error-handler'

// Cliente - manejo de errores en frontend
export {
  ClientErrorHandler,
  useErrorHandler,
  fetchWithErrorHandling,
  formatErrorMessage,
  shouldShowErrorToUser,
  type ClientErrorState,
  type APIErrorResponse
} from './client-errors'

// Sistema de logging
export {
  logger,
  createLogger,
  createRequestLogger,
  setupGlobalErrorHandling,
  LogLevel,
  type LogEntry,
  type LoggerConfig
} from '../logging/logger'

// Sistema de monitoreo
export {
  errorMonitor,
  setupErrorMonitoring,
  type ErrorMetrics,
  type ErrorEvent,
  type AlertRule
} from '../monitoring/error-monitor'

// Re-exportar para compatibilidad
export type { ErrorContext as APIErrorContext } from './error-handler'