/**
 * 🔄 HOOK DE INFINITE SCROLL PARA SCOUTS
 *
 * ✅ PROPÓSITO: Manejar carga infinita de scouts en admin
 * ✅ BENEFICIO: Soporta miles de scouts con performance óptima
 * ✅ REFACTORIZADO: Usa el hook genérico useInfiniteScroll
 */

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Scout {
  id_scout: string
  scout_name: string | null
  name: string | null
  surname: string | null
  [key: string]: unknown
}

interface UseInfiniteScoutsScrollParams {
  search?: string
  nationality?: string
  country?: string
  openToWork?: boolean | null
  limit?: number
}

interface UseInfiniteScoutsScrollReturn {
  scouts: Scout[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  loadMore: () => void
  refresh: () => void
  observerTarget: (node: HTMLDivElement | null) => void
}

export function useInfiniteScoutsScroll({
  search = '',
  nationality = '',
  country = '',
  openToWork = null,
  limit = 50
}: UseInfiniteScoutsScrollParams = {}): UseInfiniteScoutsScrollReturn {
  const {
    items: scouts,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  } = useInfiniteScroll<Scout, UseInfiniteScoutsScrollParams>({
    apiEndpoint: '/api/admin/scouts',
    getItemId: (scout) => scout.id_scout,
    filters: { 
      search, 
      nationality, 
      country,
      openToWork: openToWork ? 'true' : undefined 
    },
    limit,
    rootMargin: '100px' // Empezar a cargar 100px antes de llegar al final
  })

  return {
    scouts,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  }
}
