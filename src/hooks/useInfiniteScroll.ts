/**
 * 🔄 HOOK GENÉRICO DE INFINITE SCROLL
 *
 * ✅ PROPÓSITO: Proporcionar infinite scroll reutilizable para cualquier entidad
 * ✅ BENEFICIO: Código DRY, performance óptima, mantenimiento centralizado
 * ✅ CARACTERÍSTICAS:
 *    - Cursor-based pagination
 *    - Deduplicación automática
 *    - Throttling (500ms)
 *    - Intersection Observer con preload
 *    - Reset automático al cambiar filtros
 *    - Manejo de errores robusto
 *    - Autenticación automática (cookies de Clerk)
 *    - Mensajes de error descriptivos
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Configuración genérica para el hook
 */
export interface UseInfiniteScrollConfig<T, F> {
  /** Endpoint de la API (ej: '/api/players') */
  apiEndpoint: string
  /** Función para extraer el ID único de cada item */
  getItemId: (item: T) => string
  /** Filtros a aplicar en la búsqueda */
  filters?: F
  /** Límite de items por página */
  limit?: number
  /** Margen de rootMargin para Intersection Observer (px) */
  rootMargin?: string
  /** Tiempo de throttle entre cargas (ms) */
  throttleMs?: number
}

/**
 * Respuesta esperada de la API
 */
export interface InfiniteScrollApiResponse<T> {
  data?: T[] // Para compatibilidad con diferentes formatos
  items?: T[] // Alternativa genérica
  [key: string]: any // Para permitir respuestas con keys dinámicos (players, teams, etc.)
  hasMore: boolean
  nextCursor?: string | null
  total?: number
  totalCount?: number
}

/**
 * Retorno del hook
 */
export interface UseInfiniteScrollReturn<T> {
  /** Items cargados */
  items: T[]
  /** Estado de carga */
  loading: boolean
  /** Error si ocurrió */
  error: Error | null
  /** Si hay más items por cargar */
  hasMore: boolean
  /** Total de items disponibles */
  totalCount: number | null
  /** Callback para el Intersection Observer */
  observerTarget: (node: HTMLDivElement | null) => void
  /** Función para refrescar desde el inicio */
  refresh: () => void
  /** Función para cargar más items manualmente */
  loadMore: () => void
  /** Función para actualizar un item en el estado local */
  updateItem: (id: string, updates: Partial<T>) => void
}

/**
 * Hook genérico de infinite scroll
 * @example
 * ```tsx
 * const { items, loading, observerTarget } = useInfiniteScroll({
 *   apiEndpoint: '/api/players',
 *   getItemId: (player) => player.id_player,
 *   filters: { search, nationality, position }
 * })
 * ```
 */
