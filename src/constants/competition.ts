/**
 * Constantes relacionadas con competiciones
 */

/**
 * Confederaciones de fútbol
 */
export const CONFEDERATIONS = [
  { value: 'UEFA', label: 'UEFA' },
  { value: 'CONMEBOL', label: 'CONMEBOL' },
  { value: 'CONCACAF', label: 'CONCACAF' },
  { value: 'AFC', label: 'AFC' },
  { value: 'CAF', label: 'CAF' },
  { value: 'OFC', label: 'OFC' },
] as const

export type Confederation = typeof CONFEDERATIONS[number]['value']

/**
 * Formatos de temporada
 */
export const SEASON_FORMATS = [
  { value: 'League', label: 'Liga' },
  { value: 'Cup', label: 'Copa' },
  { value: 'Playoff', label: 'Playoff' },
] as const

export type SeasonFormat = typeof SEASON_FORMATS[number]['value']

/**
 * Tiers de competición (1-5)
 */
export const COMPETITION_TIERS = [1, 2, 3, 4, 5] as const

export type CompetitionTier = typeof COMPETITION_TIERS[number]
