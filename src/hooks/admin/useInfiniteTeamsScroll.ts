/**
 * Hook para infinite scroll en la tabla de equipos
 * Usa cursor-based pagination para mejor performance
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import type { Team } from '@/hooks/team/useTeams'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

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

export function useInfiniteTeamsScroll(
  options: UseInfiniteTeamsScrollOptions = {}
): UseInfiniteTeamsScrollReturn {
  const {
    search = '',
    country = '',
    competition = '',
    limit = 50
  } = options

  const {
    items: teams,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteScroll<Team, UseInfiniteTeamsScrollOptions>({
    apiEndpoint: '/api/teams',
    getItemId: (team) => team.id_team,
    filters: { search, country, competition },
    limit,
    rootMargin: '200px'
  })

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
