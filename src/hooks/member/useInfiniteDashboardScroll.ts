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
  period?: string
  hasMarketValue?: boolean
  hasAttributes?: boolean
  hasStats?: boolean
  hasTextReport?: boolean
  hasVideoReport?: boolean
  isYouthDiscovery?: boolean
  isEmergingTalent?: boolean
  isProfessional?: boolean
  isTopLeagues?: boolean
  isBigFive?: boolean
  playerIds?: string[]
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
    limit = 50,
    period = '3m',
    hasMarketValue,
    hasAttributes,
    hasStats,
    hasTextReport,
    hasVideoReport,
    isYouthDiscovery,
    isEmergingTalent,
    isProfessional,
    isTopLeagues,
    isBigFive,
    playerIds,
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
      max_value: maxValue,
      period,
      has_market_value: hasMarketValue || undefined,
      has_attributes: hasAttributes || undefined,
      has_stats: hasStats || undefined,
      has_text_report: hasTextReport || undefined,
      has_video_report: hasVideoReport || undefined,
      is_youth_discovery: isYouthDiscovery || undefined,
      is_emerging_talent: isEmergingTalent || undefined,
      is_professional: isProfessional || undefined,
      is_top_leagues: isTopLeagues || undefined,
      is_big_five: isBigFive || undefined,
      // Pass as joined string so useInfiniteScroll serializes it as a single query param
      player_ids: playerIds && playerIds.length > 0 ? playerIds.join(',') : undefined,
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
