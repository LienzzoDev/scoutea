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
  static async calculatePlayerRadar(playerId: string, type: 'general' | 'attacking' | 'defending' | 'goalkeeping' = 'general'): Promise<RadarComparisonData> {
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

    /* // OLD LOGIC - Disabling database metrics cache for now to force dynamic calculation based on type
    // Get radar metrics from database
    const radarMetrics = await prisma.radarMetrics.findMany({
      where: {
        playerId: playerIdNum,
        // We might want to add a 'type' column to RadarMetrics in the future
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    })

    // If we have metrics in the database, use them
    if (radarMetrics.length > 0) {
      // ... (existing logic adaptable if we added 'type' to DB)
    } 
    */

    // If no radar metrics exist, try to calculate from player stats
    const playerStats = await prisma.playerStats3m.findFirst({
      where: { id_player: playerIdNum }
    })

    if (playerStats) {
      // Calculate metrics based on player stats and type
      const metrics = this.calculateMetricsFromStats(playerStats, type)
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

  private static calculateMetricsFromStats(stats: any, type: 'general' | 'attacking' | 'defending' | 'goalkeeping'): RadarMetric[] {
    const metrics: RadarMetric[] = []

    if (type === 'general') {
       return this.calculateGeneralMetrics(stats);
    } else if (type === 'attacking') {
       return this.calculateAttackingMetrics(stats);
    } else if (type === 'defending') {
       return this.calculateDefendingMetrics(stats);
    } else if (type === 'goalkeeping') {
       return this.calculateGoalkeepingMetrics(stats);
    }

    return metrics;
  }

  private static calculateGeneralMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];


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

  private static calculateAttackingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Goals
    const goalsVal = stats.goals_p90_3m_norm ? Number(stats.goals_p90_3m_norm) : 50;
    metrics.push({ name: 'Goles', value: goalsVal, percentile: goalsVal, category: 'Goles' });

    // Assists
    const assistsVal = stats.assists_p90_3m_norm ? Number(stats.assists_p90_3m_norm) : 50;
    metrics.push({ name: 'Asistencias', value: assistsVal, percentile: assistsVal, category: 'Asistencias' });

    // Shots
    const shotsVal = stats.shots_p90_3m_norm ? Number(stats.shots_p90_3m_norm) : 50;
    metrics.push({ name: 'Tiros', value: shotsVal, percentile: shotsVal, category: 'Tiros' });

    // Crosses
    const crossesVal = stats.crosses_p90_3m_norm ? Number(stats.crosses_p90_3m_norm) : 50;
    metrics.push({ name: 'Centros', value: crossesVal, percentile: crossesVal, category: 'Centros' });

    // Offensive Duels
    const offDuelsVal = stats.off_duels_won_percent_3m_norm ? Number(stats.off_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Duelos Ofensivos', value: offDuelsVal, percentile: offDuelsVal, category: 'Duelos Ofensivos' });

    // Progressive Runs (approximated from dribbles if not exact match, using forward passes as proxy for now or specific column if exists)
    // Using Effectiveness as a proxy for general offensive efficiency
    const effVal = stats.effectiveness_percent_3m_norm ? Number(stats.effectiveness_percent_3m_norm) : 50;
    metrics.push({ name: 'Efectividad', value: effVal, percentile: effVal, category: 'Efectividad' });

    return metrics;
  }

  private static calculateDefendingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Tackles
    const tacklesVal = stats.tackles_p90_3m_norm ? Number(stats.tackles_p90_3m_norm) : 50;
    metrics.push({ name: 'Entradas', value: tacklesVal, percentile: tacklesVal, category: 'Entradas' });

    // Interceptions
    const interceptionsVal = stats.interceptions_p90_3m_norm ? Number(stats.interceptions_p90_3m_norm) : 50;
    metrics.push({ name: 'Intercepciones', value: interceptionsVal, percentile: interceptionsVal, category: 'Intercepciones' });

    // Aerial Duels
    const aerialsVal = stats.aerials_duels_won_percent_3m_norm ? Number(stats.aerials_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Duelos Aéreos', value: aerialsVal, percentile: aerialsVal, category: 'Duelos Aéreos' });

    // Defensive Duels
    const defDuelsVal = stats.def_duels_won_percent_3m_norm ? Number(stats.def_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Duelos Defensivos', value: defDuelsVal, percentile: defDuelsVal, category: 'Duelos Defensivos' });

    // Recoveries (using fouls as a negative proxy or ball recovery level if available, checking stats first)
    // Using 'stats_evo' as a placeholder for consistency/form for now, or just generic rating
    // Better: Blocked shots / Clearances proxy -> using 'conceded_goals_p90_3m_norm_neg' (goals prevented/low conceded)
    const prevGoalsVal = stats.prevented_goals_p90_3m_norm ? Number(stats.prevented_goals_p90_3m_norm) : 50;
    metrics.push({ name: 'Goles Prevenidos', value: prevGoalsVal, percentile: prevGoalsVal, category: 'Goles Prevenidos' });

    return metrics;
  }

  private static calculateGoalkeepingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Save Rate
    const saveRateVal = stats.save_rate_percent_3m_norm ? Number(stats.save_rate_percent_3m_norm) : 50;
    metrics.push({ name: '% Paradas', value: saveRateVal, percentile: saveRateVal, category: '% Paradas' });

    // Clean Sheets
    const cleanSheetsVal = stats.clean_sheets_percent_3m_norm ? Number(stats.clean_sheets_percent_3m_norm) : 50;
    metrics.push({ name: 'Porterías a Cero', value: cleanSheetsVal, percentile: cleanSheetsVal, category: 'Porterías a Cero' });

    // Prevented Goals
    const prevGoalsVal = stats.prevented_goals_p90_3m_norm ? Number(stats.prevented_goals_p90_3m_norm) : 50;
    metrics.push({ name: 'Goles Prevenidos', value: prevGoalsVal, percentile: prevGoalsVal, category: 'Goles Prevenidos' });

    // Conceded Goals (Negative is good, so we use the negative norm if available or invert logic)
    // Using 'conceded_goals_p90_3m_norm_neg' if it exists or doing 100 - norm
    const concededVal = stats.conceded_goals_p90_3m_norm_neg ? Number(stats.conceded_goals_p90_3m_norm_neg) : 
                        (stats.conceded_goals_p90_3m_norm ? 100 - Number(stats.conceded_goals_p90_3m_norm) : 50);
    metrics.push({ name: 'Goles Concedidos', value: concededVal, percentile: concededVal, category: 'Goles Concedidos' });

    // Passes (Distribution)
    const passesVal = stats.accurate_passes_percent_3m_norm ? Number(stats.accurate_passes_percent_3m_norm) : 50;
    metrics.push({ name: 'Distribución', value: passesVal, percentile: passesVal, category: 'Distribución' });

    return metrics;
  }

  private static normalizeValue(value: number): number {
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, Math.round(value)))
  }

  static async comparePlayersRadar(playerIds: string[]): Promise<RadarComparisonData[]> {
    const comparisons: RadarComparisonData[] = []

    for (const playerId of playerIds) {
      const data = await this.calculatePlayerRadar(playerId) // Compare uses default 'general' for now

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
