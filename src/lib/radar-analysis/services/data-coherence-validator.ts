/**
 * DataCoherenceValidator - Service for validating data coherence across radar views
 * 
 * This service validates that radar data is consistent with other player views,
 * verifies percentile consistency with rankings, and validates data completeness statistics.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { connectionPool } from '../../db/connection-pool';
import { PlayerService } from '../../services/player-service';
import { RadarCalculationService, RadarCategoryData, RadarFilters } from '../../services/RadarCalculationService';
import { IDataCoherenceValidator } from '../interfaces';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  AnalysisIssue, 
  AnalysisContext, 
  ValidationResult,
  AnalysisSeverity
} from '../types';


export interface RadarViewComparisonResult {
  category: string;
  radarValue: number;
  profileValue?: number;
  isConsistent: boolean;
  discrepancy?: number;
  tolerance: number;
  sourceView: string;
  issues: string[];
}

export interface PercentileConsistencyResult {
  category: string;
  radarPercentile: number;
  calculatedPercentile: number;
  rank: number;
  totalPlayers: number;
  isConsistent: boolean;
  discrepancy?: number;
  comparisonGroup: string[];
  issues: string[];
}

export interface CompletenessValidationResult {
  category: string;
  reportedCompleteness: number;
  actualCompleteness: number;
  isAccurate: boolean;
  missingAttributes: string[];
  availableAttributes: string[];
  discrepancy?: number;
  issues: string[];
}

export interface DataCoherenceValidationResult {
  playerId: string;
  timestamp: Date;
  overallCoherence: number;
  viewComparisons: RadarViewComparisonResult[];
  percentileConsistency: PercentileConsistencyResult[];
  completenessValidation: CompletenessValidationResult[];
  issues: AnalysisIssue[];
  recommendations: string[];
}

export class DataCoherenceValidator implements IDataCoherenceValidator {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  // Tolerance levels for different types of comparisons
  private readonly PERCENTILE_TOLERANCE = 5; // 5% tolerance for percentile differences
  private readonly VALUE_TOLERANCE = 2; // 2 point tolerance for value differences (0-100 scale)
  private readonly COMPLETENESS_TOLERANCE = 1; // 1% tolerance for completeness differences

  // Category mappings (copied from RadarCalculationService for validation)
  private readonly categoryMappings: Record<string, any[]> = {
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

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Validates data completeness across radar categories
   */
  async validateDataCompleteness(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_data_completeness', _playerId: context.playerId }
      });

      // Get player data to validate completeness calculations
      const player = await this.getPlayerData(context.playerId);
      if (!player) {
        throw new Error(`Player not found: ${context.playerId}`);
      }

      let allValid = true;
      const issues: string[] = [];

      for (const categoryData of radarData) {
        // Calculate actual completeness based on available attributes
        const actualCompleteness = await this.calculateActualCompleteness(
          categoryData.category,
          player.atributos,
          player.playerStats3m
        );

        const reportedCompleteness = categoryData.dataCompleteness;
        const discrepancy = Math.abs(actualCompleteness - reportedCompleteness);

        if (discrepancy > this.COMPLETENESS_TOLERANCE) {
          allValid = false;
          issues.push(
            `Category ${categoryData.category}: reported completeness ${reportedCompleteness}% ` +
            `but actual completeness is ${actualCompleteness}% (discrepancy: ${discrepancy}%)`
          );
        }
      }

      const result: ValidationResult = allValid ? 'pass' : 'fail';

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logValidationResult({
        ...context,
        metadata: { 
          operation: 'validate_data_completeness', 
          duration,
          result,
          issuesFound: issues.length
        }
      }, result);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_data_completeness', duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates data consistency across different views
   */
  async validateDataConsistency(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_data_consistency', _playerId: context.playerId }
      });

      // Compare radar values with other player views
      const viewComparisons = await this.compareWithOtherViews(context.playerId, radarData);
      
      // Check if all comparisons are consistent
      const allConsistent = viewComparisons.every(comparison => comparison.isConsistent);
      const result: ValidationResult = allConsistent ? 'pass' : 'fail';

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logValidationResult({
        ...context,
        metadata: { 
          operation: 'validate_data_consistency', 
          duration,
          result,
          inconsistentViews: viewComparisons.filter(c => !c.isConsistent).length
        }
      }, result);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_data_consistency', duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates calculation accuracy of radar values
   */
  async validateCalculationAccuracy(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_calculation_accuracy', _playerId: context.playerId }
      });

      // Validate percentile consistency
      const percentileResults = await this.validatePercentileConsistency(
        context.playerId, 
        radarData,
        context.filters
      );

      // Check if all percentiles are consistent
      const allAccurate = percentileResults.every(result => result.isConsistent);
      const result: ValidationResult = allAccurate ? 'pass' : 'fail';

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logValidationResult({
        ...context,
        metadata: { 
          operation: 'validate_calculation_accuracy', 
          duration,
          result,
          inaccurateCalculations: percentileResults.filter(r => !r.isConsistent).length
        }
      }, result);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_calculation_accuracy', duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates source data integrity
   */
  async validateSourceData(
    _playerId: string, 
    __context: AnalysisContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_source_data', playerId }
      });

      // Get player data and validate integrity
      const player = await this.getPlayerData(playerId);
      if (!player) {
        return 'fail';
      }

      let isValid = true;
      const issues: string[] = [];

      // Validate atributos data
      if (!player.atributos) {
        isValid = false;
        issues.push('Player has no atributos data');
      } else {
        // Check for required FMI attributes
        const requiredFMIAttributes = [
          'marking_fmi', 'positioning_fmi', 'heading_fmi', 'jumping_fmi',
          'dribbling_fmi', 'agility_fmi', 'balance_fmi', 'first_touch_fmi',
          'tackling_fmi', 'anticipation_fmi', 'pace_fmi', 'acceleration_fmi',
          'stamina_fmi', 'work_rate_fmi', 'crossing_fmi', 'corners_fmi',
          'free_kick_taking_fmi', 'passing_fmi', 'technique_fmi', 'composure_fmi',
          'vision_fmi', 'finishing_fmi', 'off_the_ball_fmi'
        ];

        for (const attr of requiredFMIAttributes) {
          const value = player.atributos[attr];
          if (value === null || value === undefined) {
            issues.push(`Missing FMI attribute: ${attr}`);
          } else if (typeof value !== 'number' || value < 1 || value > 20) {
            isValid = false;
            issues.push(`Invalid FMI attribute value for ${attr}: ${value} (should be 1-20)`);
          }
        }
      }

      // Validate player stats data
      if (!player.playerStats3m) {
        issues.push('Player has no playerStats3m data');
      } else {
        // Check for required statistical attributes
        const requiredStatAttributes = [
          'interceptions_p90_3m', 'accurate_passes_percent_3m',
          'forward_passes_p90_3m', 'goals_p90_3m'
        ];

        for (const attr of requiredStatAttributes) {
          const value = player.playerStats3m[attr];
          if (value !== null && value !== undefined) {
            if (typeof value !== 'number' || value < 0) {
              isValid = false;
              issues.push(`Invalid stat attribute value for ${attr}: ${value} (should be >= 0)`);
            }
          }
        }
      }

      const result: ValidationResult = isValid ? 'pass' : 'fail';

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logValidationResult({
        ...context,
        metadata: { 
          operation: 'validate_source_data', 
          duration,
          result,
          issuesFound: issues.length
        }
      }, result);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_source_data', duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Comprehensive data coherence validation
   */
  async validateDataCoherence(
    _playerId: string,
    __context: AnalysisContext,
    _period: string = '2023-24'
  ): Promise<DataCoherenceValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_data_coherence', playerId }
      });

      // Get radar data for the player
      const radarData = await this.radarService.calculatePlayerRadar(playerId, period);

      // Perform all validation checks
      const [
        viewComparisons,
        percentileConsistency,
        completenessValidation
      ] = await Promise.all([
        this.compareWithOtherViews(playerId, radarData),
        this.validatePercentileConsistency(playerId, radarData, context.filters),
        this.validateCompletenessAccuracy(playerId, radarData)
      ]);

      // Generate issues for inconsistencies
      const issues: AnalysisIssue[] = [];

      // Add issues for view inconsistencies
      viewComparisons.forEach(comparison => {
        if (!comparison.isConsistent) {
          issues.push(this.createViewInconsistencyIssue(comparison, context));
        }
      });

      // Add issues for percentile inconsistencies
      percentileConsistency.forEach(result => {
        if (!result.isConsistent) {
          issues.push(this.createPercentileInconsistencyIssue(result, context));
        }
      });

      // Add issues for completeness inaccuracies
      completenessValidation.forEach(result => {
        if (!result.isAccurate) {
          issues.push(this.createCompletenessIssue(result, context));
        }
      });

      // Calculate overall coherence score
      const totalChecks = viewComparisons.length + percentileConsistency.length + completenessValidation.length;
      const passedChecks = 
        viewComparisons.filter(c => c.isConsistent).length +
        percentileConsistency.filter(r => r.isConsistent).length +
        completenessValidation.filter(r => r.isAccurate).length;

      const overallCoherence = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

      // Generate recommendations
      const recommendations = this.generateCoherenceRecommendations(
        viewComparisons,
        percentileConsistency,
        completenessValidation
      );

      const result: DataCoherenceValidationResult = {
        playerId,
        timestamp: new Date(),
        overallCoherence: Math.round(overallCoherence * 100) / 100,
        viewComparisons,
        percentileConsistency,
        completenessValidation,
        issues,
        recommendations
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'validate_data_coherence', 
          playerId, 
          duration,
          overallCoherence,
          issuesFound: issues.length
        }
      }, result as any);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_data_coherence', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Compare radar values with other player views
   */
  private async compareWithOtherViews(
    _playerId: string,
    _radarData: RadarCategoryData[]
  ): Promise<RadarViewComparisonResult[]> {
    const results: RadarViewComparisonResult[] = [];

    // Get player data from other views
    const player = await PlayerService.getPlayerById(playerId);
    if (!player) {
      return results;
    }

    // For each radar category, compare with equivalent data in other views
    for (const categoryData of radarData) {
      const comparison: RadarViewComparisonResult = {
        category: categoryData.category,
        radarValue: categoryData.playerValue,
        isConsistent: true,
        tolerance: this.VALUE_TOLERANCE,
        sourceView: 'player-profile',
        issues: []
      };

      // Compare with player profile data (if available)
      // Note: This is a simplified comparison - in a real implementation,
      // you would map radar categories to specific profile fields
      if (player.player_rating) {
        // Example: Compare overall radar performance with player rating
        const avgRadarValue = radarData.reduce((sum, data) => sum + data.playerValue, 0) / radarData.length;
        const normalizedRating = player.player_rating; // Assuming rating is already 0-100

        const discrepancy = Math.abs(avgRadarValue - normalizedRating);
        
        if (discrepancy > this.VALUE_TOLERANCE * 5) { // More tolerance for overall comparison
          comparison.isConsistent = false;
          comparison.profileValue = normalizedRating;
          comparison.discrepancy = discrepancy;
          comparison.issues.push(
            `Radar average (${avgRadarValue.toFixed(1)}) differs significantly from player rating (${normalizedRating})`
          );
        }
      }

      results.push(comparison);
    }

    return results;
  }

  /**
   * Validate percentile consistency with rankings
   */
  private async validatePercentileConsistency(
    _playerId: string,
    _radarData: RadarCategoryData[],
    filters?: RadarFilters
  ): Promise<PercentileConsistencyResult[]> {
    const results: PercentileConsistencyResult[] = [];

    for (const categoryData of radarData) {
      if (categoryData.percentile === undefined || categoryData.rank === undefined) {
        continue;
      }

      // Calculate expected percentile based on rank and total players
      const totalPlayers = categoryData.totalPlayers || 1;
      const rank = categoryData.rank;
      const expectedPercentile = ((totalPlayers - rank) / totalPlayers) * 100;

      const discrepancy = Math.abs(categoryData.percentile - expectedPercentile);
      const isConsistent = discrepancy <= this.PERCENTILE_TOLERANCE;

      const result: PercentileConsistencyResult = {
        category: categoryData.category,
        radarPercentile: categoryData.percentile,
        calculatedPercentile: expectedPercentile,
        rank,
        totalPlayers,
        isConsistent,
        comparisonGroup: [], // Would be populated with actual comparison group IDs
        issues: []
      };

      if (!isConsistent) {
        result.discrepancy = discrepancy;
        result.issues.push(
          `Percentile mismatch: radar shows ${categoryData.percentile}% but rank ${rank}/${totalPlayers} ` +
          `should be ${expectedPercentile.toFixed(1)}% (discrepancy: ${discrepancy.toFixed(1)}%)`
        );
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Validate completeness accuracy
   */
  private async validateCompletenessAccuracy(
    _playerId: string,
    _radarData: RadarCategoryData[]
  ): Promise<CompletenessValidationResult[]> {
    const results: CompletenessValidationResult[] = [];

    // Get player data to calculate actual completeness
    const player = await this.getPlayerData(playerId);
    if (!player) {
      return results;
    }

    for (const categoryData of radarData) {
      const actualCompleteness = await this.calculateActualCompleteness(
        categoryData.category,
        player.atributos,
        player.playerStats3m
      );

      const reportedCompleteness = categoryData.dataCompleteness;
      const discrepancy = Math.abs(actualCompleteness - reportedCompleteness);
      const isAccurate = discrepancy <= this.COMPLETENESS_TOLERANCE;

      const result: CompletenessValidationResult = {
        category: categoryData.category,
        reportedCompleteness,
        actualCompleteness,
        isAccurate,
        missingAttributes: [],
        availableAttributes: categoryData.sourceAttributes,
        issues: []
      };

      if (!isAccurate) {
        result.discrepancy = discrepancy;
        result.issues.push(
          `Completeness mismatch: reported ${reportedCompleteness}% but actual is ${actualCompleteness}% ` +
          `(discrepancy: ${discrepancy.toFixed(1)}%)`
        );
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Get category mappings
   */
  private getCategoryMappings(): Record<string, any[]> {
    return this.categoryMappings;
  }

  /**
   * Calculate actual completeness for a category
   */
  private async calculateActualCompleteness(
    category: string,
    atributos: unknown,
    playerStats: unknown): Promise<number> {
    // Get category mapping - using the same mappings as RadarCalculationService
    const categoryMappings = this.getCategoryMappings();
    const mapping = categoryMappings[category];
    
    if (!mapping) {
      return 0;
    }

    let availableAttributes = 0;
    const totalAttributes = mapping.length;

    for (const { attribute, isStatistic } of mapping) {
      let value: number | null = null;

      if (isStatistic && playerStats) {
        value = playerStats[attribute];
      } else if (!isStatistic && atributos) {
        value = atributos[attribute];
      }

      if (value !== null && value !== undefined && !isNaN(value)) {
        availableAttributes++;
      }
    }

    return totalAttributes > 0 ? (availableAttributes / totalAttributes) * 100 : 0;
  }

  /**
   * Get player data with attributes and statistics
   */
  private async getPlayerData(_playerId: string) {
    return await this.prisma.jugador.findUnique({
      where: { id___player: playerId },
      include: {
        atributos: true,
        playerStats3m: true
      }
    });
  }

  /**
   * Create analysis issue for view inconsistency
   */
  private createViewInconsistencyIssue(
    comparison: RadarViewComparisonResult,
    __context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'medium' as AnalysisSeverity,
      category: 'data',
      title: `View inconsistency in category: ${comparison.category}`,
      description: `Radar value differs from ${comparison.sourceView} data`,
      affectedComponent: `radar-view-${comparison.category}`,
      expectedBehavior: 'Radar values should be consistent with other player views',
      actualBehavior: `Discrepancy of ${comparison.discrepancy?.toFixed(1)} points detected`,
      recommendation: 'Review data synchronization between radar and profile views',
      timestamp: new Date(),
      metadata: {
        category: comparison.category,
        radarValue: comparison.radarValue,
        profileValue: comparison.profileValue,
        discrepancy: comparison.discrepancy
      }
    };
  }

  /**
   * Create analysis issue for percentile inconsistency
   */
  private createPercentileInconsistencyIssue(
    result: PercentileConsistencyResult,
    __context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'high' as AnalysisSeverity,
      category: 'calculation',
      title: `Percentile inconsistency in category: ${result.category}`,
      description: `Percentile calculation doesn't match ranking position`,
      affectedComponent: `radar-percentile-${result.category}`,
      expectedBehavior: `Percentile should be ${result.calculatedPercentile.toFixed(1)}% based on rank`,
      actualBehavior: `Percentile shows ${result.radarPercentile}%`,
      recommendation: 'Review percentile calculation algorithm and ranking logic',
      timestamp: new Date(),
      metadata: {
        category: result.category,
        radarPercentile: result.radarPercentile,
        calculatedPercentile: result.calculatedPercentile,
        rank: result.rank,
        totalPlayers: result.totalPlayers,
        discrepancy: result.discrepancy
      }
    };
  }

  /**
   * Create analysis issue for completeness inaccuracy
   */
  private createCompletenessIssue(
    result: CompletenessValidationResult,
    __context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'low' as AnalysisSeverity,
      category: 'data',
      title: `Completeness inaccuracy in category: ${result.category}`,
      description: `Reported completeness doesn't match actual data availability`,
      affectedComponent: `radar-completeness-${result.category}`,
      expectedBehavior: `Completeness should be ${result.actualCompleteness.toFixed(1)}%`,
      actualBehavior: `Completeness shows ${result.reportedCompleteness}%`,
      recommendation: 'Review completeness calculation logic',
      timestamp: new Date(),
      metadata: {
        category: result.category,
        reportedCompleteness: result.reportedCompleteness,
        actualCompleteness: result.actualCompleteness,
        discrepancy: result.discrepancy
      }
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateCoherenceRecommendations(
    viewComparisons: RadarViewComparisonResult[],
    percentileConsistency: PercentileConsistencyResult[],
    completenessValidation: CompletenessValidationResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for view inconsistencies
    const inconsistentViews = viewComparisons.filter(c => !c.isConsistent);
    if (inconsistentViews.length > 0) {
      recommendations.push(
        `Review data synchronization for ${inconsistentViews.length} categories with view inconsistencies`
      );
    }

    // Check for percentile issues
    const percentileIssues = percentileConsistency.filter(r => !r.isConsistent);
    if (percentileIssues.length > 0) {
      recommendations.push(
        `Fix percentile calculation logic for ${percentileIssues.length} categories with ranking inconsistencies`
      );
    }

    // Check for completeness issues
    const completenessIssues = completenessValidation.filter(r => !r.isAccurate);
    if (completenessIssues.length > 0) {
      recommendations.push(
        `Update completeness calculation for ${completenessIssues.length} categories with inaccurate reporting`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All data coherence checks passed successfully');
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
export const dataCoherenceValidator = new DataCoherenceValidator();