/**
 * 🔄 HOOK DE INFINITE SCROLL PARA JUGADORES
 *
 * ✅ PROPÓSITO: Manejar carga infinita de jugadores en admin
 * ✅ BENEFICIO: Soporta miles de jugadores con performance óptima
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Player {
  id_player: string
  player_name: string
  [key: string]: unknown
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
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  loadMore: () => void
  refresh: () => void
  observerTarget: (node: HTMLDivElement | null) => void
}

export function useInfinitePlayersScroll({
  search = '',
  nationality = '',
  position = '',
  team = '',
  limit = 50
}: UseInfinitePlayersScrollParams = {}): UseInfinitePlayersScrollReturn {
  const {
    items: players,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  } = useInfiniteScroll<Player, UseInfinitePlayersScrollParams>({
    apiEndpoint: '/api/admin/players',
    getItemId: (player) => player.id_player,
    filters: { search, nationality, position, team },
    limit,
    rootMargin: '100px' // Empezar a cargar 100px antes de llegar al final
  })

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
