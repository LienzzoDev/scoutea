import { useState, useEffect, useCallback } from 'react'
import { CompetitionService, CompetitionFilters, CompetitionSearchOptions } from '@/lib/db/competition-service'

export interface Competition {
  id_competition: string
  competition_name: string
  correct_competition_name?: string
  competition_country?: string
  url_trfm?: string
  competition_confederation?: string
  competition_tier?: string
  competition_trfm_value?: number
  competition_trfm_value_norm?: number
  competition_rating?: number
  competition_rating_norm?: number
  competition_elo?: number
  competition_level?: string
  createdAt: Date
  updatedAt: Date
}

export interface CompetitionSearchResult {
  competitions: Competition[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CompetitionStats {
  totalCompetitions: number
  competitionsByCountry: Array<{ competition_country: string | null; _count: number }>
  competitionsByConfederation: Array<{ competition_confederation: string | null; _count: number }>
  competitionsByTier: Array<{ competition_tier: string | null; _count: number }>
  avgRating: number | null
  avgValue: number | null
}

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Buscar competiciones
  const searchCompetitions = useCallback(async (options: CompetitionSearchOptions = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await CompetitionService.searchCompetitions(options)
      setCompetitions(result.competitions)
      setPagination(result.pagination)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar competiciones'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener una competición por ID
  const getCompetition = useCallback(async (id: string): Promise<Competition | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const competition = await CompetitionService.getCompetitionById(id)
      return competition
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener competición'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener estadísticas de competiciones
  const getCompetitionStats = useCallback(async (): Promise<CompetitionStats | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const stats = await CompetitionService.getCompetitionStats()
      return stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener estadísticas'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener competiciones por país
  const getCompetitionsByCountry = useCallback(async (country: string): Promise<Competition[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const competitions = await CompetitionService.getCompetitionsByCountry(country)
      return competitions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener competiciones por país'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener competiciones por confederación
  const getCompetitionsByConfederation = useCallback(async (confederation: string): Promise<Competition[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const competitions = await CompetitionService.getCompetitionsByConfederation(confederation)
      return competitions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener competiciones por confederación'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener competiciones por tier
  const getCompetitionsByTier = useCallback(async (tier: string): Promise<Competition[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const competitions = await CompetitionService.getCompetitionsByTier(tier)
      return competitions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener competiciones por tier'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear una nueva competición
  const createCompetition = useCallback(async (data: any): Promise<Competition | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const competition = await CompetitionService.createCompetition(data)
      return competition
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear competición'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar una competición
  const updateCompetition = useCallback(async (id: string, data: any): Promise<Competition | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const competition = await CompetitionService.updateCompetition(id, data)
      return competition
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar competición'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar una competición
  const deleteCompetition = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await CompetitionService.deleteCompetition(id)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar competición'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar competiciones iniciales
  useEffect(() => {
    searchCompetitions()
  }, [searchCompetitions])

  return {
    competitions,
    loading,
    error,
    pagination,
    searchCompetitions,
    getCompetition,
    getCompetitionStats,
    getCompetitionsByCountry,
    getCompetitionsByConfederation,
    getCompetitionsByTier,
    createCompetition,
    updateCompetition,
    deleteCompetition
  }
}
