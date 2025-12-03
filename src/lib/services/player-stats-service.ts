/**
 * Service for fetching player statistics by period
 */

import { prisma } from '@/lib/db'
import { type StatsPeriod } from '@/lib/utils/stats-period-utils'

/**
 * Get the Prisma table model for a given period
 * This function must stay in the service layer (server-side only)
 */
function getPrismaTableByPeriod(period: StatsPeriod) {
  const tables = {
    '3m': prisma.playerStats3m,
    '6m': prisma.playerStats6m,
    '1y': prisma.playerStats1y,
    '2y': prisma.playerStats2y,
  } as const

  return tables[period]
}

export interface PlayerStatsData {
  // General
  matches?: number | null
  minutes?: number | null
  yellowCards?: number | null
  redCards?: number | null

  // Goalkeeping
  concededGoals?: number | null
  preventedGoals?: number | null
  shotsAgainst?: number | null
  cleanSheetsPercentage?: number | null
  saveRate?: number | null

  // Defending
  tackles?: number | null
  interceptions?: number | null
  fouls?: number | null

  // Passing
  passes?: number | null
  forwardPasses?: number | null
  crosses?: number | null
  assists?: number | null
  passAccuracy?: number | null

  // Finishing
  shots?: number | null
  goals?: number | null
  effectiveness?: number | null

  // 1vs1
  offDuels?: number | null
  defDuels?: number | null
  aerDuels?: number | null
  offDuelsWonPercentage?: number | null
  defDuelsWonPercentage?: number | null
  aerDuelsWonPercentage?: number | null
}

export interface PlayerStatsByField {
  totalValue: string
  p90Value: string
  averageValue: string
  maximumValue: string
}

export class PlayerStatsService {
  /**
   * Get player stats for a specific period
   */
  static async getPlayerStatsByPeriod(
    playerId: string,
    period: StatsPeriod
  ): Promise<PlayerStatsData | null> {
    try {
      const playerIdInt = parseInt(playerId, 10)
      if (isNaN(playerIdInt)) {
        console.error(`Invalid player ID format: ${playerId}`)
        return null
      }

      const table = getPrismaTableByPeriod(period)
      const stats = await table.findUnique({
        where: { id_player: playerIdInt }
      })

      if (!stats) {
        return null
      }

      // Map database fields to our interface
      // The field names in DB follow pattern: {metric}_{type}_{period}
      // e.g., goals_tot_3m, goals_p90_3m, etc.

      return {
        // General
        matches: stats[`matches_played_tot_${period}`] ?? null,
        minutes: stats[`minutes_played_tot_${period}`] ?? null,
        yellowCards: stats[`yellow_cards_tot_${period}`] ?? null,
        redCards: stats[`red_cards_tot_${period}`] ?? null,

        // Goalkeeping
        concededGoals: stats[`conceded_goals_tot_${period}`] ?? null,
        preventedGoals: stats[`prevented_goals_tot_${period}`] ?? null,
        shotsAgainst: stats[`shots_against_tot_${period}`] ?? null,
        cleanSheetsPercentage: stats[`clean_sheets_percentage_${period}`] ?? null,
        saveRate: stats[`save_rate_${period}`] ?? null,

        // Defending
        tackles: stats[`tackles_tot_${period}`] ?? null,
        interceptions: stats[`interceptions_tot_${period}`] ?? null,
        fouls: stats[`fouls_tot_${period}`] ?? null,

        // Passing
        passes: stats[`passes_tot_${period}`] ?? null,
        forwardPasses: stats[`forward_passes_tot_${period}`] ?? null,
        crosses: stats[`crosses_tot_${period}`] ?? null,
        assists: stats[`assists_tot_${period}`] ?? null,
        passAccuracy: stats[`pass_accuracy_${period}`] ?? null,

        // Finishing
        shots: stats[`shots_tot_${period}`] ?? null,
        goals: stats[`goals_tot_${period}`] ?? null,
        effectiveness: stats[`effectiveness_${period}`] ?? null,

        // 1vs1
        offDuels: stats[`off_duels_tot_${period}`] ?? null,
        defDuels: stats[`def_duels_tot_${period}`] ?? null,
        aerDuels: stats[`aer_duels_tot_${period}`] ?? null,
        offDuelsWonPercentage: stats[`off_duels_won_percentage_${period}`] ?? null,
        defDuelsWonPercentage: stats[`def_duels_won_percentage_${period}`] ?? null,
        aerDuelsWonPercentage: stats[`aer_duels_won_percentage_${period}`] ?? null,
      }
    } catch (error) {
      console.error(`Error fetching stats for player ${playerId} (period: ${period}):`, error)
      return null
    }
  }

