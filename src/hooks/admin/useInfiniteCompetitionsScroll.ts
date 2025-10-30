/**
 * Hook para infinite scroll en la tabla de competiciones
 * Usa cursor-based pagination para mejor performance
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
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

  const {
    items: competitions,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteScroll<Competition, Record<string, any>>({
    apiEndpoint: '/api/competitions',
    getItemId: (competition) => competition.id_competition,
    filters: { search, country, confederation, tier },
    limit,
    rootMargin: '200px'
  })

  return {
    competitions,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
