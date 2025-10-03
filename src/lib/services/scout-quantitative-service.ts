import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface QuantitativeData {
  totalReports: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  totalInvestment: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  netProfit: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  roi: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  transferTeamPts: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  transferCompetitionPts: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  initialTRFMValue: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
  profitPerReport: {
    scoutValue: number
    maxValue: number
    avgValue: number
    minValue: number
    rank: number
  }
}

export interface QuantitativeFilters {
  reportType?: string
  position?: string
  nationality1?: string
  potential?: string
  initialAge?: string
  initialTeam?: string
  initialTeamLevel?: string
  initialCompetition?: string
  initialCompetitionLevel?: string
  initialCountry?: string
  transferTeamPts?: string
  transferCompetitionPts?: string
  initialTRFMValue?: string
}

export class ScoutQuantitativeService {
  /**
   * Obtiene datos cuantitativos comparativos para un scout específico
   */
  static async getScoutQuantitativeData(scoutId: string, filters: QuantitativeFilters = {}): Promise<QuantitativeData> {
    // Construir filtros WHERE dinámicamente
    const whereClause: any = {}
    const scoutWhereClause: any = { scout_id: scoutId }

    // Aplicar filtros adicionales si están presentes
    if (filters.reportType && filters.reportType !== 'all' && filters.reportType !== 'todos') {
      whereClause.report_type = filters.reportType
      scoutWhereClause.report_type = filters.reportType
    }
    if (filters.position && filters.position !== 'all' && filters.position !== 'todos') {
      whereClause.position_player = filters.position
      scoutWhereClause.position_player = filters.position
    }
    if (filters.nationality1 && filters.nationality1 !== 'all' && filters.nationality1 !== 'todos') {
      whereClause.nationality_1 = filters.nationality1
      scoutWhereClause.nationality_1 = filters.nationality1
    }

    console.log('🔍 Quantitative WHERE clauses:', { whereClause, scoutWhereClause })

    // Obtener datos del scout específico
    const scoutReports = await prisma.reporte.findMany({
      where: scoutWhereClause,
      select: {
        initial_player_trfm_value: true,
        profit: true,
        roi: true,
        transfer_team_pts: true,
        transfer_competition_pts: true,
      },
    })

    // Obtener estadísticas agregadas de todos los scouts
    const allScoutsStats = await prisma.scout.findMany({
      select: {
        id_scout: true,
        total_reports: true,
        net_profits: true,
        roi: true,
        transfer_team_pts: true,
        transfer_competition_pts: true,
        avg_initial_trfm_value: true,
        avg_profit_report: true,
      },
    })

    // Calcular métricas del scout actual
    const scoutMetrics = this.calculateScoutMetrics(scoutReports)
    
    // Calcular estadísticas comparativas
    const comparativeStats = this.calculateComparativeStats(allScoutsStats, scoutId)

    // Si no hay datos reales, devolver datos de ejemplo
    if (scoutReports.length === 0 || allScoutsStats.length <= 1) {
      return this.getMockQuantitativeData()
    }

    return {
      totalReports: {
        scoutValue: scoutMetrics.totalReports,
        maxValue: comparativeStats.totalReports.max,
        avgValue: comparativeStats.totalReports.avg,
        minValue: comparativeStats.totalReports.min,
        rank: this.calculateRank(scoutMetrics.totalReports, allScoutsStats.map(s => s.total_reports || 0))
      },
      totalInvestment: {
        scoutValue: scoutMetrics.totalInvestment,
        maxValue: comparativeStats.totalInvestment.max,
        avgValue: comparativeStats.totalInvestment.avg,
        minValue: comparativeStats.totalInvestment.min,
        rank: this.calculateRank(scoutMetrics.totalInvestment, allScoutsStats.map(s => s.avg_initial_trfm_value || 0))
      },
      netProfit: {
        scoutValue: scoutMetrics.netProfit,
        maxValue: comparativeStats.netProfit.max,
        avgValue: comparativeStats.netProfit.avg,
        minValue: comparativeStats.netProfit.min,
        rank: this.calculateRank(scoutMetrics.netProfit, allScoutsStats.map(s => s.net_profits || 0))
      },
      roi: {
        scoutValue: scoutMetrics.roi,
        maxValue: comparativeStats.roi.max,
        avgValue: comparativeStats.roi.avg,
        minValue: comparativeStats.roi.min,
        rank: this.calculateRank(scoutMetrics.roi, allScoutsStats.map(s => s.roi || 0))
      },
      transferTeamPts: {
        scoutValue: scoutMetrics.avgTransferTeamPts,
        maxValue: comparativeStats.transferTeamPts.max,
        avgValue: comparativeStats.transferTeamPts.avg,
        minValue: comparativeStats.transferTeamPts.min,
        rank: this.calculateRank(scoutMetrics.avgTransferTeamPts, allScoutsStats.map(s => s.transfer_team_pts || 0))
      },
      transferCompetitionPts: {
        scoutValue: scoutMetrics.avgTransferCompetitionPts,
        maxValue: comparativeStats.transferCompetitionPts.max,
        avgValue: comparativeStats.transferCompetitionPts.avg,
        minValue: comparativeStats.transferCompetitionPts.min,
        rank: this.calculateRank(scoutMetrics.avgTransferCompetitionPts, allScoutsStats.map(s => s.transfer_competition_pts || 0))
      },
      initialTRFMValue: {
        scoutValue: scoutMetrics.avgInitialTRFMValue,
        maxValue: comparativeStats.initialTRFMValue.max,
        avgValue: comparativeStats.initialTRFMValue.avg,
        minValue: comparativeStats.initialTRFMValue.min,
        rank: this.calculateRank(scoutMetrics.avgInitialTRFMValue, allScoutsStats.map(s => s.avg_initial_trfm_value || 0))
      },
      profitPerReport: {
        scoutValue: scoutMetrics.profitPerReport,
        maxValue: comparativeStats.profitPerReport.max,
        avgValue: comparativeStats.profitPerReport.avg,
        minValue: comparativeStats.profitPerReport.min,
        rank: this.calculateRank(scoutMetrics.profitPerReport, allScoutsStats.map(s => s.avg_profit_report || 0))
      }
    }
  }

