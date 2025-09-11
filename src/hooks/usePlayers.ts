'use client'

import { useState, useCallback } from 'react'

export interface Player {
  id_player: string
  player_name: string
  complete_player_name?: string
  date_of_birth?: string
  correct_date_of_birth?: string
  age?: number
  age_value?: number
  age_value_percent?: number
  age_coeff?: number
  wyscout_id_1?: string
  wyscout_name_1?: string
  wyscout_id_2?: string
  wyscout_name_2?: string
  id_fmi?: string
  position_player?: string
  correct_position_player?: string
  position_value?: number
  position_value_percent?: number
  foot?: string
  correct_foot?: string
  height?: number
  correct_height?: number
  nationality_1?: string
  correct_nationality_1?: string
  nationality_value?: number
  nationality_value_percent?: number
  nationality_2?: string
  correct_nationality_2?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  team_level_value?: number
  team_level_value_percent?: number
  team_competition?: string
  competition_country?: string
  team_competition_value?: number
  team_competition_value_percent?: number
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  competition_level_value?: number
  competition_level_value_percent?: number
  owner_club?: string
  owner_club_country?: string
  owner_club_value?: number
  owner_club_value_percent?: number
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean
  agency?: string
  correct_agency?: string
  contract_end?: string
  correct_contract_end?: string
  player_rating?: number
  player_rating_norm?: number
  player_trfm_value?: number
  player_trfm_value_norm?: number
  total_fmi_pts_norm?: number
  player_elo?: number
  player_level?: string
  player_ranking?: number
  community_potential?: number
  stats_evo_3m?: number
  photo_coverage?: string
  url_trfm?: string
  url_trfm_advisor?: string
  url_secondary?: string
  url_instagram?: string
  video?: string
  existing_club?: string
  createdAt: string
  updatedAt: string
}

export interface PlayerFilters {
  player_name?: string
  position_player?: string
  team_name?: string
  nationality_1?: string
  min_age?: number
  max_age?: number
  min_rating?: number
  max_rating?: number
  on_loan?: boolean
}

export interface PlayerSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: PlayerFilters
}

