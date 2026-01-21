import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Report } from '@/types/report'

interface UseInfiniteReportsScrollParams {
  player_name?: string
  report_status?: string
  report_validation?: string
  report_type?: string
  limit?: number
}

interface UseInfiniteReportsScrollReturn {
  reports: Report[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  loadMore: () => void
  refresh: () => void
  observerTarget: (node: HTMLDivElement | null) => void
}

export function useInfiniteReportsScroll({
  player_name = '',
  report_status = '',
  report_validation = '',
  report_type = '',
  limit = 20
}: UseInfiniteReportsScrollParams = {}): UseInfiniteReportsScrollReturn {
  const {
    items: reports,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  } = useInfiniteScroll<Report, UseInfiniteReportsScrollParams>({
    apiEndpoint: '/api/admin/reports',
    getItemId: (report) => report.id_report,
    filters: { 
      player_name, 
      report_status, 
      report_validation, 
      report_type 
    },
    limit,
    rootMargin: '100px'
  })

  return {
    reports,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    observerTarget
  }
}
