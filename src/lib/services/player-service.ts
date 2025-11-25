import type { Jugador } from '@prisma/client'

import { prisma } from '@/lib/db'
import type { Player, PlayerStats } from '@/types/player'
import type { PlayerWhereInput, PlayerOrderByInput } from '@/types/service-types'

export class PlayerService {
  /**
   * Mapea un jugador de Prisma al tipo Player de la aplicación
   * Centraliza la transformación de datos para evitar duplicación
   */
  private static mapPrismaToPlayer(player: Jugador): Player {
    return {
      id: String(player.id_player),
      id_player: player.id_player,
      player_name: player.player_name,
      wyscout_id_1: player.wyscout_id_1,
      wyscout_id_2: player.wyscout_id_2,
      wyscout_name_1: player.wyscout_name_1,
      wyscout_name_2: player.wyscout_name_2,
      id_fmi: player.id_fmi,
      player_rating: player.player_rating,
      photo_coverage: player.photo_coverage,
      url_trfm_advisor: player.url_trfm_advisor,
      url_trfm: player.url_trfm,
      url_secondary: player.url_secondary,
      url_instagram: player.url_instagram,
      complete_player_name: player.complete_player_name,
      date_of_birth: player.date_of_birth,
      correct_date_of_birth: player.correct_date_of_birth,
      age: player.age,
      age_value: player.age_value,
      age_value_percent: player.age_value_percent,
      age_coeff: player.age_coeff,
      position_player: player.position_player,
      correct_position_player: player.correct_position_player,
      position_value: player.position_value,
      position_value_percent: player.position_value_percent,
      foot: player.foot,
      correct_foot: player.correct_foot,
      height: player.height,
      correct_height: player.correct_height,
      nationality_1: player.nationality_1,
      correct_nationality_1: player.correct_nationality_1,
      nationality_value: player.nationality_value,
      nationality_value_percent: player.nationality_value_percent,
      nationality_2: player.nationality_2,
      correct_nationality_2: player.correct_nationality_2,
      national_tier: player.national_tier,
      rename_national_tier: player.rename_national_tier,
      correct_national_tier: player.correct_national_tier,
      pre_team: player.pre_team,
      team_name: player.team_name,
      correct_team_name: player.correct_team_name,
      team_country: player.team_country,
      team_elo: player.team_elo,
      team_level: player.team_level,
      team_level_value: player.team_level_value,
      team_level_value_percent: player.team_level_value_percent,
      team_competition: player.team_competition,
      competition_country: player.competition_country,
      team_competition_value: player.team_competition_value,
      team_competition_value_percent: player.team_competition_value_percent,
      competition_tier: player.competition_tier,
      competition_confederation: player.competition_confederation,
      competition_elo: player.competition_elo,
      competition_level: player.competition_level,
      competition_level_value: player.competition_level_value,
      competition_level_value_percent: player.competition_level_value_percent,
      owner_club: player.owner_club,
      owner_club_country: player.owner_club_country,
      owner_club_value: player.owner_club_value,
      owner_club_value_percent: player.owner_club_value_percent,
      pre_team_loan_from: player.pre_team_loan_from,
      team_loan_from: player.team_loan_from,
      correct_team_loan_from: player.correct_team_loan_from,
      on_loan: player.on_loan,
      agency: player.agency,
      correct_agency: player.correct_agency,
      contract_end: player.contract_end,
      correct_contract_end: player.correct_contract_end,
      player_trfm_value: player.player_trfm_value,
      player_trfm_value_norm: player.player_trfm_value_norm,
      stats_evo_3m: player.stats_evo_3m,
      player_rating_norm: player.player_rating_norm,
      total_fmi_pts_norm: player.total_fmi_pts_norm,
      player_elo: player.player_elo,
      player_level: player.player_level,
      player_ranking: player.player_ranking,
      community_potential: player.community_potential,
      video: player.video,
      existing_club: player.existing_club,
      previous_trfm_value: player.previous_trfm_value,
      previous_trfm_value_date: player.previous_trfm_value_date,
      trfm_value_change_percent: player.trfm_value_change_percent,
      trfm_value_last_updated: player.trfm_value_last_updated,
      // Social media profiles - TODO: Add proper fields to Jugador schema
      // Currently these fields don't exist in schema, so mapping to null
      facebook_profile: null,
      twitter_profile: null,
      linkedin_profile: null,
      telegram_profile: null,
      instagram_profile: player.url_instagram, // This exists
      admin_notes: player.admin_notes,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    };
  }

