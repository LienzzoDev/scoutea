// 🎯 SERVICES INDEX
// 🚀 PROPÓSITO: Punto de entrada unificado para todos los servicios
// 📊 IMPACTO: Importaciones simplificadas y gestión centralizada

// Servicios principales
export { default as chartService } from './chart-service'
export { default as competitionService } from './competition-service'
export { default as playerService } from './player-service'
export { default as reportService } from './report-service'
export { default as scoutService } from './scout-service'
export { default as teamService } from './team-service'
export { default as tournamentService } from './tournament-service'
export { default as userService } from './user-service'

// Servicios de radar y datos
export { DataPopulationService } from './DataPopulationService'
export { RadarCalculationService } from './RadarCalculationService'
export { radarMetricsService, RadarMetricsService } from './radar-metrics-service'

// Generadores de datos
export { AtributosDataGenerator } from './data-generators/AtributosDataGenerator'
export { PlayerStatsDataGenerator } from './data-generators/PlayerStatsDataGenerator'

// Tipos principales
export type { RadarMetricsData } from './radar-metrics-service'