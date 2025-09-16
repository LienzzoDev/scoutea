'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useCallback, useEffect, useMemo } from 'react'

import type { Player } from '../types/player'

import { useCache, useErrorHandler } from '../base'


interface PlayerList {
  id: string
  userId: string
  playerId: string
  createdAt: string
  player: Pick<Player, 'id_player' | 'player_name' | 'team_name' | 'position_player' | 'nationality_1' | 'player_rating' | 'photo_coverage'>
}

interface UsePlayerListReturn {
  playerList: PlayerList[]
  isInList: (playerId: string) => boolean
  addToList: (playerId: string) => Promise<boolean>
  removeFromList: (playerId: string) => Promise<boolean>
  loading: boolean
  error: string | null
  refreshList: () => Promise<void>
  clearCache: () => void
  cacheStats: any
  syncAcrossTabs: boolean
  setSyncAcrossTabs: (sync: boolean) => void
}

/**
 * 🚀 HOOK OPTIMIZADO PARA LISTA DE JUGADORES
 * 
 * ✅ MEJORAS IMPLEMENTADAS:
 *   - Cache inteligente con invalidación automática
 *   - Sincronización entre pestañas
 *   - Persistencia en localStorage
 *   - Manejo de errores consistente
 *   - Optimistic updates
 *   - Retry automático
 */
