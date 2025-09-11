import { useState, useEffect } from 'react'
import { 
  PlayerStats, 
  RadarData, 
  BeeswarmData, 
  LollipopData, 
  ChartFilters,
  AllPlayerStats 
} from '@/types/charts'

// Hook para estadísticas de jugador
export function usePlayerStats(playerId: string, period: string = 'current', category?: string) {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          period,
          ...(category && { category })
        })
        
        const response = await fetch(`/api/players/${playerId}/stats?${params}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener estadísticas')
        }
        
        const data = await response.json()
        setStats(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchStats()
    }
  }, [playerId, period, category])

  return { stats, loading, error }
}

// Hook para datos de radar
export function useRadarData(playerId: string, position: string = 'CM', period: string = 'current') {
  const [radarData, setRadarData] = useState<RadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          position,
          period
        })
        
        const response = await fetch(`/api/players/${playerId}/radar?${params}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener datos de radar')
        }
        
        const data = await response.json()
        setRadarData(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchRadarData()
    }
  }, [playerId, position, period])

  return { radarData, loading, error }
}

// Hook para datos de enjambre
export function useBeeswarmData(metric: string, filters: ChartFilters = {}, selectedPlayerId?: string) {
  const [beeswarmData, setBeeswarmData] = useState<BeeswarmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBeeswarmData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          metric,
          ...(selectedPlayerId && { selectedPlayerId }),
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value) acc[key] = value
            return acc
          }, {} as Record<string, string>)
        })
        
        const response = await fetch(`/api/players/beeswarm?${params}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener datos de enjambre')
        }
        
        const data = await response.json()
        setBeeswarmData(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (metric) {
      fetchBeeswarmData()
    }
  }, [metric, selectedPlayerId, JSON.stringify(filters)])

  return { beeswarmData, loading, error }
}

// Hook para datos de paleta
export function useLollipopData(playerId: string, period: string = 'current', position?: string) {
  const [lollipopData, setLollipopData] = useState<LollipopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLollipopData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          period,
          ...(position && { position })
        })
        
        const response = await fetch(`/api/players/${playerId}/lollipop?${params}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener datos de paleta')
        }
        
        const data = await response.json()
        setLollipopData(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchLollipopData()
    }
  }, [playerId, period, position])

  return { lollipopData, loading, error }
}

// Hook para opciones de filtros
export function useChartFilters() {
  const [filters, setFilters] = useState<{
    metrics: string[]
    positions: string[]
    nationalities: string[]
    competitions: string[]
    periods: string[]
    ageRanges: string[]
    trfmValueRanges: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/players/filters')
        
        if (!response.ok) {
          throw new Error('Error al obtener opciones de filtros')
        }
        
        const data = await response.json()
        setFilters(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchFilters()
  }, [])

  return { filters, loading, error }
}

// Hook para estadísticas completas de jugador
export function useAllPlayerStats(playerId: string, period: string = 'current') {
  const [allStats, setAllStats] = useState<AllPlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/players/${playerId}/stats?period=${period}`)
        
        if (!response.ok) {
          throw new Error('Error al obtener estadísticas completas')
        }
        
        const data = await response.json()
        
        // Organizar estadísticas por categoría
        const organizedStats: AllPlayerStats = {
          general: {
            matches: 0,
            minutes: 0,
            yellowCards: 0,
            redCards: 0
          },
          goalkeeping: {
            concededGoals: 0,
            preventedGoals: 0,
            shotsAgainst: 0,
            cleanSheetsPercentage: 0,
            saveRate: 0
          },
          defending: {
            tackles: 0,
            interceptions: 0,
            fouls: 0
          },
          passing: {
            passes: 0,
            forwardPasses: 0,
            crosses: 0,
            assists: 0,
            accuratePassesPercentage: 0
          },
          finishing: {
            shots: 0,
            shotsOnTarget: 0,
            goals: 0,
            goalsPerShot: 0,
            conversionRate: 0
          }
        }

        // Mapear estadísticas a la estructura organizada
        data.data.forEach((stat: PlayerStats) => {
          const category = stat.category as keyof AllPlayerStats
          if (organizedStats[category]) {
            switch (stat.metricName) {
              case 'matches':
                if (category === 'general') (organizedStats[category] as any).matches = stat.metrics.total
                break
              case 'minutes':
                if (category === 'general') (organizedStats[category] as any).minutes = stat.metrics.total
                break
              case 'goals':
                if (category === 'finishing') (organizedStats[category] as any).goals = stat.metrics.total
                break
              case 'assists':
                if (category === 'passing') (organizedStats[category] as any).assists = stat.metrics.total
                break
              // Agregar más mapeos según sea necesario
            }
          }
        })

        setAllStats(organizedStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchAllStats()
    }
  }, [playerId, period])

  return { allStats, loading, error }
}
