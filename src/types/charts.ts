// Tipos para gráficos de jugadores

export interface PlayerStats {
  playerId: string
  period: 'current' | '6months' | '12months'
  category: 'general' | 'goalkeeping' | 'defending' | 'passing' | 'finishing'
  metrics: {
    total: number
    p90: number
    average: number
    maximum: number
  }
  lastUpdated: string
}

export interface RadarData {
  playerId: string
  position: string
  categories: {
    name: string
    playerValue: number
    positionAverage: number
    percentile: number
  }[]
  period: string
}

export interface BeeswarmData {
  metric: string
  players: {
    playerId: string
    playerName: string
    value: number
    position: string
    age: number
    nationality: string
    competition: string
    trfmValue: number
    isSelected: boolean
  }[]
  selectedPlayer: {
    playerId: string
    value: number
    percentile: number
  }
}

export interface LollipopData {
  playerId: string
  metrics: {
    name: string
    value: number
    rank: number
    totalPlayers: number
    percentile: number
    category: string
  }[]
  period: string
  position: string
}

// Tipos para filtros
export interface ChartFilters {
  period?: string
  position?: string
  age?: string
  nationality?: string
  competition?: string
  trfmValue?: string
  metric?: string
}

// Tipos para estadísticas específicas
export interface GeneralStats {
  matches: number
  minutes: number
  yellowCards: number
  redCards: number
}

export interface GoalkeepingStats {
  concededGoals: number
  preventedGoals: number
  shotsAgainst: number
  cleanSheetsPercentage: number
  saveRate: number
}

export interface DefendingStats {
  tackles: number
  interceptions: number
  fouls: number
}

export interface PassingStats {
  passes: number
  forwardPasses: number
  crosses: number
  assists: number
  accuratePassesPercentage: number
}

export interface FinishingStats {
  shots: number
  shotsOnTarget: number
  goals: number
  goalsPerShot: number
  conversionRate: number
}

// Tipo unificado para todas las estadísticas
export interface AllPlayerStats {
  general: GeneralStats
  goalkeeping: GoalkeepingStats
  defending: DefendingStats
  passing: PassingStats
  finishing: FinishingStats
}

// Tipos para categorías de radar
export interface RadarCategory {
  name: string
  displayName: string
  description: string
  maxValue: number
}

export const RADAR_CATEGORIES: RadarCategory[] = [
  {
    name: 'off_transition',
    displayName: 'Transición Ofensiva',
    description: 'Efectividad en transiciones de defensa a ataque',
    maxValue: 100
  },
  {
    name: 'maintenance',
    displayName: 'Mantenimiento',
    description: 'Capacidad de mantener la posesión del balón',
    maxValue: 100
  },
  {
    name: 'progression',
    displayName: 'Progresión',
    description: 'Habilidad para avanzar el balón hacia el área rival',
    maxValue: 100
  },
  {
    name: 'finishing',
    displayName: 'Finalización',
    description: 'Efectividad en situaciones de gol',
    maxValue: 100
  },
  {
    name: 'off_stopped_ball',
    displayName: 'Balón Parado Ofensivo',
    description: 'Rendimiento en saques de esquina y faltas',
    maxValue: 100
  },
  {
    name: 'def_transition',
    displayName: 'Transición Defensiva',
    description: 'Efectividad en transiciones de ataque a defensa',
    maxValue: 100
  },
  {
    name: 'recovery',
    displayName: 'Recuperación',
    description: 'Habilidad para recuperar la posesión del balón',
    maxValue: 100
  },
  {
    name: 'evitation',
    displayName: 'Evitación',
    description: 'Capacidad de evitar presión y mantener el control',
    maxValue: 100
  },
  {
    name: 'def_stopped_ball',
    displayName: 'Balón Parado Defensivo',
    description: 'Rendimiento en situaciones defensivas de balón parado',
    maxValue: 100
  }
]

// Tipos para métricas de enjambre
export interface BeeswarmMetric {
  name: string
  displayName: string
  description: string
  unit: string
  category: string
}

export const BEESWARM_METRICS: BeeswarmMetric[] = [
  {
    name: 'goals',
    displayName: 'Goles',
    description: 'Número total de goles marcados',
    unit: 'goles',
    category: 'finishing'
  },
  {
    name: 'assists',
    displayName: 'Asistencias',
    description: 'Número total de asistencias',
    unit: 'asistencias',
    category: 'passing'
  },
  {
    name: 'passes',
    displayName: 'Pases',
    description: 'Número total de pases completados',
    unit: 'pases',
    category: 'passing'
  },
  {
    name: 'tackles',
    displayName: 'Entradas',
    description: 'Número total de entradas exitosas',
    unit: 'entradas',
    category: 'defending'
  },
  {
    name: 'interceptions',
    displayName: 'Intercepciones',
    description: 'Número total de intercepciones',
    unit: 'intercepciones',
    category: 'defending'
  },
  {
    name: 'shots',
    displayName: 'Disparos',
    description: 'Número total de disparos',
    unit: 'disparos',
    category: 'finishing'
  },
  {
    name: 'clean_sheets',
    displayName: 'Portería a Cero',
    description: 'Número de partidos sin recibir goles',
    unit: 'partidos',
    category: 'goalkeeping'
  },
  {
    name: 'saves',
    displayName: 'Paradas',
    description: 'Número total de paradas del portero',
    unit: 'paradas',
    category: 'goalkeeping'
  }
]
