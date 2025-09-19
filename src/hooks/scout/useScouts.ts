import { useState, useCallback } from 'react'

// Interfaces locales (copiadas del servicio para evitar importar Prisma en el cliente)
export interface ScoutFilters {
  search?: string
  scout_name?: string
  name?: string
  surname?: string
  nationality?: string
  email?: string
  country?: string
  favourite_club?: string
  open_to_work?: boolean
  nationality_expertise?: string
  competition_expertise?: string
  scout_level?: string
  min_age?: number
  max_age?: number
  min_total_reports?: number
  max_total_reports?: number
  min_original_reports?: number
  max_original_reports?: number
  min_roi?: number
  max_roi?: number
  min_net_profits?: number
  max_net_profits?: number
  min_scout_elo?: number
  max_scout_elo?: number
  min_ranking?: number
  max_ranking?: number
  join_date_from?: Date
  join_date_to?: Date
}

export interface ScoutSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: ScoutFilters
}

export interface Scout {
  id_scout: string
  join_date?: Date
  scout_name?: string
  name?: string
  surname?: string
  date_of_birth?: Date
  age?: number
  nationality?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  favourite_club?: string
  open_to_work?: boolean
  professional_experience?: string
  twitter_profile?: string
  instagram_profile?: string
  linkedin_profile?: string
  url_profile?: string
  total_reports?: number
  total_reports_norm?: number
  total_reports_rank?: number
  original_reports?: number
  original_reports_norm?: number
  original_reports_rank?: number
  nationality_expertise?: string
  competition_expertise?: string
  avg_potential?: number
  avg_initial_age?: number
  avg_initial_age_norm?: number
  total_investment?: number
  total_investment_rank?: number
  total_investment_orig?: number
  total_investment_orig_rank?: number
  net_profits?: number
  net_profits_rank?: number
  net_profits_orig?: number
  net_profits_orig_rank?: number
  roi?: number
  roi_norm?: number
  roi_rank?: number
  roi_orig?: number
  roi_orig_rank?: number
  avg_initial_trfm_value?: number
  avg_initial_trfm_value_rank?: number
  avg_initial_trfm_value_orig?: number
  avg_initial_trfm_value_orig_rank?: number
  max_profit_report?: number
  max_profit_report_rank?: number
  min_profit_report?: number
  min_profit_report_rank?: number
  avg_profit_report?: number
  avg_profit_report_norm?: number
  avg_profit_report_rank?: number
  avg_profit_report_orig?: number
  avg_profit_report_orig_rank?: number
  transfer_team_pts?: number
  transfer_team_pts_norm?: number
  transfer_team_pts_rank?: number
  transfer_team_pts_orig?: number
  transfer_team_pts_orig_rank?: number
  avg_initial_team_elo?: number
  avg_initial_team_level?: string
  transfer_competition_pts?: number
  transfer_competition_pts_norm?: number
  transfer_competition_pts_rank?: number
  transfer_competition_pts_orig?: number
  transfer_competition_pts_orig_rank?: number
  avg_initial_competition_elo?: number
  avg_initial_competition_level?: string
  scout_elo?: number
  scout_level?: string
  scout_ranking?: number
  createdAt: Date
  updatedAt: Date
}

export interface ScoutSearchResult {
  scouts: Scout[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ScoutStats {
  totalScouts: number
  scoutsByNationality: Array<{ nationality: string | null; _count: number }>
  scoutsByCountry: Array<{ country: string | null; _count: number }>
  scoutsByLevel: Array<{ scout_level: string | null; _count: number }>
  scoutsByExpertise: Array<{ nationality_expertise: string | null; _count: number }>
  avgAge: number | null
  avgTotalReports: number | null
  avgOriginalReports: number | null
  avgRoi: number | null
  avgNetProfits: number | null
  avgScoutElo: number | null
}

export function useScouts() {
  const [scouts, setScouts] = useState<Scout[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Buscar scouts
  const searchScouts = useCallback(async (options: ScoutSearchOptions = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir parámetros de URL
      const params = new URLSearchParams()
      
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.sortBy) params.append('sortBy', options.sortBy)
      if (options.sortOrder) params.append('sortOrder', options.sortOrder)
      
      // Agregar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'search') {
              params.append('search', value.toString())
            } else {
              params.append(key, value.toString())
            }
          }
        })
      }
      
      // Hacer llamada a la API
      const response = await fetch(`/api/scouts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar scouts')
      }
      
      const result = await response.json()
      setScouts(result.scouts)
      setPagination(result.pagination)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar scouts'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener un scout por ID
  const getScout = useCallback(async (id: string): Promise<Scout | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/scouts/${id}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener scout')
      }
      
      const scout = await response.json()
      return scout
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener scout'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear un nuevo scout
  const createScout = useCallback(async (data: unknown): Promise<Scout | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/scouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Error al crear scout')
      }
      
      const scout = await response.json()
      return scout
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear scout'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    scouts,
    loading,
    error,
    pagination,
    searchScouts,
    getScout,
    createScout
  }
}
