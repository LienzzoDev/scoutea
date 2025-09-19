/**
 * RadarCalculationService - Service for calculating the 9 tactical radar categories
 * 
 * This service maps existing database attributes from atributos and player_stats_3m tables
 * to create meaningful tactical insights across 9 specific categories.
 */

import { PrismaClient } from '@prisma/client';

import { connectionPool } from '../db/connection-pool';
import { radarLogger } from '../logging/radar-logger';
import { radarPerformanceMonitor } from '../monitoring/radar-performance-monitor';

import { RadarQueryOptimizer } from './radar-query-optimizer';

export interface RadarCategoryData {
  category: string;
  playerValue: number;
  comparisonAverage?: number;
  percentile?: number;
  rank?: number;
  totalPlayers?: number;
  maxValue?: number;
  minValue?: number;
  dataCompleteness: number;
  sourceAttributes: string[];
}

export interface RadarFilters {
  position?: string;
  nationality?: string;
  competition?: string;
  ageMin?: number;
  ageMax?: number;
  ratingMin?: number;
  ratingMax?: number;
}

export interface AttributeWeight {
  attribute: string;
  weight: number;
  isStatistic?: boolean; // true if from player_stats_3m, false if from atributos
}

export class RadarCalculationService {
  private prisma: PrismaClient;
  private queryOptimizer: RadarQueryOptimizer;

  // Category definitions with attribute mappings and weights
  private readonly categoryMappings: Record<string, AttributeWeight[]> = {
    'def_stopped_ball': [
      { attribute: 'marking_fmi', weight: 0.40 },
      { attribute: 'positioning_fmi', weight: 0.30 },
      { attribute: 'heading_fmi', weight: 0.20 },
      { attribute: 'jumping_fmi', weight: 0.10 }
    ],
    'evitation': [
      { attribute: 'dribbling_fmi', weight: 0.30 },
      { attribute: 'agility_fmi', weight: 0.25 },
      { attribute: 'balance_fmi', weight: 0.25 },
      { attribute: 'first_touch_fmi', weight: 0.20 }
    ],
    'recovery': [
      { attribute: 'tackling_fmi', weight: 0.35 },
      { attribute: 'anticipation_fmi', weight: 0.30 },
      { attribute: 'positioning_fmi', weight: 0.20 },
      { attribute: 'interceptions_p90_3m', weight: 0.15, isStatistic: true }
    ],
    'def_transition': [
      { attribute: 'pace_fmi', weight: 0.25 },
      { attribute: 'acceleration_fmi', weight: 0.25 },
      { attribute: 'stamina_fmi', weight: 0.25 },
      { attribute: 'work_rate_fmi', weight: 0.25 }
    ],
    'off_stopped_ball': [
      { attribute: 'crossing_fmi', weight: 0.30 },
      { attribute: 'corners_fmi', weight: 0.25 },
      { attribute: 'free_kick_taking_fmi', weight: 0.25 },
      { attribute: 'heading_fmi', weight: 0.20 }
    ],
    'maintenance': [
      { attribute: 'passing_fmi', weight: 0.35 },
      { attribute: 'technique_fmi', weight: 0.25 },
      { attribute: 'composure_fmi', weight: 0.25 },
      { attribute: 'accurate_passes_percent_3m', weight: 0.15, isStatistic: true }
    ],
    'progression': [
      { attribute: 'vision_fmi', weight: 0.30 },
      { attribute: 'passing_fmi', weight: 0.30 },
      { attribute: 'dribbling_fmi', weight: 0.25 },
      { attribute: 'forward_passes_p90_3m', weight: 0.15, isStatistic: true }
    ],
    'finishing': [
      { attribute: 'finishing_fmi', weight: 0.40 },
      { attribute: 'composure_fmi', weight: 0.25 },
      { attribute: 'technique_fmi', weight: 0.20 },
      { attribute: 'goals_p90_3m', weight: 0.15, isStatistic: true }
    ],
    'off_transition': [
      { attribute: 'pace_fmi', weight: 0.30 },
      { attribute: 'acceleration_fmi', weight: 0.30 },
      { attribute: 'off_the_ball_fmi', weight: 0.25 },
      { attribute: 'anticipation_fmi', weight: 0.15 }
    ]
  };

