/**
 * Catálogo de métricas mostradas en Stats · By Period de un jugador.
 * La `key` debe coincidir con la usada por `PlayerStatsService.getPlayerStatsFormatted`
 * (map en `src/lib/services/player-stats-service.ts`).
 */

export interface StatsMetric {
  key: string
  label: string
}

export interface StatsMetricGroup {
  key: string
  title: string
  metrics: StatsMetric[]
}

export const GENERAL_METRICS: StatsMetric[] = [
  { key: 'matches', label: 'Matches' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'Yellow Cards', label: 'Yellow Cards' },
  { key: 'Red Cards', label: 'Red Cards' },
]

export const GOALKEEPING_METRICS: StatsMetric[] = [
  { key: 'concededGoals', label: 'Conceded Goals' },
  { key: 'preventedGoals', label: 'Prevented Goals' },
  { key: 'shotsAgainst', label: 'Shots Against' },
  { key: 'cleanSheetsPercentage', label: 'Clean Sheets (%)' },
  { key: 'saveRate', label: 'Save Rate (%)' },
]

export const DEFENDING_METRICS: StatsMetric[] = [
  { key: 'tackles', label: 'Tackles' },
  { key: 'interceptions', label: 'Interceptions' },
  { key: 'fouls', label: 'Fouls' },
]

export const PASSING_METRICS: StatsMetric[] = [
  { key: 'Passes', label: 'Passes' },
  { key: 'Forward Passes', label: 'Forward Passes' },
  { key: 'Crosses', label: 'Crosses' },
  { key: 'Assists', label: 'Assists' },
  { key: 'Pass Accuracy', label: 'Accurate Passes (%)' },
]

export const FINISHING_METRICS: StatsMetric[] = [
  { key: 'Shots', label: 'Shots' },
  { key: 'Goals', label: 'Goals' },
  { key: 'effectiveness', label: 'Effectiveness (%)' },
]

export const DUELS_METRICS: StatsMetric[] = [
  { key: 'offDuels', label: 'Off Duels' },
  { key: 'defDuels', label: 'Def Duels' },
  { key: 'aerDuels', label: 'Aer Duels' },
  { key: 'offDuelsWonPercentage', label: 'Off Duels Won (%)' },
  { key: 'defDuelsWonPercentage', label: 'Def Duels Won (%)' },
  { key: 'aerDuelsWonPercentage', label: 'Aer Duels Won (%)' },
]

export const PLAYER_STATS_GROUPS: StatsMetricGroup[] = [
  { key: 'general', title: 'General', metrics: GENERAL_METRICS },
  { key: 'goalkeeping', title: 'Goalkeeping', metrics: GOALKEEPING_METRICS },
  { key: 'defending', title: 'Defending', metrics: DEFENDING_METRICS },
  { key: 'passing', title: 'Passing', metrics: PASSING_METRICS },
  { key: 'finishing', title: 'Finishing', metrics: FINISHING_METRICS },
  { key: 'duels', title: '1vs1', metrics: DUELS_METRICS },
]