  /**
   * Get formatted stats with all field types (total, p90, avg, max)
   */
  static async getPlayerStatsFormatted(
    playerId: string,
    period: StatsPeriod
  ): Promise<Record<string, PlayerStatsByField>> {
    try {
      const playerIdInt = parseInt(playerId, 10)
      if (isNaN(playerIdInt)) {
        console.error(`Invalid player ID format: ${playerId}`)
        return {}
      }

      const table = getPrismaTableByPeriod(period)
      const stats = await table.findUnique({
        where: { id_player: playerIdInt }
      })

      if (!stats) {
        return {}
      }

      // Helper function to get stat values
      // Note: Currently only tot and p90 fields exist in DB schema
      const getStatValues = (metricName: string): PlayerStatsByField => {
        const total = stats[`${metricName}_tot_${period}`]
        const p90 = stats[`${metricName}_p90_${period}`]

        return {
          totalValue: total?.toString() ?? '-',
          p90Value: p90?.toString() ?? '-',
          averageValue: '-', // Not available in current schema
          maximumValue: '-', // Not available in current schema
        }
      }

      // Create a map of all metrics
      return {
        // General
        matches: getStatValues('matches_played'),
        minutes: getStatValues('minutes_played'),
        'Yellow Cards': getStatValues('yellow_cards'),
        'Red Cards': getStatValues('red_cards'),

        // Goalkeeping
        concededGoals: getStatValues('conceded_goals'),
        preventedGoals: getStatValues('prevented_goals'),
        shotsAgainst: getStatValues('shots_against'),
        cleanSheetsPercentage: {
          totalValue: stats[`clean_sheets_percentage_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },
        saveRate: {
          totalValue: stats[`save_rate_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },

        // Defending
        tackles: getStatValues('tackles'),
        interceptions: getStatValues('interceptions'),
        fouls: getStatValues('fouls'),

        // Passing
        'Passes': getStatValues('passes'),
        'Forward Passes': getStatValues('forward_passes'),
        'Crosses': getStatValues('crosses'),
        'Assists': getStatValues('assists'),
        'Pass Accuracy': {
          totalValue: stats[`pass_accuracy_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },

        // Finishing
        'Shots': getStatValues('shots'),
        'Goals': getStatValues('goals'),
        effectiveness: {
          totalValue: stats[`effectiveness_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },

        // 1vs1
        offDuels: getStatValues('off_duels'),
        defDuels: getStatValues('def_duels'),
        aerDuels: getStatValues('aer_duels'),
        offDuelsWonPercentage: {
          totalValue: stats[`off_duels_won_percentage_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },
        defDuelsWonPercentage: {
          totalValue: stats[`def_duels_won_percentage_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },
        aerDuelsWonPercentage: {
          totalValue: stats[`aer_duels_won_percentage_${period}`]?.toString() ?? '-',
          p90Value: '-',
          averageValue: '-',
          maximumValue: '-',
        },
      }
    } catch (error) {
      console.error(`Error fetching formatted stats for player ${playerId} (period: ${period}):`, error)
      return {}
    }
  }
}