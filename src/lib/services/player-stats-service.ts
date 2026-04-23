/**
 * Service for fetching player statistics by period.
 *
 * `getPlayerStatsFormattedWithCohort` calcula Avg/Max/Percentile sobre un cohort
 * de jugadores (opcionalmente filtrado por posición, nacionalidad, competición,
 * edad y valor de mercado). Es el método que usa el endpoint público.
 */

import { prisma } from '@/lib/db'
import { type StatsPeriod } from '@/lib/utils/stats-period-utils'

/**
 * Devuelve el modelo Prisma de la tabla stats correspondiente al período.
 * Se devuelve como `any` porque la unión de modelos no es narrowable por TS
 * al construirse dinámicamente con índice.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrismaTableByPeriod(period: StatsPeriod): any {
  switch (period) {
    case '3m':
      return prisma.playerStats3m
    case '6m':
      return prisma.playerStats6m
    case '1y':
      return prisma.playerStats1y
    case '2y':
      return prisma.playerStats2y
  }
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
  percentile: string
}

export interface CohortStatsFilters {
  positions?: string[]
  nationalities?: string[]
  competitions?: string[]
  ageMin?: number
  ageMax?: number
  trfmMin?: number
  trfmMax?: number
}

/**
 * Mapping between UI metric key (used by `getStatValue` en PlayerStats.tsx) y
 * las columnas reales del schema. `base` se usa para construir `*_tot_{period}`
 * y `*_p90_{period}`. `percentBase` es para métricas que no tienen tot/p90 sino
 * un único valor en porcentaje.
 */
interface MetricSpec {
  uiKey: string
  base: string | null
  percentBase: string | null
}

const METRIC_SPECS: MetricSpec[] = [
  // General
  { uiKey: 'matches', base: 'matches_played', percentBase: null },
  { uiKey: 'minutes', base: 'minutes_played', percentBase: null },
  { uiKey: 'Yellow Cards', base: 'yellow_cards', percentBase: null },
  { uiKey: 'Red Cards', base: 'red_cards', percentBase: null },
  // Goalkeeping
  { uiKey: 'concededGoals', base: 'conceded_goals', percentBase: null },
  { uiKey: 'preventedGoals', base: 'prevented_goals', percentBase: null },
  { uiKey: 'shotsAgainst', base: 'shots_against', percentBase: null },
  { uiKey: 'cleanSheetsPercentage', base: null, percentBase: 'clean_sheets_percent' },
  { uiKey: 'saveRate', base: null, percentBase: 'save_rate_percent' },
  // Defending
  { uiKey: 'tackles', base: 'tackles', percentBase: null },
  { uiKey: 'interceptions', base: 'interceptions', percentBase: null },
  { uiKey: 'fouls', base: 'fouls', percentBase: null },
  // Passing
  { uiKey: 'Passes', base: 'passes', percentBase: null },
  { uiKey: 'Forward Passes', base: 'forward_passes', percentBase: null },
  { uiKey: 'Crosses', base: 'crosses', percentBase: null },
  { uiKey: 'Assists', base: 'assists', percentBase: null },
  { uiKey: 'Pass Accuracy', base: null, percentBase: 'accurate_passes_percent' },
  // Finishing
  { uiKey: 'Shots', base: 'shots', percentBase: null },
  { uiKey: 'Goals', base: 'goals', percentBase: null },
  { uiKey: 'effectiveness', base: null, percentBase: 'effectiveness_percent' },
  // 1vs1
  { uiKey: 'offDuels', base: 'off_duels', percentBase: null },
  { uiKey: 'defDuels', base: 'def_duels', percentBase: null },
  { uiKey: 'aerDuels', base: 'aerials_duels', percentBase: null },
  { uiKey: 'offDuelsWonPercentage', base: null, percentBase: 'off_duels_won_percent' },
  { uiKey: 'defDuelsWonPercentage', base: null, percentBase: 'def_duels_won_percent' },
  { uiKey: 'aerDuelsWonPercentage', base: null, percentBase: 'aerials_duels_won_percent' },
]

