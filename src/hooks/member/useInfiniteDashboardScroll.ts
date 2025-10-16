import { useState, useEffect, useCallback, useRef } from 'react'

import type { Player } from '@/types/player'

interface UseInfiniteDashboardScrollOptions {
  search?: string
  nationality?: string
  position?: string
  team?: string
  competition?: string
  minAge?: number
  maxAge?: number
  minRating?: number
  maxRating?: number
  minValue?: number
  maxValue?: number
  limit?: number
}

interface UseInfiniteDashboardScrollReturn {
  players: Player[]
  loading: boolean
  hasMore: boolean
  totalCount: number | null
  observerTarget: (node: HTMLDivElement | null) => void
  refresh: () => void
}

/**
 * Hook para infinite scroll en el dashboard de members
 * Usa cursor-based pagination para mejor performance
 */
export function useInfiniteDashboardScroll(
  options: UseInfiniteDashboardScrollOptions = {}
): UseInfiniteDashboardScrollReturn {
  const {
    search = '',
    nationality = '',
    position = '',
    team = '',
    competition = '',
    minAge,
    maxAge,
    minRating,
    maxRating,
    minValue,
    maxValue,
    limit = 50
  } = options

  const [players, setPlayers] = useState<Player[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const loadingRef = useRef(false)
  const lastLoadTime = useRef(0)
  const hasLoadedInitial = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Reset cuando cambian los filtros
  useEffect(() => {
    console.log('🔄 Filters changed, resetting...')
    setPlayers([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    hasLoadedInitial.current = false
    loadingRef.current = false
  }, [search, nationality, position, team, competition, minAge, maxAge, minRating, maxRating, minValue, maxValue])

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
      console.log('📡 Loading players...', { cursor: nextCursor, hasMore })

      // Construir URL con parámetros
      const params = new URLSearchParams()
      if (nextCursor) params.append('cursor', nextCursor)
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (nationality) params.append('nationality', nationality)
      if (position) params.append('position', position)
      if (team) params.append('team', team)
      if (competition) params.append('competition', competition)
      if (minAge !== undefined) params.append('min_age', minAge.toString())
      if (maxAge !== undefined) params.append('max_age', maxAge.toString())
      if (minRating !== undefined) params.append('min_rating', minRating.toString())
      if (maxRating !== undefined) params.append('max_rating', maxRating.toString())
      if (minValue !== undefined) params.append('min_value', minValue.toString())
      if (maxValue !== undefined) params.append('max_value', maxValue.toString())

      const response = await fetch(`/api/players-cursor?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Loaded players:', data.players.length, 'hasMore:', data.hasMore)

      // Actualizar total solo en la primera carga
      if (data.total !== undefined) {
        setTotalCount(data.total)
      }

      // Deduplicar jugadores por id_player
      setPlayers(prev => {
        const existingIds = new Set(prev.map(p => p.id_player))
        const uniqueNewPlayers = data.players.filter((p: Player) => !existingIds.has(p.id_player))
        console.log('📊 Deduplicated:', uniqueNewPlayers.length, 'new players')
        return [...prev, ...uniqueNewPlayers]
      })

      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
      hasLoadedInitial.current = true

    } catch (error) {
      console.error('❌ Error loading players:', error)
      setHasMore(false)
    } finally {
      loadingRef.current = false
    }
  }, [nextCursor, hasMore, search, nationality, position, team, competition, minAge, maxAge, minRating, maxRating, minValue, maxValue, limit])

  // Cargar datos iniciales
  useEffect(() => {
    if (!hasLoadedInitial.current && !loadingRef.current) {
      console.log('🚀 Initial load')
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
          console.log('👁️ Observer triggered')
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
    console.log('🔄 Refreshing from start...')
    setPlayers([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
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
    players,
    loading: loadingRef.current,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
