'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface APIError {
  message: string
  code?: string
  status?: number
  details?: any
}

export interface UseAPIOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  dependencies?: unknown[]
  cacheKey?: string
  cacheTTL?: number
  headers?: Record<string, string>
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export interface UseAPIReturn<T> {
  data: T | null
  loading: boolean
  error: APIError | null
  refetch: () => Promise<void>
  clearCache: () => void
  execute: (overrideOptions?: Partial<UseAPIOptions<T>>) => Promise<T | null>
}

// Cache global simple para todas las instancias de useAPI
const globalCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

/**
 * 🚀 HOOK BASE PARA LLAMADAS API
 * 
 * ✅ PROPÓSITO: Centralizar toda la lógica común de llamadas HTTP
 * ✅ BENEFICIOS: 
 *   - Manejo consistente de errores
 *   - Sistema de caché unificado
 *   - Retry automático
 *   - Timeout configurable
 *   - Loading states consistentes
 */
export function useAPI<T = any>(options: UseAPIOptions<T>): UseAPIReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * 🔍 VERIFICAR CACHÉ
   */
  const getCachedData = useCallback((cacheKey: string): T | null => {
    if (!cacheKey) return null
    
    const cached = globalCache.get(cacheKey)
    if (!cached) return null
    
    // Verificar si expiró
    if (Date.now() - cached.timestamp > cached.ttl) {
      globalCache.delete(cacheKey)
      return null
    }
    
    return cached.data as T
  }, [])

  /**
   * 💾 GUARDAR EN CACHÉ
   */
  const setCachedData = useCallback((cacheKey: string, data: T, ttl: number) => {
    if (!cacheKey) return
    
    globalCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }, [])

  /**
   * 🧹 LIMPIAR CACHÉ
   */
  const clearCache = useCallback(() => {
    if (options.cacheKey) {
      globalCache.delete(options.cacheKey)
    }
  }, [options.cacheKey])

  /**
   * 🔄 RETRY CON BACKOFF EXPONENCIAL
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /**
   * 🚀 EJECUTAR LLAMADA API
   */
  const execute = useCallback(async (overrideOptions?: Partial<UseAPIOptions<T>>): Promise<T | null> => {
    const finalOptions = { ...options, ...overrideOptions }
    const {
      url,
      method = 'GET',
      body,
      cacheKey,
      cacheTTL = 5 * 60 * 1000, // 5 minutos por defecto
      headers = {},
      timeout = 10000,
      retryAttempts = 3,
      retryDelay = 1000
    } = finalOptions

    // Verificar caché primero (solo para GET)
    if (method === 'GET' && cacheKey) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        if (mountedRef.current) {
          setData(cachedData)
          setError(null)
        }
        return cachedData
      }
    }

    if (mountedRef.current) {
      setLoading(true)
      setError(null)
    }

    let lastError: APIError | null = null

    // Intentar con retry
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController()
        
        // Timeout
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
        }, timeout)

        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers
        }

        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
          signal: abortControllerRef.current.signal
        }

        if (body && method !== 'GET') {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
        }

        const response = await fetch(url, requestOptions)
        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorData: unknown = {}
          
          try {
            const text = await response.text()
            if (text) {
              errorData = JSON.parse(text)
            }
          } catch (_parseError) {
            // Ignorar errores de parsing
          }

          const apiError: APIError = {
            message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            code: errorData.code,
            status: response.status,
            details: errorData.details
          }

          // Errores que no deberían hacer retry
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            throw apiError
          }

          lastError = apiError
          
          // Si es el último intento, lanzar error
          if (attempt === retryAttempts) {
            throw apiError
          }

          // Esperar antes del siguiente intento (backoff exponencial)
          await sleep(retryDelay * Math.pow(2, attempt))
          continue
        }

        // Parsear respuesta
        let responseData: T
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = (await response.text()) as unknown as T
        }

        // Guardar en caché si es GET
        if (method === 'GET' && cacheKey) {
          setCachedData(cacheKey, responseData, cacheTTL)
        }

        if (mountedRef.current) {
          setData(responseData)
          setError(null)
          setLoading(false)
        }

        return responseData

      } catch (err) {
        // Si fue abortado, no es un error real
        if (err instanceof Error && err.name === 'AbortError') {
          return null
        }

        lastError = err instanceof Error 
          ? { message: err.message, status: 0 }
          : { message: 'Error desconocido', status: 0 }

        // Si es el último intento o un error que no debería hacer retry
        if (attempt === retryAttempts || (lastError.status && [401, 403, 404].includes(lastError.status))) {
          break
        }

        // Esperar antes del siguiente intento
        await sleep(retryDelay * Math.pow(2, attempt))
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    if (mountedRef.current) {
      setError(lastError)
      setLoading(false)
    }

    console.error('❌ API Error after all retries:', {
      url,
      method,
      __error: lastError,
      attempts: retryAttempts + 1,
      timestamp: new Date().toISOString()
    })

    return null
  }, [options, getCachedData, setCachedData])

  /**
   * 🔄 REFETCH (alias para execute)
   */
  const refetch = useCallback(async () => {
    await execute()
  }, [execute])

  // Auto-ejecutar en mount si hay dependencies
  useEffect(() => {
    if (options.dependencies !== undefined) {
      execute()
    }
  }, options.dependencies || [])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    execute
  }
}

/**
 * 🧹 UTILIDAD PARA LIMPIAR TODO EL CACHÉ
 */
export function clearAllAPICache(): void {
  globalCache.clear()
}

/**
 * 📊 UTILIDAD PARA OBTENER ESTADÍSTICAS DEL CACHÉ
 */
export function getAPICacheStats() {
  return {
    size: globalCache.size,
    keys: Array.from(globalCache.keys()),
    totalMemory: JSON.stringify(Array.from(globalCache.values())).length
  }
}