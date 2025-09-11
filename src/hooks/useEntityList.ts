'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

interface EntityListItem {
  id: string
  userId: string
  entityId: string
  createdAt: string
  [key: string]: any // Para permitir propiedades adicionales específicas de cada entidad
}

interface UseEntityListConfig {
  entityType: 'player' | 'scout'
  apiEndpoint: string
}

interface UseEntityListReturn {
  entityList: EntityListItem[]
  isInList: (entityId: string) => boolean
  addToList: (entityId: string) => Promise<boolean>
  removeFromList: (entityId: string) => Promise<boolean>
  loading: boolean
  error: string | null
  refreshList: () => Promise<void>
}

export function useEntityList(config: UseEntityListConfig): UseEntityListReturn {
  const { user, isLoaded } = useUser()
  const [entityList, setEntityList] = useState<EntityListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 📋 CARGAR LA LISTA DE ENTIDADES DEL USUARIO
  const loadEntityList = useCallback(async () => {
    if (!isLoaded) {
      return
    }
    
    if (!user?.id) {
      setEntityList([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(config.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=120'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          // Silently handle parse errors
        }
        
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 404) {
          setEntityList([])
          return
        } else {
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      const listKey = `${config.entityType}List`
      
      if (!data[listKey] || !Array.isArray(data[listKey])) {
        setEntityList([])
        return
      }
      
      setEntityList(data[listKey])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      setEntityList([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, isLoaded, config.apiEndpoint, config.entityType])

  // Verificar si una entidad está en la lista
  const isInList = useCallback((entityId: string): boolean => {
    const idKey = `${config.entityType}Id`
    return entityList.some(item => item[idKey] === entityId)
  }, [entityList, config.entityType])

  // ➕ AÑADIR ENTIDAD A LA LISTA
  const addToList = useCallback(async (entityId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado')
      return false
    }

    if (!entityId || typeof entityId !== 'string' || entityId.trim().length === 0) {
      setError(`ID de ${config.entityType} inválido`)
      return false
    }

    if (isInList(entityId)) {
      setError(`El ${config.entityType} ya está en tu lista`)
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [`${config.entityType}Id`]: entityId.trim() }),
      })

      if (!response.ok) {
        let errorData = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          // Silently handle parse errors
        }
        
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 404) {
          throw new Error(`${config.entityType} no encontrado`)
        } else if (response.status === 409) {
          throw new Error(`El ${config.entityType} ya está en tu lista`)
        } else {
          throw new Error(errorData.error || `Error al añadir ${config.entityType} a la lista`)
        }
      }

      const data = await response.json()
      const listKey = `${config.entityType}List`
      
      if (!data[listKey] || !data[listKey][config.entityType]) {
        throw new Error('Respuesta inválida del servidor')
      }
      
      setEntityList(prev => [...prev, data[listKey]])
      return true
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, isInList, config.apiEndpoint, config.entityType])

  // 🗑️ REMOVER ENTIDAD DE LA LISTA
  const removeFromList = useCallback(async (entityId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado')
      return false
    }

    if (!entityId || typeof entityId !== 'string' || entityId.trim().length === 0) {
      setError(`ID de ${config.entityType} inválido`)
      return false
    }

    if (!isInList(entityId)) {
      setError(`El ${config.entityType} no está en tu lista`)
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${config.apiEndpoint}/${encodeURIComponent(entityId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        let errorData = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          // Silently handle parse errors
        }
        
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 404) {
          setEntityList(prev => prev.filter(item => item[`${config.entityType}Id`] !== entityId))
          return true
        } else {
          throw new Error(errorData.error || `Error al remover ${config.entityType} de la lista`)
        }
      }

      const idKey = `${config.entityType}Id`
      setEntityList(prev => prev.filter(item => item[idKey] !== entityId))
      return true
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, isInList, config.apiEndpoint, config.entityType])

  // Refrescar la lista
  const refreshList = useCallback(async () => {
    await loadEntityList()
  }, [loadEntityList])

  // Cargar la lista al montar el componente
  useEffect(() => {
    if (isLoaded) {
      loadEntityList()
    }
  }, [loadEntityList, isLoaded])

  return {
    entityList,
    loading,
    error,
    isInList,
    addToList,
    removeFromList,
    refreshList
  }
}