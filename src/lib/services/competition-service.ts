import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateCompetitionData {
  competition_name: string
  correct_competition_name?: string
  competition_country?: string
  url_trfm?: string
  competition_confederation?: string
  competition_tier?: string
  competition_trfm_value?: number
  competition_trfm_value_norm?: number
  competition_rating?: number
  competition_rating_norm?: number
  competition_elo?: number
  competition_level?: string
}

export interface UpdateCompetitionData extends Partial<CreateCompetitionData> {}

export interface CompetitionFilters {
  competition_name?: string
  competition_country?: string
  competition_confederation?: string
  competition_tier?: string
  competition_level?: string
  min_rating?: number
  max_rating?: number
  min_value?: number
  max_value?: number
}

export interface CompetitionSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: CompetitionFilters
}

export class CompetitionService {
  /**
   * Crear una nueva competición
   */
  static async createCompetition(data: CreateCompetitionData) {
    try {
      const competition = await prisma.competicion.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return competition
    } catch (_error) {
      console.error('Error creating competition:', error)
      throw error
    }
  }

  /**
   * Obtener una competición por ID
   */
  static async getCompetitionById(id: string) {
    try {
      const competition = await prisma.competicion.findUnique({
        where: { id_competition: id }
      })
      return competition
    } catch (_error) {
      console.error('Error getting competition by ID:', error)
      throw error
    }
  }

  /**
   * Actualizar una competición
   */
  static async updateCompetition(id: string, data: UpdateCompetitionData) {
    try {
      const competition = await prisma.competicion.update({
        where: { id_competition: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      return competition
    } catch (_error) {
      console.error('Error updating competition:', error)
      throw error
    }
  }

  /**
   * Eliminar una competición
   */
  static async deleteCompetition(id: string) {
    try {
      await prisma.competicion.delete({
        where: { id_competition: id }
      })
      return true
    } catch (_error) {
      console.error('Error deleting competition:', error)
      throw error
    }
  }

  /**
   * Buscar competiciones con filtros y paginación
   */
  static async searchCompetitions(options: CompetitionSearchOptions = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'competition_name',
        sortOrder = 'asc',
        filters = {}
      } = options

      const skip = (page - 1) * limit

      // Construir filtros WHERE
      const where: unknown = {}
      
      if (filters.competition_name) {
        where.competition_name = {
          contains: filters.competition_name,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_country) {
        where.competition_country = {
          contains: filters.competition_country,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_confederation) {
        where.competition_confederation = {
          contains: filters.competition_confederation,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_tier) {
        where.competition_tier = {
          contains: filters.competition_tier,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_level) {
        where.competition_level = {
          contains: filters.competition_level,
          mode: 'insensitive'
        }
      }
      
      if (filters.min_rating || filters.max_rating) {
        where.competition_rating = {}
        if (filters.min_rating) where.competition_rating.gte = filters.min_rating
        if (filters.max_rating) where.competition_rating.lte = filters.max_rating
      }
      
      if (filters.min_value || filters.max_value) {
        where.competition_trfm_value = {}
        if (filters.min_value) where.competition_trfm_value.gte = filters.min_value
        if (filters.max_value) where.competition_trfm_value.lte = filters.max_value
      }

      // Obtener competiciones
      const [competitions, total] = await Promise.all([
        prisma.competicion.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.competicion.count({ where })
      ])

      return {
        competitions,
        _pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (_error) {
      console.error('Error searching competitions:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de competiciones
   */
  static async getCompetitionStats() {
    try {
      const [
        totalCompetitions,
        competitionsByCountry,
        competitionsByConfederation,
        competitionsByTier,
        avgRating,
        avgValue
      ] = await Promise.all([
        prisma.competicion.count(),
        prisma.competicion.groupBy({
          by: ['competition_country'],
          _count: true,
          orderBy: { _count: { competition_country: 'desc' } },
          take: 10
        }),
        prisma.competicion.groupBy({
          by: ['competition_confederation'],
          _count: true,
          orderBy: { _count: { competition_confederation: 'desc' } },
          take: 10
        }),
        prisma.competicion.groupBy({
          by: ['competition_tier'],
          _count: true,
          orderBy: { _count: { competition_tier: 'desc' } },
          take: 10
        }),
        prisma.competicion.aggregate({
          _avg: { competition_rating: true }
        }),
        prisma.competicion.aggregate({
          _avg: { competition_trfm_value: true }
        })
      ])

      return {
        totalCompetitions,
        competitionsByCountry,
        competitionsByConfederation,
        competitionsByTier,
        avgRating: avgRating._avg.competition_rating,
        avgValue: avgValue._avg.competition_trfm_value
      }
    } catch (_error) {
      console.error('Error getting competition stats:', error)
      throw error
    }
  }

  /**
   * Obtener competiciones por país
   */
  static async getCompetitionsByCountry(country: string) {
    try {
      const competitions = await prisma.competicion.findMany({
        where: {
          competition_country: {
            contains: country,
            mode: 'insensitive'
          }
        },
        orderBy: { competition_name: 'asc' }
      })
      return competitions
    } catch (_error) {
      console.error('Error getting competitions by country:', error)
      throw error
    }
  }

  /**
   * Obtener competiciones por confederación
   */
  static async getCompetitionsByConfederation(confederation: string) {
    try {
      const competitions = await prisma.competicion.findMany({
        where: {
          competition_confederation: {
            contains: confederation,
            mode: 'insensitive'
          }
        },
        orderBy: { competition_name: 'asc' }
      })
      return competitions
    } catch (_error) {
      console.error('Error getting competitions by confederation:', error)
      throw error
    }
  }

  /**
   * Obtener competiciones por tier
   */
  static async getCompetitionsByTier(tier: string) {
    try {
      const competitions = await prisma.competicion.findMany({
        where: {
          competition_tier: {
            contains: tier,
            mode: 'insensitive'
          }
        },
        orderBy: { competition_name: 'asc' }
      })
      return competitions
    } catch (_error) {
      console.error('Error getting competitions by tier:', error)
      throw error
    }
  }
}
