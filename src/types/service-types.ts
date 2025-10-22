/**
 * Tipos para servicios
 * Reemplaza el uso de `any` y `unknown` por tipos específicos
 */

import type { Prisma } from '@prisma/client'

// ============================================================================
// TIPOS PARA PRISMA WHERE CLAUSES
// ============================================================================

export type PlayerWhereInput = Prisma.JugadorWhereInput
export type ScoutWhereInput = Prisma.ScoutWhereInput
export type CompetitionWhereInput = Prisma.CompetitionWhereInput
export type TournamentWhereInput = Prisma.TorneoWhereInput
export type JobOfferWhereInput = Prisma.JobOfferWhereInput
export type ReportWhereInput = Prisma.ReporteWhereInput

// ============================================================================
// TIPOS PARA PRISMA ORDER BY
// ============================================================================

export type PlayerOrderByInput = Prisma.JugadorOrderByWithRelationInput
export type ScoutOrderByInput = Prisma.ScoutOrderByWithRelationInput
export type CompetitionOrderByInput = Prisma.CompetitionOrderByWithRelationInput

// ============================================================================
// TIPOS PARA UPDATES
// ============================================================================

export type PlayerUpdateInput = Prisma.JugadorUpdateInput
export type ScoutUpdateInput = Prisma.ScoutUpdateInput
export type CompetitionUpdateInput = Prisma.CompetitionUpdateInput
export type TournamentUpdateInput = Prisma.TorneoUpdateInput
export type JobOfferUpdateInput = Prisma.JobOfferUpdateInput

// ============================================================================
// TIPOS PARA CREATES
// ============================================================================

export type PlayerCreateInput = Prisma.JugadorCreateInput
export type ScoutCreateInput = Prisma.ScoutCreateInput
export type CompetitionCreateInput = Prisma.CompetitionCreateInput
export type TournamentCreateInput = Prisma.TorneoCreateInput
export type JobOfferCreateInput = Prisma.JobOfferCreateInput

// ============================================================================
// TIPOS ESPECÍFICOS PARA SERVICIOS
// ============================================================================

/**
 * Filtros para búsqueda de scouts
 */
export interface ScoutFilters {
  nationality?: string
  country?: string
  favourite_club?: string
  open_to_work?: boolean
  competition_expertise?: string
  nationality_expertise?: string
}

/**
 * Resultado de métricas de scout
 */
export interface ScoutMetrics {
  totalReports: number
  originalReports: number
  totalInvestment: number
  netProfits: number
  roi: number
  avgPotential: number
  avgInitialAge: number
  avgInitialTRFMValue: number
  maxProfitReport: number
  minProfitReport: number
  avgProfitReport: number
  transferTeamPts: number
  transferCompetitionPts: number
}

/**
 * Estadísticas comparativas entre scouts
 */
export interface ComparativeStats {
  totalReports: { max: number; min: number; avg: number }
  totalInvestment: { max: number; min: number; avg: number }
  netProfits: { max: number; min: number; avg: number }
  roi: { max: number; min: number; avg: number }
  avgInitialTRFMValue: { max: number; min: number; avg: number }
  currentScoutPosition: {
    totalReportsRank: number
    totalInvestmentRank: number
    netProfitsRank: number
    roiRank: number
  }
}

/**
 * Datos para actualización de valores económicos del scout
 */
export interface ScoutEconomicUpdate {
  field: 'total_investment' | 'net_profits' | 'roi' | 'avg_initial_trfm_value' | 'max_profit_report' | 'min_profit_report' | 'avg_profit_report' | 'transfer_team_pts' | 'transfer_competition_pts'
  newValue: number
  scoutId: string
}

/**
 * Opciones de búsqueda genéricas
 */
export interface SearchOptions {
  limit?: number
  offset?: number
  search?: string
}

/**
 * Subscription data (para UserService)
 */
export interface SubscriptionData {
  plan: string
  status: 'active' | 'inactive' | 'cancelled'
  startDate: Date
  endDate?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}
