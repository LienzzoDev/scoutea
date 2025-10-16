import { useState, useEffect, useRef } from 'react'

import { QuantitativeData, QuantitativeFilters } from '@/lib/services/scout-quantitative-service'

interface UseScoutQuantitativeReturn {
  data: QuantitativeData | null
  filterOptions: any
  loading: boolean
  error: string | null
  filters: QuantitativeFilters
  setFilters: (filters: QuantitativeFilters) => void
  refetch: () => Promise<void>
}

export function useScoutQuantitative(scoutId: string): UseScoutQuantitativeReturn {
  const [data, setData] = useState<QuantitativeData | null>(null)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<QuantitativeFilters>({})
  const isInitialLoad = useRef(true)

  const loadData = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }
      
      // Construir query parameters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== 'todos' && value !== '') {
          params.append(key, value)
        }
      })
      
      const url = `/api/scout/${scoutId}/quantitative?${params}`
      console.log('🔍 Fetching quantitative data:', url, filters)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const quantitativeData = await response.json()
      console.log('📊 Quantitative data received:', quantitativeData)
      
      setData(quantitativeData)
      setError(null)
    } catch (err) {
      console.error('❌ Error loading quantitative data:', err)
      setError('Error al cargar los datos cuantitativos')
    } finally {
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }

  const loadFilterOptions = async () => {
    try {
      // Reutilizar las opciones de filtros del servicio cualitativo
      const response = await fetch(`/api/scout/${scoutId}/qualitative/options`)
      if (!response.ok) {
        throw new Error('Error al cargar opciones')
      }
      
      const options = await response.json()
      console.log('🎛️ Quantitative filter options loaded:', options)
      setFilterOptions(options)
    } catch (err) {
      console.error('❌ Error loading filter options:', err)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    if (scoutId) {
      loadData()
      loadFilterOptions()
    }
  }, [scoutId])

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (!isInitialLoad.current && scoutId) {
      console.log('🔄 Quantitative filters changed, reloading data:', filters)
      loadData()
    }
  }, [filters])

  return {
    data,
    filterOptions,
    loading,
    error,
    filters,
    setFilters,
    refetch: loadData,
  }
}