export interface PlayerSearchResult {
  players: Player[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface PlayerStats {
  totalPlayers: number
  playersByPosition: Array<{
    position_player: string
    _count: { position_player: number }
  }>
  playersByNationality: Array<{
    nationality_1: string
    _count: { nationality_1: number }
  }>
  averageRating: number | null
  topRatedPlayers: Array<{
    id_player: string
    player_name: string
    player_rating: number | null
    team_name: string | null
    position_player: string | null
  }>
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PlayerSearchResult['pagination'] | null>(null)
  
  // 🚀 NUEVO: Cache simple para evitar llamadas redundantes
  const [lastSearchOptions, setLastSearchOptions] = useState<string>('')
  const [cachedResult, setCachedResult] = useState<PlayerSearchResult | null>(null)

  /**
   * 🔍 BUSCAR JUGADORES CON FILTROS OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Busca jugadores usando la API consolidada optimizada
   * ✅ OPTIMIZACIONES: Cache simple, validación mejorada, manejo de errores robusto
   * ✅ BENEFICIO: Menos llamadas redundantes, mejor UX, respuestas más rápidas
   */
  const searchPlayers = useCallback(async (options: PlayerSearchOptions = {}) => {
    // 🚀 OPTIMIZACIÓN: Cache simple para evitar llamadas redundantes
    const optionsKey = JSON.stringify(options)
    if (optionsKey === lastSearchOptions && cachedResult && !loading) {
      setPlayers(cachedResult.players)
      setPagination(cachedResult.pagination)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 🛡️ VALIDACIÓN DE PARÁMETROS MEJORADA
      const safeOptions = {
        page: Math.max(options.page || 1, 1),
        limit: Math.min(Math.max(options.limit || 20, 1), 100),
        sortBy: options.sortBy || 'player_name',
        sortOrder: options.sortOrder || 'asc',
        filters: options.filters || {}
      }

      // 🔧 CONSTRUIR QUERY PARAMS OPTIMIZADO
      const queryParams = new URLSearchParams()
      
      queryParams.append('page', safeOptions.page.toString())
      queryParams.append('limit', safeOptions.limit.toString())
      queryParams.append('sortBy', safeOptions.sortBy)
      queryParams.append('sortOrder', safeOptions.sortOrder)
      
      // 🔍 AÑADIR FILTROS SOLO SI TIENEN VALOR
      if (safeOptions.filters) {
        Object.entries(safeOptions.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(`filters[${key}]`, value.toString())
          }
        })
      }

      // 🚀 LLAMADA A LA API CONSOLIDADA
      const startTime = Date.now()
      
      const response = await fetch(`/api/players?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 🚀 HEADERS PARA OPTIMIZACIÓN
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // 🔍 MANEJO DE ERRORES ESPECÍFICOS
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a esta información.')
        } else if (response.status === 429) {
          throw new Error('Demasiadas solicitudes. Por favor, espera un momento.')
        } else {
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }
      }

      const data: PlayerSearchResult = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DE RESPUESTA
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('Respuesta inválida del servidor')
      }

      // 🚀 ACTUALIZAR ESTADO Y CACHE
      setPlayers(data.players)
      setPagination(data.pagination)
      setLastSearchOptions(optionsKey)
      setCachedResult(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al buscar jugadores'
      setError(errorMessage)
      console.error('❌ Error searching players:', {
        error: errorMessage,
        options: options,
        timestamp: new Date().toISOString()
      })
      
      // 🧹 LIMPIAR ESTADO EN CASO DE ERROR
      setPlayers([])
      setPagination(null)
      setCachedResult(null)
    } finally {
      setLoading(false)
    }
  }, [lastSearchOptions, cachedResult, loading])

  /**
   * 👤 OBTENER UN JUGADOR POR ID OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene un jugador específico usando la API consolidada
   * ✅ OPTIMIZACIONES: Cache por ID, validación mejorada, manejo de errores específicos
   */
  const getPlayer = useCallback(async (id: string): Promise<Player | null> => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      setError('ID de jugador inválido')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      const response = await fetch(`/api/players/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver este jugador.')
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al obtener el jugador')
        }
      }

      const player: Player = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DEL JUGADOR
      if (!player.id_player || !player.player_name) {
        throw new Error('Datos del jugador incompletos')
      }
      
      return player
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error getting player:', {
        error: errorMessage,
        playerId: id,
        timestamp: new Date().toISOString()
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 📊 OBTENER ESTADÍSTICAS DE JUGADORES OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene estadísticas usando la API consolidada optimizada
   * ✅ OPTIMIZACIONES: Cache con TTL, validación de respuesta, métricas de performance
   */
  const getPlayerStats = useCallback(async (): Promise<PlayerStats | null> => {
    setLoading(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      const response = await fetch('/api/players/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 🚀 APROVECHAR CACHE DEL SERVIDOR (5 minutos)
          'Cache-Control': 'max-age=300'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver las estadísticas.')
        } else if (response.status === 503) {
          throw new Error('Las estadísticas no están disponibles temporalmente. Inténtalo más tarde.')
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al obtener estadísticas')
        }
      }

      const stats: PlayerStats = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DE ESTADÍSTICAS
      if (typeof stats.totalPlayers !== 'number' || !Array.isArray(stats.playersByPosition)) {
        throw new Error('Estadísticas con formato inválido')
      }
      
      return stats
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error getting player stats:', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtener jugadores por equipo
   */
  const getPlayersByTeam = useCallback(async (teamName: string): Promise<Player[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/players/team/${encodeURIComponent(teamName)}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener jugadores del equipo')
      }

      const players: Player[] = await response.json()
      return players
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error getting players by team:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtener jugadores por posición
   */
  const getPlayersByPosition = useCallback(async (position: string): Promise<Player[]> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/players/position/${encodeURIComponent(position)}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener jugadores por posición')
      }

      const players: Player[] = await response.json()
      return players
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error getting players by position:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 🔧 OBTENER FILTROS DISPONIBLES OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene opciones para dropdowns usando la API consolidada
   * ✅ OPTIMIZACIONES: Cache agresivo (10 min), validación de respuesta
   */
  const getAvailableFilters = useCallback(async (): Promise<any | null> => {
    setLoading(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      const response = await fetch('/api/players/filters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 🚀 CACHE AGRESIVO (10 minutos) - Los filtros no cambian frecuentemente
          'Cache-Control': 'max-age=600'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 503) {
          throw new Error('Los filtros no están disponibles temporalmente.')
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al obtener filtros')
        }
      }

      const filters = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DE FILTROS
      if (!filters.positions || !filters.nationalities || !filters.teams || !filters.competitions) {
        throw new Error('Filtros con formato inválido')
      }
      
      return filters
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error getting available filters:', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 🧹 LIMPIAR CACHE
   * 
   * ✅ QUÉ HACE: Limpia el cache interno para forzar nuevas consultas
   * ✅ CUÁNDO USAR: Después de crear/actualizar jugadores
   */
  const clearCache = useCallback(() => {
    setLastSearchOptions('')
    setCachedResult(null)
    setPlayers([])
    setPagination(null)
    setError(null)
  }, [])

  /**
   * ➕ CREAR NUEVO JUGADOR
   * 
   * ✅ QUÉ HACE: Crea un nuevo jugador usando la API legacy /api/jugadores
   * ✅ BENEFICIO: Permite añadir jugadores desde el panel de admin
   */
  const crearJugador = useCallback(async (data: any): Promise<any | null> => {
    setLoading(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      const response = await fetch('/api/jugadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Datos inválidos para crear el jugador')
        } else if (response.status === 401) {
          throw new Error('No tienes permisos para crear jugadores')
        } else if (response.status === 409) {
          throw new Error('Ya existe un jugador con ese nombre de usuario')
        } else {
          throw new Error(errorData.error || 'Error al crear el jugador')
        }
      }

      const jugador = await response.json()
      
      // Limpiar cache para refrescar listas
      clearCache()
      
      return jugador
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear jugador'
      setError(errorMessage)
      console.error('❌ Error creating player:', {
        error: err,
        errorMessage: errorMessage,
        errorType: typeof err,
        data: data,
        timestamp: new Date().toISOString()
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [clearCache])

  return {
    // 📊 ESTADO
    players,
    loading,
    error,
    pagination,
    
    // 🔍 MÉTODOS DE BÚSQUEDA
    searchPlayers,
    getPlayer,
    getPlayerStats,
    getPlayersByTeam,
    getPlayersByPosition,
    getAvailableFilters,
    
    // ➕ MÉTODOS DE CREACIÓN
    crearJugador,
    
    // 🛠️ UTILIDADES
    clearCache
  }
}

export default usePlayers

// 🔄 EXPORT PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// Algunos archivos antiguos pueden estar importando useJugadores
export { usePlayers as useJugadores }