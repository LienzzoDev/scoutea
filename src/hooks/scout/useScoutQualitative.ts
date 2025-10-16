import { useState, useEffect, useCallback } from 'react'

import { QualitativeData, QualitativeFilters } from '@/lib/services/scout-qualitative-service'

interface UseScoutQualitativeReturn {
  data: QualitativeData | null
  filterOptions: any
  loading: boolean
  error: string | null
  filters: QualitativeFilters
  setFilters: (filters: QualitativeFilters) => void
  refetch: () => Promise<void>
}

export function useScoutQualitative(scoutId: string): UseScoutQualitativeReturn {
  const [data, setData] = useState<QualitativeData | null>(null)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<QualitativeFilters>({})

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Construir query parameters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })
      
      const url = `/api/scout/${scoutId}/qualitative?${params}`
      console.log('🔍 Fetching qualitative data from:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const qualitativeData = await response.json()
      console.log('📊 Qualitative data received:', qualitativeData)
      console.log('🔍 Data keys:', Object.keys(qualitativeData))
      console.log('🔍 Sample data (reportType):', qualitativeData.reportType)
      console.log('🔍 Type of reportType:', typeof qualitativeData.reportType)
      
      // Forzar una copia profunda para evitar problemas de reactividad
      const cleanData = JSON.parse(JSON.stringify(qualitativeData))
      console.log('🔄 Clean data (reportType):', cleanData.reportType)
      
      setData(cleanData)
      setError(null)
    } catch (err) {
      console.error('❌ Error loading qualitative data:', err)
      setError('Error al cargar los datos cualitativos')
    } finally {
      setLoading(false)
    }
  }, [scoutId, filters])

  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/scout/${scoutId}/qualitative/options`)
      if (!response.ok) {
        throw new Error('Error al cargar opciones')
      }
      
      const options = await response.json()
      setFilterOptions(options)
    } catch (err) {
      console.error('Error loading filter options:', err)
    }
  }, [scoutId])

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
    loadFilterOptions()
  }, [loadData, loadFilterOptions])

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (filterOptions) {
      loadData()
    }
  }, [filters, filterOptions, loadData])

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