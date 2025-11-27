/**
 * 🔄 HOOK DE INFINITE SCROLL PARA JUGADORES
 *
 * ✅ PROPÓSITO: Manejar carga infinita de jugadores en admin
 * ✅ BENEFICIO: Soporta miles de jugadores con performance óptima
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Player {
  id_player: number
  player_name: string
  [key: string]: unknown
}

interface UseInfinitePlayersScrollParams {
  search?: string
  nationality?: string
  position?: string
  team?: string
  competition?: string
  foot?: string
  onLoan?: string // 'all' | 'yes' | 'no'
  isVisible?: string // 'all' | 'yes' | 'no'
  ageMin?: string
  ageMax?: string
  valueMin?: string
  valueMax?: string
  ratingMin?: string
  ratingMax?: string
  heightMin?: string
  heightMax?: string
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
  competition = '',
  foot = '',
  onLoan = 'all',
  isVisible = 'all',
  ageMin = '',
  ageMax = '',
  valueMin = '',
  valueMax = '',
  ratingMin = '',
  ratingMax = '',
  heightMin = '',
  heightMax = '',
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
    getItemId: (player) => String(player.id_player), // Convertir número a string para el hook
    filters: {
      search,
      nationality,
      position,
      team,
      competition,
      foot,
      onLoan,
      isVisible,
      ageMin,
      ageMax,
      valueMin,
      valueMax,
      ratingMin,
      ratingMax,
      heightMin,
      heightMax
    },
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
