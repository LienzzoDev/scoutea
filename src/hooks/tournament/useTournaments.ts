import { useState, useCallback } from 'react'

interface Torneo {
  id_torneo: string
  nombre: string
  descripcion?: string
  pais?: string
  ciudad?: string
  fecha_inicio: string
  fecha_fin: string
  tipo_torneo: string
  categoria?: string
  genero: string
  estado: string
  max_equipos?: number
  equipos_inscritos: number
  premio_primero?: number
  premio_segundo?: number
  premio_tercero?: number
  organizador?: string
  contacto_email?: string
  contacto_telefono?: string
  sitio_web?: string
  reglas_especiales?: string
  requisitos_inscripcion?: string
  fecha_limite_inscripcion?: string
  imagen_url?: string
  banner_url?: string
  pdf_url?: string
  es_publico: boolean
  es_gratuito: boolean
  costo_inscripcion?: number
  moneda: string
  createdAt: string
  updatedAt: string
}

export interface TorneoFilters {
  search?: string
  tipo_torneo?: string
  categoria?: string
  genero?: string
  estado?: string
  pais?: string
  es_publico?: boolean
  es_gratuito?: boolean
  fecha_inicio_desde?: string
  fecha_inicio_hasta?: string
}

interface TorneosResponse {
  torneos: Torneo[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useTournaments() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [currentFilters, setCurrentFilters] = useState<TorneoFilters>({})

  const searchTorneos = useCallback(async (__filters: TorneoFilters = {}, pageNum = 1) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      
      // Agregar filtros a los parámetros de búsqueda
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
      
      searchParams.append('page', pageNum.toString())
      searchParams.append('limit', '10')

      const response = await fetch(`/api/torneos?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los torneos')
      }

      const data: TorneosResponse = await response.json()
      
      if (pageNum === 1) {
        setTorneos(data.torneos)
      } else {
        setTorneos(prev => [...prev, ...data.torneos])
      }
      
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setCurrentFilters(filters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interno del servidor')
      console.error('Error fetching tournaments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      searchTorneos(currentFilters, page + 1)
    }
  }, [page, totalPages, loading, currentFilters, searchTorneos])

  // Cargar torneos iniciales al montar el componente
  const loadInitialTorneos = useCallback(() => {
    searchTorneos({ es_publico: true }, 1)
  }, [searchTorneos])

  const createTorneo = useCallback(async (torneoData: Partial<Torneo>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/torneos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(torneoData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el torneo')
      }

      const newTorneo = await response.json()
      setTorneos(prev => [newTorneo, ...prev])
      setTotal(prev => prev + 1)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interno del servidor')
      console.error('Error creating tournament:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTorneo = useCallback(async (id: string, torneoData: Partial<Torneo>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/torneos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(torneoData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el torneo')
      }

      const updatedTorneo = await response.json()
      setTorneos(prev => prev.map(t => t.id_torneo === id ? updatedTorneo : t))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interno del servidor')
      console.error('Error updating tournament:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTorneo = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/torneos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el torneo')
      }

      setTorneos(prev => prev.filter(t => t.id_torneo !== id))
      setTotal(prev => prev - 1)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interno del servidor')
      console.error('Error deleting tournament:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const _clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    torneos,
    loading,
    error,
    total,
    page,
    totalPages,
    searchTorneos,
    loadMore,
    loadInitialTorneos,
    createTorneo,
    updateTorneo,
    deleteTorneo,
    clearError
  }
}