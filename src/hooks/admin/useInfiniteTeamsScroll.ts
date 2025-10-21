import { useState, useEffect, useCallback, useRef } from 'react'

import type { Team } from '@/hooks/team/useTeams'

interface UseInfiniteTeamsScrollOptions {
  search?: string
  country?: string
  competition?: string
  limit?: number
}

interface UseInfiniteTeamsScrollReturn {
  teams: Team[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  observerTarget: (node: HTMLDivElement | null) => void
  refresh: () => void
}

/**
 * Hook para infinite scroll en la tabla de equipos
 * Usa cursor-based pagination para mejor performance
 */
export function useInfiniteTeamsScroll(
  options: UseInfiniteTeamsScrollOptions = {}
): UseInfiniteTeamsScrollReturn {
  const {
    search = '',
    country = '',
    competition = '',
    limit = 50
  } = options

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true) // Iniciar con true para mostrar loading inicial
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
    console.log('🔄 Team filters changed, resetting...')
    setTeams([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    setLoading(true) // Mostrar loading mientras se refresca
    hasLoadedInitial.current = false
    loadingRef.current = false
  }, [search, country, competition])

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
    setLoading(true)
    lastLoadTime.current = now

    try {
      console.log('📡 Loading teams...', { cursor: nextCursor, hasMore })

      // Construir URL con parámetros
      const params = new URLSearchParams()
      if (nextCursor) params.append('cursor', nextCursor)
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (country) params.append('country', country)
      if (competition) params.append('competition', competition)

      const response = await fetch(`/api/teams?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Loaded teams:', data.teams?.length || 0, 'hasMore:', data.hasMore)

      // Actualizar total solo en la primera carga
      if (data.total !== undefined) {
        setTotalCount(data.total)
      }

      // Deduplicar equipos por id_team
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id_team))
        const uniqueNewTeams = (data.teams || []).filter((t: Team) => !existingIds.has(t.id_team))
        console.log('📊 Deduplicated:', uniqueNewTeams.length, 'new teams')
        return [...prev, ...uniqueNewTeams]
      })

      setNextCursor(data.nextCursor || null)
      setHasMore(data.hasMore ?? false)
      hasLoadedInitial.current = true

    } catch (err) {
      console.error('❌ Error loading teams:', err)
      setError(err as Error)
      setHasMore(false)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [nextCursor, hasMore, search, country, competition, limit])

  // Cargar datos iniciales
  useEffect(() => {
    if (!hasLoadedInitial.current && !loadingRef.current) {
      console.log('🚀 Initial team load')
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
          console.log('👁️ Team observer triggered')
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
    console.log('🔄 Refreshing teams from start...')
    setTeams([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    setLoading(true) // Mostrar loading mientras se refresca
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
    teams,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
