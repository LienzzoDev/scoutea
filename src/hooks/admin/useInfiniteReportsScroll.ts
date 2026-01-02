import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: string | null
  report_type: string | null
  report_format: string | null
  form_url_report: string | null
  form_url_video: string | null
  form_text_report: string | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  rating: number | null
  // Snapshot histórico
  initial_age: number | null
  initial_player_trfm_value: number | null
  initial_team: string | null
  correct_initial_team: string | null
  initial_team_elo: number | null
  initial_team_level: string | null
  initial_competition: string | null
  initial_competition_country: string | null
  initial_competition_elo: number | null
  initial_competition_level: string | null
  transfer_team_pts: number | null
  transfer_competition_pts: number | null
  // Campos de aprobación
  approval_status: string | null
  approved_by_admin_id: string | null
  approval_date: string | null
  rejection_reason: string | null
  createdAt: string
  updatedAt: string | null
  id_player: number | null
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
