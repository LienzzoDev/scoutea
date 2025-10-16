import { useState, useEffect, useCallback, useRef } from 'react'

import type { Competition } from '@/lib/services/competition-service'

interface UseInfiniteCompetitionsScrollOptions {
  search?: string
  country?: string
  confederation?: string
  tier?: number
  limit?: number
}

interface UseInfiniteCompetitionsScrollReturn {
  competitions: Competition[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  observerTarget: (node: HTMLDivElement | null) => void
  refresh: () => void
}

/**
 * Hook para infinite scroll en la tabla de competiciones
 * Usa cursor-based pagination para mejor performance
 */
export function useInfiniteCompetitionsScroll(
  options: UseInfiniteCompetitionsScrollOptions = {}
): UseInfiniteCompetitionsScrollReturn {
  const {
    search = '',
    country = '',
    confederation = '',
    tier,
    limit = 50
  } = options

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const loadingRef = useRef(false)
  const lastLoadTime = useRef(0)
  const hasLoadedInitial = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Reset cuando cambian los filtros
  useEffect(() => {
    console.log('🔄 Competition filters changed, resetting...')
    setCompetitions([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    hasLoadedInitial.current = false
    loadingRef.current = false
  }, [search, country, confederation, tier])

  const loadMore = useCallback(async () => {
    // Prevenir llamadas múltiples
    if (loadingRef.current || !hasMore) {
      console.log('⏭️ Skipping loadMore:', { loading: loadingRef.current, hasMore })
      return
    }

    // Throttle: esperar 500ms entre cargas
    const now = Date.now()
    if (now - lastLoadTime.current < 500) {
      console.log('⏳ Throttled, too soon')
      return
    }

    loadingRef.current = true
    lastLoadTime.current = now

    try {
      console.log('📡 Loading competitions...', { cursor: nextCursor, hasMore })

      // Construir URL con parámetros
      const params = new URLSearchParams()
      if (nextCursor) params.append('cursor', nextCursor)
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (country) params.append('country', country)
      if (confederation) params.append('confederation', confederation)
      if (tier) params.append('tier', tier.toString())

      const response = await fetch(`/api/competitions?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Loaded competitions:', data.competitions?.length || 0, 'hasMore:', data.hasMore)

      // Actualizar total solo en la primera carga
      if (data.total !== undefined) {
        setTotalCount(data.total)
      }

      // Deduplicar competiciones por id_competition
      setCompetitions(prev => {
        const existingIds = new Set(prev.map(c => c.id_competition))
        const uniqueNewCompetitions = (data.competitions || []).filter((c: Competition) => !existingIds.has(c.id_competition))
        console.log('📊 Deduplicated:', uniqueNewCompetitions.length, 'new competitions')
        return [...prev, ...uniqueNewCompetitions]
      })

      setNextCursor(data.nextCursor || null)
      setHasMore(data.hasMore ?? false)
      hasLoadedInitial.current = true

    } catch (err) {
      console.error('❌ Error loading competitions:', err)
      setError(err as Error)
      setHasMore(false)
    } finally {
      loadingRef.current = false
    }
  }, [nextCursor, hasMore, search, country, confederation, tier, limit])

  // Cargar datos iniciales
  useEffect(() => {
    if (!hasLoadedInitial.current && !loadingRef.current) {
      console.log('🚀 Initial competition load')
      loadMore()
    }
  }, [loadMore])

  // Intersection Observer callback
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
          console.log('👁️ Competition observer triggered')
          loadMore()
        }
      },
      {
        rootMargin: '200px' // Cargar antes de llegar al final
      }
    )

    observerRef.current.observe(node)
  }, [hasMore, loadMore])

  // Función para refrescar desde el inicio
  const refresh = useCallback(() => {
    console.log('🔄 Refreshing competitions from start...')
    setCompetitions([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    hasLoadedInitial.current = false
    loadingRef.current = false
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    competitions,
    loading: loadingRef.current,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
