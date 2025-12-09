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
    if (type === 'attacking') {
       return this.calculateAttackingMetrics(stats);
    } else if (type === 'defending') {
       return this.calculateDefendingMetrics(stats);
    } else if (type === 'goalkeeping') {
       return this.calculateGoalkeepingMetrics(stats);
    }

    // Default to attacking if 'general' or unknown (or could define a generic one, but user asked for these 3 specific ones)
    return this.calculateAttackingMetrics(stats);
  }

  private static calculateAttackingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Shots
    const shotsVal = stats.shots_p90_3m_norm ? Number(stats.shots_p90_3m_norm) : 50;
    metrics.push({ name: 'Shots', value: shotsVal, percentile: shotsVal, category: 'Shots' });

    // Goals
    const goalsVal = stats.goals_p90_3m_norm ? Number(stats.goals_p90_3m_norm) : 50;
    metrics.push({ name: 'Goals', value: goalsVal, percentile: goalsVal, category: 'Goals' });

    // Effectiveness %
    const effVal = stats.effectiveness_percent_3m_norm ? Number(stats.effectiveness_percent_3m_norm) : 50;
    metrics.push({ name: 'Effectiveness %', value: effVal, percentile: effVal, category: 'Effectiveness %' });

    // Forward Passes
    const fwdPassesVal = stats.forward_passes_p90_3m_norm ? Number(stats.forward_passes_p90_3m_norm) : 50;
    metrics.push({ name: 'Forward Passes', value: fwdPassesVal, percentile: fwdPassesVal, category: 'Forward Passes' });

    // Crosses
    const crossesVal = stats.crosses_p90_3m_norm ? Number(stats.crosses_p90_3m_norm) : 50;
    metrics.push({ name: 'Crosses', value: crossesVal, percentile: crossesVal, category: 'Crosses' });

    // Assists
    const assistsVal = stats.assists_p90_3m_norm ? Number(stats.assists_p90_3m_norm) : 50;
    metrics.push({ name: 'Assists', value: assistsVal, percentile: assistsVal, category: 'Assists' });

    // Accurate Passes %
    const accPassesVal = stats.accurate_passes_percent_3m_norm ? Number(stats.accurate_passes_percent_3m_norm) : 50;
    metrics.push({ name: 'Accurate Passes %', value: accPassesVal, percentile: accPassesVal, category: 'Accurate Passes %' });

    // Off Duels
    const offDuelsVal = stats.off_duels_p90_3m_norm ? Number(stats.off_duels_p90_3m_norm) : 50;
    metrics.push({ name: 'Off Duels', value: offDuelsVal, percentile: offDuelsVal, category: 'Off Duels' });

    // Off Duels Won %
    const offDuelsWonVal = stats.off_duels_won_percent_3m_norm ? Number(stats.off_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Off Duels Won %', value: offDuelsWonVal, percentile: offDuelsWonVal, category: 'Off Duels Won %' });

    return metrics;
  }

  private static calculateDefendingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Tackles
    const tacklesVal = stats.tackles_p90_3m_norm ? Number(stats.tackles_p90_3m_norm) : 50;
    metrics.push({ name: 'Tackles', value: tacklesVal, percentile: tacklesVal, category: 'Tackles' });

    // Interceptions
    const interceptionsVal = stats.interceptions_p90_3m_norm ? Number(stats.interceptions_p90_3m_norm) : 50;
    metrics.push({ name: 'Interceptions', value: interceptionsVal, percentile: interceptionsVal, category: 'Interceptions' });

    // Fouls (Negative is better)
    const foulsVal = stats.fouls_p90_3m_norm_neg ? Number(stats.fouls_p90_3m_norm_neg) : 50;
    metrics.push({ name: 'Fouls', value: foulsVal, percentile: foulsVal, category: 'Fouls' });

    // Yellow Cards (Negative is better)
    const yellowCardsVal = stats.yellow_cards_p90_3m_norm_neg ? Number(stats.yellow_cards_p90_3m_norm_neg) : 50;
    metrics.push({ name: 'Yellow Cards', value: yellowCardsVal, percentile: yellowCardsVal, category: 'Yellow Cards' });

    // Red Cards (Negative is better)
    const redCardsVal = stats.red_cards_p90_3m_norm_neg ? Number(stats.red_cards_p90_3m_norm_neg) : 50;
    metrics.push({ name: 'Red Cards', value: redCardsVal, percentile: redCardsVal, category: 'Red Cards' });

    // Def Duels
    const defDuelsVal = stats.def_duels_p90_3m_norm ? Number(stats.def_duels_p90_3m_norm) : 50;
    metrics.push({ name: 'Def Duels', value: defDuelsVal, percentile: defDuelsVal, category: 'Def Duels' });

    // Def Duels Won %
    const defDuelsWonVal = stats.def_duels_won_percent_3m_norm ? Number(stats.def_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Def Duels Won %', value: defDuelsWonVal, percentile: defDuelsWonVal, category: 'Def Duels Won %' });

    // Aer Duels
    const aerDuelsVal = stats.aerials_duels_p90_3m_norm ? Number(stats.aerials_duels_p90_3m_norm) : 50;
    metrics.push({ name: 'Aer Duels', value: aerDuelsVal, percentile: aerDuelsVal, category: 'Aer Duels' });

    // Aer Duels Won %
    const aerDuelsWonVal = stats.aerials_duels_won_percent_3m_norm ? Number(stats.aerials_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Aer Duels Won %', value: aerDuelsWonVal, percentile: aerDuelsWonVal, category: 'Aer Duels Won %' });

    return metrics;
  }

  private static calculateGoalkeepingMetrics(stats: any): RadarMetric[] {
    const metrics: RadarMetric[] = [];

    // Conceded Goals (Negative is better)
    const concededVal = stats.conceded_goals_p90_3m_norm_neg ? Number(stats.conceded_goals_p90_3m_norm_neg) : 50;
    metrics.push({ name: 'Conceded Goals', value: concededVal, percentile: concededVal, category: 'Conceded Goals' });

    // Prevented Goals
    const prevGoalsVal = stats.prevented_goals_p90_3m_norm ? Number(stats.prevented_goals_p90_3m_norm) : 50;
    metrics.push({ name: 'Prevented Goals', value: prevGoalsVal, percentile: prevGoalsVal, category: 'Prevented Goals' });

    // Shots Against
    // Note: Usually fewer shots against is better for defense quality, but for a GK workload metric maybe more is 'more active'? 
    // However, usually negative traits are inverted. Assuming standard 'more is higher percentile' for activity, or checking if there's a neg field.
    // The user didn't specify direction. I will use the standard norm.
    const shotsAgainstVal = stats.shots_against_p90_3m_norm ? Number(stats.shots_against_p90_3m_norm) : 50;
    metrics.push({ name: 'Shots Against', value: shotsAgainstVal, percentile: shotsAgainstVal, category: 'Shots Against' });

    // Clean Sheets %
    const cleanSheetsVal = stats.clean_sheets_percent_3m_norm ? Number(stats.clean_sheets_percent_3m_norm) : 50;
    metrics.push({ name: 'Clean Sheets %', value: cleanSheetsVal, percentile: cleanSheetsVal, category: 'Clean Sheets %' });

    // Save Rate %
    const saveRateVal = stats.save_rate_percent_3m_norm ? Number(stats.save_rate_percent_3m_norm) : 50;
    metrics.push({ name: 'Save Rate %', value: saveRateVal, percentile: saveRateVal, category: 'Save Rate %' });

    // Def Duels (For GK? Requested by user)
    const defDuelsVal = stats.def_duels_p90_3m_norm ? Number(stats.def_duels_p90_3m_norm) : 50;
    metrics.push({ name: 'Def Duels', value: defDuelsVal, percentile: defDuelsVal, category: 'Def Duels' });

    // Def Duels Won %
    const defDuelsWonVal = stats.def_duels_won_percent_3m_norm ? Number(stats.def_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Def Duels Won %', value: defDuelsWonVal, percentile: defDuelsWonVal, category: 'Def Duels Won %' });

    // Aer Duels
    const aerDuelsVal = stats.aerials_duels_p90_3m_norm ? Number(stats.aerials_duels_p90_3m_norm) : 50;
    metrics.push({ name: 'Aer Duels', value: aerDuelsVal, percentile: aerDuelsVal, category: 'Aer Duels' });

    // Aer Duels Won %
    const aerDuelsWonVal = stats.aerials_duels_won_percent_3m_norm ? Number(stats.aerials_duels_won_percent_3m_norm) : 50;
    metrics.push({ name: 'Aer Duels Won %', value: aerDuelsWonVal, percentile: aerDuelsWonVal, category: 'Aer Duels Won %' });

    return metrics;
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