const toNum = (v: unknown): number | null => {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: () => number }).toNumber === 'function') {
    const n = (v as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const formatNum = (v: number | null): string => {
  if (v == null) return '-'
  if (Number.isInteger(v)) return String(v)
  // Round to 2 decimals, drop trailing zeros (e.g. 1.20 → 1.2, 1.00 → 1)
  return Number(v.toFixed(2)).toString()
}

const reduceMax = (values: number[]): number | null => {
  if (values.length === 0) return null
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > m) m = values[i]!
  }
  return m
}

export class PlayerStatsService {
  /**
   * Versión lightweight sin cohort: devuelve solo los valores del jugador.
   * Mantenida por compatibilidad con llamadas que no necesiten cohort.
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
      const stats = await table.findUnique({ where: { id_player: playerIdInt } })
      if (!stats) return null

      const s = stats as Record<string, unknown>
      return {
        matches: toNum(s[`matches_played_tot_${period}`]),
        minutes: toNum(s[`minutes_played_tot_${period}`]),
        yellowCards: toNum(s[`yellow_cards_tot_${period}`]),
        redCards: toNum(s[`red_cards_tot_${period}`]),

        concededGoals: toNum(s[`conceded_goals_tot_${period}`]),
        preventedGoals: toNum(s[`prevented_goals_tot_${period}`]),
        shotsAgainst: toNum(s[`shots_against_tot_${period}`]),
        cleanSheetsPercentage: toNum(s[`clean_sheets_percent_${period}`]),
        saveRate: toNum(s[`save_rate_percent_${period}`]),

        tackles: toNum(s[`tackles_tot_${period}`]),
        interceptions: toNum(s[`interceptions_tot_${period}`]),
        fouls: toNum(s[`fouls_tot_${period}`]),

        passes: toNum(s[`passes_tot_${period}`]),
        forwardPasses: toNum(s[`forward_passes_tot_${period}`]),
        crosses: toNum(s[`crosses_tot_${period}`]),
        assists: toNum(s[`assists_tot_${period}`]),
        passAccuracy: toNum(s[`accurate_passes_percent_${period}`]),

        shots: toNum(s[`shots_tot_${period}`]),
        goals: toNum(s[`goals_tot_${period}`]),
        effectiveness: toNum(s[`effectiveness_percent_${period}`]),

        offDuels: toNum(s[`off_duels_tot_${period}`]),
        defDuels: toNum(s[`def_duels_tot_${period}`]),
        aerDuels: toNum(s[`aerials_duels_tot_${period}`]),
        offDuelsWonPercentage: toNum(s[`off_duels_won_percent_${period}`]),
        defDuelsWonPercentage: toNum(s[`def_duels_won_percent_${period}`]),
        aerDuelsWonPercentage: toNum(s[`aerials_duels_won_percent_${period}`]),
      }
    } catch (error) {
      console.error(`Error fetching stats for player ${playerId} (period: ${period}):`, error)
      return null
    }
  }

  /**
   * Devuelve los valores formateados del jugador junto con avg/max/percentile
   * calculados sobre un cohort (opcionalmente filtrado).
   * `sampleSize` = nº de jugadores del cohort con fila en la tabla de stats.
   */
  static async getPlayerStatsFormattedWithCohort(
    playerId: string,
    period: StatsPeriod,
    filters: CohortStatsFilters = {}
  ): Promise<{ stats: Record<string, PlayerStatsByField>; sampleSize: number }> {
    const playerIdInt = parseInt(playerId, 10)
    if (isNaN(playerIdInt)) {
      console.error(`Invalid player ID format: ${playerId}`)
      return { stats: {}, sampleSize: 0 }
    }

    const table = getPrismaTableByPeriod(period)

    // Jugador propio
    const playerStats = await table.findUnique({ where: { id_player: playerIdInt } })

    // Cohort: buscamos ids de Jugador con los filtros aplicados y luego su fila
    // de stats para el período. Array vacío = sin filtro para ese campo.
    const where: Record<string, unknown> = {}
    if (filters.positions && filters.positions.length > 0) {
      where.position_player = { in: filters.positions }
    }
    if (filters.nationalities && filters.nationalities.length > 0) {
      where.nationality_1 = { in: filters.nationalities }
    }
    if (filters.competitions && filters.competitions.length > 0) {
      where.team_competition = { in: filters.competitions }
    }
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      const ageRange: Record<string, number> = {}
      if (filters.ageMin !== undefined) ageRange.gte = filters.ageMin
      if (filters.ageMax !== undefined) ageRange.lte = filters.ageMax
      where.age = ageRange
    }
    if (filters.trfmMin !== undefined || filters.trfmMax !== undefined) {
      const trfmRange: Record<string, number> = {}
      if (filters.trfmMin !== undefined) trfmRange.gte = filters.trfmMin
      if (filters.trfmMax !== undefined) trfmRange.lte = filters.trfmMax
      where.player_trfm_value = trfmRange
    }

