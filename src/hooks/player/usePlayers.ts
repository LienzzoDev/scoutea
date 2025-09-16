'use client'

import { useState, useCallback, useMemo } from 'react'

import type { 
  Player, 
  PlayerSearchOptions, 
  PlayerSearchResult, 
  PlayerStats,
  CreatePlayerData 
} from '../types/player'

import { useCache, useErrorHandler } from '../base'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [pagination, setPagination] = useState<PlayerSearchResult['pagination'] | null>(null)
  
  // 🚀 USAR HOOKS BASE PARA FUNCIONALIDAD COMÚN
  const cache = useCache({ 
    key: 'players', 
    ttl: 5 * 60 * 1000, // 5 minutos
    storage: 'memory' 
  })
  
  const { handleError, clearError, getError } = useErrorHandler()
  
  // Estado de loading centralizado
  const [loading, setLoading] = useState(false)
  
  // Error simplificado usando el hook base
  const error = getError('players')?.message || null

  /**
   * 🔍 BUSCAR JUGADORES CON FILTROS OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Busca jugadores usando la API consolidada optimizada
   * ✅ OPTIMIZACIONES: Cache inteligente, validación mejorada, manejo de errores robusto
   * ✅ BENEFICIO: Menos llamadas redundantes, mejor UX, respuestas más rápidas
   */
  const searchPlayers = useCallback(async (options: PlayerSearchOptions = {}) => {
    // 🚀 OPTIMIZACIÓN: Cache inteligente para evitar llamadas redundantes
    const cacheKey = `search-${JSON.stringify(options)}`
    const cachedResult = cache.get(cacheKey)
    
    if (cachedResult && !loading) {
      setPlayers(cachedResult.players)
      setPagination(cachedResult.pagination)
      return
    }

    setLoading(true)
    clearError('players')

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
      const response = await fetch(`/api/players?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || `Error ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code
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
      cache.set(data, cacheKey)
      
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      
      // 🧹 LIMPIAR ESTADO EN CASO DE ERROR
      setPlayers([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [cache, loading, clearError, handleError])

  /**
   * 👤 OBTENER UN JUGADOR POR ID OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene un jugador específico usando la API consolidada
   * ✅ OPTIMIZACIONES: Cache por ID, validación mejorada, manejo de errores específicos
   */
  const getPlayer = useCallback(async (id: string): Promise<Player | null> => {
    console.log('usePlayers.getPlayer: Called with ID:', id);
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      console.log('usePlayers.getPlayer: Invalid ID provided');
      handleError('ID de jugador inválido', { context: 'players' })
      return null
    }

    // 🚀 VERIFICAR CACHE PRIMERO
    const cacheKey = `player-${id}`
    const cachedPlayer = cache.get(cacheKey)
    if (cachedPlayer) {
      console.log('usePlayers.getPlayer: Cache HIT for', id);
      return cachedPlayer
    }

    console.log('usePlayers.getPlayer: Cache MISS, fetching from API');
    setLoading(true)
    clearError('players')

    try {
      const response = await fetch(`/api/players/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300' // 5 minutos de cache en servidor
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al obtener el jugador',
          status: response.status,
          code: errorData.code
        }
      }

      const player: Player = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DEL JUGADOR
      if (!player.id_player || !player.player_name) {
        throw new Error('Datos del jugador incompletos')
      }
      
      // 💾 GUARDAR EN CACHE (10 minutos para jugadores individuales)
      cache.set(player, cacheKey, 10 * 60 * 1000)
      
      console.log('usePlayers.getPlayer: Success, returning player data');
      return player
      
    } catch (err) {
      console.error('usePlayers.getPlayer: Error occurred:', err);
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      return null
    } finally {
      console.log('usePlayers.getPlayer: Setting usePlayers loading to false');
      setLoading(false)
    }
  }, []) // Empty dependencies to prevent infinite loops - cache and error handlers are stable

  /**
   * 📊 OBTENER ESTADÍSTICAS DE JUGADORES OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene estadísticas usando la API consolidada optimizada
   * ✅ OPTIMIZACIONES: Cache con TTL, validación de respuesta, métricas de performance
   */
  const getPlayerStats = useCallback(async (): Promise<PlayerStats | null> => {
    // 🚀 VERIFICAR CACHE PRIMERO (30 minutos para estadísticas)
    const cacheKey = 'player-stats'
    const cachedStats = cache.get(cacheKey)
    if (cachedStats) {
      return cachedStats
    }

    setLoading(true)
    clearError('players')

    try {
      const response = await fetch('/api/players/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300' // 5 minutos en servidor
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al obtener estadísticas',
          status: response.status,
          code: errorData.code
        }
      }

      const stats: PlayerStats = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DE ESTADÍSTICAS
      if (typeof stats.totalPlayers !== 'number' || !Array.isArray(stats.playersByPosition)) {
        throw new Error('Estadísticas con formato inválido')
      }
      
      // 💾 GUARDAR EN CACHE (30 minutos para estadísticas)
      cache.set(stats, cacheKey, 30 * 60 * 1000)
      
      return stats
      
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [cache, clearError, handleError])

  /**
   * 🏟️ OBTENER JUGADORES POR EQUIPO OPTIMIZADO
   */
  const getPlayersByTeam = useCallback(async (teamName: string): Promise<Player[]> => {
    if (!teamName || typeof teamName !== 'string') {
      handleError('Nombre de equipo inválido', { context: 'players' })
      return []
    }

    // 🚀 VERIFICAR CACHE
    const cacheKey = `team-${teamName}`
    const cachedPlayers = cache.get(cacheKey)
    if (cachedPlayers) {
      return cachedPlayers
    }

    setLoading(true)
    clearError('players')

    try {
      const response = await fetch(`/api/players/team/${encodeURIComponent(teamName)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al obtener jugadores del equipo',
          status: response.status,
          code: errorData.code
        }
      }

      const players: Player[] = await response.json()
      
      // 💾 GUARDAR EN CACHE (10 minutos)
      cache.set(players, cacheKey, 10 * 60 * 1000)
      
      return players
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [cache, clearError, handleError])

  /**
   * ⚽ OBTENER JUGADORES POR POSICIÓN OPTIMIZADO
   */
  const getPlayersByPosition = useCallback(async (position: string): Promise<Player[]> => {
    if (!position || typeof position !== 'string') {
      handleError('Posición inválida', { context: 'players' })
      return []
    }

    // 🚀 VERIFICAR CACHE
    const cacheKey = `position-${position}`
    const cachedPlayers = cache.get(cacheKey)
    if (cachedPlayers) {
      return cachedPlayers
    }

    setLoading(true)
    clearError('players')

    try {
      const response = await fetch(`/api/players/position/${encodeURIComponent(position)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al obtener jugadores por posición',
          status: response.status,
          code: errorData.code
        }
      }

      const players: Player[] = await response.json()
      
      // 💾 GUARDAR EN CACHE (10 minutos)
      cache.set(players, cacheKey, 10 * 60 * 1000)
      
      return players
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [cache, clearError, handleError])

  /**
   * 🔧 OBTENER FILTROS DISPONIBLES OPTIMIZADO
   * 
   * ✅ QUÉ HACE: Obtiene opciones para dropdowns usando la API consolidada
   * ✅ OPTIMIZACIONES: Cache agresivo (1 hora), validación de respuesta
   */
  const getAvailableFilters = useCallback(async (): Promise<any | null> => {
    // 🚀 VERIFICAR CACHE PRIMERO (1 hora para filtros)
    const cacheKey = 'available-filters'
    const cachedFilters = cache.get(cacheKey)
    if (cachedFilters) {
      return cachedFilters
    }

    setLoading(true)
    clearError('players')

    try {
      const response = await fetch('/api/players/filters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=600' // 10 minutos en servidor
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al obtener filtros',
          status: response.status,
          code: errorData.code
        }
      }

      const filters = await response.json()
      
      // 📊 VALIDAR ESTRUCTURA DE FILTROS
      if (!filters.positions || !filters.nationalities || !filters.teams || !filters.competitions) {
        throw new Error('Filtros con formato inválido')
      }
      
      // 💾 GUARDAR EN CACHE (1 hora - los filtros no cambian frecuentemente)
      cache.set(filters, cacheKey, 60 * 60 * 1000)
      
      return filters
      
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: true
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [cache, clearError, handleError])

  /**
   * 🧹 LIMPIAR CACHE
   * 
   * ✅ QUÉ HACE: Limpia el cache interno para forzar nuevas consultas
   * ✅ CUÁNDO USAR: Después de crear/actualizar jugadores
   */
  const clearCache = useCallback(() => {
    cache.clear()
    setPlayers([])
    setPagination(null)
    clearError('players')
  }, [cache, clearError])

  /**
   * ➕ CREAR NUEVO JUGADOR
   * 
   * ✅ QUÉ HACE: Crea un nuevo jugador usando la API consolidada /api/players
   * ✅ BENEFICIO: Permite añadir jugadores desde el panel de admin
   */
  const crearJugador = useCallback(async (data: CreatePlayerData): Promise<Player | null> => {
    if (!data || !data.player_name) {
      handleError('Datos del jugador inválidos', { context: 'players' })
      return null
    }

    setLoading(true)
    clearError('players')

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Error al crear el jugador',
          status: response.status,
          code: errorData.code,
          details: errorData.details
        }
      }

      const jugador: Player = await response.json()
      
      // Limpiar cache para refrescar listas
      clearCache()
      
      return jugador
      
    } catch (err) {
      handleError(err, { 
        context: 'players',
        logErrors: true,
        retryable: false // No reintentar creaciones automáticamente
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [clearCache, clearError, handleError])

  // Memoize methods to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    // Search methods
    searchPlayers,
    getPlayer,
    getPlayerStats,
    getPlayersByTeam,
    getPlayersByPosition,
    getAvailableFilters,
    
    // Creation methods
    crearJugador,
    
    // Utilities
    clearCache,
    
    // Error handling
    clearError: () => clearError('players'),
    retryLastAction: () => {
      // TODO: Implement retry functionality for failed operations
      console.log('Retry functionality can be implemented here')
    }
  }), [
    searchPlayers,
    getPlayer,
    getPlayerStats,
    getPlayersByTeam,
    getPlayersByPosition,
    getAvailableFilters,
    crearJugador,
    clearCache,
    clearError
  ])

  return {
    // 📊 ESTADO
    players,
    loading,
    error,
    pagination,
    
    // 📈 ESTADÍSTICAS DEL CACHE
    cacheStats: cache.stats,
    
    // 🔧 MÉTODOS
    ...methods
  }
}

export default usePlayers

// 🔄 EXPORT PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// Algunos archivos antiguos pueden estar importando useJugadores
export { usePlayers as useJugadores }