export function useInfiniteScroll<T = any, F = Record<string, any>>({
  apiEndpoint,
  getItemId,
  filters = {} as F,
  limit = 50,
  rootMargin = '200px',
  throttleMs = 500
}: UseInfiniteScrollConfig<T, F>): UseInfiniteScrollReturn<T> {
  // Estados
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Refs para control de carga
  const loadingRef = useRef(false)
  const lastLoadTime = useRef(0)
  const hasLoadedInitial = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // Mirror of nextCursor used inside loadMore to avoid stale closures when the
  // caller resets cursor + filters in the same tick (tab switch, etc.)
  const nextCursorRef = useRef<string | null>(null)
  const hasMoreRef = useRef(true)

  // Serializar filtros para detección de cambios
  const filtersJson = JSON.stringify(filters)

  // Reset cuando cambian los filtros
  useEffect(() => {
    console.log('🔄 Filters changed, resetting infinite scroll...')
    setItems([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    setLoading(true)
    hasLoadedInitial.current = false
    loadingRef.current = false
    // Synchronously reset the cursor/hasMore refs so the next loadMore call
    // sees a clean slate even if it fires before the setState commits.
    nextCursorRef.current = null
    hasMoreRef.current = true
  }, [filtersJson])

  /**
   * Función principal para cargar más items
   */
  const loadMore = useCallback(async () => {
    // Prevenir llamadas múltiples. Leemos hasMore del ref para evitar closures stale.
    if (loadingRef.current || !hasMoreRef.current) {
      console.log('⏭️ Skipping loadMore:', { loading: loadingRef.current, hasMore: hasMoreRef.current })
      return
    }

    // Throttle: esperar tiempo configurado entre cargas
    const now = Date.now()
    if (now - lastLoadTime.current < throttleMs) {
      console.log('⏳ Throttled, too soon. Retrying in', throttleMs, 'ms')
      setTimeout(() => {
        if (hasMore && !loadingRef.current) {
          loadMore()
        }
      }, throttleMs)
      return
    }

    loadingRef.current = true
    setLoading(true)
    lastLoadTime.current = now

    try {
      const currentCursor = nextCursorRef.current
      console.log('📡 Loading items...', { cursor: currentCursor, hasMore: hasMoreRef.current })

      // Construir URL con parámetros
      const params = new URLSearchParams()
      if (currentCursor) params.append('cursor', currentCursor)
      params.append('limit', limit.toString())

      // Agregar filtros dinámicamente
      Object.entries(filters as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        // Next.js maneja cookies automáticamente en same-origin requests
        credentials: 'same-origin',
        // Evitar caché del navegador para siempre obtener datos frescos
        cache: 'no-store',
      })

      if (!response.ok) {
        // Intentar obtener mensaje de error del servidor
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.__error) {
            errorMessage = errorData.__error
          }
        } catch {
          // Si no se puede parsear el JSON, usar mensaje genérico
        }

        // Mensajes específicos por código de error
        if (response.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.'
        } else if (response.status === 403) {
          errorMessage = 'Acceso denegado. No tienes permisos para acceder a este recurso.'
        }

        throw new Error(errorMessage)
      }

      const data: InfiniteScrollApiResponse<T> = await response.json()

      // Extraer items de la respuesta (soportar múltiples formatos)
      const newItems = data.data || data.items || extractItemsFromResponse(data)

      console.log('✅ Loaded items:', newItems.length, 'hasMore:', data.hasMore)

      // Actualizar total solo en la primera carga
      if (data.total !== undefined) {
        setTotalCount(data.total)
      } else if (data.totalCount !== undefined) {
        setTotalCount(data.totalCount)
      }

      // Deduplicar items por ID
      setItems(prev => {
        const existingIds = new Set(prev.map(getItemId))
        const uniqueNewItems = newItems.filter(item => !existingIds.has(getItemId(item)))
        console.log('📊 Deduplicated:', uniqueNewItems.length, 'new items')
        return [...prev, ...uniqueNewItems]
      })

      const newCursor = data.nextCursor || null
      const newHasMore = data.hasMore ?? false
      nextCursorRef.current = newCursor
      hasMoreRef.current = newHasMore
      setNextCursor(newCursor)
      setHasMore(newHasMore)
      hasLoadedInitial.current = true

    } catch (err) {
      console.error('❌ Error loading items:', err)
      setError(err as Error)
      hasMoreRef.current = false
      setHasMore(false)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [filtersJson, apiEndpoint, limit, throttleMs, getItemId])

  // Cargar datos iniciales
  useEffect(() => {
    if (!hasLoadedInitial.current && !loadingRef.current) {
      console.log('🚀 Initial load')
      loadMore()
    }
  }, [loadMore])

  /**
   * Callback del Intersection Observer
   */
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (loadingRef.current) return

    // Desconectar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (!node) return

    // Crear nuevo observer
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !loadingRef.current) {
          console.log('👁️ Observer triggered - loading more')
          loadMore()
        }
      },
      {
        rootMargin // Cargar antes de llegar al final
      }
    )

    observerRef.current.observe(node)
  }, [hasMore, loadMore, rootMargin])

  /**
   * Función para refrescar desde el inicio
   */
  const refresh = useCallback(() => {
    console.log('🔄 Refreshing from start...')
    setItems([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    setLoading(true)
    hasLoadedInitial.current = false
    loadingRef.current = false
    nextCursorRef.current = null
    hasMoreRef.current = true
    // Disparar recarga inmediatamente después de limpiar el estado
    setTimeout(() => {
      loadMore()
    }, 0)
  }, [loadMore])

  /**
   * Función para actualizar un item en el estado local
   */
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    console.log('🔄 updateItem called:', { id, updates })
    setItems((prev: T[]) => {
      const newItems = prev.map((item: T) =>
        getItemId(item) === id ? { ...item, ...updates } : item
      )
      console.log('🔄 Items updated, new array created')
      return newItems
    })
  }, [getItemId])

  // Cleanup del observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    items,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh,
    loadMore,
    updateItem
  }
}

/**
 * Helper para extraer items de respuestas con keys dinámicos
 * Busca el primer array en la respuesta (players, teams, competitions, etc.)
 */
function extractItemsFromResponse<T>(data: any): T[] {
  // Buscar el primer array en la respuesta
  for (const key in data) {
    if (Array.isArray(data[key])) {
      return data[key]
    }
  }
  return []
}