    const cohortIdsRows = await prisma.jugador.findMany({
      where: where as never,
      select: { id_player: true },
    })
    const cohortIds = cohortIdsRows.map(r => r.id_player)

    // Para el cálculo necesitamos las columnas de stats; hacemos un findMany.
    // Si no hay filtros activos, cogemos todo lo disponible para ese período.
    const cohortStats: Record<string, unknown>[] = cohortIds.length > 0
      ? await table.findMany({ where: { id_player: { in: cohortIds } } })
      : []

    const sampleSize = cohortStats.length

    const playerRow = (playerStats ?? {}) as Record<string, unknown>
    const result: Record<string, PlayerStatsByField> = {}

    for (const spec of METRIC_SPECS) {
      const totKey = spec.base ? `${spec.base}_tot_${period}` : null
      const p90Key = spec.base ? `${spec.base}_p90_${period}` : null
      const percentKey = spec.percentBase ? `${spec.percentBase}_${period}` : null

      const playerTot = totKey ? toNum(playerRow[totKey]) : null
      const playerP90 = p90Key ? toNum(playerRow[p90Key]) : null
      const playerPercent = percentKey ? toNum(playerRow[percentKey]) : null

      // Columna usada para avg/max/percentile: p90 > tot > percent.
      const cohortKey = p90Key ?? totKey ?? percentKey
      const playerCohortVal = playerP90 ?? playerTot ?? playerPercent

      let avg: number | null = null
      let max: number | null = null
      let percentile: number | null = null

      if (cohortKey && cohortStats.length > 0) {
        const values: number[] = []
        for (const row of cohortStats) {
          const v = toNum(row[cohortKey])
          if (v !== null) values.push(v)
        }
        if (values.length > 0) {
          avg = values.reduce((a, b) => a + b, 0) / values.length
          max = reduceMax(values)
          if (playerCohortVal !== null) {
            let belowOrEqual = 0
            for (const v of values) if (v <= playerCohortVal) belowOrEqual++
            percentile = Math.round((belowOrEqual / values.length) * 100)
          }
        }
      }

      // totalValue: el "tot" si existe, si no el porcentaje (caso clean sheets %).
      const totalDisplay = playerTot ?? playerPercent
      result[spec.uiKey] = {
        totalValue: formatNum(totalDisplay),
        p90Value: formatNum(playerP90),
        averageValue: formatNum(avg),
        maximumValue: formatNum(max),
        percentile: formatNum(percentile),
      }
    }

    return { stats: result, sampleSize }
  }

  /**
   * @deprecated Mantenido por compat; nuevos callers deberían usar
   * `getPlayerStatsFormattedWithCohort` que devuelve también `sampleSize`.
   */
  static async getPlayerStatsFormatted(
    playerId: string,
    period: StatsPeriod
  ): Promise<Record<string, PlayerStatsByField>> {
    const { stats } = await this.getPlayerStatsFormattedWithCohort(playerId, period, {})
    return stats
  }
}
