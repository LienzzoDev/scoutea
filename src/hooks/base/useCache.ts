// 🚀 HOOK DE CACHÉ UNIFICADO
// 🎯 PROPÓSITO: Caché consistente en toda la aplicación con React
// 📊 IMPACTO: Mejor performance y menos re-renders innecesarios

import { useCallback, useEffect, useState } from 'react'

import { cacheManager, type CacheStats } from '@/lib/cache/cache-manager'

interface UseCacheOptions {
  key: string
  ttl?: number
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseCacheReturn<T> {
  // Datos
  data: T | null
  loading: boolean
  error: string | null
  
  // Métodos
  get: () => T | null
  set: (value: T, customTtl?: number) => void
  clear: () => void
  refresh: () => void
  
  // Estado del caché
  has: () => boolean
  isExpired: () => boolean
  
  // Estadísticas
  stats: CacheStats & { hitRate: number }
}

export function useCache<T = any>(options: UseCacheOptions): UseCacheReturn<T> {
  const { key, ttl, storage = 'memory', autoRefresh = false, refreshInterval = 60000 } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 📖 Obtener datos del caché
  const get = useCallback((): T | null => {
    try {
      
      if (storage === 'memory') {
        return cacheManager.get<T>(key)
      } else if (storage === 'localStorage' && typeof window !== 'undefined') {
        const item = localStorage.getItem(key)
        if (!item) return null
        
        const parsed = JSON.parse(item)
        // Verificar TTL si está definido
        if (ttl && Date.now() - parsed.timestamp > ttl) {
          localStorage.removeItem(key)
          return null
        }
        return parsed.value
      } else if (storage === 'sessionStorage' && typeof window !== 'undefined') {
        const item = sessionStorage.getItem(key)
        if (!item) return null
        
        const parsed = JSON.parse(item)
        // Verificar TTL si está definido
        if (ttl && Date.now() - parsed.timestamp > ttl) {
          sessionStorage.removeItem(key)
          return null
        }
        return parsed.value
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener datos del caché'
      setError(errorMessage)
      console.error('Cache get error:', err)
      return null
    }
  }, [key, storage, ttl])

  // 💾 Guardar datos en el caché
  const set = useCallback((value: T, customTtl?: number): void => {
    try {
      
      if (storage === 'memory') {
        cacheManager.set(key, value, customTtl || ttl)
      } else if (storage === 'localStorage' && typeof window !== 'undefined') {
        const item = {
          value,
          timestamp: Date.now()
        }
        localStorage.setItem(key, JSON.stringify(item))
      } else if (storage === 'sessionStorage' && typeof window !== 'undefined') {
        const item = {
          value,
          timestamp: Date.now()
        }
        sessionStorage.setItem(key, JSON.stringify(item))
      }
      
      setData(value)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar datos en el caché'
      setError(errorMessage)
      console.error('Cache set error:', err)
    }
  }, [key, storage, ttl])

  // 🗑️ Limpiar caché
  const clear = useCallback((): void => {
    try {
      
      if (storage === 'memory') {
        cacheManager.delete(key)
      } else if (storage === 'localStorage' && typeof window !== 'undefined') {
        localStorage.removeItem(key)
      } else if (storage === 'sessionStorage' && typeof window !== 'undefined') {
        sessionStorage.removeItem(key)
      }
      
      setData(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al limpiar caché'
      setError(errorMessage)
      console.error('Cache clear error:', err)
    }
  }, [key, storage])

  // 🔄 Refrescar datos
  const refresh = useCallback((): void => {
    const cachedData = get()
    setData(cachedData)
  }, [get])

  // 🔍 Verificar si existe
  const has = useCallback((): boolean => {
    if (storage === 'memory') {
      return cacheManager.has(key)
    } else if (storage === 'localStorage' && typeof window !== 'undefined') {
      return localStorage.getItem(key) !== null
    } else if (storage === 'sessionStorage' && typeof window !== 'undefined') {
      return sessionStorage.getItem(key) !== null
    }
    return false
  }, [key, storage])

  // ⏰ Verificar si expiró
  const isExpired = useCallback((): boolean => {
    if (storage === 'memory') {
      return !cacheManager.has(key)
    } else if (ttl && typeof window !== 'undefined') {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage
      const item = storageObj.getItem(key)
      if (!item) return true
      
      try {
        const parsed = JSON.parse(item)
        return Date.now() - parsed.timestamp > ttl
      } catch {
        return true
      }
    }
    return false
  }, [key, storage, ttl])

  // 📊 Obtener estadísticas
  const stats = cacheManager.getStats()

  // 🔄 Auto-refresh si está habilitado
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refresh])

  // 📖 Cargar datos iniciales
  useEffect(() => {
    const cachedData = get()
    setData(cachedData)
  }, [get])

  return {
    data,
    loading,
    error,
    get,
    set,
    clear,
    refresh,
    has,
    isExpired,
    stats
  }
}

// 🎯 Hooks especializados para diferentes tipos de datos

export function usePlayerCache(playerId: string) {
  return useCache({
    key: `players:details:${playerId}`,
    ttl: 10 * 60 * 1000 // 10 minutos
  })
}

export function usePlayerListCache(cacheKey: string) {
  return useCache({
    key: `players:list:${cacheKey}`,
    ttl: 5 * 60 * 1000 // 5 minutos
  })
}

export function usePlayerStatsCache(playerId: string, period?: string) {
  const key = period ? `players:stats:${playerId}:${period}` : `players:stats:${playerId}`
  return useCache({
    key,
    ttl: 30 * 60 * 1000 // 30 minutos
  })
}

export function useFilterOptionsCache() {
  return useCache({
    key: 'filters:options',
    ttl: 60 * 60 * 1000 // 1 hora
  })
}

export function useSearchCache(searchQuery: string) {
  // Crear clave única basada en la consulta
  const searchKey = btoa(encodeURIComponent(searchQuery)).replace(/[^a-zA-Z0-9]/g, '')
  
  return useCache({
    key: `search:${searchKey}`,
    ttl: 3 * 60 * 1000 // 3 minutos
  })
}

// 🔧 Hook para gestión avanzada del caché
export function useCacheManager() {
  const [stats, setStats] = useState(cacheManager.getStats())

  const refreshStats = useCallback(() => {
    setStats(cacheManager.getStats())
  }, [])

  const clearAll = useCallback(() => {
    cacheManager.invalidate()
    refreshStats()
  }, [refreshStats])

  const clearPlayerData = useCallback((playerId?: string) => {
    cacheManager.invalidatePlayerData(playerId)
    refreshStats()
  }, [refreshStats])

  const clearSearchResults = useCallback(() => {
    cacheManager.invalidateSearchResults()
    refreshStats()
  }, [refreshStats])

  const clearFilterOptions = useCallback(() => {
    cacheManager.invalidateFilterOptions()
    refreshStats()
  }, [refreshStats])

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    const interval = setInterval(refreshStats, 5000) // Cada 5 segundos
    return () => clearInterval(interval)
  }, [refreshStats])

  return {
    stats,
    refreshStats,
    clearAll,
    clearPlayerData,
    clearSearchResults,
    clearFilterOptions,
    cacheManager
  }
}