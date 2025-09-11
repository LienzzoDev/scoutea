import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateReportData {
  report_status?: string
  report_validation?: string
  report_author?: string
  report_date?: Date
  report_type?: string
  id_player?: string
  form_player_name?: string
  player_name?: string
  form_url_reference?: string
  url_trfm_advisor?: string
  url_trfm?: string
  url_secondary?: string
  url_instagram?: string
  form_date_of_birth?: string
  date_of_birth?: Date
  correct_date_of_birth?: Date
  age?: number
  initial_age?: number
  form_team_name?: string
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  initial_team?: string
  correct_initial_team?: string
  initial_team_elo?: number
  initial_team_level?: string
  transfer_team_pts?: number
  form_team_competition?: string
  team_competition?: string
  competition_country?: string
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  initial_competition?: string
  initial_competition_country?: string
  initial_competition_elo?: number
  initial_competition_level?: string
  transfer_competition_pts?: number
  owner_club?: string
  owner_club_country?: string
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean
  complete_player_name?: string
  form_position_player?: string
  position_player?: string
  correct_position_player?: string
  form_foot?: string
  foot?: string
  correct_foot?: string
  form_height?: string
  height?: number
  correct_height?: number
  form_nationality_1?: string
  nationality_1?: string
  correct_nationality_1?: string
  form_nationality_2?: string
  nationality_2?: string
  correct_nationality_2?: string
  form_national_tier?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string
  form_agency?: string
  agency?: string
  correct_agency?: string
  contract_end?: Date
  correct_contract_end?: Date
  player_trfm_value?: number
  initial_player_trfm_value?: number
  roi?: number
  profit?: number
  form_potential?: string
  report_format?: string
  form_url_report?: string
  form_url_video?: string
  form_text_report?: string
}

export interface UpdateReportData extends Partial<CreateReportData> {}

export interface ReportFilters {
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
}

export interface ReportSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: ReportFilters
}

export class ReportService {
  /**
   * Crear un nuevo reporte
   */
  static async createReport(data: CreateReportData) {
    try {
      const report = await prisma.reporte.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return report
    } catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  }

  /**
   * Obtener un reporte por ID
   */
  static async getReportById(id: string) {
    try {
      const report = await prisma.reporte.findUnique({
        where: { id_report: id }
      })
      return report
    } catch (error) {
      console.error('Error getting report by ID:', error)
      throw error
    }
  }

