/**
 * RadarQueryOptimizer - Optimized database queries for radar calculations
 * 
 * This service provides optimized database queries specifically designed for
 * radar calculations, comparison group filtering, and percentile calculations.
 */

import { PrismaClient } from '@prisma/client';
import { RadarFilters } from './RadarCalculationService';

export interface OptimizedPlayerData {
  id_player: string;
  player_name: string;
  position_player: string | null;
  correct_position_player: string | null;
  nationality_1: string | null;
  correct_nationality_1: string | null;
  team_competition: string | null;
  age: number | null;
  player_rating: number | null;
  atributos: any;
  playerStats3m: any;
}

export interface ComparisonGroupStats {
  totalPlayers: number;
  averageRating: number;
  positionDistribution: Record<string, number>;
  nationalityDistribution: Record<string, number>;
}

export class RadarQueryOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Optimized query to get player data with all required attributes and stats
   */
  async getPlayerWithRadarData(playerId: string): Promise<OptimizedPlayerData | null> {
    try {
      const player = await this.prisma.jugador.findUnique({
        where: { id_player: playerId },
        select: {
          id_player: true,
          player_name: true,
          position_player: true,
          correct_position_player: true,
          nationality_1: true,
          correct_nationality_1: true,
          team_competition: true,
          age: true,
          player_rating: true,
          atributos: {
            select: {
              // Technical attributes
              corners_fmi: true,
              crossing_fmi: true,
              dribbling_fmi: true,
              finishing_fmi: true,
              first_touch_fmi: true,
              free_kick_taking_fmi: true,
              heading_fmi: true,
              passing_fmi: true,
              tackling_fmi: true,
              technique_fmi: true,
              marking_fmi: true,
              off_the_ball_fmi: true,
              positioning_fmi: true,
              
              // Physical attributes
              acceleration_fmi: true,
              agility_fmi: true,
              balance_fmi: true,
              jumping_fmi: true,
              pace_fmi: true,
              stamina_fmi: true,
              
              // Mental attributes
              anticipation_fmi: true,
              composure_fmi: true,
              vision_fmi: true,
              work_rate_fmi: true
            }
          },
          playerStats3m: {
            select: {
              goals_p90_3m: true,
              assists_p90_3m: true,
              shots_p90_3m: true,
              passes_p90_3m: true,
              forward_passes_p90_3m: true,
              accurate_passes_percent_3m: true,
              crosses_p90_3m: true,
              tackles_p90_3m: true,
              interceptions_p90_3m: true,
              effectiveness_percent_3m: true
            }
          }
        }
      });

      return player as OptimizedPlayerData | null;
    } catch (error) {
      console.error(`Error fetching player data for ${playerId}:`, error);
      throw new Error(`Failed to fetch player data: ${error}`);
    }
  }

  /**
   * Optimized query to get comparison group with minimal data transfer
   */
  async getOptimizedComparisonGroup(filters: RadarFilters = {}): Promise<string[]> {
    try {
      const whereClause = this.buildOptimizedWhereClause(filters);

      const players = await this.prisma.jugador.findMany({
        where: whereClause,
        select: { id_player: true },
        orderBy: { player_rating: 'desc' },
        // Limit to prevent excessive memory usage
        take: 5000
      });

      return players.map(p => p.id_player);
    } catch (error) {
      console.error('Error fetching optimized comparison group:', error);
      throw new Error(`Failed to fetch comparison group: ${error}`);
    }
  }

  /**
   * Batch query to get multiple players' radar data efficiently
   */
  async batchGetPlayersWithRadarData(playerIds: string[]): Promise<OptimizedPlayerData[]> {
    try {
      // Process in chunks to avoid query size limits
      const chunkSize = 100;
      const results: OptimizedPlayerData[] = [];

      for (let i = 0; i < playerIds.length; i += chunkSize) {
        const chunk = playerIds.slice(i, i + chunkSize);
        
        const players = await this.prisma.jugador.findMany({
          where: {
            id_player: { in: chunk },
            atributos: { isNot: null } // Only players with atributos data
          },
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
            correct_position_player: true,
            nationality_1: true,
            correct_nationality_1: true,
            team_competition: true,
            age: true,
            player_rating: true,
            atributos: {
              select: {
                // Only select attributes needed for radar calculations
                corners_fmi: true,
                crossing_fmi: true,
                dribbling_fmi: true,
                finishing_fmi: true,
                first_touch_fmi: true,
                free_kick_taking_fmi: true,
                heading_fmi: true,
                passing_fmi: true,
                tackling_fmi: true,
                technique_fmi: true,
                marking_fmi: true,
                off_the_ball_fmi: true,
                positioning_fmi: true,
                acceleration_fmi: true,
                agility_fmi: true,
                balance_fmi: true,
                jumping_fmi: true,
                pace_fmi: true,
                stamina_fmi: true,
                anticipation_fmi: true,
                composure_fmi: true,
                vision_fmi: true,
                work_rate_fmi: true
              }
            },
            playerStats3m: {
              select: {
                goals_p90_3m: true,
                assists_p90_3m: true,
                shots_p90_3m: true,
                passes_p90_3m: true,
                forward_passes_p90_3m: true,
                accurate_passes_percent_3m: true,
                crosses_p90_3m: true,
                tackles_p90_3m: true,
                interceptions_p90_3m: true,
                effectiveness_percent_3m: true
              }
            }
          }
        });

        results.push(...(players as OptimizedPlayerData[]));
      }

      return results;
    } catch (error) {
      console.error('Error in batch get players with radar data:', error);
      throw new Error(`Failed to batch fetch player data: ${error}`);
    }
  }

  /**
   * Get cached radar metrics for multiple players efficiently
   */
  async batchGetCachedRadarMetrics(
    playerIds: string[], 
    period: string = '2023-24'
  ): Promise<Map<string, any[]>> {
    try {
      const radarMetrics = await this.prisma.radarMetrics.findMany({
        where: {
          playerId: { in: playerIds },
          period: period
        },
        select: {
          playerId: true,
          category: true,
          playerValue: true,
          comparisonAverage: true,
          percentile: true,
          rank: true,
          totalPlayers: true,
          dataCompleteness: true,
          sourceAttributes: true,
          calculatedAt: true
        },
        orderBy: [
          { playerId: 'asc' },
          { category: 'asc' }
        ]
      });

      // Group by player ID
      const groupedMetrics = new Map<string, any[]>();
      
      for (const metric of radarMetrics) {
        if (!groupedMetrics.has(metric.playerId)) {
          groupedMetrics.set(metric.playerId, []);
        }
        groupedMetrics.get(metric.playerId)!.push(metric);
      }

      return groupedMetrics;
    } catch (error) {
      console.error('Error fetching cached radar metrics:', error);
      throw new Error(`Failed to fetch cached radar metrics: ${error}`);
    }
  }

  /**
   * Get comparison group statistics for analysis
   */
  async getComparisonGroupStats(filters: RadarFilters = {}): Promise<ComparisonGroupStats> {
    try {
      const whereClause = this.buildOptimizedWhereClause(filters);

      const [totalCount, avgRating, positionStats, nationalityStats] = await Promise.all([
        // Total count
        this.prisma.jugador.count({ where: whereClause }),
        
        // Average rating
        this.prisma.jugador.aggregate({
          where: whereClause,
          _avg: { player_rating: true }
        }),
        
        // Position distribution
        this.prisma.jugador.groupBy({
          by: ['position_player'],
          where: {
            ...whereClause,
            position_player: { not: null }
          },
          _count: true
        }),
        
        // Nationality distribution
        this.prisma.jugador.groupBy({
          by: ['nationality_1'],
          where: {
            ...whereClause,
            nationality_1: { not: null }
          },
          _count: true
        })
      ]);

      const positionDistribution: Record<string, number> = {};
      positionStats.forEach(stat => {
        if (stat.position_player) {
          positionDistribution[stat.position_player] = stat._count;
        }
      });

      const nationalityDistribution: Record<string, number> = {};
      nationalityStats.forEach(stat => {
        if (stat.nationality_1) {
          nationalityDistribution[stat.nationality_1] = stat._count;
        }
      });

      return {
        totalPlayers: totalCount,
        averageRating: avgRating._avg.player_rating || 0,
        positionDistribution,
        nationalityDistribution
      };
    } catch (error) {
      console.error('Error fetching comparison group stats:', error);
      throw new Error(`Failed to fetch comparison group stats: ${error}`);
    }
  }

  /**
   * Optimized query to check data completeness for players
   */
  async checkDataCompleteness(playerIds: string[]): Promise<Map<string, { hasAtributos: boolean; hasStats: boolean }>> {
    try {
      const results = await this.prisma.jugador.findMany({
        where: { id_player: { in: playerIds } },
        select: {
          id_player: true,
          atributos: { select: { id_player: true } },
          playerStats3m: { select: { id_player: true } }
        }
      });

      const completenessMap = new Map<string, { hasAtributos: boolean; hasStats: boolean }>();
      
      for (const player of results) {
        completenessMap.set(player.id_player, {
          hasAtributos: !!player.atributos,
          hasStats: !!player.playerStats3m
        });
      }

      return completenessMap;
    } catch (error) {
      console.error('Error checking data completeness:', error);
      throw new Error(`Failed to check data completeness: ${error}`);
    }
  }

  /**
   * Build optimized WHERE clause for comparison group queries
   */
  private buildOptimizedWhereClause(filters: RadarFilters): any {
    const whereClause: any = {
      // Always require atributos data for radar calculations
      atributos: { isNot: null }
    };

    // Position filter with similar positions
    if (filters.position) {
      const similarPositions = this.getSimilarPositions(filters.position);
      whereClause.OR = [
        { position_player: { in: similarPositions } },
        { correct_position_player: { in: similarPositions } }
      ];
    }

    // Nationality filter
    if (filters.nationality) {
      const nationalityCondition = {
        OR: [
          { nationality_1: filters.nationality },
          { correct_nationality_1: filters.nationality }
        ]
      };
      
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          nationalityCondition
        ];
        delete whereClause.OR;
      } else {
        Object.assign(whereClause, nationalityCondition);
      }
    }

    // Competition filter
    if (filters.competition) {
      whereClause.team_competition = filters.competition;
    }

    // Age filter
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      whereClause.age = {};
      if (filters.ageMin !== undefined) whereClause.age.gte = filters.ageMin;
      if (filters.ageMax !== undefined) whereClause.age.lte = filters.ageMax;
    }

    // Rating filter
    if (filters.ratingMin !== undefined || filters.ratingMax !== undefined) {
      whereClause.player_rating = {};
      if (filters.ratingMin !== undefined) whereClause.player_rating.gte = filters.ratingMin;
      if (filters.ratingMax !== undefined) whereClause.player_rating.lte = filters.ratingMax;
    }

    return whereClause;
  }

  /**
   * Get similar positions for position filtering
   */
  private getSimilarPositions(position: string): string[] {
    const positionGroups: Record<string, string[]> = {
      'GK': ['GK'],
      'CB': ['CB', 'SW'],
      'SW': ['CB', 'SW'],
      'LB': ['LB', 'LWB'],
      'RB': ['RB', 'RWB'],
      'LWB': ['LB', 'LWB'],
      'RWB': ['RB', 'RWB'],
      'DM': ['DM', 'CM'],
      'CM': ['CM', 'DM', 'AM'],
      'AM': ['AM', 'CM'],
      'LM': ['LM', 'LW', 'CM'],
      'RM': ['RM', 'RW', 'CM'],
      'LW': ['LW', 'LM', 'ST'],
      'RW': ['RW', 'RM', 'ST'],
      'ST': ['ST', 'CF'],
      'CF': ['CF', 'ST']
    };

    return positionGroups[position] || [position];
  }

  /**
   * Execute raw SQL for complex aggregations when needed
   */
  async executeRawQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...params);
    } catch (error) {
      console.error('Error executing raw query:', error);
      throw new Error(`Raw query execution failed: ${error}`);
    }
  }

  /**
   * Get database connection pool status
   */
  async getConnectionPoolStatus(): Promise<any> {
    try {
      // This would typically require database-specific queries
      // For now, return basic connection info
      return {
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting connection pool status:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}