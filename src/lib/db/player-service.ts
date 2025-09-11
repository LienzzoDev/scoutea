import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreatePlayerData {
  player_name: string
  complete_player_name?: string
  date_of_birth?: Date
  correct_date_of_birth?: Date
  age?: number
  age_value?: number
  age_value_percent?: number
  age_coeff?: number
  wyscout_id_1?: string
  wyscout_name_1?: string
  wyscout_id_2?: string
  wyscout_name_2?: string
  id_fmi?: string
  position_player?: string
  correct_position_player?: string
  position_value?: number
  position_value_percent?: number
  foot?: string
  correct_foot?: string
  height?: number
  correct_height?: number
  nationality_1?: string
  correct_nationality_1?: string
  nationality_value?: number
  nationality_value_percent?: number
  nationality_2?: string
  correct_nationality_2?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  team_level_value?: number
  team_level_value_percent?: number
  team_competition?: string
  competition_country?: string
  team_competition_value?: number
  team_competition_value_percent?: number
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  competition_level_value?: number
  competition_level_value_percent?: number
  owner_club?: string
  owner_club_country?: string
  owner_club_value?: number
  owner_club_value_percent?: number
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean
  agency?: string
  correct_agency?: string
  contract_end?: Date
  correct_contract_end?: Date
  player_rating?: number
  player_rating_norm?: number
  player_trfm_value?: number
  player_trfm_value_norm?: number
  total_fmi_pts_norm?: number
  player_elo?: number
  player_level?: string
  player_ranking?: number
  community_potential?: number
  stats_evo_3m?: number
  photo_coverage?: string
  url_trfm?: string
  url_trfm_advisor?: string
  url_secondary?: string
  url_instagram?: string
  video?: string
  existing_club?: string
}

export interface UpdatePlayerData extends Partial<CreatePlayerData> {}

export interface PlayerFilters {
  player_name?: string
  position_player?: string
  team_name?: string
  nationality_1?: string
  min_age?: number
  max_age?: number
  min_rating?: number
  max_rating?: number
  on_loan?: boolean
}

export interface PlayerSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: PlayerFilters
}

export class PlayerService {
  /**
   * Crear un nuevo jugador
   */
  static async createPlayer(data: CreatePlayerData) {
    try {
      const player = await prisma.jugador.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return player
    } catch (error) {
      console.error('Error creating player:', error)
      throw error
    }
  }

  /**
   * Obtener un jugador por ID
   */
  static async getPlayerById(id: string) {
    try {
      const player = await prisma.jugador.findUnique({
        where: { id_player: id }
      })
      return player
    } catch (error) {
      console.error('Error getting player by ID:', error)
      throw error
    }
  }

  /**
   * Actualizar un jugador
   */
  static async updatePlayer(id: string, data: UpdatePlayerData) {
    try {
      const player = await prisma.jugador.update({
        where: { id_player: id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
      return player
    } catch (error) {
      console.error('Error updating player:', error)
      throw error
    }
  }

  /**
   * Eliminar un jugador
   */
  static async deletePlayer(id: string) {
    try {
      const player = await prisma.jugador.delete({
        where: { id_player: id }
      })
      return player
    } catch (error) {
      console.error('Error deleting player:', error)
      throw error
    }
  }

  /**
   * Buscar jugadores con filtros y paginación
   */
  static async searchPlayers(options: PlayerSearchOptions = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'player_name',
        sortOrder = 'asc',
        filters = {}
      } = options

      const skip = (page - 1) * limit

      // Construir filtros WHERE
      const where: any = {}

      if (filters.player_name) {
        where.player_name = {
          contains: filters.player_name,
          mode: 'insensitive'
        }
      }

      if (filters.position_player) {
        where.position_player = filters.position_player
      }

      if (filters.team_name) {
        where.team_name = {
          contains: filters.team_name,
          mode: 'insensitive'
        }
      }

      if (filters.nationality_1) {
        where.nationality_1 = filters.nationality_1
      }

      if (filters.min_age || filters.max_age) {
        where.age = {}
        if (filters.min_age) where.age.gte = filters.min_age
        if (filters.max_age) where.age.lte = filters.max_age
      }

      if (filters.min_rating || filters.max_rating) {
        where.player_rating = {}
        if (filters.min_rating) where.player_rating.gte = filters.min_rating
        if (filters.max_rating) where.player_rating.lte = filters.max_rating
      }

      if (filters.on_loan !== undefined) {
        where.on_loan = filters.on_loan
      }

      // Construir ordenamiento
      const orderBy: any = {}
      orderBy[sortBy] = sortOrder

      // Ejecutar consulta
      const [players, total] = await Promise.all([
        prisma.jugador.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.jugador.count({ where })
      ])

      return {
        players,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error searching players:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de jugadores
   */
  static async getPlayerStats() {
    try {
      const [
        totalPlayers,
        playersByPosition,
        playersByNationality,
        averageRating,
        topRatedPlayers
      ] = await Promise.all([
        prisma.jugador.count(),
        prisma.jugador.groupBy({
          by: ['position_player'],
          _count: { position_player: true },
          where: { position_player: { not: null } }
        }),
        prisma.jugador.groupBy({
          by: ['nationality_1'],
          _count: { nationality_1: true },
          where: { nationality_1: { not: null } },
          orderBy: { _count: { nationality_1: 'desc' } },
          take: 10
        }),
        prisma.jugador.aggregate({
          _avg: { player_rating: true },
          where: { player_rating: { not: null } }
        }),
        prisma.jugador.findMany({
          where: { player_rating: { not: null } },
          orderBy: { player_rating: 'desc' },
          take: 10,
          select: {
            id_player: true,
            player_name: true,
            player_rating: true,
            team_name: true,
            position_player: true
          }
        })
      ])

      return {
        totalPlayers,
        playersByPosition,
        playersByNationality,
        averageRating: averageRating._avg.player_rating,
        topRatedPlayers
      }
    } catch (error) {
      console.error('Error getting player stats:', error)
      throw error
    }
  }

  /**
   * Obtener jugadores por equipo
   */
  static async getPlayersByTeam(teamName: string) {
    try {
      const players = await prisma.jugador.findMany({
        where: {
          team_name: {
            contains: teamName,
            mode: 'insensitive'
          }
        },
        orderBy: { player_rating: 'desc' }
      })
      return players
    } catch (error) {
      console.error('Error getting players by team:', error)
      throw error
    }
  }

  /**
   * Obtener jugadores por posición
   */
  static async getPlayersByPosition(position: string) {
    try {
      const players = await prisma.jugador.findMany({
        where: { position_player: position },
        orderBy: { player_rating: 'desc' }
      })
      return players
    } catch (error) {
      console.error('Error getting players by position:', error)
      throw error
    }
  }
}

export default PlayerService