  /**
   * Calcula métricas del scout específico basado en sus reportes
   */
  private static calculateScoutMetrics(reports: any[]) {
    const totalReports = reports.length
    const totalInvestment = reports.reduce((sum, r) => sum + (r.initial_player_trfm_value || 0), 0)
    const netProfit = reports.reduce((sum, r) => sum + (r.profit || 0), 0)
    const avgROI = totalReports > 0 ? reports.reduce((sum, r) => sum + (r.roi || 0), 0) / totalReports : 0
    const avgTransferTeamPts = totalReports > 0 ? reports.reduce((sum, r) => sum + (r.transfer_team_pts || 0), 0) / totalReports : 0
    const avgTransferCompetitionPts = totalReports > 0 ? reports.reduce((sum, r) => sum + (r.transfer_competition_pts || 0), 0) / totalReports : 0
    const avgInitialTRFMValue = totalReports > 0 ? totalInvestment / totalReports : 0
    const profitPerReport = totalReports > 0 ? netProfit / totalReports : 0

    return {
      totalReports,
      totalInvestment,
      netProfit,
      roi: avgROI,
      avgTransferTeamPts,
      avgTransferCompetitionPts,
      avgInitialTRFMValue,
      profitPerReport
    }
  }

  /**
   * Calcula estadísticas comparativas de todos los scouts
   */
  private static calculateComparativeStats(allScouts: any[], currentScoutId: string) {
    const stats = {
      totalReports: { max: 0, min: 0, avg: 0 },
      totalInvestment: { max: 0, min: 0, avg: 0 },
      netProfit: { max: 0, min: 0, avg: 0 },
      roi: { max: 0, min: 0, avg: 0 },
      transferTeamPts: { max: 0, min: 0, avg: 0 },
      transferCompetitionPts: { max: 0, min: 0, avg: 0 },
      initialTRFMValue: { max: 0, min: 0, avg: 0 },
      profitPerReport: { max: 0, min: 0, avg: 0 }
    }

    const validScouts = allScouts.filter(s => s.id_scout !== currentScoutId)

    if (validScouts.length === 0) return stats

    // Calcular estadísticas para cada métrica
    const metrics = [
      { key: 'totalReports', values: validScouts.map(s => s.total_reports || 0) },
      { key: 'netProfit', values: validScouts.map(s => s.net_profits || 0) },
      { key: 'roi', values: validScouts.map(s => s.roi || 0) },
      { key: 'transferTeamPts', values: validScouts.map(s => s.transfer_team_pts || 0) },
      { key: 'transferCompetitionPts', values: validScouts.map(s => s.transfer_competition_pts || 0) },
      { key: 'initialTRFMValue', values: validScouts.map(s => s.avg_initial_trfm_value || 0) },
      { key: 'profitPerReport', values: validScouts.map(s => s.avg_profit_report || 0) }
    ]

    metrics.forEach(({ key, values }) => {
      const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v))
      if (validValues.length > 0) {
        stats[key as keyof typeof stats] = {
          max: Math.max(...validValues),
          min: Math.min(...validValues),
          avg: validValues.reduce((sum, v) => sum + v, 0) / validValues.length
        }
      } else {
        // Si no hay valores válidos, usar valores por defecto
        stats[key as keyof typeof stats] = {
          max: 0,
          min: 0,
          avg: 0
        }
      }
    })

    return stats
  }

  /**
   * Calcula el ranking del scout para una métrica específica
   */
  private static calculateRank(scoutValue: number, allValues: number[]): number {
    const validValues = allValues.filter(v => v !== null && v !== undefined && !isNaN(v))
    const sortedValues = [...validValues].sort((a, b) => b - a) // Descendente
    const rank = sortedValues.findIndex(v => v <= scoutValue) + 1
    return rank || validValues.length + 1
  }

  /**
   * Genera datos de ejemplo para demostración cuando no hay datos reales
   */
  private static getMockQuantitativeData(): QuantitativeData {
    return {
      totalReports: {
        scoutValue: 127,
        maxValue: 245,
        avgValue: 89,
        minValue: 12,
        rank: 15
      },
      totalInvestment: {
        scoutValue: 45500000, // €45.5M
        maxValue: 89200000,   // €89.2M
        avgValue: 32100000,   // €32.1M
        minValue: 5800000,    // €5.8M
        rank: 8
      },
      netProfit: {
        scoutValue: 12800000, // €12.8M
        maxValue: 28500000,   // €28.5M
        avgValue: 8900000,    // €8.9M
        minValue: -2100000,   // -€2.1M
        rank: 12
      },
      roi: {
        scoutValue: 28.5,     // 28.5%
        maxValue: 45.2,       // 45.2%
        avgValue: 18.7,       // 18.7%
        minValue: -5.3,       // -5.3%
        rank: 6
      },
      transferTeamPts: {
        scoutValue: 72.3,
        maxValue: 89.1,
        avgValue: 65.8,
        minValue: 42.5,
        rank: 18
      },
      transferCompetitionPts: {
        scoutValue: 68.9,
        maxValue: 85.4,
        avgValue: 61.2,
        minValue: 38.7,
        rank: 22
      },
      initialTRFMValue: {
        scoutValue: 15200000, // €15.2M
        maxValue: 28900000,   // €28.9M
        avgValue: 12800000,   // €12.8M
        minValue: 3200000,    // €3.2M
        rank: 14
      },
      profitPerReport: {
        scoutValue: 98500,    // €98.5K
        maxValue: 185000,     // €185K
        avgValue: 67200,      // €67.2K
        minValue: -15000,     // -€15K
        rank: 9
      }
    }
  }
}