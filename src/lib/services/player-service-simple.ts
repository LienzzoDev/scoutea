/**
 * Player Service - Simplified version without cache or circuit breaker
 */

import { prisma } from '@/lib/db'
import type {
  Player,
  PlayerSearchOptions,
  PlayerSearchResult,
  PlayerStats,
  FilterOptions,
  CreatePlayerData,
  UpdatePlayerData
} from '@/types/player'

export class PlayerService {
  /**
   * 🔍 BUSCAR JUGADORES CON FILTROS AVANZADOS
   */
  static async searchPlayers(options: PlayerSearchOptions = {}): Promise<PlayerSearchResult> {
    try {
      console.log('🔍 PlayerService.searchPlayers called with options:', options);
      
      const {
        search = '',
        position = '',
        nationality = '',
        team = '',
        competition = '',
        ageMin,
        ageMax,
        ratingMin,
        ratingMax,
        page = 1,
        limit = 20,
        sortBy = 'player_rating',
        sortOrder = 'desc'
      } = options

      // 🔍 CONSTRUIR CONDICIONES DE BÚSQUEDA
      const whereConditions: unknown = {}

      if (search) {
        whereConditions.OR = [
          { player_name: { contains: search, mode: 'insensitive' } },
          { team_name: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (position) {
        whereConditions.position_player = { contains: position, mode: 'insensitive' }
      }

      if (nationality) {
        whereConditions.nationality_1 = { contains: nationality, mode: 'insensitive' }
      }

      if (team) {
        whereConditions.team_name = { contains: team, mode: 'insensitive' }
      }

      if (competition) {
        whereConditions.team_competition = { contains: competition, mode: 'insensitive' }
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        whereConditions.age = {}
        if (ageMin !== undefined) whereConditions.age.gte = ageMin
        if (ageMax !== undefined) whereConditions.age.lte = ageMax
      }

      if (ratingMin !== undefined || ratingMax !== undefined) {
        whereConditions.player_rating = {}
        if (ratingMin !== undefined) whereConditions.player_rating.gte = ratingMin
        if (ratingMax !== undefined) whereConditions.player_rating.lte = ratingMax
      }

      // 📊 EJECUTAR CONSULTA CON PAGINACIÓN
      const skip = (page - 1) * limit

      const [players, totalCount] = await Promise.all([
        prisma.jugador.findMany({
          where: whereConditions,
          select: {
            id___player: true,
            player_name: true,
            complete_player_name: true,
            date_of_birth: true,
            age: true,
            position_player: true,
            foot: true,
            height: true,
            nationality_1: true,
            nationality_2: true,
            team_name: true,
            team_country: true,
            team_competition: true,
            competition_country: true,
            player_rating: true,
            player_trfm_value: true,
            photo_coverage: true,
            url_trfm: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.jugador.count({ where: whereConditions })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        players,
        _pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    } catch (_error) {
      console.error('❌ Error in PlayerService.searchPlayers:', error);
      throw error;
    }
  }

  /**
   * 👤 OBTENER JUGADOR POR ID
   */
  static async getPlayerById(id: string): Promise<Player | null> {
    try {
      console.log('🔍 PlayerService.getPlayerById called with ID:', id);
      
      const player = await prisma.jugador.findUnique({
        where: { id___player: id },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: {
            where: { _period: '2023-24' },
            orderBy: { category: 'asc' }
          }
        }
      })

      if (!player) {
        console.log('❌ Player not found:', id);
        return null
      }

      console.log('✅ Player found:', player.player_name);
      return player as Player
    } catch (_error) {
      console.error('❌ Error in PlayerService.getPlayerById:', error);
      throw error;
    }
  }

  /**
   * ➕ CREAR NUEVO JUGADOR
   */
  static async createPlayer(playerData: CreatePlayerData): Promise<Player> {
    try {
      const newPlayer = await prisma.jugador.create({
        data: {
          ...playerData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: true
        }
      })

      console.log('✅ Player created successfully:', newPlayer.id_player);
      return newPlayer as Player
    } catch (_error) {
      console.error('❌ Error creating ___player: ', error);
      throw error;
    }
  }

  /**
   * ✏️ ACTUALIZAR JUGADOR EXISTENTE
   */
  static async updatePlayer(id: string, updateData: UpdatePlayerData): Promise<Player> {
    try {
      const updatedPlayer = await prisma.jugador.update({
        where: { id___player: id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: true
        }
      })

      console.log('✅ Player updated successfully:', id);
      return updatedPlayer as Player
    } catch (_error) {
      console.error('❌ Error updating ___player: ', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR JUGADOR
   */
  static async deletePlayer(id: string): Promise<void> {
    try {
      await prisma.jugador.delete({
        where: { id___player: id }
      })

      console.log('✅ Player deleted successfully:', id);
    } catch (_error) {
      console.error('❌ Error deleting ___player: ', error);
      throw error;
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS GENERALES DE JUGADORES
   */
  static async getPlayerStats(): Promise<PlayerStats> {
    try {
      const [
        totalPlayers,
        averageAge,
        averageRating,
        topRatedPlayer,
        positionDistribution,
        nationalityDistribution,
        recentlyAdded
      ] = await Promise.all([
        // Total de jugadores
        prisma.jugador.count(),
        
        // Edad promedio
        prisma.jugador.aggregate({
          _avg: { age: true },
          where: { age: { not: null } }
        }),
        
        // Rating promedio
        prisma.jugador.aggregate({
          _avg: { player_rating: true },
          where: { player_rating: { not: null } }
        }),
        
        // Jugador mejor valorado
        prisma.jugador.findFirst({
          where: { player_rating: { not: null } },
          orderBy: { player_rating: 'desc' },
          select: {
            id___player: true,
            player_name: true,
            player_rating: true,
            team_name: true
          }
        }),
        
        // Distribución por posición
        prisma.jugador.groupBy({
          by: ['position_player'],
          _count: { position___player: true },
          where: { position_player: { not: null } },
          orderBy: { _count: { position_player: 'desc' } },
          take: 10
        }),
        
        // Distribución por nacionalidad
        prisma.jugador.groupBy({
          by: ['nationality_1'],
          _count: { nationality_1: true },
          where: { nationality_1: { not: null } },
          orderBy: { _count: { nationality_1: 'desc' } },
          take: 10
        }),
        
        // Jugadores añadidos recientemente
        prisma.jugador.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
            }
          }
        })
      ])

      return {
        totalPlayers,
        averageAge: averageAge._avg.age || 0,
        averageRating: averageRating._avg.player_rating || 0,
        topRatedPlayer: topRatedPlayer ? {
          id: topRatedPlayer.id_player,
          name: topRatedPlayer.player_name,
          rating: topRatedPlayer.player_rating || 0,
          team: topRatedPlayer.team_name || 'N/A'
        } : null,
        positionDistribution: positionDistribution.map(item => ({
          position: item.position_player || 'Unknown',
          count: item._count.position_player
        })),
        nationalityDistribution: nationalityDistribution.map(item => ({
          nationality: item.nationality_1 || 'Unknown',
          count: item._count.nationality_1
        })),
        recentlyAdded
      }
    } catch (_error) {
      console.error('❌ Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * 🔧 OBTENER OPCIONES DE FILTROS DISPONIBLES
   */
  static async getAvailableFilters(): Promise<FilterOptions> {
    try {
      const [
        positions,
        nationalities,
        teams,
        competitions,
        ageRange,
        ratingRange
      ] = await Promise.all([
        // Posiciones únicas
        prisma.jugador.findMany({
          select: { position___player: true },
          where: { position_player: { not: null } },
          distinct: ['position_player'],
          orderBy: { position_player: 'asc' }
        }),
        
        // Nacionalidades únicas
        prisma.jugador.findMany({
          select: { nationality_1: true },
          where: { nationality_1: { not: null } },
          distinct: ['nationality_1'],
          orderBy: { nationality_1: 'asc' }
        }),
        
        // Equipos únicos
        prisma.jugador.findMany({
          select: { team_name: true },
          where: { team_name: { not: null } },
          distinct: ['team_name'],
          orderBy: { team_name: 'asc' },
          take: 100 // Limitar para performance
        }),
        
        // Competiciones únicas
        prisma.jugador.findMany({
          select: { team_competition: true },
          where: { team_competition: { not: null } },
          distinct: ['team_competition'],
          orderBy: { team_competition: 'asc' }
        }),
        
        // Rango de edades
        prisma.jugador.aggregate({
          _min: { age: true },
          _max: { age: true },
          where: { age: { not: null } }
        }),
        
        // Rango de ratings
        prisma.jugador.aggregate({
          _min: { player_rating: true },
          _max: { player_rating: true },
          where: { player_rating: { not: null } }
        })
      ])

      return {
        positions: positions
          .map(p => p.position_player)
          .filter((p): p is string => p !== null)
          .sort(),
        nationalities: nationalities
          .map(n => n.nationality_1)
          .filter((n): n is string => n !== null)
          .sort(),
        teams: teams
          .map(t => t.team_name)
          .filter((t): t is string => t !== null)
          .sort(),
        competitions: competitions
          .map(c => c.team_competition)
          .filter((c): c is string => c !== null)
          .sort(),
        ageRange: {
          min: ageRange._min.age || 16,
          max: ageRange._max.age || 45
        },
        ratingRange: {
          min: Math.floor(ratingRange._min.player_rating || 0),
          max: Math.ceil(ratingRange._max.player_rating || 100)
        }
      }
    } catch (_error) {
      console.error('❌ Error getting filter options:', error);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR JUGADORES POR NOMBRE (AUTOCOMPLETADO)
   */
  static async searchPlayersByName(query: string, limit: number = 10): Promise<Array<{
    id: string
    name: string
    team: string | null
    position: string | null
    rating: number | null
  }>> {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const players = await prisma.jugador.findMany({
        where: {
          player_name: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        },
        select: {
          id_player: true,
          player_name: true,
          team_name: true,
          position_player: true,
          player_rating: true
        },
        orderBy: [
          { player_rating: 'desc' },
          { player_name: 'asc' }
        ],
        take: limit
      })

      return players.map(player => ({
        id: player.id_player,
        name: player.player_name,
        team: player.team_name,
        position: player.position_player,
        rating: player.player_rating
      }))
    } catch (_error) {
      console.error('❌ Error searching players by name:', error);
      throw error;
    }
  }

  /**
   * 👤 OBTENER JUGADOR POR ID
   */
  static async getPlayerById(id: string): Promise<Player | null> {
    try {
      console.log('🔍 PlayerService.getPlayerById called with ID:', id);
      
      const player = await prisma.jugador.findUnique({
        where: { id___player: id },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: {
            where: { _period: '2023-24' },
            orderBy: { category: 'asc' }
          }
        }
      })

      if (!player) {
        console.log('❌ Player not found:', id);
        return null
      }

      console.log('✅ Player found:', player.player_name);
      return player as Player
    } catch (_error) {
      console.error('❌ Error in PlayerService.getPlayerById:', error);
      throw error;
    }
  }

  /**
   * ➕ CREAR NUEVO JUGADOR
   */
  static async createPlayer(playerData: CreatePlayerData): Promise<Player> {
    try {
      const newPlayer = await prisma.jugador.create({
        data: {
          ...playerData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: true
        }
      })

      console.log('✅ Player created successfully:', newPlayer.id_player);
      return newPlayer as Player
    } catch (_error) {
      console.error('❌ Error creating ___player: ', error);
      throw error;
    }
  }

  /**
   * ✏️ ACTUALIZAR JUGADOR EXISTENTE
   */
  static async updatePlayer(id: string, updateData: UpdatePlayerData): Promise<Player> {
    try {
      const updatedPlayer = await prisma.jugador.update({
        where: { id___player: id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          atributos: true,
          playerStats3m: true,
          radarMetrics: true
        }
      })

      console.log('✅ Player updated successfully:', id);
      return updatedPlayer as Player
    } catch (_error) {
      console.error('❌ Error updating ___player: ', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR JUGADOR
   */
  static async deletePlayer(id: string): Promise<void> {
    try {
      await prisma.jugador.delete({
        where: { id___player: id }
      })

      console.log('✅ Player deleted successfully:', id);
    } catch (_error) {
      console.error('❌ Error deleting ___player: ', error);
      throw error;
    }
  }

  /**
   * 🔧 VERIFICAR SALUD DEL SERVICIO
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    database: boolean
    timestamp: string
  }> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`
      
      return {
        status: 'healthy',
        database: true,
        timestamp: new Date().toISOString()
      }
    } catch (_error) {
      console.error('❌ PlayerService health check failed:', error)
      
      return {
        status: 'unhealthy',
        database: false,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton-like access
export const playerService = PlayerService