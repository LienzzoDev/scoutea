import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateScoutData {
  join_date?: Date
  scout_name?: string
  name?: string
  surname?: string
  date_of_birth?: Date
  age?: number
  nationality?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  favourite_club?: string
  open_to_work?: boolean
  professional_experience?: string
  twitter_profile?: string
  instagram_profile?: string
  linkedin_profile?: string
  url_profile?: string
  total_reports?: number
  total_reports_norm?: number
  total_reports_rank?: number
  original_reports?: number
  original_reports_norm?: number
  original_reports_rank?: number
  nationality_expertise?: string
  competition_expertise?: string
  avg_potential?: number
  avg_initial_age?: number
  avg_initial_age_norm?: number
  total_investment?: number
  total_investment_rank?: number
  total_investment_orig?: number
  total_investment_orig_rank?: number
  net_profits?: number
  net_profits_rank?: number
  net_profits_orig?: number
  net_profits_orig_rank?: number
  roi?: number
  roi_norm?: number
  roi_rank?: number
  roi_orig?: number
  roi_orig_rank?: number
  avg_initial_trfm_value?: number
  avg_initial_trfm_value_rank?: number
  avg_initial_trfm_value_orig?: number
  avg_initial_trfm_value_orig_rank?: number
  max_profit_report?: number
  max_profit_report_rank?: number
  min_profit_report?: number
  min_profit_report_rank?: number
  avg_profit_report?: number
  avg_profit_report_norm?: number
  avg_profit_report_rank?: number
  avg_profit_report_orig?: number
  avg_profit_report_orig_rank?: number
  transfer_team_pts?: number
  transfer_team_pts_norm?: number
  transfer_team_pts_rank?: number
  transfer_team_pts_orig?: number
  transfer_team_pts_orig_rank?: number
  avg_initial_team_elo?: number
  avg_initial_team_level?: string
  transfer_competition_pts?: number
  transfer_competition_pts_norm?: number
  transfer_competition_pts_rank?: number
  transfer_competition_pts_orig?: number
  transfer_competition_pts_orig_rank?: number
  avg_initial_competition_elo?: number
  avg_initial_competition_level?: string
  scout_elo?: number
  scout_level?: string
  scout_ranking?: number
}

export interface UpdateScoutData extends Partial<CreateScoutData> {}

export interface ScoutFilters {
  search?: string // Para búsqueda general
  scout_name?: string
  name?: string
  surname?: string
  nationality?: string
  email?: string
  country?: string
  favourite_club?: string
  open_to_work?: boolean
  nationality_expertise?: string
  competition_expertise?: string
  scout_level?: string
  min_age?: number
  max_age?: number
  min_total_reports?: number
  max_total_reports?: number
  min_original_reports?: number
  max_original_reports?: number
  min_roi?: number
  max_roi?: number
  min_net_profits?: number
  max_net_profits?: number
  min_scout_elo?: number
  max_scout_elo?: number
  min_ranking?: number
  max_ranking?: number
  join_date_from?: Date
  join_date_to?: Date
}

export interface ScoutSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: ScoutFilters
}

export class ScoutService {
  /**
   * Crear un nuevo scout
   */
  static async createScout(data: CreateScoutData) {
    try {
      const scout = await prisma.scout.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return scout
    } catch (_error) {
      console.error('Error creating scout:', error)
      throw error
    }
  }

  /**
   * Obtener un scout por ID
   */
  static async getScoutById(id: string) {
    try {
      const scout = await prisma.scout.findUnique({
        where: { id_scout: id }
      })
      return scout
    } catch (_error) {
      console.error('Error getting scout by ID:', error)
      throw error
    }
  }

