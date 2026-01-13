/**
 * 🔄 HOOK DE INFINITE SCROLL PARA JUGADORES
 *
 * ✅ PROPÓSITO: Manejar carga infinita de jugadores en admin
 * ✅ BENEFICIO: Soporta miles de jugadores con performance óptima
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useCallback } from 'react'

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
  // Filtros de datos vacíos/llenos
  playerColor?: string // 'all' | 'has' | 'empty'
  playerName?: string // 'all' | 'has' | 'empty'
  teamName?: string // 'all' | 'has' | 'empty'
  wyscoutName1?: string // 'all' | 'has' | 'empty'
  wyscoutId1?: string // 'all' | 'has' | 'empty'
  wyscoutId2?: string // 'all' | 'has' | 'empty'
  idFmi?: string // 'all' | 'has' | 'empty'
  photoCoverage?: string // 'all' | 'has' | 'empty'
  urlTrfmAdvisor?: string // 'all' | 'has' | 'empty'
  urlTrfm?: string // 'all' | 'has' | 'empty'
  urlInstagram?: string // 'all' | 'has' | 'empty'
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
  updatePlayer: (id: string | number, updates: Partial<Player>) => void
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
  // Filtros de datos vacíos/llenos
  playerColor = 'all',
  playerName = 'all',
  teamName = 'all',
  wyscoutName1 = 'all',
  wyscoutId1 = 'all',
  wyscoutId2 = 'all',
  idFmi = 'all',
  photoCoverage = 'all',
  urlTrfmAdvisor = 'all',
  urlTrfm = 'all',
  urlInstagram = 'all',
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
    observerTarget,
    updateItem
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
      heightMax,
      // Filtros de datos vacíos/llenos
      playerColor,
      playerName,
      teamName,
      wyscoutName1,
      wyscoutId1,
      wyscoutId2,
      idFmi,
      photoCoverage,
      urlTrfmAdvisor,
      urlTrfm,
      urlInstagram
    },
    limit,
    rootMargin: '100px' // Empezar a cargar 100px antes de llegar al final
  })

  // Wrapper para updateItem que acepta number o string (memoizado)
  const updatePlayer = useCallback((id: string | number, updates: Partial<Player>) => {
    updateItem(String(id), updates)
  }, [updateItem])

  return {
    players,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget,
    updatePlayer
  }
}