  // Spanish labels for categories
  private readonly categoryLabels: Record<string, string> = {
    'def_stopped_ball': 'Balón Parado Def.',
    'evitation': 'Evitación',
    'recovery': 'Recuperación',
    'def_transition': 'Transición Def.',
    'off_stopped_ball': 'Balón Parado Of.',
    'maintenance': 'Mantenimiento',
    'progression': 'Progresión',
    'finishing': 'Finalización',
    'off_transition': 'Transición Of.'
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.queryOptimizer = new RadarQueryOptimizer(this.prisma);
  }

  /**
   * Calculates radar data for a specific player
   */
  async calculatePlayerRadar(playerId: string, period: string = '2023-24'): Promise<RadarCategoryData[]> {
    const operationId = `radar_calc_${playerId}_${Date.now()}`;
    const startTime = Date.now();
    
    radarPerformanceMonitor.startOperation(operationId, 'calculate_player_radar', {
      playerId,
      period
    });

    try {
      // Get player data using optimized query
      const player = await this.queryOptimizer.getPlayerWithRadarData(playerId);

      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }

      if (!player.atributos) {
        throw new Error(`Player ${playerId} has no atributos data`);
      }

    const radarData: RadarCategoryData[] = [];

    // Calculate each category
    for (const [categoryKey, mapping] of Object.entries(this.categoryMappings)) {
      const categoryData = this.calculateCategoryValue(
        categoryKey,
        player.atributos,
        player.playerStats3m,
        mapping
      );

      radarData.push({
        category: this.categoryLabels[categoryKey] || categoryKey,
        playerValue: categoryData.value,
        dataCompleteness: categoryData.completeness,
        sourceAttributes: categoryData.sourceAttributes
      });
    }

    const duration = Date.now() - startTime;
    const avgCompleteness = radarData.reduce((sum, cat) => sum + cat.dataCompleteness, 0) / radarData.length;

    radarPerformanceMonitor.recordRadarCalculation({
      playerId,
      calculationTime: duration,
      categoriesCalculated: radarData.length,
      dataCompleteness: avgCompleteness,
      timestamp: new Date()
    });

    radarPerformanceMonitor.endOperation(operationId);
    
    radarLogger.logRadarCalculation({
      playerId,
      operation: 'calculate_player_radar',
      duration,
      success: true,
      metadata: { 
        cacheHit: false, 
        categoriesCount: radarData.length,
        avgCompleteness: Math.round(avgCompleteness * 100) / 100
      }
    });

    return radarData;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    radarPerformanceMonitor.endOperation(operationId);
    
    radarLogger.logRadarCalculation({
      playerId,
      operation: 'calculate_player_radar',
      duration,
      success: false,
      error: errorMessage
    });

    throw error;
    }
  }

  /**
   * Calculates a single category value from attributes and stats
   */
  private calculateCategoryValue(
    categoryKey: string,
    atributos: any,
    playerStats: any,
    mapping: AttributeWeight[]
  ): { value: number; completeness: number; sourceAttributes: string[] } {
    let weightedSum = 0;
    let totalWeight = 0;
    let availableAttributes = 0;
    const sourceAttributes: string[] = [];

    for (const { attribute, weight, isStatistic } of mapping) {
      let value: number | null = null;

      if (isStatistic && playerStats) {
        value = playerStats[attribute];
      } else if (!isStatistic && atributos) {
        value = atributos[attribute];
      }

      if (value !== null && value !== undefined && !isNaN(value)) {
        // Normalize the value based on its type
        const normalizedValue = this.normalizeAttributeValue(attribute, value, isStatistic);
        
        weightedSum += normalizedValue * weight;
        totalWeight += weight;
        availableAttributes++;
        sourceAttributes.push(attribute);
      }
    }

    // Calculate final value and completeness
    const finalValue = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    const completeness = (availableAttributes / mapping.length) * 100;

    return {
      value: Math.round(finalValue * 100) / 100, // Round to 2 decimal places
      completeness: Math.round(completeness * 100) / 100,
      sourceAttributes
    };
  }

  /**
   * Normalizes attribute values to 0-1 scale based on expected ranges
   */
  private normalizeAttributeValue(attribute: string, value: number, isStatistic: boolean = false): number {
    if (isStatistic) {
      return this.normalizeStatisticValue(attribute, value);
    } else {
      return this.normalizeAtributoValue(attribute, value);
    }
  }

  /**
   * Normalizes FMI attribute values (typically 1-20 scale)
   */
  private normalizeAtributoValue(attribute: string, value: number): number {
    // FMI attributes are typically on a 1-20 scale
    const minValue = 1;
    const maxValue = 20;
    
    // Clamp value to expected range
    const clampedValue = Math.max(minValue, Math.min(maxValue, value));
    
    // Normalize to 0-1 scale
    return (clampedValue - minValue) / (maxValue - minValue);
  }

  /**
   * Normalizes statistical values based on realistic ranges
   */
  private normalizeStatisticValue(attribute: string, value: number): number {
    // Define realistic ranges for different statistics
    const statRanges: Record<string, { min: number; max: number }> = {
      'goals_p90_3m': { min: 0, max: 1.5 },
      'assists_p90_3m': { min: 0, max: 1.0 },
      'shots_p90_3m': { min: 0, max: 8.0 },
      'passes_p90_3m': { min: 10, max: 100 },
      'forward_passes_p90_3m': { min: 5, max: 50 },
      'accurate_passes_percent_3m': { min: 50, max: 100 },
      'crosses_p90_3m': { min: 0, max: 10 },
      'tackles_p90_3m': { min: 0, max: 6 },
      'interceptions_p90_3m': { min: 0, max: 5 },
      'def_duels_won_percent_3m': { min: 30, max: 80 },
      'off_duels_won_percent_3m': { min: 30, max: 80 },
      'aerials_duels_won_percent_3m': { min: 30, max: 90 },
      'effectiveness_percent_3m': { min: 0, max: 50 }
    };

    const range = statRanges[attribute];
    if (!range) {
      // Default normalization for unknown stats
      return Math.max(0, Math.min(1, value / 100));
    }

    // Clamp value to expected range
    const clampedValue = Math.max(range.min, Math.min(range.max, value));
    
    // Normalize to 0-1 scale
    return (clampedValue - range.min) / (range.max - range.min);
  }

  /**
   * Calculates radar data with comparison against a filtered group
   */
  async calculatePlayerRadarWithComparison(
    playerId: string,
    filters: RadarFilters = {},
    period: string = '2023-24'
  ): Promise<RadarCategoryData[]> {
    try {
      // Get player's radar data
      const playerRadarData = await this.calculatePlayerRadar(playerId, period);

      // Get comparison group - if no filters provided, compare against ALL players
      const comparisonGroup = await this.getComparisonGroup(filters);

      if (comparisonGroup.length === 0) {
        console.warn(`No comparison group found for filters:`, filters);
        return playerRadarData;
      }

      console.log(`Comparing player ${playerId} against ${comparisonGroup.length} players`);

      // Calculate percentiles and rankings
      const enrichedRadarData = await this.calculatePercentiles(
        playerRadarData,
        comparisonGroup,
        period
      );

      return enrichedRadarData;

    } catch (error) {
      console.error(`Error calculating radar with comparison for player ${playerId}:`, error);
      // Fallback to basic radar data without comparison
      return await this.calculatePlayerRadar(playerId, period);
    }
  }

  /**
   * Gets comparison group based on filters with enhanced filtering logic
   */
  async getComparisonGroup(filters: RadarFilters = {}): Promise<string[]> {
    const whereClause: any = {};
    const orConditions: any[] = [];

    // Position filter with exact and similar position matching
    if (filters.position) {
      const similarPositions = this.getSimilarPositions(filters.position);
      const positionConditions = [
        { position_player: { in: similarPositions } },
        { correct_position_player: { in: similarPositions } }
      ];
      orConditions.push(...positionConditions);
    }

    // Nationality filter
    if (filters.nationality) {
      const nationalityConditions = [
        { nationality_1: filters.nationality },
        { correct_nationality_1: filters.nationality }
      ];
      if (orConditions.length > 0) {
        // Combine with existing OR conditions using AND logic
        whereClause.AND = [
          { OR: orConditions },
          { OR: nationalityConditions }
        ];
        orConditions.length = 0; // Clear since we're using AND now
      } else {
        orConditions.push(...nationalityConditions);
      }
    }

    // Apply OR conditions if any
    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
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

    // Ensure players have atributos data (required for radar calculations)
    whereClause.atributos = { isNot: null };

    try {
      // Use optimized query
      const playerIds = await this.queryOptimizer.getOptimizedComparisonGroup(filters);
      
      return playerIds;
    } catch (error) {
      console.error('Error fetching comparison group:', error);
      throw new Error(`Failed to fetch comparison group: ${error}`);
    }
  }

  /**
   * Gets similar positions for position filtering
   */
  private getSimilarPositions(position: string): string[] {
    const positionGroups: Record<string, string[]> = {
      // Goalkeepers
      'GK': ['GK'],
      
      // Defenders
      'CB': ['CB', 'SW'],
      'SW': ['CB', 'SW'],
      'LB': ['LB', 'LWB'],
      'RB': ['RB', 'RWB'],
      'LWB': ['LB', 'LWB'],
      'RWB': ['RB', 'RWB'],
      
      // Midfielders
      'DM': ['DM', 'CM'],
      'CM': ['CM', 'DM', 'AM'],
      'AM': ['AM', 'CM'],
      'LM': ['LM', 'LW', 'CM'],
      'RM': ['RM', 'RW', 'CM'],
      
      // Forwards
      'LW': ['LW', 'LM', 'ST'],
      'RW': ['RW', 'RM', 'ST'],
      'ST': ['ST', 'CF'],
      'CF': ['CF', 'ST']
    };

    return positionGroups[position] || [position];
  }

  /**
   * Calculates percentiles and rankings for player values within comparison groups
   */
  async calculatePercentiles(
    playerValues: RadarCategoryData[],
    comparisonGroup: string[],
    period: string = '2023-24'
  ): Promise<RadarCategoryData[]> {
    const enrichedData: RadarCategoryData[] = [];

    for (const playerCategory of playerValues) {
      try {
        // Get comparison values for this category
        const comparisonValues = await this.getComparisonValues(
          playerCategory.category,
          comparisonGroup,
          period
        );

        if (comparisonValues.length === 0) {
          // No comparison data available
          enrichedData.push({
            ...playerCategory,
            comparisonAverage: undefined,
            percentile: undefined,
            rank: undefined,
            totalPlayers: 0,
            maxValue: undefined,
            minValue: undefined
          });
          continue;
        }

        // Calculate statistics
        const stats = this.calculateStatistics(comparisonValues);
        
        // Calculate rank and percentile
        const ranking = this.calculateRanking(playerCategory.playerValue, comparisonValues);

        enrichedData.push({
          ...playerCategory,
          comparisonAverage: Math.round(stats.average * 100) / 100,
          percentile: Math.round(ranking.percentile * 100) / 100,
          rank: ranking.rank,
          totalPlayers: comparisonValues.length,
          maxValue: Math.round(stats.max * 100) / 100,
          minValue: Math.round(stats.min * 100) / 100
        });

      } catch (error) {
        console.error(`Error calculating percentiles for category ${playerCategory.category}:`, error);
        // Return original data without comparison stats
        enrichedData.push(playerCategory);
      }
    }

    return enrichedData;
  }

  /**
   * Calculates ranking and percentile for a player value within a comparison group
   */
  private calculateRanking(
    playerValue: number,
    comparisonValues: number[]
  ): { rank: number; percentile: number } {
    if (comparisonValues.length === 0) {
      return { rank: 1, percentile: 100 };
    }

    // Sort values in descending order (higher is better)
    const sortedValues = [...comparisonValues].sort((a, b) => b - a);
    
    // Handle tied values correctly
    let rank = 1;
    let playersAbove = 0;
    
    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] > playerValue) {
        playersAbove++;
      } else if (sortedValues[i] === playerValue) {
        // For tied values, use the average rank
        let tiedCount = 1;
        for (let j = i + 1; j < sortedValues.length && sortedValues[j] === playerValue; j++) {
          tiedCount++;
        }
        rank = playersAbove + 1 + (tiedCount - 1) / 2;
        break;
      } else {
        rank = playersAbove + 1;
        break;
      }
    }

    // If player value is lower than all comparison values
    if (playersAbove === sortedValues.length) {
      rank = sortedValues.length + 1;
    }

    // Calculate percentile (percentage of players with lower or equal values)
    const playersWithLowerOrEqualValues = sortedValues.filter(v => v <= playerValue).length;
    const percentile = (playersWithLowerOrEqualValues / sortedValues.length) * 100;

    return {
      rank: Math.round(rank),
      percentile: Math.max(0, Math.min(100, percentile))
    };
  }

  /**
   * Calculates statistical measures for a set of values
   */
  private calculateStatistics(values: number[]): {
    min: number;
    max: number;
    average: number;
    median: number;
    standardDeviation: number;
  } {
    if (values.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0, standardDeviation: 0 };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;

    // Calculate median
    const mid = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];

    // Calculate standard deviation
    const squaredDifferences = values.map(val => Math.pow(val - average, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      min,
      max,
      average,
      median,
      standardDeviation
    };
  }

  /**
   * Gets comparison values for a specific category from a group of players
   */
  private async getComparisonValues(
    categoryLabel: string,
    playerIds: string[],
    period: string
  ): Promise<number[]> {
    const values: number[] = [];

    // Find the category key from the label
    const categoryKey = Object.entries(this.categoryLabels)
      .find(([key, label]) => label === categoryLabel)?.[0];

    if (!categoryKey) {
      return values;
    }

    const mapping = this.categoryMappings[categoryKey];
    if (!mapping) {
      return values;
    }

    // Process players in batches to avoid memory issues with large comparison groups
    const batchSize = 50;
    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      
      try {
        const players = await this.prisma.jugador.findMany({
          where: {
            id_player: { in: batch }
          },
          include: {
            atributos: true,
            playerStats3m: true
          }
        });

        for (const player of players) {
          if (player?.atributos) {
            try {
              const categoryData = this.calculateCategoryValue(
                categoryKey,
                player.atributos,
                player.playerStats3m,
                mapping
              );
              
              // Only include values with reasonable data completeness
              if (categoryData.completeness >= 50) {
                values.push(categoryData.value);
              }
            } catch (error) {
              // Skip players with calculation errors
              console.warn(`Error calculating category ${categoryKey} for player ${player.id_player}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
      }
    }

    return values;
  }

  /**
   * Caches radar data in the RadarMetrics table
   */
  async cachePlayerRadarData(playerId: string, period: string = '2023-24'): Promise<void> {
    const radarData = await this.calculatePlayerRadar(playerId, period);

    // Delete existing radar data for this player and period
    await this.prisma.radarMetrics.deleteMany({
      where: {
        playerId,
        period
      }
    });

    // Insert new radar data
    const radarMetrics = radarData.map(data => ({
      playerId,
      category: data.category,
      playerValue: data.playerValue,
      period,
      positionAverage: 50, // Will be calculated later with comparison
      percentile: 50, // Will be calculated later with comparison
      calculatedAt: new Date(),
      dataCompleteness: data.dataCompleteness,
      sourceAttributes: data.sourceAttributes
    }));

    await this.prisma.radarMetrics.createMany({
      data: radarMetrics
    });
  }

  /**
   * Batch calculation for multiple players
   */
  async batchCalculateRadarData(
    playerIds: string[],
    period: string = '2023-24',
    batchSize: number = 10
  ): Promise<{ processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      
      for (const playerId of batch) {
        try {
          await this.cachePlayerRadarData(playerId, period);
          processed++;
        } catch (error) {
          const errorMsg = `Error processing player ${playerId}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Small delay between batches
      if (i + batchSize < playerIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { processed, errors };
  }

  /**
   * Gets all supported categories
   */
  getSupportedCategories(): string[] {
    return Object.keys(this.categoryMappings);
  }

  /**
   * Gets category labels in Spanish
   */
  getCategoryLabels(): Record<string, string> {
    return { ...this.categoryLabels };
  }

  /**
   * Cleanup method to disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}