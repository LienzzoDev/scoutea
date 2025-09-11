'use client'

import { useEntityList } from './useEntityList'

interface PlayerList {
  id: string
  userId: string
  playerId: string
  createdAt: string
  player: {
    id_player: string
    player_name: string
    team_name?: string
    position_player?: string
    nationality_1?: string
    player_rating?: number
    photo_coverage?: string
  }
}

interface UsePlayerListReturn {
  playerList: PlayerList[]
  isInList: (playerId: string) => boolean
  addToList: (playerId: string) => Promise<boolean>
  removeFromList: (playerId: string) => Promise<boolean>
  loading: boolean
  error: string | null
  refreshList: () => Promise<void>
}

export function usePlayerList(): UsePlayerListReturn {
  const {
    entityList,
    loading,
    error,
    isInList,
    addToList,
    removeFromList,
    refreshList
  } = useEntityList({
    entityType: 'player',
    apiEndpoint: '/api/player-list'
  })

  return {
    playerList: entityList as PlayerList[],
    loading,
    error,
    isInList,
    addToList,
    removeFromList,
    refreshList
  }
}