export function usePlayerList(): UsePlayerListReturn {
  const { user, isLoaded } = useUser()
  const [playerList, setPlayerList] = useState<PlayerList[]>([])
  const [loading, setLoading] = useState(false)
  const [syncAcrossTabs, setSyncAcrossTabs] = useState(true)
  
  // 🚀 USAR HOOKS BASE PARA FUNCIONALIDAD COMÚN
  const cache = useCache({ 
    key: `player-list-${user?.id || 'anonymous'}`, 
    ttl: 10 * 60 * 1000, // 10 minutos
    storage: 'localStorage' // Persistir en localStorage para sincronización entre pestañas
  })
  
  const { handleError, clearError, getError, setRetryAction } = useErrorHandler()
  
  // Error simplificado
  const error = getError('playerList')?.message || null

  /**
   * 📋 CARGAR LISTA DE JUGADORES CON CACHE INTELIGENTE
   */
  const loadPlayerList = useCallback(async (forceRefresh: boolean = false) => {
    if (!isLoaded) return
    
    if (!user?.id) {
      setPlayerList([])
      if (error) {
        clearError('playerList')
      }
      return
    }

    // 🚀 VERIFICAR CACHE PRIMERO (si no es refresh forzado)
    if (!forceRefresh) {
      const cachedList = cache.get()
      if (cachedList && Array.isArray(cachedList)) {
        setPlayerList(cachedList)
        return
      }
    }

    setLoading(true)
    if (error) {
      clearError('playerList')
    }

    try {
      const response = await fetch('/api/player-list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=120'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No hay lista aún, es válido
          setPlayerList([])
          cache.set([])
          return
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.playerList || !Array.isArray(data.playerList)) {
        setPlayerList([])
        cache.set([])
        return
      }
      
      setPlayerList(data.playerList)
      cache.set(data.playerList)
      
    } catch (err) {
      // Ensure we have a proper error object
      const error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al cargar lista de jugadores'
      )
      
      handleError(error, { 
        context: 'playerList',
        logErrors: true,
        retryable: true
      })
      
      // Configurar acción de retry
      setRetryAction('playerList', () => loadPlayerList(forceRefresh))
      
      setPlayerList([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, isLoaded, cache, clearError, handleError, setRetryAction])

  /**
   * ❓ VERIFICAR SI JUGADOR ESTÁ EN LA LISTA
   */
  const isInList = useCallback((playerId: string): boolean => {
    return playerList.some(item => item.playerId === playerId)
  }, [playerList])

  /**
   * ➕ AÑADIR JUGADOR A LA LISTA CON OPTIMISTIC UPDATE
   */
  const addToList = useCallback(async (playerId: string): Promise<boolean> => {
    if (!user?.id) {
      handleError('Usuario no autenticado', { context: 'playerList' })
      return false
    }

    if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
      handleError('ID de jugador inválido', { context: 'playerList' })
      return false
    }

    if (isInList(playerId)) {
      handleError('El jugador ya está en tu lista', { context: 'playerList' })
      return false
    }

    // 🚀 OPTIMISTIC UPDATE - Añadir temporalmente a la lista
    const tempItem: PlayerList = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      playerId: playerId.trim(),
      createdAt: new Date().toISOString(),
      player: {
        id_player: playerId.trim(),
        player_name: 'Cargando...',
        team_name: '',
        position_player: '',
        nationality_1: '',
        player_rating: null,
        photo_coverage: null
      }
    }
    
    const previousList = [...playerList]
    setPlayerList(prev => [...prev, tempItem])

    setLoading(true)
    if (error) {
      clearError('playerList')
    }

    try {
      const response = await fetch('/api/player-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: playerId.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error al añadir jugador a la lista (${response.status})`)
      }

      const data = await response.json()
      
      if (!data.playerList) {
        console.error('Respuesta de API inválida:', data)
        throw new Error('Respuesta inválida del servidor')
      }
      
      // 🔄 ACTUALIZAR CON DATOS REALES
      setPlayerList(prev => {
        const filtered = prev.filter(item => item.id !== tempItem.id)
        return [...filtered, data.playerList]
      })
      
      // 💾 ACTUALIZAR CACHE
      const updatedList = [...previousList, data.playerList]
      cache.set(updatedList)
      
      return true
      
    } catch (err) {
      // 🔙 REVERTIR OPTIMISTIC UPDATE
      setPlayerList(previousList)
      
      // Log the original error for debugging
      console.error('Error original en addToList:', err)
      
      // Ensure we have a proper error object
      const error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al añadir jugador a la lista'
      )
      
      handleError(error, { 
        context: 'playerList',
        logErrors: true,
        retryable: true
      })
      
      // Configurar retry
      setRetryAction('playerList', async () => { await addToList(playerId) })
      
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, isInList, playerList, cache, clearError, handleError, setRetryAction])

  /**
   * 🗑️ REMOVER JUGADOR DE LA LISTA CON OPTIMISTIC UPDATE
   */
  const removeFromList = useCallback(async (playerId: string): Promise<boolean> => {
    if (!user?.id) {
      handleError('Usuario no autenticado', { context: 'playerList' })
      return false
    }

    if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
      handleError('ID de jugador inválido', { context: 'playerList' })
      return false
    }

    if (!isInList(playerId)) {
      handleError('El jugador no está en tu lista', { context: 'playerList' })
      return false
    }

    // 🚀 OPTIMISTIC UPDATE - Remover temporalmente de la lista
    const previousList = [...playerList]
    const itemToRemove = playerList.find(item => item.playerId === playerId)
    setPlayerList(prev => prev.filter(item => item.playerId !== playerId))

    setLoading(true)
    if (error) {
      clearError('playerList')
    }

    try {
      const response = await fetch(`/api/player-list/${encodeURIComponent(playerId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Ya no existe, el optimistic update es correcto
          const updatedList = previousList.filter(item => item.playerId !== playerId)
          cache.set(updatedList)
          return true
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error al remover jugador de la lista (${response.status})`)
      }

      // 💾 ACTUALIZAR CACHE
      const updatedList = previousList.filter(item => item.playerId !== playerId)
      cache.set(updatedList)
      
      return true
      
    } catch (err) {
      // 🔙 REVERTIR OPTIMISTIC UPDATE
      setPlayerList(previousList)
      
      // Ensure we have a proper error object
      const error = err instanceof Error ? err : new Error(
        typeof err === 'string' ? err : 'Error al remover jugador de la lista'
      )
      
      handleError(error, { 
        context: 'playerList',
        logErrors: true,
        retryable: true
      })
      
      // Configurar retry
      setRetryAction('playerList', async () => { await removeFromList(playerId) })
      
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, isInList, playerList, cache, clearError, handleError, setRetryAction])

  /**
   * 🔄 REFRESCAR LISTA
   */
  const refreshList = useCallback(async (): Promise<void> => {
    await loadPlayerList(true)
  }, [loadPlayerList])

  /**
   * 🧹 LIMPIAR CACHE
   */
  const clearCache = useCallback(() => {
    cache.clear()
    setPlayerList([])
    if (error) {
      clearError('playerList')
    }
  }, [cache, clearError])

  // 🔄 CARGAR LISTA AL MONTAR EL COMPONENTE
  useEffect(() => {
    if (isLoaded && user?.id) {
      loadPlayerList()
    }
  }, [isLoaded, user?.id]) // Removed loadPlayerList from dependencies

  // 🔄 SINCRONIZACIÓN ENTRE PESTAÑAS
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('player-list') && e.newValue) {
        try {
          const newList = JSON.parse(e.newValue)
          if (Array.isArray(newList.value)) {
            setPlayerList(newList.value)
          }
        } catch (error) {
          console.error('Error syncing player list across tabs:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncAcrossTabs]) // Removed cache dependency - not used in effect

  // 🚀 MEMOIZAR MÉTODOS PARA EVITAR RE-RENDERS
  const methods = useMemo(() => ({
    isInList,
    addToList,
    removeFromList,
    refreshList,
    clearCache
  }), [isInList, addToList, removeFromList, refreshList, clearCache])

  return {
    playerList,
    loading,
    error,
    cacheStats: cache.stats,
    syncAcrossTabs,
    setSyncAcrossTabs,
    ...methods
  }
}