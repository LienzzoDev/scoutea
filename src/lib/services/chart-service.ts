import { prisma } from '@/lib/db'
import { 
  PlayerStats, 
  RadarData, 
  BeeswarmData, 
  LollipopData, 
  ChartFilters,
  AllPlayerStats 
} from '@/types/charts'

export class ChartService {
  // ===== ESTADÍSTICAS POR PERÍODO =====
  
  /**
   * Obtiene estadísticas detalladas de un jugador por período y categoría
   */
  static async getPlayerStats(
    playerId: string, 
    period: string = 'current', 
    category?: string
  ): Promise<PlayerStats[]> {
    const whereClause: any = {
      playerId,
      period
    }
    
    if (category) {
      whereClause.category = category
    }

    const stats = await prisma.playerStats.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { metricName: 'asc' }
      ]
    })

    return stats.map(stat => ({
      playerId: stat.playerId,
      period: stat.period as 'current' | '6months' | '12months',
      category: stat.category as 'general' | 'goalkeeping' | 'defending' | 'passing' | 'finishing',
      metrics: {
        total: stat.totalValue || 0,
        p90: stat.p90Value || 0,
        average: stat.averageValue || 0,
        maximum: stat.maximumValue || 0
      },
      lastUpdated: stat.updatedAt.toISOString()
    }))
  }

  /**
   * Obtiene estadísticas completas de un jugador organizadas por categoría
   */
  static async getAllPlayerStats(
    playerId: string, 
    period: string = 'current'
  ): Promise<AllPlayerStats> {
    const stats = await this.getPlayerStats(playerId, period)
    
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

    // Organizar estadísticas por categoría
    stats.forEach(stat => {
      const category = stat.category as keyof AllPlayerStats
      if (organizedStats[category]) {
        // Mapear métricas específicas a propiedades del objeto
        const metrics = stat.metrics
        switch (stat.metricName) {
          case 'matches':
            if (category === 'general') (organizedStats[category] as any).matches = metrics.total
            break
          case 'minutes':
            if (category === 'general') (organizedStats[category] as any).minutes = metrics.total
            break
          case 'goals':
            if (category === 'finishing') (organizedStats[category] as any).goals = metrics.total
            break
          case 'assists':
            if (category === 'passing') (organizedStats[category] as any).assists = metrics.total
            break
          // Agregar más mapeos según sea necesario
        }
      }
    })

    return organizedStats
  }

  // ===== DATOS DE RADAR =====
  
  /**
   * Obtiene datos de radar para un jugador específico
   */
  static async getRadarData(
    playerId: string, 
    position: string, 
    period: string = 'current'
  ): Promise<RadarData> {
    const radarMetrics = await prisma.radarMetrics.findMany({
      where: {
        playerId,
        position,
        period
      },
      orderBy: { category: 'asc' }
    })

    return {
      playerId,
      position,
      categories: radarMetrics.map(metric => ({
        name: metric.category,
        playerValue: metric.playerValue,
        positionAverage: metric.positionAverage,
        percentile: metric.percentile
      })),
      period
    }
  }

  // ===== DATOS DE ENJAMBRE =====
  
  /**
   * Obtiene datos de enjambre para una métrica específica con filtros
   */
  static async getBeeswarmData(
    metric: string, 
    filters: ChartFilters = {},
    selectedPlayerId?: string
  ): Promise<BeeswarmData> {
    const whereClause: any = {
      metric
    }

    // Aplicar filtros
    if (filters.position) whereClause.position = filters.position
    if (filters.age) {
      const ageRange = filters.age.split('-')
      if (ageRange.length === 2) {
        whereClause.age = {
          gte: parseInt(ageRange[0]),
          lte: parseInt(ageRange[1])
        }
      }
    }
    if (filters.nationality) whereClause.nationality = filters.nationality
    if (filters.competition) whereClause.competition = filters.competition
    if (filters.period) whereClause.period = filters.period

    const beeswarmData = await prisma.beeswarmData.findMany({
      where: whereClause,
      orderBy: { value: 'desc' },
      take: 1000 // Limitar para rendimiento
    })

    // Calcular percentil del jugador seleccionado
    let selectedPlayer = null
    if (selectedPlayerId) {
      const playerData = beeswarmData.find(data => data.playerId === selectedPlayerId)
      if (playerData) {
        const sortedValues = beeswarmData.map(d => d.value).sort((a, b) => a - b)
        const playerIndex = sortedValues.indexOf(playerData.value)
        const percentile = (playerIndex / (sortedValues.length - 1)) * 100
        
        selectedPlayer = {
          playerId: playerData.playerId,
          value: playerData.value,
          percentile
        }
      }
    }

    return {
      metric,
      players: beeswarmData.map(data => ({
        playerId: data.playerId,
        playerName: data.playerName,
        value: data.value,
        position: data.position,
        age: data.age,
        nationality: data.nationality,
        competition: data.competition,
        trfmValue: data.trfmValue || 0,
        isSelected: data.playerId === selectedPlayerId
      })),
      selectedPlayer: selectedPlayer || {
        playerId: selectedPlayerId || '',
        value: 0,
        percentile: 0
      }
    }
  }

  // ===== DATOS DE PALETA =====
  
  /**
   * Obtiene datos de paleta para un jugador específico
   */
  static async getLollipopData(
    playerId: string, 
    period: string = 'current',
    position?: string
  ): Promise<LollipopData> {
    const whereClause: any = {
      playerId,
      period
    }

    if (position) {
      whereClause.position = position
    }

    const lollipopData = await prisma.lollipopData.findMany({
      where: whereClause,
      orderBy: { percentile: 'desc' }
    })

    return {
      playerId,
      metrics: lollipopData.map(data => ({
        name: data.metricName,
        value: data.value,
        rank: data.rank,
        totalPlayers: data.totalPlayers,
        percentile: data.percentile,
        category: data.category
      })),
      period,
      position: position || ''
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  /**
   * Obtiene métricas disponibles para enjambre
   */
  static async getAvailableMetrics(): Promise<string[]> {
    const metrics = await prisma.beeswarmData.findMany({
      select: { metric: true },
      distinct: ['metric']
    })
    
    return metrics.map(m => m.metric)
  }

  /**
   * Obtiene posiciones disponibles para filtros
   */
  static async getAvailablePositions(): Promise<string[]> {
    const positions = await prisma.jugador.findMany({
      select: { position_player: true },
      distinct: ['position_player'],
      where: {
        position_player: {
          not: null
        }
      }
    })
    
    return positions
      .map(p => p.position_player)
      .filter((pos): pos is string => pos !== null)
  }

  /**
   * Obtiene nacionalidades disponibles para filtros
   */
  static async getAvailableNationalities(): Promise<string[]> {
    const nationalities = await prisma.jugador.findMany({
      select: { nationality_1: true },
      distinct: ['nationality_1'],
      where: {
        nationality_1: {
          not: null
        }
      }
    })
    
    return nationalities
      .map(n => n.nationality_1)
      .filter((nat): nat is string => nat !== null)
  }

  /**
   * Obtiene competiciones disponibles para filtros
   */
  static async getAvailableCompetitions(): Promise<string[]> {
    const competitions = await prisma.jugador.findMany({
      select: { team_competition: true },
      distinct: ['team_competition'],
      where: {
        team_competition: {
          not: null
        }
      }
    })
    
    return competitions
      .map(c => c.team_competition)
      .filter((comp): comp is string => comp !== null)
  }
}