  /**
   * Select minimal para listas (optimizado para performance)
   */
  private static readonly LIST_SELECT = {
    id_player: true,
    player_name: true,
    position_player: true,
    team_name: true,
    nationality_1: true,
    age: true,
    player_rating: true,
    photo_coverage: true,
    createdAt: true,
    updatedAt: true,
  }

  static async getAllPlayers(): Promise<Player[]> {
    try {
      const players = await prisma.jugador.findMany({
        where: {
          // Solo mostrar jugadores aprobados
          approval_status: 'approved'
        },
        take: 100, // Limit to 100 players for performance
        orderBy: {
          createdAt: 'desc'
        },
        // OPTIMIZACIÓN: Solo seleccionar campos necesarios
        select: this.LIST_SELECT
      });

      // Transform Prisma result to Player type using mapper
      return players.map(this.mapPrismaToPlayer);
    } catch (error) {
      console.error('Error fetching players:', error);
      // Return empty array on database error
      return [];
    }
  }

  static async getPlayerById(id: string): Promise<Player | null> {
    try {
      // Convert string ID to number since id_player is Int in Prisma
      const playerId = parseInt(id, 10);

      // Validate that the conversion was successful
      if (isNaN(playerId)) {
        console.error('Invalid player ID format:', id);
        return null;
      }

      const player = await prisma.jugador.findUnique({
        where: {
          id_player: playerId
        }
      });

      if (!player) {
        return null;
      }

      // Transform Prisma result to Player type using mapper
      return this.mapPrismaToPlayer(player);
    } catch (error) {
      console.error('Error fetching player by ID:', error);
      // Return null on database error
      return null;
    }
  }


