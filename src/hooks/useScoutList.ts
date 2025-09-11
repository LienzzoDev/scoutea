'use client'

import { useEntityList } from './useEntityList'

interface ScoutList {
  id: string
  userId: string
  scoutId: string
  createdAt: string
  scout: {
    id_scout: string
    scout_name?: string
    name?: string
    surname?: string
    nationality?: string
    scout_level?: string
    scout_elo?: number
    total_reports?: number
    url_profile?: string
  }
}

interface UseScoutListReturn {
  scoutList: ScoutList[]
  isInList: (scoutId: string) => boolean
  addToList: (scoutId: string) => Promise<boolean>
  removeFromList: (scoutId: string) => Promise<boolean>
  loading: boolean
  error: string | null
  refreshList: () => Promise<void>
}

export function useScoutList(): UseScoutListReturn {
  const {
    entityList,
    loading,
    error,
    isInList,
    addToList,
    removeFromList,
    refreshList
  } = useEntityList({
    entityType: 'scout',
    apiEndpoint: '/api/scout-list'
  })

  return {
    scoutList: entityList as ScoutList[],
    loading,
    error,
    isInList,
    addToList,
    removeFromList,
    refreshList
  }
}