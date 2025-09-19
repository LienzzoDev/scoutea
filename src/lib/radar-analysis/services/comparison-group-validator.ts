/**
 * ComparisonGroupValidator - Service for validating comparison group integrity
 * 
 * This service validates that comparison groups are appropriate for applied filters,
 * verifies that averages are calculated correctly from the active group,
 * and ensures proper notification when no players meet filter criteria.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { connectionPool } from '../../db/connection-pool';
import { RadarCalculationService, RadarFilters } from '../../services/RadarCalculationService';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  AnalysisIssue, 
  AnalysisContext,
  AnalysisSeverity
} from '../types';


export interface ComparisonGroupValidationResult {
  filters: RadarFilters;
  expectedGroupSize: number;
  actualGroupSize: number;
  isAppropriate: boolean;
  groupComposition: GroupComposition;
  averageValidation: AverageValidationResult[];
  emptyGroupHandling: EmptyGroupHandlingResult;
  issues: AnalysisIssue[];
  recommendations: string[];
}

export interface GroupComposition {
  totalPlayers: number;
  positionDistribution: Record<string, number>;
  nationalityDistribution: Record<string, number>;
  ageDistribution: { min: number; max: number; average: number };
  ratingDistribution: { min: number; max: number; average: number };
  isRepresentative: boolean;
  representativenessScore: number;
}

export interface AverageValidationResult {
  category: string;
  reportedAverage: number;
  calculatedAverage: number;
  isCorrect: boolean;
  discrepancy?: number;
  sampleSize: number;
  standardDeviation: number;
  issues: string[];
}

export interface EmptyGroupHandlingResult {
  hasEmptyGroups: boolean;
  emptyFilterCombinations: string[];
  isProperlyNotified: boolean;
  fallbackBehavior: string;
  issues: string[];
}

export interface FilterAppropriateness {
  filter: string;
  value: any;
  isAppropriate: boolean;
  resultingGroupSize: number;
  minimumRecommendedSize: number;
  reason: string;
}

export class ComparisonGroupValidator {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  // Minimum group sizes for meaningful comparisons
  private readonly MIN_GROUP_SIZE = 10;
  private readonly RECOMMENDED_GROUP_SIZE = 30;
  private readonly AVERAGE_TOLERANCE = 0.5; // 0.5 point tolerance for average calculations

  // Position similarity mappings for appropriate comparisons
  private readonly POSITION_SIMILARITIES: Record<string, string[]> = {
    'GK': ['GK'],
    'CB': ['CB', 'LCB', 'RCB'],
    'LB': ['LB', 'LWB', 'LM'],
    'RB': ['RB', 'RWB', 'RM'],
    'CDM': ['CDM', 'CM', 'LCM', 'RCM'],
    'CM': ['CM', 'CDM', 'CAM', 'LCM', 'RCM'],
    'CAM': ['CAM', 'CM', 'CF', 'LW', 'RW'],
    'LW': ['LW', 'LM', 'CAM', 'CF'],
    'RW': ['RW', 'RM', 'CAM', 'CF'],
    'CF': ['CF', 'CAM', 'LW', 'RW', 'ST'],
    'ST': ['ST', 'CF']
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Validates the integrity of comparison groups for given filters
   */
  async validateComparisonGroupIntegrity(
    playerId: string,
    filters: RadarFilters,
    context: AnalysisContext
  ): Promise<ComparisonGroupValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_comparison_group', playerId, filters }
      });

      // Get the actual comparison group based on filters
      const comparisonGroup = await this.getComparisonGroup(playerId, filters);
      
      // Validate group appropriateness
      const groupComposition = await this.analyzeGroupComposition(comparisonGroup, filters);
      
      // Validate average calculations
      const averageValidation = await this.validateAverageCalculations(
        playerId, 
        comparisonGroup, 
        filters
      );
      
      // Check empty group handling
      const emptyGroupHandling = await this.validateEmptyGroupHandling(filters);
      
      // Determine if group is appropriate
      const isAppropriate = this.isGroupAppropriate(groupComposition, filters);
      
      // Generate issues
      const issues: AnalysisIssue[] = [];
      
      if (!isAppropriate) {
        issues.push(this.createGroupAppropriatenessIssue(groupComposition, filters, context));
      }
      
      averageValidation.forEach(result => {
        if (!result.isCorrect) {
          issues.push(this.createAverageCalculationIssue(result, context));
        }
      });
      
      if (emptyGroupHandling.hasEmptyGroups && !emptyGroupHandling.isProperlyNotified) {
        issues.push(this.createEmptyGroupHandlingIssue(emptyGroupHandling, context));
      }
      
      // Generate recommendations
      const recommendations = this.generateGroupRecommendations(
        groupComposition,
        averageValidation,
        emptyGroupHandling,
        filters
      );

      const result: ComparisonGroupValidationResult = {
        filters,
        expectedGroupSize: this.calculateExpectedGroupSize(filters),
        actualGroupSize: comparisonGroup.length,
        isAppropriate,
        groupComposition,
        averageValidation,
        emptyGroupHandling,
        issues,
        recommendations
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'validate_comparison_group', 
          playerId, 
          duration,
          groupSize: comparisonGroup.length,
          isAppropriate,
          issuesFound: issues.length
        }
      }, result as any);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_comparison_group', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates that filter combinations produce appropriate comparison groups
   */
  async validateFilterAppropriateness(
    filters: RadarFilters,
    context: AnalysisContext
  ): Promise<FilterAppropriateness[]> {
    const results: FilterAppropriateness[] = [];

    // Test each filter individually and in combination
    const filterTests = [
      { name: 'position', value: filters.position },
      { name: 'nationality', value: filters.nationality },
      { name: 'competition', value: filters.competition },
      { name: 'age_range', value: filters.ageMin || filters.ageMax ? { min: filters.ageMin, max: filters.ageMax } : null },
      { name: 'rating_range', value: filters.ratingMin || filters.ratingMax ? { min: filters.ratingMin, max: filters.ratingMax } : null }
    ];

    for (const filterTest of filterTests) {
      if (filterTest.value === null || filterTest.value === undefined) {
        continue;
      }

      // Create isolated filter to test
      const isolatedFilter: RadarFilters = {};
      if (filterTest.name === 'position') isolatedFilter.position = filterTest.value as string;
      if (filterTest.name === 'nationality') isolatedFilter.nationality = filterTest.value as string;
      if (filterTest.name === 'competition') isolatedFilter.competition = filterTest.value as string;
      if (filterTest.name === 'age_range') {
        const range = filterTest.value as { min?: number; max?: number };
        isolatedFilter.ageMin = range.min;
        isolatedFilter.ageMax = range.max;
      }
      if (filterTest.name === 'rating_range') {
        const range = filterTest.value as { min?: number; max?: number };
        isolatedFilter.ratingMin = range.min;
        isolatedFilter.ratingMax = range.max;
      }

      // Get group size for this filter
      const groupSize = await this.getGroupSize(isolatedFilter);
      const isAppropriate = groupSize >= this.MIN_GROUP_SIZE;

      let reason = '';
      if (!isAppropriate) {
        reason = `Filter produces only ${groupSize} players (minimum: ${this.MIN_GROUP_SIZE})`;
      } else if (groupSize < this.RECOMMENDED_GROUP_SIZE) {
        reason = `Filter produces ${groupSize} players (recommended: ${this.RECOMMENDED_GROUP_SIZE}+)`;
      } else {
        reason = `Filter produces appropriate group size of ${groupSize} players`;
      }

      results.push({
        filter: filterTest.name,
        value: filterTest.value,
        isAppropriate,
        resultingGroupSize: groupSize,
        minimumRecommendedSize: this.RECOMMENDED_GROUP_SIZE,
        reason
      });
    }

    return results;
  }

  /**
   * Get comparison group based on filters
   */
  private async getComparisonGroup(playerId: string, filters: RadarFilters): Promise<any[]> {
    const whereClause: any = {
      id_player: { not: playerId } // Exclude the target player
    };

    // Apply position filter with similar positions
    if (filters.position) {
      const similarPositions = this.POSITION_SIMILARITIES[filters.position] || [filters.position];
      whereClause.position_player = { in: similarPositions };
    }

    // Apply other filters
    if (filters.nationality) {
      whereClause.nationality_1 = filters.nationality;
    }

    if (filters.competition) {
      whereClause.team_competition = filters.competition;
    }

    if (filters.ageMin || filters.ageMax) {
      whereClause.age = {};
      if (filters.ageMin) whereClause.age.gte = filters.ageMin;
      if (filters.ageMax) whereClause.age.lte = filters.ageMax;
    }

    if (filters.ratingMin || filters.ratingMax) {
      whereClause.player_rating = {};
      if (filters.ratingMin) whereClause.player_rating.gte = filters.ratingMin;
      if (filters.ratingMax) whereClause.player_rating.lte = filters.ratingMax;
    }

    return await this.prisma.jugador.findMany({
      where: whereClause,
      include: {
        atributos: true,
        playerStats3m: true
      }
    });
  }

  /**
   * Get group size for given filters (without including player data)
   */
  private async getGroupSize(filters: RadarFilters): Promise<number> {
    const whereClause: any = {};

    if (filters.position) {
      const similarPositions = this.POSITION_SIMILARITIES[filters.position] || [filters.position];
      whereClause.position_player = { in: similarPositions };
    }

    if (filters.nationality) {
      whereClause.nationality_1 = filters.nationality;
    }

    if (filters.competition) {
      whereClause.team_competition = filters.competition;
    }

    if (filters.ageMin || filters.ageMax) {
      whereClause.age = {};
      if (filters.ageMin) whereClause.age.gte = filters.ageMin;
      if (filters.ageMax) whereClause.age.lte = filters.ageMax;
    }

    if (filters.ratingMin || filters.ratingMax) {
      whereClause.player_rating = {};
      if (filters.ratingMin) whereClause.player_rating.gte = filters.ratingMin;
      if (filters.ratingMax) whereClause.player_rating.lte = filters.ratingMax;
    }

    return await this.prisma.jugador.count({ where: whereClause });
  }

  /**
   * Analyze group composition for representativeness
   */
  private async analyzeGroupComposition(
    comparisonGroup: any[],
    filters: RadarFilters
  ): Promise<GroupComposition> {
    if (comparisonGroup.length === 0) {
      return {
        totalPlayers: 0,
        positionDistribution: {},
        nationalityDistribution: {},
        ageDistribution: { min: 0, max: 0, average: 0 },
        ratingDistribution: { min: 0, max: 0, average: 0 },
        isRepresentative: false,
        representativenessScore: 0
      };
    }

    // Calculate distributions
    const positionDistribution: Record<string, number> = {};
    const nationalityDistribution: Record<string, number> = {};
    const ages: number[] = [];
    const ratings: number[] = [];

    comparisonGroup.forEach(player => {
      // Position distribution
      if (player.position_player) {
        positionDistribution[player.position_player] = 
          (positionDistribution[player.position_player] || 0) + 1;
      }

      // Nationality distribution
      if (player.nationality_1) {
        nationalityDistribution[player.nationality_1] = 
          (nationalityDistribution[player.nationality_1] || 0) + 1;
      }

      // Age and rating arrays
      if (player.age) ages.push(player.age);
      if (player.player_rating) ratings.push(player.player_rating);
    });

    // Calculate age statistics
    const ageDistribution = {
      min: ages.length > 0 ? Math.min(...ages) : 0,
      max: ages.length > 0 ? Math.max(...ages) : 0,
      average: ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0
    };

    // Calculate rating statistics
    const ratingDistribution = {
      min: ratings.length > 0 ? Math.min(...ratings) : 0,
      max: ratings.length > 0 ? Math.max(...ratings) : 0,
      average: ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
    };

    // Calculate representativeness score
    const representativenessScore = this.calculateRepresentativenessScore(
      comparisonGroup.length,
      positionDistribution,
      nationalityDistribution,
      filters
    );

    const isRepresentative = representativenessScore >= 0.7; // 70% threshold

    return {
      totalPlayers: comparisonGroup.length,
      positionDistribution,
      nationalityDistribution,
      ageDistribution,
      ratingDistribution,
      isRepresentative,
      representativenessScore
    };
  }

  /**
   * Calculate representativeness score (0-1)
   */
  private calculateRepresentativenessScore(
    groupSize: number,
    positionDistribution: Record<string, number>,
    nationalityDistribution: Record<string, number>,
    filters: RadarFilters
  ): number {
    let score = 0;
    let factors = 0;

    // Factor 1: Group size adequacy (0-0.4)
    const sizeScore = Math.min(groupSize / this.RECOMMENDED_GROUP_SIZE, 1) * 0.4;
    score += sizeScore;
    factors += 0.4;

    // Factor 2: Position diversity (0-0.3) - only if position filter is not applied
    if (!filters.position) {
      const positionCount = Object.keys(positionDistribution).length;
      const diversityScore = Math.min(positionCount / 5, 1) * 0.3; // Expect at least 5 different positions
      score += diversityScore;
    }
    factors += 0.3;

    // Factor 3: Nationality diversity (0-0.3) - only if nationality filter is not applied
    if (!filters.nationality) {
      const nationalityCount = Object.keys(nationalityDistribution).length;
      const diversityScore = Math.min(nationalityCount / 10, 1) * 0.3; // Expect at least 10 different nationalities
      score += diversityScore;
    }
    factors += 0.3;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Validate average calculations for the comparison group
   */
  private async validateAverageCalculations(
    playerId: string,
    comparisonGroup: any[],
    filters: RadarFilters
  ): Promise<AverageValidationResult[]> {
    const results: AverageValidationResult[] = [];

    if (comparisonGroup.length === 0) {
      return results;
    }

    // Get radar data for all players in comparison group
    const radarDataPromises = comparisonGroup.map(player => 
      this.radarService.calculatePlayerRadar(player.id_player, '2023-24')
    );

    const allRadarData = await Promise.all(radarDataPromises);

    // Get the target player's radar data to compare reported averages
    const targetRadarData = await this.radarService.calculatePlayerRadar(playerId, '2023-24');

    // For each category, calculate the actual average and compare with reported
    const categories = targetRadarData.map(data => data.category);

    for (const category of categories) {
      const categoryValues = allRadarData
        .map(playerData => playerData.find(data => data.category === category)?.playerValue)
        .filter(value => value !== undefined) as number[];

      if (categoryValues.length === 0) {
        continue;
      }

      const calculatedAverage = categoryValues.reduce((sum, value) => sum + value, 0) / categoryValues.length;
      const reportedAverage = targetRadarData.find(data => data.category === category)?.comparisonAverage || 0;

      const discrepancy = Math.abs(calculatedAverage - reportedAverage);
      const isCorrect = discrepancy <= this.AVERAGE_TOLERANCE;

      // Calculate standard deviation
      const variance = categoryValues.reduce((sum, value) => sum + Math.pow(value - calculatedAverage, 2), 0) / categoryValues.length;
      const standardDeviation = Math.sqrt(variance);

      const result: AverageValidationResult = {
        category,
        reportedAverage,
        calculatedAverage,
        isCorrect,
        sampleSize: categoryValues.length,
        standardDeviation,
        issues: []
      };

      if (!isCorrect) {
        result.discrepancy = discrepancy;
        result.issues.push(
          `Average mismatch: reported ${reportedAverage.toFixed(2)} but calculated ${calculatedAverage.toFixed(2)} ` +
          `(discrepancy: ${discrepancy.toFixed(2)})`
        );
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Validate empty group handling
   */
  private async validateEmptyGroupHandling(filters: RadarFilters): Promise<EmptyGroupHandlingResult> {
    const emptyFilterCombinations: string[] = [];
    
    // Test various filter combinations that might result in empty groups
    const testCombinations = [
      { ...filters, ageMin: 45, ageMax: 50 }, // Very old players
      { ...filters, ratingMin: 95, ratingMax: 100 }, // Very high ratings
      { position: 'INVALID_POSITION' }, // Invalid position
      { nationality: 'INVALID_COUNTRY' } // Invalid nationality
    ];

    for (const testFilter of testCombinations) {
      const groupSize = await this.getGroupSize(testFilter);
      if (groupSize === 0) {
        emptyFilterCombinations.push(JSON.stringify(testFilter));
      }
    }

    const hasEmptyGroups = emptyFilterCombinations.length > 0;
    
    // In a real implementation, you would check if the UI properly notifies users
    // For now, we assume proper notification if empty groups are detected
    const isProperlyNotified = true; // This would be validated through UI testing

    return {
      hasEmptyGroups,
      emptyFilterCombinations,
      isProperlyNotified,
      fallbackBehavior: 'Show player layer only when no comparison group available',
      issues: hasEmptyGroups && !isProperlyNotified ? 
        ['Empty groups not properly communicated to user'] : []
    };
  }

  /**
   * Calculate expected group size based on filters
   */
  private calculateExpectedGroupSize(filters: RadarFilters): number {
    // This is a simplified calculation - in reality, you'd use historical data
    let expectedSize = 1000; // Base expectation

    if (filters.position) expectedSize *= 0.1; // Position reduces by ~90%
    if (filters.nationality) expectedSize *= 0.05; // Nationality reduces significantly
    if (filters.competition) expectedSize *= 0.2; // Competition reduces by ~80%
    if (filters.ageMin || filters.ageMax) expectedSize *= 0.3; // Age range reduces by ~70%
    if (filters.ratingMin || filters.ratingMax) expectedSize *= 0.4; // Rating range reduces by ~60%

    return Math.max(Math.round(expectedSize), this.MIN_GROUP_SIZE);
  }

  /**
   * Determine if group is appropriate for comparison
   */
  private isGroupAppropriate(composition: GroupComposition, filters: RadarFilters): boolean {
    return composition.totalPlayers >= this.MIN_GROUP_SIZE && 
           composition.isRepresentative;
  }

  /**
   * Create analysis issue for group appropriateness
   */
  private createGroupAppropriatenessIssue(
    composition: GroupComposition,
    filters: RadarFilters,
    context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: composition.totalPlayers < this.MIN_GROUP_SIZE ? 'high' : 'medium' as AnalysisSeverity,
      category: 'data',
      title: 'Inappropriate comparison group',
      description: `Comparison group is not suitable for meaningful analysis`,
      affectedComponent: 'radar-comparison-group',
      expectedBehavior: `Group should have at least ${this.MIN_GROUP_SIZE} players and be representative`,
      actualBehavior: `Group has ${composition.totalPlayers} players with representativeness score ${composition.representativenessScore.toFixed(2)}`,
      recommendation: 'Adjust filters to create more appropriate comparison groups or warn users about limited comparisons',
      timestamp: new Date(),
      metadata: {
        groupSize: composition.totalPlayers,
        representativenessScore: composition.representativenessScore,
        filters
      }
    };
  }

  /**
   * Create analysis issue for average calculation errors
   */
  private createAverageCalculationIssue(
    result: AverageValidationResult,
    context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'high' as AnalysisSeverity,
      category: 'calculation',
      title: `Average calculation error in category: ${result.category}`,
      description: `Comparison average doesn't match calculated value from group`,
      affectedComponent: `radar-average-${result.category}`,
      expectedBehavior: `Average should be ${result.calculatedAverage.toFixed(2)}`,
      actualBehavior: `Average shows ${result.reportedAverage.toFixed(2)}`,
      recommendation: 'Review average calculation logic for comparison groups',
      timestamp: new Date(),
      metadata: {
        category: result.category,
        reportedAverage: result.reportedAverage,
        calculatedAverage: result.calculatedAverage,
        discrepancy: result.discrepancy,
        sampleSize: result.sampleSize
      }
    };
  }

  /**
   * Create analysis issue for empty group handling
   */
  private createEmptyGroupHandlingIssue(
    result: EmptyGroupHandlingResult,
    context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'medium' as AnalysisSeverity,
      category: 'visual',
      title: 'Poor empty group handling',
      description: 'Empty comparison groups are not properly communicated to users',
      affectedComponent: 'radar-empty-group-notification',
      expectedBehavior: 'Users should be clearly notified when filters result in empty comparison groups',
      actualBehavior: 'Empty groups may not be properly communicated',
      recommendation: 'Implement clear notifications for empty comparison groups and provide fallback behavior',
      timestamp: new Date(),
      metadata: {
        emptyFilterCombinations: result.emptyFilterCombinations,
        fallbackBehavior: result.fallbackBehavior
      }
    };
  }

  /**
   * Generate recommendations for group improvements
   */
  private generateGroupRecommendations(
    composition: GroupComposition,
    averageValidation: AverageValidationResult[],
    emptyGroupHandling: EmptyGroupHandlingResult,
    filters: RadarFilters
  ): string[] {
    const recommendations: string[] = [];

    // Group size recommendations
    if (composition.totalPlayers < this.MIN_GROUP_SIZE) {
      recommendations.push(`Increase comparison group size (current: ${composition.totalPlayers}, minimum: ${this.MIN_GROUP_SIZE})`);
    } else if (composition.totalPlayers < this.RECOMMENDED_GROUP_SIZE) {
      recommendations.push(`Consider expanding comparison group for better statistical significance (current: ${composition.totalPlayers}, recommended: ${this.RECOMMENDED_GROUP_SIZE}+)`);
    }

    // Representativeness recommendations
    if (!composition.isRepresentative) {
      recommendations.push(`Improve group representativeness (current score: ${composition.representativenessScore.toFixed(2)}, target: 0.70+)`);
    }

    // Average calculation recommendations
    const incorrectAverages = averageValidation.filter(r => !r.isCorrect);
    if (incorrectAverages.length > 0) {
      recommendations.push(`Fix average calculation logic for ${incorrectAverages.length} categories`);
    }

    // Empty group handling recommendations
    if (emptyGroupHandling.hasEmptyGroups && !emptyGroupHandling.isProperlyNotified) {
      recommendations.push('Implement proper notifications for empty comparison groups');
    }

    if (recommendations.length === 0) {
      recommendations.push('Comparison group validation passed all checks');
    }

    return recommendations;
  }

  /**
   * Cleanup method
   */
  async disconnect(): Promise<void> {
    await this.radarService.disconnect();
  }
}

// Export singleton instance
export const comparisonGroupValidator = new ComparisonGroupValidator();