import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateTeamData {
  team_name: string
  correct_team_name?: string
  team_country?: string
  url_trfm_advisor?: string
  url_trfm?: string
  owner_club?: string
  owner_club_country?: string
  pre_competition?: string
  competition?: string
  correct_competition?: string
  competition_country?: string
  team_trfm_value?: number
  team_trfm_value_norm?: number
  team_rating?: number
  team_rating_norm?: number
  team_elo?: number
  team_level?: string
}

export interface UpdateTeamData extends Partial<CreateTeamData> {}

export interface TeamFilters {
  team_name?: string
  team_country?: string
  competition?: string
  competition_country?: string
  min_rating?: number
  max_rating?: number
  min_value?: number
  max_value?: number
}

export interface TeamSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: TeamFilters
}

export class TeamService {
  /**
   * Crear un nuevo equipo
   */
  static async createTeam(data: CreateTeamData) {
    try {
      const team = await prisma.equipo.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return team
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  }

  /**
   * Obtener un equipo por ID
   */
  static async getTeamById(id: string) {
    try {
      const team = await prisma.equipo.findUnique({
        where: { id_team: id }
      })
      return team
    } catch (error) {
      console.error('Error getting team by ID:', error)
      throw error
    }
  }

  /**
   * Actualizar un equipo
   */
  static async updateTeam(id: string, data: UpdateTeamData) {
    try {
      const team = await prisma.equipo.update({
        where: { id_team: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      return team
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  }

  /**
   * Eliminar un equipo
   */
  static async deleteTeam(id: string) {
    try {
      await prisma.equipo.delete({
        where: { id_team: id }
      })
      return true
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  }

  /**
   * Buscar equipos con filtros y paginación
   */
  static async searchTeams(options: TeamSearchOptions = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'team_name',
        sortOrder = 'asc',
        filters = {}
      } = options

      const skip = (page - 1) * limit

      // Construir filtros WHERE
      const where: any = {}
      
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
      
      if (filters.competition) {
        where.competition = {
          contains: filters.competition,
          mode: 'insensitive'
        }
      }
      
      if (filters.competition_country) {
        where.competition_country = {
          contains: filters.competition_country,
          mode: 'insensitive'
        }
      }
      
      if (filters.min_rating || filters.max_rating) {
        where.team_rating = {}
        if (filters.min_rating) where.team_rating.gte = filters.min_rating
        if (filters.max_rating) where.team_rating.lte = filters.max_rating
      }
      
      if (filters.min_value || filters.max_value) {
        where.team_trfm_value = {}
        if (filters.min_value) where.team_trfm_value.gte = filters.min_value
        if (filters.max_value) where.team_trfm_value.lte = filters.max_value
      }

      // Obtener equipos
      const [teams, total] = await Promise.all([
        prisma.equipo.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
          }
        }),
        prisma.equipo.count({ where })
      ])

      return {
        teams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error searching teams:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de equipos
   */
  static async getTeamStats() {
    try {
      const [
        totalTeams,
        teamsByCountry,
        teamsByCompetition,
        avgRating,
        avgValue
      ] = await Promise.all([
        prisma.equipo.count(),
        prisma.equipo.groupBy({
          by: ['team_country'],
          _count: true,
          orderBy: { _count: { team_country: 'desc' } },
          take: 10
        }),
        prisma.equipo.groupBy({
          by: ['competition'],
          _count: true,
          orderBy: { _count: { competition: 'desc' } },
          take: 10
        }),
        prisma.equipo.aggregate({
          _avg: { team_rating: true }
        }),
        prisma.equipo.aggregate({
          _avg: { team_trfm_value: true }
        })
      ])

      return {
        totalTeams,
        teamsByCountry,
        teamsByCompetition,
        avgRating: avgRating._avg.team_rating,
        avgValue: avgValue._avg.team_trfm_value
      }
    } catch (error) {
      console.error('Error getting team stats:', error)
      throw error
    }
  }

  /**
   * Obtener equipos por país
   */
  static async getTeamsByCountry(country: string) {
    try {
      const teams = await prisma.equipo.findMany({
        where: {
          team_country: {
            contains: country,
            mode: 'insensitive'
          }
        },
        orderBy: { team_name: 'asc' }
      })
      return teams
    } catch (error) {
      console.error('Error getting teams by country:', error)
      throw error
    }
  }

  /**
   * Obtener equipos por competición
   */
  static async getTeamsByCompetition(competition: string) {
    try {
      const teams = await prisma.equipo.findMany({
        where: {
          competition: {
            contains: competition,
            mode: 'insensitive'
          }
        },
        orderBy: { team_name: 'asc' }
      })
      return teams
    } catch (error) {
      console.error('Error getting teams by competition:', error)
      throw error
    }
  }
}
