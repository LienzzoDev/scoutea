/**
 * 🔄 HOOK DE INFINITE SCROLL PARA JUGADORES
 *
 * ✅ PROPÓSITO: Manejar carga infinita de jugadores en admin
 * ✅ BENEFICIO: Soporta miles de jugadores con performance óptima
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface Player {
  id_player: string
  player_name: string
  [key: string]: any
}

interface UseInfinitePlayersScrollParams {
  search?: string
  nationality?: string
  position?: string
  team?: string
  limit?: number
}

interface UseInfinitePlayersScrollReturn {
  players: Player[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number | null
  loadMore: () => void
  refresh: () => void
  observerTarget: React.RefObject<HTMLDivElement>
}

export function useInfinitePlayersScroll({
  search = '',
  nationality = '',
  position = '',
  team = '',
  limit = 50
}: UseInfinitePlayersScrollParams = {}): UseInfinitePlayersScrollReturn {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true) // Iniciar con true para mostrar loading inicial
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  const observerTarget = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false) // Evitar múltiples llamadas simultáneas
  const hasLoadedInitial = useRef(false) // Evitar cargas iniciales duplicadas
  const lastLoadTime = useRef<number>(0) // Timestamp de última carga para throttle

  // Función para cargar más jugadores
  const loadMore = useCallback(async () => {
    // Throttle: no cargar más de una vez cada 500ms
    const now = Date.now()
    if (now - lastLoadTime.current < 500) {
      console.log('⏸️ Throttled - too soon since last load')
      return
    }

    // Si ya está cargando, no hacer nada
    if (loadingRef.current || !hasMore) return

    lastLoadTime.current = now
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      // Construir URL con parámetros
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(nextCursor && { cursor: nextCursor }),
        ...(search && { search }),
        ...(nationality && { nationality }),
        ...(position && { position }),
        ...(team && { team })
      })

      const response = await fetch(`/api/admin/players?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar jugadores')
      }

      const data = await response.json()

      // IMPORTANTE: Usar callback en setPlayers para evitar problemas de closure
      setPlayers(prev => {
        // Crear un Set de IDs existentes para deduplicación
        const existingIds = new Set(prev.map(p => p.id_player))

        // Filtrar jugadores nuevos que no existan ya
        const uniqueNewPlayers = data.players.filter((p: Player) => !existingIds.has(p.id_player))

        const newPlayers = [...prev, ...uniqueNewPlayers]

        console.log('✅ Loaded players:', {
          received: data.players.length,
          unique: uniqueNewPlayers.length,
          duplicates: data.players.length - uniqueNewPlayers.length,
          total: newPlayers.length,
          hasMore: data.hasMore
        })

        return newPlayers
      })

      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)

      // Solo actualizar totalCount en la primera carga
      if (data.totalCount !== undefined) {
        setTotalCount(data.totalCount)
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('❌ Error loading players:', err)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [nextCursor, hasMore, search, nationality, position, team, limit])

  // Función para refrescar la lista
  const refresh = useCallback(() => {
    setPlayers([])
    setNextCursor(null)
    setHasMore(true)
    setTotalCount(null)
    setError(null)
    setLoading(true) // Mostrar loading mientras se refresca
    loadingRef.current = false
    hasLoadedInitial.current = false
  }, [])

  // Efecto para refrescar cuando cambien los filtros
  useEffect(() => {
    refresh()
  }, [search, nationality, position, team, refresh])

  // Efecto para cargar la primera página (solo una vez por ciclo)
  useEffect(() => {
    if (players.length === 0 && hasMore && !loadingRef.current && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true
      loadMore()
    }
  }, [players.length, hasMore, loadMore])

  // Intersection Observer para detectar cuando llegar al final
  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      entries => {
        // Solo activar si el elemento es visible, hay más jugadores y no está cargando
        const entry = entries[0]
        if (entry && entry.isIntersecting && hasMore && !loadingRef.current) {
          console.log('🔄 Intersection Observer triggered - loading more players')
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Empezar a cargar 100px antes de llegar al final
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadMore])

  return {
    players,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  }
}
