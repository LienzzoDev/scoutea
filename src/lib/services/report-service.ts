import { prisma } from '@/lib/db'

export interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: Date | null
  report_type: string | null
  id_player: number | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  createdAt: Date
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  }
  scout?: {
    scout_name: string | null
    name: string | null
    surname: string | null
  }
}

export interface ReportStats {
  totalReports: number
  averageRating: number
  reportsByMonth: { month: string; count: number }[]
}

export interface SearchReportsOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: {
    report_status?: string
    report_validation?: string
    report_author?: string
    report_type?: string
    id_player?: string
    player_name?: string
    team_name?: string
    team_country?: string
    competition_country?: string
    position_player?: string
    nationality_1?: string
    agency?: string
    min_age?: number
    max_age?: number
    min_value?: number
    max_value?: number
    min_roi?: number
    max_roi?: number
    min_profit?: number
    max_profit?: number
    on_loan?: boolean
    date_from?: Date
    date_to?: Date
    includeOrphans?: boolean
  }
}

export interface SearchReportsResult {
  reports: Report[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ReportService {
  static async searchReports(options: SearchReportsOptions): Promise<SearchReportsResult> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = options

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Only exclude invalid player references if includeOrphans is explicitly false or undefined
    // For admin views, we might want to see everything
    if (!options.filters?.includeOrphans) {
      where.id_player = { not: null }
      where.player = { isNot: null }
    }

    // Direct report filters
    if (filters.report_status) {
      where.report_status = filters.report_status
    }
    if (filters.report_validation) {
      where.report_validation = filters.report_validation
    }
    if (filters.report_author) {
      where.report_author = filters.report_author
    }
    if (filters.report_type) {
      where.report_type = filters.report_type
    }
    if (filters.id_player) {
      where.id_player = parseInt(filters.id_player)
    }

    // ROI filters
    if (filters.min_roi !== undefined || filters.max_roi !== undefined) {
      where.roi = {}
      if (filters.min_roi !== undefined) where.roi.gte = filters.min_roi
      if (filters.max_roi !== undefined) where.roi.lte = filters.max_roi
    }

    // Profit filters
    if (filters.min_profit !== undefined || filters.max_profit !== undefined) {
      where.profit = {}
      if (filters.min_profit !== undefined) where.profit.gte = filters.min_profit
      if (filters.max_profit !== undefined) where.profit.lte = filters.max_profit
    }

    // Date filters
    if (filters.date_from || filters.date_to) {
      where.report_date = {}
      if (filters.date_from) where.report_date.gte = filters.date_from
      if (filters.date_to) where.report_date.lte = filters.date_to
    }

    // Player-related filters (via relation)
    if (filters.player_name || filters.team_name || filters.team_country ||
        filters.competition_country || filters.position_player || filters.nationality_1 ||
        filters.agency || filters.min_age !== undefined || filters.max_age !== undefined ||
        filters.min_value !== undefined || filters.max_value !== undefined ||
        filters.on_loan !== undefined) {
      where.player = {}

      if (filters.player_name) {
        where.player.player_name = {
          contains: filters.player_name,
          mode: 'insensitive'
        }
      }
      if (filters.team_name) {
        where.player.team_name = {
          contains: filters.team_name,
          mode: 'insensitive'
        }
      }
      if (filters.team_country) {
        where.player.team_country = filters.team_country
      }
      if (filters.competition_country) {
        where.player.competition_country = filters.competition_country
      }
      if (filters.position_player) {
        where.player.position_player = filters.position_player
      }
      if (filters.nationality_1) {
        where.player.nationality_1 = filters.nationality_1
      }
      if (filters.agency) {
        where.player.agency = {
          contains: filters.agency,
          mode: 'insensitive'
        }
      }
      if (filters.min_age !== undefined || filters.max_age !== undefined) {
        where.player.age = {}
        if (filters.min_age !== undefined) where.player.age.gte = filters.min_age
        if (filters.max_age !== undefined) where.player.age.lte = filters.max_age
      }
      if (filters.min_value !== undefined || filters.max_value !== undefined) {
        where.player.player_trfm_value = {}
        if (filters.min_value !== undefined) where.player.player_trfm_value.gte = filters.min_value
        if (filters.max_value !== undefined) where.player.player_trfm_value.lte = filters.max_value
      }
      if (filters.on_loan !== undefined) {
        where.player.on_loan = filters.on_loan
      }
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'player_name') {
      orderBy.player = { player_name: sortOrder }
    } else if (sortBy === 'scout_name') {
      orderBy.scout = { scout_name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Execute queries in parallel
    const [reports, total] = await Promise.all([
      prisma.reporte.findMany({
        where,
        include: {
          player: {
            select: {
              player_name: true,
              position_player: true,
              team_name: true,
              nationality_1: true,
              age: true
            }
          },
          scout: {
            select: {
              scout_name: true,
              name: true,
              surname: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.reporte.count({ where })
    ])

    return {
      reports: reports as Report[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async getAllReports(): Promise<Report[]> {
    const reports = await prisma.reporte.findMany({
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return reports as Report[]
  }

  static async getReportById(id: string): Promise<Report | null> {
    const report = await prisma.reporte.findUnique({
      where: { id_report: id },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      }
    })
    return report as Report | null
  }

  static async getReportsByPlayerId(playerId: number): Promise<Report[]> {
    const reports = await prisma.reporte.findMany({
      where: { id_player: playerId },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return reports as Report[]
  }

  static async getReportsByScoutId(scoutId: string): Promise<Report[]> {
    const reports = await prisma.reporte.findMany({
      where: { scout_id: scoutId },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return reports as Report[]
  }

  static async getReportStats(): Promise<ReportStats> {
    const reports = await prisma.reporte.findMany({
      select: {
        createdAt: true,
        roi: true
      }
    })

    const totalReports = reports.length
    const reportsWithRoi = reports.filter(r => r.roi !== null)
    const averageRating = reportsWithRoi.length > 0
      ? reportsWithRoi.reduce((sum, r) => sum + (r.roi || 0), 0) / reportsWithRoi.length
      : 0

    // Group by month
    const monthCounts: Record<string, number> = {}
    reports.forEach(r => {
      const month = r.createdAt.toISOString().slice(0, 7) // YYYY-MM format
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })

    const reportsByMonth = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({ month, count }))

    return {
      totalReports,
      averageRating,
      reportsByMonth
    }
  }

  static async createReport(reportData: Partial<Report>): Promise<Report> {
    const report = await prisma.reporte.create({
      data: {
        report_status: reportData.report_status,
        report_validation: reportData.report_validation,
        report_author: reportData.report_author,
        scout_id: reportData.scout_id,
        report_date: reportData.report_date,
        report_type: reportData.report_type,
        id_player: reportData.id_player,
        form_potential: reportData.form_potential,
        roi: reportData.roi,
        profit: reportData.profit
      },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      }
    })
    return report as Report
  }

  static async updateReport(id: string, reportData: Partial<Report>): Promise<Report | null> {
    const report = await prisma.reporte.update({
      where: { id_report: id },
      data: {
        report_status: reportData.report_status,
        report_validation: reportData.report_validation,
        report_author: reportData.report_author,
        scout_id: reportData.scout_id,
        report_date: reportData.report_date,
        report_type: reportData.report_type,
        id_player: reportData.id_player,
        form_potential: reportData.form_potential,
        roi: reportData.roi,
        profit: reportData.profit
      },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true,
            nationality_1: true,
            age: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true,
            surname: true
          }
        }
      }
    })
    return report as Report
  }

  static async deleteReport(id: string): Promise<boolean> {
    try {
      await prisma.reporte.delete({
        where: { id_report: id }
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Count orphan reports (reports with invalid player or scout references)
   */
  static async countOrphanReports(): Promise<{ total: number; noPlayer: number; noScout: number }> {
    // Get all report IDs with their player and scout references
    const allReports = await prisma.reporte.findMany({
      select: {
        id_report: true,
        id_player: true,
        scout_id: true,
        player: { select: { id_player: true } },
        scout: { select: { id: true } }
      }
    })

    let noPlayer = 0
    let noScout = 0

    for (const report of allReports) {
      // Report has id_player but player doesn't exist
      if (report.id_player !== null && report.player === null) {
        noPlayer++
      }
      // Report has scout_id but scout doesn't exist
      if (report.scout_id !== null && report.scout === null) {
        noScout++
      }
    }

    // Total orphans are reports where player reference is broken (main issue)
    const total = noPlayer

    return { total, noPlayer, noScout }
  }

  /**
   * Delete all orphan reports (reports with invalid player references)
   */
  static async deleteOrphanReports(): Promise<{ deleted: number }> {
    // First, find all reports where id_player is set but player doesn't exist
    const allReports = await prisma.reporte.findMany({
      select: {
        id_report: true,
        id_player: true,
        player: { select: { id_player: true } }
      }
    })

    const orphanIds = allReports
      .filter(r => r.id_player !== null && r.player === null)
      .map(r => r.id_report)

    if (orphanIds.length === 0) {
      return { deleted: 0 }
    }

    // Delete all orphan reports
    const result = await prisma.reporte.deleteMany({
      where: {
        id_report: { in: orphanIds }
      }
    })

    return { deleted: result.count }
  }
}
