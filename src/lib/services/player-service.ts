import { prisma } from '@/lib/db';
import type { Player, PlayerStats } from '@/types/player';

export class PlayerService {
  static async getAllPlayers(): Promise<Player[]> {
    try {
      const players = await prisma.jugador.findMany({
        take: 100, // Limit to 100 players for performance
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform Prisma result to Player type
      return players.map(player => ({
        id: player.id_player,
        id_player: player.id_player,
        player_name: player.player_name,
        complete_player_name: player.complete_player_name,
        date_of_birth: player.date_of_birth,
        correct_date_of_birth: player.correct_date_of_birth,
        age: player.age,
        position_player: player.position_player,
        correct_position_player: player.correct_position_player,
        foot: player.foot,
        correct_foot: player.correct_foot,
        height: player.height,
        correct_height: player.correct_height,
        nationality_1: player.nationality_1,
        correct_nationality_1: player.correct_nationality_1,
        nationality_2: player.nationality_2,
        correct_nationality_2: player.correct_nationality_2,
        national_tier: player.national_tier,
        correct_national_tier: player.correct_national_tier,
        team_name: player.team_name,
        correct_team_name: player.correct_team_name,
        team_country: player.team_country,
        team_level: player.team_level,
        team_elo: player.team_elo,
        team_competition: player.team_competition,
        competition_country: player.competition_country,
        competition_tier: player.competition_tier,
        competition_level: player.competition_level,
        on_loan: player.on_loan,
        owner_club: player.owner_club,
        owner_club_country: player.owner_club_country,
        agency: player.agency,
        correct_agency: player.correct_agency,
        contract_end: player.contract_end,
        correct_contract_end: player.correct_contract_end,
        player_rating: player.player_rating,
        player_trfm_value: player.player_trfm_value,
        previous_trfm_value: player.previous_trfm_value,
        previous_trfm_value_date: player.previous_trfm_value_date,
        trfm_value_change_percent: player.trfm_value_change_percent,
        trfm_value_last_updated: player.trfm_value_last_updated,
        facebook_profile: player.url_instagram,
        twitter_profile: player.url_secondary,
        linkedin_profile: null,
        telegram_profile: null,
        instagram_profile: player.url_instagram,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching players:', error);
      // Fallback to mock data if database is not available
      return this.getMockPlayers();
    }
  }

  static async getPlayerById(id: string): Promise<Player | null> {
    try {
      const player = await prisma.jugador.findUnique({
        where: {
          id_player: id
        }
      });

      if (!player) {
        return null;
      }

      // Transform Prisma result to Player type
      return {
        id: player.id_player,
        id_player: player.id_player,
        player_name: player.player_name,
        complete_player_name: player.complete_player_name,
        date_of_birth: player.date_of_birth,
        correct_date_of_birth: player.correct_date_of_birth,
        age: player.age,
        position_player: player.position_player,
        correct_position_player: player.correct_position_player,
        foot: player.foot,
        correct_foot: player.correct_foot,
        height: player.height,
        correct_height: player.correct_height,
        nationality_1: player.nationality_1,
        correct_nationality_1: player.correct_nationality_1,
        nationality_2: player.nationality_2,
        correct_nationality_2: player.correct_nationality_2,
        national_tier: player.national_tier,
        correct_national_tier: player.correct_national_tier,
        team_name: player.team_name,
        correct_team_name: player.correct_team_name,
        team_country: player.team_country,
        team_level: player.team_level,
        team_elo: player.team_elo,
        team_competition: player.team_competition,
        competition_country: player.competition_country,
        competition_tier: player.competition_tier,
        competition_level: player.competition_level,
        on_loan: player.on_loan,
        owner_club: player.owner_club,
        owner_club_country: player.owner_club_country,
        agency: player.agency,
        correct_agency: player.correct_agency,
        contract_end: player.contract_end,
        correct_contract_end: player.correct_contract_end,
        player_rating: player.player_rating,
        player_trfm_value: player.player_trfm_value,
        previous_trfm_value: player.previous_trfm_value,
        previous_trfm_value_date: player.previous_trfm_value_date,
        trfm_value_change_percent: player.trfm_value_change_percent,
        trfm_value_last_updated: player.trfm_value_last_updated,
        facebook_profile: player.url_instagram, // Mapear campos de redes sociales
        twitter_profile: player.url_secondary,
        linkedin_profile: null, // No disponible en el esquema actual
        telegram_profile: null, // No disponible en el esquema actual
        instagram_profile: player.url_instagram,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt
      };
    } catch (error) {
      console.error('Error fetching player by ID:', error);
      // Fallback to mock data if database is not available
      const mockPlayers = this.getMockPlayers();
      return mockPlayers.find(p => p.id === id || p.id_player === id) || null;
    }
  }

  private static getMockPlayers(): Player[] {
    return [
      {
        id: '1',
        id_player: '1',
        player_name: 'Lionel Messi',
        position_player: 'Delantero',
        team_name: 'Inter Miami',
        age: 36,
        nationality_1: 'Argentina',
        player_rating: 95,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        id_player: '2',
        player_name: 'Cristiano Ronaldo',
        position_player: 'Delantero',
        team_name: 'Al Nassr',
        age: 39,
        nationality_1: 'Portugal',
        player_rating: 94,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        id_player: '3',
        player_name: 'Kylian Mbappé',
        position_player: 'Delantero',
        team_name: 'Real Madrid',
        age: 25,
        nationality_1: 'Francia',
        player_rating: 93,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        id_player: '4',
        player_name: 'Erling Haaland',
        position_player: 'Delantero',
        team_name: 'Manchester City',
        age: 24,
        nationality_1: 'Noruega',
        player_rating: 92,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        id_player: '5',
        player_name: 'Vinicius Jr.',
        position_player: 'Extremo',
        team_name: 'Real Madrid',
        age: 24,
        nationality_1: 'Brasil',
        player_rating: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
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
      const whereConditions: any = {};
      
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
      const orderBy: any = {};
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

      const transformedPlayers = players.map(player => ({
        id: player.id_player,
        id_player: player.id_player,
        player_name: player.player_name,
        complete_player_name: player.complete_player_name,
        date_of_birth: player.date_of_birth,
        correct_date_of_birth: player.correct_date_of_birth,
        age: player.age,
        position_player: player.position_player,
        correct_position_player: player.correct_position_player,
        foot: player.foot,
        correct_foot: player.correct_foot,
        height: player.height,
        correct_height: player.correct_height,
        nationality_1: player.nationality_1,
        correct_nationality_1: player.correct_nationality_1,
        nationality_2: player.nationality_2,
        correct_nationality_2: player.correct_nationality_2,
        national_tier: player.national_tier,
        correct_national_tier: player.correct_national_tier,
        team_name: player.team_name,
        correct_team_name: player.correct_team_name,
        team_country: player.team_country,
        team_level: player.team_level,
        team_elo: player.team_elo,
        team_competition: player.team_competition,
        competition_country: player.competition_country,
        competition_tier: player.competition_tier,
        competition_level: player.competition_level,
        on_loan: player.on_loan,
        owner_club: player.owner_club,
        owner_club_country: player.owner_club_country,
        agency: player.agency,
        correct_agency: player.correct_agency,
        contract_end: player.contract_end,
        correct_contract_end: player.correct_contract_end,
        player_rating: player.player_rating,
        player_trfm_value: player.player_trfm_value,
        previous_trfm_value: player.previous_trfm_value,
        previous_trfm_value_date: player.previous_trfm_value_date,
        trfm_value_change_percent: player.trfm_value_change_percent,
        trfm_value_last_updated: player.trfm_value_last_updated,
        facebook_profile: player.url_instagram,
        twitter_profile: player.url_secondary,
        linkedin_profile: null,
        telegram_profile: null,
        instagram_profile: player.url_instagram,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt
      }));

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
      // Fallback to mock search
      const mockPlayers = this.getMockPlayers();
      return {
        players: mockPlayers,
        pagination: {
          page: 1,
          limit: mockPlayers.length,
          total: mockPlayers.length,
          totalPages: 1
        }
      };
    }
  }

  static async updatePlayer(id: string, data: Partial<Player>): Promise<Player> {
    try {
      const updatedPlayer = await prisma.jugador.update({
        where: {
          id_player: id
        },
        data: {
          player_name: data.player_name,
          position_player: data.position_player,
          team_name: data.team_name,
          age: data.age,
          nationality_1: data.nationality_1,
          player_rating: data.player_rating,
          updatedAt: new Date()
        }
      });

      return {
        id: updatedPlayer.id_player,
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
      await prisma.jugador.delete({
        where: {
          id_player: id
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
        id: newPlayer.id_player,
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