  /**
   * Actualizar un reporte
   */
  static async updateReport(id: string, data: UpdateReportData) {
    try {
      const report = await prisma.reporte.update({
        where: { id_report: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      return report
    } catch (error) {
      console.error('Error updating report:', error)
      throw error
    }
  }

  /**
   * Eliminar un reporte
   */
  static async deleteReport(id: string) {
    try {
      await prisma.reporte.delete({
        where: { id_report: id }
      })
      return true
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }

  /**
   * Buscar reportes con filtros y paginación
   */
  static async searchReports(options: ReportSearchOptions = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {}
      } = options

      const skip = (page - 1) * limit

      // Construir filtros WHERE
      const where: any = {}
      
      if (filters.report_status) {
        where.report_status = {
          contains: filters.report_status,
          mode: 'insensitive'
        }
      }
      
      if (filters.report_validation) {
        where.report_validation = {
          contains: filters.report_validation,
          mode: 'insensitive'
        }
      }
      
      if (filters.report_author) {
        where.report_author = {
          contains: filters.report_author,
          mode: 'insensitive'
        }
      }
      
      if (filters.report_type) {
        where.report_type = {
          contains: filters.report_type,
          mode: 'insensitive'
        }
      }
      
      if (filters.id_player) {
        where.id_player = filters.id_player
      }
      
      if (filters.player_name) {
        where.player_name = {
          contains: filters.player_name,
          mode: 'insensitive'
        }
      }
      
      if (filters.team_name) {
        where.team_name = {
          contains: filters.team_name,
          mode: 'insensitive'
        }
      }
      
      if (filters.team_country) {
        where.team_country = {
          contains: filters.team_country,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_country) {
        where.competition_country = {
          contains: filters.competition_country,
          mode: 'insensitive'
        }
      }
      
      if (filters.position_player) {
        where.position_player = {
          contains: filters.position_player,
          mode: 'insensitive'
        }
      }
      
      if (filters.nationality_1) {
        where.nationality_1 = {
          contains: filters.nationality_1,
          mode: 'insensitive'
        }
      }
      
      if (filters.agency) {
        where.agency = {
          contains: filters.agency,
          mode: 'insensitive'
        }
      }
      
      if (filters.min_age || filters.max_age) {
        where.age = {}
        if (filters.min_age) where.age.gte = filters.min_age
        if (filters.max_age) where.age.lte = filters.max_age
      }
      
      if (filters.min_value || filters.max_value) {
        where.player_trfm_value = {}
        if (filters.min_value) where.player_trfm_value.gte = filters.min_value
        if (filters.max_value) where.player_trfm_value.lte = filters.max_value
      }
      
      if (filters.min_roi || filters.max_roi) {
        where.roi = {}
        if (filters.min_roi) where.roi.gte = filters.min_roi
        if (filters.max_roi) where.roi.lte = filters.max_roi
      }
      
      if (filters.min_profit || filters.max_profit) {
        where.profit = {}
        if (filters.min_profit) where.profit.gte = filters.min_profit
        if (filters.max_profit) where.profit.lte = filters.max_profit
      }
      
      if (filters.on_loan !== undefined) {
        where.on_loan = filters.on_loan
      }
      
      if (filters.date_from || filters.date_to) {
        where.report_date = {}
        if (filters.date_from) where.report_date.gte = filters.date_from
        if (filters.date_to) where.report_date.lte = filters.date_to
      }

      // Obtener reportes
      const [reports, total] = await Promise.all([
        prisma.reporte.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.reporte.count({ where })
      ])

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error searching reports:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de reportes
   */
  static async getReportStats() {
    try {
      const [
        totalReports,
        reportsByStatus,
        reportsByValidation,
        reportsByAuthor,
        reportsByType,
        reportsByPosition,
        reportsByNationality,
        avgAge,
        avgValue,
        avgRoi,
        avgProfit
      ] = await Promise.all([
        prisma.reporte.count(),
        prisma.reporte.groupBy({
          by: ['report_status'],
          _count: true,
          orderBy: { _count: { report_status: 'desc' } },
          take: 10
        }),
        prisma.reporte.groupBy({
          by: ['report_validation'],
          _count: true,
          orderBy: { _count: { report_validation: 'desc' } },
          take: 10
        }),
        prisma.reporte.groupBy({
          by: ['report_author'],
          _count: true,
          orderBy: { _count: { report_author: 'desc' } },
          take: 10
        }),
        prisma.reporte.groupBy({
          by: ['report_type'],
          _count: true,
          orderBy: { _count: { report_type: 'desc' } },
          take: 10
        }),
        prisma.reporte.groupBy({
          by: ['position_player'],
          _count: true,
          orderBy: { _count: { position_player: 'desc' } },
          take: 10
        }),
        prisma.reporte.groupBy({
          by: ['nationality_1'],
          _count: true,
          orderBy: { _count: { nationality_1: 'desc' } },
          take: 10
        }),
        prisma.reporte.aggregate({
          _avg: { age: true }
        }),
        prisma.reporte.aggregate({
          _avg: { player_trfm_value: true }
        }),
        prisma.reporte.aggregate({
          _avg: { roi: true }
        }),
        prisma.reporte.aggregate({
          _avg: { profit: true }
        })
      ])

      return {
        totalReports,
        reportsByStatus,
        reportsByValidation,
        reportsByAuthor,
        reportsByType,
        reportsByPosition,
        reportsByNationality,
        avgAge: avgAge._avg.age,
        avgValue: avgValue._avg.player_trfm_value,
        avgRoi: avgRoi._avg.roi,
        avgProfit: avgProfit._avg.profit
      }
    } catch (error) {
      console.error('Error getting report stats:', error)
      throw error
    }
  }

  /**
   * Obtener reportes por jugador
   */
  static async getReportsByPlayer(playerId: string) {
    try {
      const reports = await prisma.reporte.findMany({
        where: { id_player: playerId },
        orderBy: { createdAt: 'desc' }
      })
      return reports
    } catch (error) {
      console.error('Error getting reports by player:', error)
      throw error
    }
  }

  /**
   * Obtener reportes por autor
   */
  static async getReportsByAuthor(author: string) {
    try {
      const reports = await prisma.reporte.findMany({
        where: {
          report_author: {
            contains: author,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return reports
    } catch (error) {
      console.error('Error getting reports by author:', error)
      throw error
    }
  }

  /**
   * Obtener reportes por estado
   */
  static async getReportsByStatus(status: string) {
    try {
      const reports = await prisma.reporte.findMany({
        where: {
          report_status: {
            contains: status,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return reports
    } catch (error) {
      console.error('Error getting reports by status:', error)
      throw error
    }
  }
}
