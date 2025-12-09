import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: string | null
  report_type: string | null
  createdAt: string
  id_player: number | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  }
  scout?: {
    scout_name: string
    name: string | null
    surname: string | null
  }
}

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