  /**
   * Actualizar un scout
   */
  static async updateScout(id: string, data: UpdateScoutData) {
    try {
      const scout = await prisma.scout.update({
        where: { id_scout: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      return scout
    } catch (_error) {
      console.error('Error updating scout:', error)
      throw error
    }
  }

  /**
   * Eliminar un scout
   */
  static async deleteScout(id: string) {
    try {
      await prisma.scout.delete({
        where: { id_scout: id }
      })
      return true
    } catch (_error) {
      console.error('Error deleting scout:', error)
      throw error
    }
  }

  /**
   * Buscar scouts con filtros y paginación
   */
  static async searchScouts(options: ScoutSearchOptions = {}) {
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
      const where: unknown = {}
      
      // Búsqueda general (para navbar)
      if (filters.search) {
        where.OR = [
          {
            scout_name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            surname: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            nationality: {
              contains: filters.search,
              mode: 'insensitive'
            }
          },
          {
            country: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        ]
      } else {
        // Filtros específicos (solo si no hay búsqueda general)
        if (filters.scout_name) {
          where.scout_name = {
            contains: filters.scout_name,
            mode: 'insensitive'
          }
        }
        
        if (filters.name) {
          where.name = {
            contains: filters.name,
            mode: 'insensitive'
          }
        }
        
        if (filters.surname) {
          where.surname = {
            contains: filters.surname,
            mode: 'insensitive'
          }
        }
      }
      
      if (filters.nationality) {
        where.nationality = {
          contains: filters.nationality,
          mode: 'insensitive'
        }
      }
      
      if (filters.email) {
        where.email = {
          contains: filters.email,
          mode: 'insensitive'
        }
      }
      
      if (filters.country) {
        where.country = {
          contains: filters.country,
          mode: 'insensitive'
        }
      }
      
      if (filters.favourite_club) {
        where.favourite_club = {
          contains: filters.favourite_club,
          mode: 'insensitive'
        }
      }
      
      if (filters.open_to_work !== undefined) {
        where.open_to_work = filters.open_to_work
      }
      
      if (filters.nationality_expertise) {
        where.nationality_expertise = {
          contains: filters.nationality_expertise,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_expertise) {
        where.competition_expertise = {
          contains: filters.competition_expertise,
          mode: 'insensitive'
        }
      }
      
      if (filters.scout_level) {
        where.scout_level = {
          contains: filters.scout_level,
          mode: 'insensitive'
        }
      }
      
      if (filters.min_age || filters.max_age) {
        where.age = {}
        if (filters.min_age) where.age.gte = filters.min_age
        if (filters.max_age) where.age.lte = filters.max_age
      }
      
      if (filters.min_total_reports || filters.max_total_reports) {
        where.total_reports = {}
        if (filters.min_total_reports) where.total_reports.gte = filters.min_total_reports
        if (filters.max_total_reports) where.total_reports.lte = filters.max_total_reports
      }
      
      if (filters.min_original_reports || filters.max_original_reports) {
        where.original_reports = {}
        if (filters.min_original_reports) where.original_reports.gte = filters.min_original_reports
        if (filters.max_original_reports) where.original_reports.lte = filters.max_original_reports
      }
      
      if (filters.min_roi || filters.max_roi) {
        where.roi = {}
        if (filters.min_roi) where.roi.gte = filters.min_roi
        if (filters.max_roi) where.roi.lte = filters.max_roi
      }
      
      if (filters.min_net_profits || filters.max_net_profits) {
        where.net_profits = {}
        if (filters.min_net_profits) where.net_profits.gte = filters.min_net_profits
        if (filters.max_net_profits) where.net_profits.lte = filters.max_net_profits
      }
      
      if (filters.min_scout_elo || filters.max_scout_elo) {
        where.scout_elo = {}
        if (filters.min_scout_elo) where.scout_elo.gte = filters.min_scout_elo
        if (filters.max_scout_elo) where.scout_elo.lte = filters.max_scout_elo
      }
      
      if (filters.min_ranking || filters.max_ranking) {
        where.scout_ranking = {}
        if (filters.min_ranking) where.scout_ranking.gte = filters.min_ranking
        if (filters.max_ranking) where.scout_ranking.lte = filters.max_ranking
      }
      
      if (filters.join_date_from || filters.join_date_to) {
        where.join_date = {}
        if (filters.join_date_from) where.join_date.gte = filters.join_date_from
        if (filters.join_date_to) where.join_date.lte = filters.join_date_to
      }

      // Obtener scouts
      const [scouts, total] = await Promise.all([
        prisma.scout.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.scout.count({ where })
      ])

      return {
        scouts,
        _pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (_error) {
      console.error('Error searching scouts:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de scouts
   */
  static async getScoutStats() {
    try {
      const [
        totalScouts,
        scoutsByNationality,
        scoutsByCountry,
        scoutsByLevel,
        scoutsByExpertise,
        avgAge,
        avgTotalReports,
        avgOriginalReports,
        avgRoi,
        avgNetProfits,
        avgScoutElo
      ] = await Promise.all([
        prisma.scout.count(),
        prisma.scout.groupBy({
          by: ['nationality'],
          _count: true,
          orderBy: { _count: { nationality: 'desc' } },
          take: 10
        }),
        prisma.scout.groupBy({
          by: ['country'],
          _count: true,
          orderBy: { _count: { country: 'desc' } },
          take: 10
        }),
        prisma.scout.groupBy({
          by: ['scout_level'],
          _count: true,
          orderBy: { _count: { scout_level: 'desc' } },
          take: 10
        }),
        prisma.scout.groupBy({
          by: ['nationality_expertise'],
          _count: true,
          orderBy: { _count: { nationality_expertise: 'desc' } },
          take: 10
        }),
        prisma.scout.aggregate({
          _avg: { age: true }
        }),
        prisma.scout.aggregate({
          _avg: { total_reports: true }
        }),
        prisma.scout.aggregate({
          _avg: { original_reports: true }
        }),
        prisma.scout.aggregate({
          _avg: { ro_i: true }
        }),
        prisma.scout.aggregate({
          _avg: { net_profits: true }
        }),
        prisma.scout.aggregate({
          _avg: { scout_elo: true }
        })
      ])

      return {
        totalScouts,
        scoutsByNationality,
        scoutsByCountry,
        scoutsByLevel,
        scoutsByExpertise,
        avgAge: avgAge._avg.age,
        avgTotalReports: avgTotalReports._avg.total_reports,
        avgOriginalReports: avgOriginalReports._avg.original_reports,
        avgRoi: avgRoi._avg.roi,
        avgNetProfits: avgNetProfits._avg.net_profits,
        avgScoutElo: avgScoutElo._avg.scout_elo
      }
    } catch (_error) {
      console.error('Error getting scout stats:', error)
      throw error
    }
  }

  /**
   * Obtener scouts por nacionalidad
   */
  static async getScoutsByNationality(nationality: string) {
    try {
      const scouts = await prisma.scout.findMany({
        where: {
          nationality: {
            contains: nationality,
            mode: 'insensitive'
          }
        },
        orderBy: { scout_ranking: 'asc' }
      })
      return scouts
    } catch (_error) {
      console.error('Error getting scouts by nationality:', error)
      throw error
    }
  }

  /**
   * Obtener scouts por país
   */
  static async getScoutsByCountry(country: string) {
    try {
      const scouts = await prisma.scout.findMany({
        where: {
          country: {
            contains: country,
            mode: 'insensitive'
          }
        },
        orderBy: { scout_ranking: 'asc' }
      })
      return scouts
    } catch (_error) {
      console.error('Error getting scouts by country:', error)
      throw error
    }
  }

  /**
   * Obtener scouts por nivel
   */
  static async getScoutsByLevel(level: string) {
    try {
      const scouts = await prisma.scout.findMany({
        where: {
          scout_level: {
            contains: level,
            mode: 'insensitive'
          }
        },
        orderBy: { scout_ranking: 'asc' }
      })
      return scouts
    } catch (_error) {
      console.error('Error getting scouts by level:', error)
      throw error
    }
  }

  /**
   * Obtener scouts disponibles para trabajo
   */
  static async getAvailableScouts() {
    try {
      const scouts = await prisma.scout.findMany({
        where: { open_to_work: true },
        orderBy: { scout_ranking: 'asc' }
      })
      return scouts
    } catch (_error) {
      console.error('Error getting available scouts:', error)
      throw error
    }
  }

  /**
   * Obtener ranking de scouts
   */
  static async getScoutRanking(limit: number = 50) {
    try {
      const scouts = await prisma.scout.findMany({
        where: {
          scout_ranking: {
            not: null
          }
        },
        orderBy: { scout_ranking: 'asc' },
        take: limit
      })
      return scouts
    } catch (_error) {
      console.error('Error getting scout ranking:', error)
      throw error
    }
  }
}
