/**
 * 🚀 BASE HOOKS - HOOKS REUTILIZABLES PARA TODA LA APLICACIÓN
 * 
 * ✅ PROPÓSITO: Centralizar hooks base que otros hooks pueden usar
 * ✅ BENEFICIOS: Menos duplicación, comportamiento más consistente
 */

// API Hook
export { 
  useAPI, 
  clearAllAPICache, 
  getAPICacheStats,
  type APIError,
  type UseAPIOptions,
  type UseAPIReturn
} from './useAPI'

// Cache Hook
export { 
  useCache, 
  clearAllCaches, 
  getGlobalCacheStats,
  type CacheOptions,
  type CacheEntry,
  type UseCacheReturn,
  type CacheStats
} from './useCache'

// Error Handler Hook
export { 
  useErrorHandler, 
  useSimpleErrorHandler,
  ErrorUtils,
  type ErrorState,
  type ErrorHandlerOptions,
  type UseErrorHandlerReturn
} from './useErrorHandler'

// Pagination Hook
export { 
  usePagination, 
  useSimplePagination,
  PaginationUtils,
  type PaginationState,
  type PaginationOptions,
  type UsePaginationReturn
} from './usePagination'