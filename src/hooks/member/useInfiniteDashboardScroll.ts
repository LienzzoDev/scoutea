/**
 * Hook para infinite scroll en el dashboard de members
 * Usa cursor-based pagination para mejor performance
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
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
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  observerTarget: (node: HTMLDivElement | null) => void
  refresh: () => void
}

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

  const {
    items: players,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteScroll<Player, Record<string, any>>({
    apiEndpoint: '/api/players-cursor',
    getItemId: (player) => player.id_player,
    filters: {
      search,
      nationality,
      position,
      team,
      competition,
      min_age: minAge,
      max_age: maxAge,
      min_rating: minRating,
      max_rating: maxRating,
      min_value: minValue,
      max_value: maxValue
    },
    limit,
    rootMargin: '200px'
  })

  return {
    players,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
