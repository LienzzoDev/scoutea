import { prisma } from '@/lib/db'

export interface RadarMetric {
  name: string
  value: number
  percentile: number
  category: string
}

export interface RadarComparisonData {
  playerId: string
  playerName: string
  metrics: RadarMetric[]
  overallRating: number
}

export class RadarCalculationService {
  static async calculatePlayerRadar(playerId: string): Promise<RadarComparisonData> {
    const playerIdNum = parseInt(playerId, 10)

    // Get player info
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerIdNum },
      select: {
        player_name: true,
        player_rating: true
      }
    })

    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`)
    }

    // Get radar metrics from database
    const radarMetrics = await prisma.radarMetrics.findMany({
      where: {
        playerId: playerIdNum
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    })

    // If we have metrics in the database, use them
    if (radarMetrics.length > 0) {
      // Group by category and get the most recent for each
      const latestByCategory = new Map<string, typeof radarMetrics[0]>()
      for (const metric of radarMetrics) {
        if (!latestByCategory.has(metric.category)) {
          latestByCategory.set(metric.category, metric)
        }
      }

      const metrics: RadarMetric[] = Array.from(latestByCategory.values()).map(m => ({
        name: m.category,
        value: m.playerValue,
        percentile: m.percentile ?? 50,
        category: m.category
      }))

      return {
        playerId,
        playerName: player.player_name,
        metrics,
        overallRating: player.player_rating ?? 75
      }
    }

    // If no radar metrics exist, try to calculate from player stats
    const playerStats = await prisma.playerStats3m.findFirst({
      where: { playerId: playerIdNum },
      orderBy: { updatedAt: 'desc' }
    })

    if (playerStats) {
      // Calculate metrics based on player stats
      const metrics = this.calculateMetricsFromStats(playerStats)
      return {
        playerId,
        playerName: player.player_name,
        metrics,
        overallRating: player.player_rating ?? 75
      }
    }

    // No data available - return empty metrics with message
    return {
      playerId,
      playerName: player.player_name,
      metrics: [],
      overallRating: player.player_rating ?? 0
    }
  }

  private static calculateMetricsFromStats(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = []

    // Offensive Transition
    if (stats.successfulDribblesPerc !== null || stats.keyPassesAccurate !== null) {
      const value = this.normalizeValue(
        ((stats.successfulDribblesPerc ?? 0) + (stats.keyPassesAccurate ?? 0) * 10) / 2
      )
      metrics.push({
        name: 'Off Transition',
        value,
        percentile: value,
        category: 'Off Transition'
      })
    }

    // Maintenance (ball retention)
    if (stats.passesAccurate !== null || stats.passesTotal !== null) {
      const passAcc = stats.passesTotal > 0
        ? (stats.passesAccurate / stats.passesTotal) * 100
        : 0
      metrics.push({
        name: 'Maintenance',
        value: this.normalizeValue(passAcc),
        percentile: this.normalizeValue(passAcc),
        category: 'Maintenance'
      })
    }

    // Progression
    if (stats.progressivePassesAccurate !== null || stats.progressiveRunsTotal !== null) {
      const value = this.normalizeValue(
        ((stats.progressivePassesAccurate ?? 0) + (stats.progressiveRunsTotal ?? 0)) * 5
      )
      metrics.push({
        name: 'Progression',
        value,
        percentile: value,
        category: 'Progression'
      })
    }

    // Finishing
    if (stats.goalsScored !== null || stats.shotsOnTarget !== null) {
      const value = this.normalizeValue(
        ((stats.goalsScored ?? 0) * 15 + (stats.shotsOnTarget ?? 0) * 5)
      )
      metrics.push({
        name: 'Finishing',
        value,
        percentile: value,
        category: 'Finishing'
      })
    }

    // Off Stopped Ball (set pieces)
    if (stats.freekickGoals !== null || stats.penaltiesScored !== null) {
      const value = this.normalizeValue(
        ((stats.freekickGoals ?? 0) + (stats.penaltiesScored ?? 0)) * 20
      )
      metrics.push({
        name: 'Off Stopped Ball',
        value,
        percentile: value,
        category: 'Off Stopped Ball'
      })
    }

    // Defensive Transition
    if (stats.counterpressingRecoveries !== null || stats.interceptions !== null) {
      const value = this.normalizeValue(
        ((stats.counterpressingRecoveries ?? 0) + (stats.interceptions ?? 0)) * 3
      )
      metrics.push({
        name: 'Def Transition',
        value,
        percentile: value,
        category: 'Def Transition'
      })
    }

    // Recovery
    if (stats.ballRecoveries !== null || stats.tacklesWon !== null) {
      const value = this.normalizeValue(
        ((stats.ballRecoveries ?? 0) + (stats.tacklesWon ?? 0)) * 3
      )
      metrics.push({
        name: 'Recovery',
        value,
        percentile: value,
        category: 'Recovery'
      })
    }

    // Evitation (avoiding loss)
    if (stats.dribblesAgainstWon !== null || stats.foulsDrawn !== null) {
      const value = this.normalizeValue(
        ((stats.dribblesAgainstWon ?? 0) * 5 + (stats.foulsDrawn ?? 0) * 2)
      )
      metrics.push({
        name: 'Evitation',
        value,
        percentile: value,
        category: 'Evitation'
      })
    }

    // Def Stopped Ball
    if (stats.blockedShots !== null || stats.clearances !== null) {
      const value = this.normalizeValue(
        ((stats.blockedShots ?? 0) + (stats.clearances ?? 0)) * 3
      )
      metrics.push({
        name: 'Def Stopped Ball',
        value,
        percentile: value,
        category: 'Def Stopped Ball'
      })
    }

    return metrics
  }

  private static normalizeValue(value: number): number {
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, Math.round(value)))
  }

  static async comparePlayersRadar(playerIds: string[]): Promise<RadarComparisonData[]> {
    const comparisons: RadarComparisonData[] = []

    for (const playerId of playerIds) {
      const data = await this.calculatePlayerRadar(playerId)
      comparisons.push(data)
    }

    return comparisons
  }

  static calculatePercentile(value: number, allValues: number[]): number {
    if (allValues.length === 0) return 50
    const sorted = allValues.sort((a, b) => a - b)
    const index = sorted.findIndex(v => v >= value)
    if (index === -1) return 100
    return Math.round((index / sorted.length) * 100)
  }
}
