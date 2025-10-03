import { useState, useEffect, useRef } from 'react'
import { QualitativeData, QualitativeFilters } from '@/lib/services/scout-qualitative-service'

interface UseScoutQualitativeWithFiltersReturn {
  data: QualitativeData | null
  filterOptions: any
  loading: boolean
  error: string | null
  filters: QualitativeFilters
  setFilters: (filters: QualitativeFilters) => void
  refetch: () => Promise<void>
}

export function useScoutQualitativeWithFilters(scoutId: string): UseScoutQualitativeWithFiltersReturn {
  const [data, setData] = useState<QualitativeData | null>(null)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<QualitativeFilters>({})
  const isInitialLoad = useRef(true)

  const loadData = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true)
      }
      
      // Construir query parameters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value)
        }
      })
      
      const url = `/api/scout/${scoutId}/qualitative?${params}`
      console.log('🔍 Fetching data with filters:', url, filters)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const qualitativeData = await response.json()
      console.log('📊 Data received:', qualitativeData)
      
      setData(qualitativeData)
      setError(null)
    } catch (err) {
      console.error('❌ Error loading qualitative data:', err)
      setError('Error al cargar los datos cualitativos')
    } finally {
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
    }
  }

  const loadFilterOptions = async () => {
    try {
      const response = await fetch(`/api/scout/${scoutId}/qualitative/options`)
      if (!response.ok) {
        throw new Error('Error al cargar opciones')
      }
      
      const options = await response.json()
      console.log('🎛️ Filter options loaded:', options)
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
      console.log('🔄 Filters changed, reloading data:', filters)
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