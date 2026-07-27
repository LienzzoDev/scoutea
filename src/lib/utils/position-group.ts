/**
 * Agrupación de posiciones para cohortes de percentiles.
 *
 * La BD guarda posiciones estilo Transfermarkt ('Centre-Back', 'Goalkeeper',
 * 'Defensive Midfield'...) y algunos registros con abreviaturas ('GK', 'CB'...).
 * Un percentil solo tiene sentido comparando contra el grupo posicional:
 * un delantero no debe medirse en goles/90 contra porteros.
 */

export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD'

const ABBREVIATIONS: Record<string, PositionGroup> = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF', RWB: 'DEF', LWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', RM: 'MID', LM: 'MID', DMF: 'MID', CMF: 'MID', AMF: 'MID',
  RW: 'FWD', LW: 'FWD', CF: 'FWD', ST: 'FWD', SS: 'FWD',
}

/**
 * Devuelve el grupo posicional o null si la posición es desconocida/vacía
 * (los desconocidos se comparan contra la población completa).
 */
export function positionGroup(position: string | null | undefined): PositionGroup | null {
  if (!position) return null
  const trimmed = position.trim()
  if (!trimmed) return null

  const abbr = ABBREVIATIONS[trimmed.toUpperCase()]
  if (abbr) return abbr

  const p = trimmed.toLowerCase()
  if (p.includes('goalkeeper') || p.includes('portero')) return 'GK'
  // 'midfield' antes que 'defen'/'attack': 'Defensive Midfield' y
  // 'Attacking Midfield' son mediocampistas.
  if (p.includes('midfield') || p.includes('mediocentro') || p.includes('mediocampista')) return 'MID'
  if (p.includes('back') || p.includes('defen') || p.includes('defensa')) return 'DEF'
  if (
    p.includes('winger') || p.includes('forward') || p.includes('striker') ||
    p.includes('attack') || p.includes('delantero') || p.includes('extremo')
  ) return 'FWD'
  return null
}
