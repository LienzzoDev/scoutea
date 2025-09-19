'use client'

import { useAuth } from '@clerk/nextjs'
import { useState, useCallback, useMemo } from 'react'

import { fetchPlayerAPI } from '@/lib/debug/api-debug'

import { useErrorHandler } from '../base'
import type { 
  Player, 
  PlayerSearchOptions, 
  PlayerSearchResult, 
  PlayerStats,
  CreatePlayerData 
} from '../types/player'


export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [pagination, setPagination] = useState<PlayerSearchResult['pagination'] | null>(null)
  
  // 🔐 HOOK DE AUTENTICACIÓN DE CLERK
  const { isLoaded, isSignedIn, getToken } = useAuth()
  
  const { handleError, clearError, getError } = useErrorHandler()
  
  // Estado de loading centralizado
  const [loading, setLoading] = useState(false)
  
  // Error simplificado usando el hook base
  const _error = getError('players')?.message || null

  /**
   * 🔍 BUSCAR JUGADORES CON FILTROS
   */
  const searchPlayers = useCallback(async (options: PlayerSearchOptions = {}): Promise<PlayerSearchResult> => {
    console.log('usePlayers.searchPlayers: Starting search with options:', options)

    if (!isLoaded) {
      console.log('usePlayers.searchPlayers: Auth not loaded yet, waiting...')
      throw new Error('Autenticación no cargada')
    }

    setLoading(true)
    clearError('players')

    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      let token: string | null = null
      if (isSignedIn) {
        try {
          token = await getToken()
        } catch (tokenError) {
          console.warn('usePlayers.searchPlayers: Failed to get auth token:', tokenError)
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // 🚀 LLAMADA A LA API CONSOLIDADA
      // Construir URL con parámetros de búsqueda
      const searchParams = new URLSearchParams()
      
      if (options.search) searchParams.set('search', options.search)
      if (options.position) searchParams.set('filters[position_player]', options.position)
      if (options.nationality) searchParams.set('filters[nationality_1]', options.nationality)
      if (options.team) searchParams.set('filters[team_name]', options.team)
      if (options.competition) searchParams.set('filters[team_competition]', options.competition)
      if (options.ageMin !== undefined) searchParams.set('filters[min_age]', options.ageMin.toString())
      if (options.ageMax !== undefined) searchParams.set('filters[max_age]', options.ageMax.toString())
      if (options.ratingMin !== undefined) searchParams.set('filters[min_rating]', options.ratingMin.toString())
      if (options.ratingMax !== undefined) searchParams.set('filters[max_rating]', options.ratingMax.toString())
      if (options.page !== undefined) searchParams.set('page', options.page.toString())
      if (options.limit !== undefined) searchParams.set('limit', options.limit.toString())
      if (options.sortBy) searchParams.set('sortBy', options.sortBy)
      if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder)
      
      const url = `/api/players${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      
      const searchResult = await fetchPlayerAPI(url, {
        method: 'GET',
        headers
      })

      console.log('usePlayers.searchPlayers: Search completed', {
        playersCount: searchResult.players?.length || 0
      });

      // 📊 ACTUALIZAR ESTADO
      setPlayers(searchResult.players || [])
      setPagination(searchResult.pagination || null)
      
      return searchResult
      
    } catch (err) {
      console.error('usePlayers.searchPlayers: Error occurred:', err);
      
      const _error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al buscar jugadores'
      )
      
      handleError(_error, { 
        __context: 'players',
        logErrors: true,
        retryable: true
      });
      
      setPlayers([])
      setPagination(null)
      
      throw _error
    } finally {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, getToken, clearError, handleError])

  /**
   * 👤 OBTENER UN JUGADOR POR ID
   */
  const getPlayer = useCallback(async (id: string): Promise<Player | null> => {
    console.log('usePlayers.getPlayer: Getting player with ID:', id);
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de jugador inválido')
    }

    if (!isLoaded) {
      throw new Error('Autenticación no cargada')
    }

    setLoading(true)
    clearError('players')

    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      let token: string | null = null
      if (isSignedIn) {
        try {
          token = await getToken()
        } catch (tokenError) {
          console.warn('usePlayers.getPlayer: Failed to get auth token:', tokenError)
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Use enhanced API debugger
      const playerData: Player = await fetchPlayerAPI(`/api/players/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers
      })
      
      // 📊 VALIDAR ESTRUCTURA DEL JUGADOR
      if (!playerData || !playerData.id_player) {
        console.error('usePlayers.getPlayer: Invalid player data received:', playerData);
        throw new Error('Datos del jugador incompletos o inválidos')
      }
      
      return playerData;
        
    } catch (err) {
      console.error('usePlayers.getPlayer: Error occurred:', err);
      
      const _error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al obtener jugador'
      )
      
      handleError(_error, { 
        __context: 'players',
        logErrors: true,
        retryable: true
      });
      
      throw _error
    } finally {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, getToken, clearError, handleError])

  /**
   * 📊 OBTENER ESTADÍSTICAS DE UN JUGADOR
   */
  const getPlayerStats = useCallback(async (_playerId: string): Promise<PlayerStats | null> => {
    if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
      throw new Error('ID de jugador inválido')
    }

    if (!isLoaded) {
      throw new Error('Autenticación no cargada')
    }

    setLoading(true)
    clearError('players')

    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      let token: string | null = null
      if (isSignedIn) {
        try {
          token = await getToken()
        } catch (tokenError) {
          console.warn('usePlayers.getPlayerStats: Failed to get auth token:', tokenError)
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const statsData = await fetchPlayerAPI(`/api/players/${encodeURIComponent(playerId)}/stats`, {
        method: 'GET',
        headers
      })
      
      return statsData
        
    } catch (err) {
      console.error('usePlayers.getPlayerStats: Error occurred:', err);
      
      const _error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al obtener estadísticas del jugador'
      )
      
      handleError(_error, { 
        __context: 'players',
        logErrors: true,
        retryable: true
      });
      
      throw _error
    } finally {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, getToken, clearError, handleError])

  /**
   * ➕ CREAR NUEVO JUGADOR
   */
  const createPlayer = useCallback(async (playerData: CreatePlayerData): Promise<Player> => {
    if (!playerData || typeof playerData !== 'object') {
      throw new Error('Datos del jugador inválidos')
    }

    if (!isLoaded) {
      throw new Error('Autenticación no cargada')
    }

    if (!isSignedIn) {
      throw new Error('Usuario no autenticado')
    }

    setLoading(true)
    clearError('players')

    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      const token = await getToken()
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación')
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      const newPlayer = await fetchPlayerAPI('/api/players', {
        method: 'POST',
        headers,
        body: playerData
      })
      
      return newPlayer
        
    } catch (err) {
      console.error('usePlayers.createPlayer: Error occurred:', err);
      
      const _error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al crear jugador'
      )
      
      handleError(_error, { 
        __context: 'players',
        logErrors: true,
        retryable: true
      });
      
      throw _error
    } finally {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, getToken, clearError, handleError])

  // 🚀 MEMOIZAR MÉTODOS PARA EVITAR RE-RENDERS
  const methods = useMemo(() => ({
    searchPlayers,
    getPlayer,
    getPlayerStats,
    createPlayer
  }), [searchPlayers, getPlayer, getPlayerStats, createPlayer])

  return {
    players,
    pagination,
    loading,
    error,
    ...methods
  }
}