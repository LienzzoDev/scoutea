import { useState, useEffect, useCallback } from 'react'
import { ReportService, ReportFilters, ReportSearchOptions } from '@/lib/db/report-service'

export interface Report {
  id_report: string
  report_status?: string
  report_validation?: string
  report_author?: string
  report_date?: Date
  report_type?: string
  id_player?: string
  form_player_name?: string
  player_name?: string
  form_url_reference?: string
  url_trfm_advisor?: string
  url_trfm?: string
  url_secondary?: string
  url_instagram?: string
  form_date_of_birth?: string
  date_of_birth?: Date
  correct_date_of_birth?: Date
  age?: number
  initial_age?: number
  form_team_name?: string
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  initial_team?: string
  correct_initial_team?: string
  initial_team_elo?: number
  initial_team_level?: string
  transfer_team_pts?: number
  form_team_competition?: string
  team_competition?: string
  competition_country?: string
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  initial_competition?: string
  initial_competition_country?: string
  initial_competition_elo?: number
  initial_competition_level?: string
  transfer_competition_pts?: number
  owner_club?: string
  owner_club_country?: string
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean
  complete_player_name?: string
  form_position_player?: string
  position_player?: string
  correct_position_player?: string
  form_foot?: string
  foot?: string
  correct_foot?: string
  form_height?: string
  height?: number
  correct_height?: number
  form_nationality_1?: string
  nationality_1?: string
  correct_nationality_1?: string
  form_nationality_2?: string
  nationality_2?: string
  correct_nationality_2?: string
  form_national_tier?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string
  form_agency?: string
  agency?: string
  correct_agency?: string
  contract_end?: Date
  correct_contract_end?: Date
  player_trfm_value?: number
  initial_player_trfm_value?: number
  roi?: number
  profit?: number
  form_potential?: string
  report_format?: string
  form_url_report?: string
  form_url_video?: string
  form_text_report?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReportSearchResult {
  reports: Report[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ReportStats {
  totalReports: number
  reportsByStatus: Array<{ report_status: string | null; _count: number }>
  reportsByValidation: Array<{ report_validation: string | null; _count: number }>
  reportsByAuthor: Array<{ report_author: string | null; _count: number }>
  reportsByType: Array<{ report_type: string | null; _count: number }>
  reportsByPosition: Array<{ position_player: string | null; _count: number }>
  reportsByNationality: Array<{ nationality_1: string | null; _count: number }>
  avgAge: number | null
  avgValue: number | null
  avgRoi: number | null
  avgProfit: number | null
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Buscar reportes
  const searchReports = useCallback(async (options: ReportSearchOptions = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await ReportService.searchReports(options)
      setReports(result.reports)
      setPagination(result.pagination)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar reportes'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener un reporte por ID
  const getReport = useCallback(async (id: string): Promise<Report | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const report = await ReportService.getReportById(id)
      return report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reporte'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener estadísticas de reportes
  const getReportStats = useCallback(async (): Promise<ReportStats | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await ReportService.getReportStats()
      return stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener estadísticas'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener reportes por jugador
  const getReportsByPlayer = useCallback(async (playerId: string): Promise<Report[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const reports = await ReportService.getReportsByPlayer(playerId)
      return reports
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reportes por jugador'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener reportes por autor
  const getReportsByAuthor = useCallback(async (author: string): Promise<Report[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const reports = await ReportService.getReportsByAuthor(author)
      return reports
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reportes por autor'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener reportes por estado
  const getReportsByStatus = useCallback(async (status: string): Promise<Report[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const reports = await ReportService.getReportsByStatus(status)
      return reports
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reportes por estado'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear un nuevo reporte
  const createReport = useCallback(async (data: any): Promise<Report | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const report = await ReportService.createReport(data)
      return report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear reporte'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar un reporte
  const updateReport = useCallback(async (id: string, data: any): Promise<Report | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const report = await ReportService.updateReport(id, data)
      return report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar reporte'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar un reporte
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await ReportService.deleteReport(id)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar reporte'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar reportes iniciales
  useEffect(() => {
    searchReports()
  }, [searchReports])

  return {
    reports,
    loading,
    error,
    pagination,
    searchReports,
    getReport,
    getReportStats,
    getReportsByPlayer,
    getReportsByAuthor,
    getReportsByStatus,
    createReport,
    updateReport,
    deleteReport
  }
}
