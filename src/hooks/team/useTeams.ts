import { useState, useEffect, useCallback } from 'react'

export interface TeamFilters {
  team_name?: string
  team_country?: string
  competition?: string
  competition_country?: string
  min_rating?: number
  max_rating?: number
  min_value?: number
  max_value?: number
}

export interface TeamSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: TeamFilters
}

export interface Team {
  id_team: string
  team_name: string
  correct_team_name?: string
  team_country?: string
  url_trfm_advisor?: string
  url_trfm?: string
  owner_club?: string
  owner_club_country?: string
  pre_competition?: string
  competition?: string
  correct_competition?: string
  competition_country?: string
  team_trfm_value?: number
  team_trfm_value_norm?: number
  team_rating?: number
  team_rating_norm?: number
  team_elo?: number
  team_level?: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamSearchResult {
  teams: Team[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface TeamStats {
  totalTeams: number
  teamsByCountry: Array<{ team_country: string; _count: { team_country: number } }>
  teamsByCompetition: Array<{ competition: string; _count: { competition: number } }>
  avgRating: number | null
  avgValue: number | null
  topRatedTeams: Array<{
    id_team: string
    team_name: string
    team_rating: number | null
    team_country: string | null
    competition: string | null
  }>
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<TeamSearchResult['pagination'] | null>(null)

  // Buscar equipos
  const searchTeams = useCallback(async (options: TeamSearchOptions = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir query params
      const queryParams = new URLSearchParams()
      
      queryParams.append('page', (options.page || 1).toString())
      queryParams.append('limit', (options.limit || 20).toString())
      queryParams.append('sortBy', options.sortBy || 'team_name')
      queryParams.append('sortOrder', options.sortOrder || 'asc')
      
      // Añadir filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(`filters[${key}]`, value.toString())
          }
        })
      }

      const response = await fetch(`/api/teams?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al buscar equipos')
      }

      const result: TeamSearchResult = await response.json()
      setTeams(result.teams)
      setPagination(result.pagination)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar equipos'
      setError(errorMessage)
      console.error('❌ Error searching teams:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener un equipo por ID
  const getTeam = useCallback(async (id: string): Promise<Team | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/teams/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al obtener equipo')
      }

      const team: Team = await response.json()
      return team
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener equipo'
      setError(errorMessage)
      console.error('❌ Error getting team:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener estadísticas de equipos
  const getTeamStats = useCallback(async (): Promise<TeamStats | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/teams/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al obtener estadísticas')
      }

      const stats: TeamStats = await response.json()
      return stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener estadísticas'
      setError(errorMessage)
      console.error('❌ Error getting team stats:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener equipos por país
  const getTeamsByCountry = useCallback(async (country: string): Promise<Team[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await searchTeams({
        filters: { team_country: country },
        limit: 100
      })
      
      return result.teams
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener equipos por país'
      setError(errorMessage)
      console.error('❌ Error getting teams by country:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [searchTeams])

  // Obtener equipos por competición
  const getTeamsByCompetition = useCallback(async (competition: string): Promise<Team[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await searchTeams({
        filters: { competition: competition },
        limit: 100
      })
      
      return result.teams
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener equipos por competición'
      setError(errorMessage)
      console.error('❌ Error getting teams by competition:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [searchTeams])

  // Crear un nuevo equipo
  const createTeam = useCallback(async (data: any): Promise<Team | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al crear equipo')
      }

      const team: Team = await response.json()
      return team
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear equipo'
      setError(errorMessage)
      console.error('❌ Error creating team:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar un equipo
  const updateTeam = useCallback(async (id: string, data: any): Promise<Team | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/teams/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar equipo')
      }

      const team: Team = await response.json()
      return team
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar equipo'
      setError(errorMessage)
      console.error('❌ Error updating team:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar un equipo
  const deleteTeam = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/teams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar equipo')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar equipo'
      setError(errorMessage)
      console.error('❌ Error deleting team:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar equipos iniciales
  useEffect(() => {
    const loadInitialTeams = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const queryParams = new URLSearchParams()
        queryParams.append('page', '1')
        queryParams.append('limit', '20')
        queryParams.append('sortBy', 'team_name')
        queryParams.append('sortOrder', 'asc')

        const response = await fetch(`/api/teams?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al cargar equipos')
        }

        const result: TeamSearchResult = await response.json()
        setTeams(result.teams)
        setPagination(result.pagination)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar equipos'
        setError(errorMessage)
        console.error('❌ Error loading initial teams:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialTeams()
  }, [])

  return {
    teams,
    loading,
    error,
    pagination,
    searchTeams,
    getTeam,
    getTeamStats,
    getTeamsByCountry,
    getTeamsByCompetition,
    createTeam,
    updateTeam,
    deleteTeam
  }
}