  static async searchPlayers(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
      player_name?: string;
      position_player?: string;
      team_name?: string;
      nationality_1?: string;
      min_age?: number;
      max_age?: number;
      min_rating?: number;
      max_rating?: number;
      on_loan?: boolean;
    };
  } = {}): Promise<{
    players: Player[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'player_name',
        sortOrder = 'asc',
        filters = {}
      } = options;

      // Construir condiciones WHERE
      const whereConditions: PlayerWhereInput = {}

      // IMPORTANTE: Solo mostrar jugadores aprobados (para miembros)
      // Los jugadores con approval_status 'pending' o 'rejected' no deben aparecer
      whereConditions.approval_status = 'approved';

      if (filters.player_name) {
        whereConditions.player_name = {
          contains: filters.player_name,
          mode: 'insensitive'
        };
      }

      if (filters.position_player) {
        whereConditions.position_player = {
          contains: filters.position_player,
          mode: 'insensitive'
        };
      }

      if (filters.team_name) {
        whereConditions.team_name = {
          contains: filters.team_name,
          mode: 'insensitive'
        };
      }

      if (filters.nationality_1) {
        whereConditions.nationality_1 = {
          contains: filters.nationality_1,
          mode: 'insensitive'
        };
      }

      if (filters.min_age || filters.max_age) {
        whereConditions.age = {};
        if (filters.min_age) whereConditions.age.gte = filters.min_age;
        if (filters.max_age) whereConditions.age.lte = filters.max_age;
      }

      if (filters.min_rating || filters.max_rating) {
        whereConditions.player_rating = {};
        if (filters.min_rating) whereConditions.player_rating.gte = filters.min_rating;
        if (filters.max_rating) whereConditions.player_rating.lte = filters.max_rating;
      }

      if (filters.on_loan !== undefined) {
        whereConditions.on_loan = filters.on_loan;
      }

      // Obtener total de registros para paginación
      const total = await prisma.jugador.count({
        where: whereConditions
      });

      // Construir ordenamiento
      const orderBy: PlayerOrderByInput = {}
      if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder;
      } else if (sortBy === 'player_rating') {
        orderBy.player_rating = sortOrder;
      } else if (sortBy === 'age') {
        orderBy.age = sortOrder;
      } else if (sortBy === 'team_name') {
        orderBy.team_name = sortOrder;
      } else if (sortBy === 'position_player') {
        orderBy.position_player = sortOrder;
      } else if (sortBy === 'nationality_1') {
        orderBy.nationality_1 = sortOrder;
      } else {
        orderBy.player_name = sortOrder;
      }

      // Obtener jugadores con paginación
      const players = await prisma.jugador.findMany({
        where: whereConditions,
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      });

      const transformedPlayers = players.map(this.mapPrismaToPlayer);

      return {
        players: transformedPlayers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error searching players:', error);
      // Return empty result on database error
      return {
        players: [],
        pagination: {
          page: page || 1,
          limit: limit || 20,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  static async updatePlayer(id: string, data: Partial<Player>): Promise<Player> {
    try {
      // Convert string ID to number since id_player is Int in Prisma
      const playerId = parseInt(id, 10);

      // Validate that the conversion was successful
      if (isNaN(playerId)) {
        throw new Error(`Invalid player ID format: ${id}`);
      }

      // Clean up the data object to only include defined fields
      const updateData: any = {}

      // Add all defined fields from data to updateData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value
        }
      })

      // Always update the timestamp
      updateData.updatedAt = new Date()

      const updatedPlayer = await prisma.jugador.update({
        where: {
          id_player: playerId
        },
        data: updateData
      });

      return {
        id: String(updatedPlayer.id_player),
        id_player: updatedPlayer.id_player,
        player_name: updatedPlayer.player_name,
        complete_player_name: updatedPlayer.complete_player_name,
        date_of_birth: updatedPlayer.date_of_birth,
        correct_date_of_birth: updatedPlayer.correct_date_of_birth,
        age: updatedPlayer.age,
        position_player: updatedPlayer.position_player,
        correct_position_player: updatedPlayer.correct_position_player,
        foot: updatedPlayer.foot,
        correct_foot: updatedPlayer.correct_foot,
        height: updatedPlayer.height,
        correct_height: updatedPlayer.correct_height,
        nationality_1: updatedPlayer.nationality_1,
        correct_nationality_1: updatedPlayer.correct_nationality_1,
        nationality_2: updatedPlayer.nationality_2,
        correct_nationality_2: updatedPlayer.correct_nationality_2,
        national_tier: updatedPlayer.national_tier,
        correct_national_tier: updatedPlayer.correct_national_tier,
        team_name: updatedPlayer.team_name,
        correct_team_name: updatedPlayer.correct_team_name,
        team_country: updatedPlayer.team_country,
        team_level: updatedPlayer.team_level,
        team_elo: updatedPlayer.team_elo,
        team_competition: updatedPlayer.team_competition,
        competition_country: updatedPlayer.competition_country,
        competition_tier: updatedPlayer.competition_tier,
        competition_level: updatedPlayer.competition_level,
        on_loan: updatedPlayer.on_loan,
        owner_club: updatedPlayer.owner_club,
        owner_club_country: updatedPlayer.owner_club_country,
        agency: updatedPlayer.agency,
        correct_agency: updatedPlayer.correct_agency,
        contract_end: updatedPlayer.contract_end,
        correct_contract_end: updatedPlayer.correct_contract_end,
        player_rating: updatedPlayer.player_rating,
        player_trfm_value: updatedPlayer.player_trfm_value,
        previous_trfm_value: updatedPlayer.previous_trfm_value,
        previous_trfm_value_date: updatedPlayer.previous_trfm_value_date,
        trfm_value_change_percent: updatedPlayer.trfm_value_change_percent,
        trfm_value_last_updated: updatedPlayer.trfm_value_last_updated,
        facebook_profile: updatedPlayer.url_instagram,
        twitter_profile: updatedPlayer.url_secondary,
        linkedin_profile: null,
        telegram_profile: null,
        instagram_profile: updatedPlayer.url_instagram,
        createdAt: updatedPlayer.createdAt,
        updatedAt: updatedPlayer.updatedAt
      };
    } catch (error) {
      console.error('Error updating player:', error);
      throw new Error(`Failed to update player with ID ${id}`);
    }
  }

  static async deletePlayer(id: string): Promise<void> {
    try {
      // Convert string ID to number since id_player is Int in Prisma
      const playerId = parseInt(id, 10);

      // Validate that the conversion was successful
      if (isNaN(playerId)) {
        throw new Error(`Invalid player ID format: ${id}`);
      }

      await prisma.jugador.delete({
        where: {
          id_player: playerId
        }
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      throw new Error(`Failed to delete player with ID ${id}`);
    }
  }

  static async createPlayer(data: Omit<Player, 'id' | 'id_player' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    try {
      const newPlayer = await prisma.jugador.create({
        data: {
          player_name: data.player_name,
          position_player: data.position_player,
          team_name: data.team_name,
          age: data.age,
          nationality_1: data.nationality_1,
          player_rating: data.player_rating,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        id: String(newPlayer.id_player),
        id_player: newPlayer.id_player,
        player_name: newPlayer.player_name,
        complete_player_name: newPlayer.complete_player_name,
        date_of_birth: newPlayer.date_of_birth,
        correct_date_of_birth: newPlayer.correct_date_of_birth,
        age: newPlayer.age,
        position_player: newPlayer.position_player,
        correct_position_player: newPlayer.correct_position_player,
        foot: newPlayer.foot,
        correct_foot: newPlayer.correct_foot,
        height: newPlayer.height,
        correct_height: newPlayer.correct_height,
        nationality_1: newPlayer.nationality_1,
        correct_nationality_1: newPlayer.correct_nationality_1,
        nationality_2: newPlayer.nationality_2,
        correct_nationality_2: newPlayer.correct_nationality_2,
        national_tier: newPlayer.national_tier,
        correct_national_tier: newPlayer.correct_national_tier,
        team_name: newPlayer.team_name,
        correct_team_name: newPlayer.correct_team_name,
        team_country: newPlayer.team_country,
        team_level: newPlayer.team_level,
        team_elo: newPlayer.team_elo,
        team_competition: newPlayer.team_competition,
        competition_country: newPlayer.competition_country,
        competition_tier: newPlayer.competition_tier,
        competition_level: newPlayer.competition_level,
        on_loan: newPlayer.on_loan,
        owner_club: newPlayer.owner_club,
        owner_club_country: newPlayer.owner_club_country,
        agency: newPlayer.agency,
        correct_agency: newPlayer.correct_agency,
        contract_end: newPlayer.contract_end,
        correct_contract_end: newPlayer.correct_contract_end,
        player_rating: newPlayer.player_rating,
        player_trfm_value: newPlayer.player_trfm_value,
        previous_trfm_value: newPlayer.previous_trfm_value,
        previous_trfm_value_date: newPlayer.previous_trfm_value_date,
        trfm_value_change_percent: newPlayer.trfm_value_change_percent,
        trfm_value_last_updated: newPlayer.trfm_value_last_updated,
        facebook_profile: newPlayer.url_instagram,
        twitter_profile: newPlayer.url_secondary,
        linkedin_profile: null,
        telegram_profile: null,
        instagram_profile: newPlayer.url_instagram,
        createdAt: newPlayer.createdAt,
        updatedAt: newPlayer.updatedAt
      };
    } catch (error) {
      console.error('Error creating player:', error);
      throw new Error('Failed to create new player');
    }
  }

  static async getPlayerStats(): Promise<PlayerStats> {
    try {
      // Obtener estadísticas básicas
      const totalPlayers = await prisma.jugador.count();
      
      // Calcular promedio de rating (solo jugadores con rating)
      const avgRatingResult = await prisma.jugador.aggregate({
        _avg: {
          player_rating: true
        },
        where: {
          player_rating: {
            not: null,
            gt: 0
          }
        }
      });

      // Jugadores por posición
      const playersByPosition = await prisma.jugador.groupBy({
        by: ['position_player'],
        _count: {
          id_player: true
        },
        where: {
          position_player: {
            not: null
          }
        },
        orderBy: {
          _count: {
            id_player: 'desc'
          }
        },
        take: 10
      });

      // Jugadores por nacionalidad
      const playersByNationality = await prisma.jugador.groupBy({
        by: ['nationality_1'],
        _count: {
          id_player: true
        },
        where: {
          nationality_1: {
            not: null
          }
        },
        orderBy: {
          _count: {
            id_player: 'desc'
          }
        },
        take: 15
      });

      // Top jugadores por rating
      const topRatedPlayers = await prisma.jugador.findMany({
        where: {
          player_rating: {
            not: null,
            gt: 0
          }
        },
        orderBy: {
          player_rating: 'desc'
        },
        take: 10,
        select: {
          id_player: true,
          player_name: true,
          player_rating: true,
          position_player: true,
          team_name: true
        }
      });

      return {
        totalPlayers,
        averageRating: Math.round((avgRatingResult._avg.player_rating || 0) * 100) / 100,
        playersByPosition: playersByPosition.map(p => ({
          position: p.position_player || 'Sin posición',
          count: p._count.id_player
        })),
        playersByNationality: playersByNationality.map(p => ({
          nationality: p.nationality_1 || 'Sin nacionalidad',
          count: p._count.id_player
        })),
        topRatedPlayers: topRatedPlayers.map(p => ({
          id: p.id_player,
          name: p.player_name || 'Sin nombre',
          rating: p.player_rating || 0,
          position: p.position_player || 'Sin posición',
          team: p.team_name || 'Sin equipo'
        }))
      };
    } catch (error) {
      console.error('Error getting player stats:', error);
      // Fallback con datos básicos
      return {
        totalPlayers: 0,
        averageRating: 0,
        playersByPosition: [],
        playersByNationality: [],
        topRatedPlayers: []
      };
    }
  }
}