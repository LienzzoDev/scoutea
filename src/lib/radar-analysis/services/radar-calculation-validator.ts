/**
 * RadarCalculationValidator - Service for validating radar calculation accuracy
 * 
 * This service validates the mathematical formulas used in the 9 tactical radar categories,
 * verifies normalization of FMI attributes (1-20) and statistics, and ensures calculation accuracy.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { connectionPool } from '../../db/connection-pool';
import { RadarCalculationService, RadarCategoryData, AttributeWeight } from '../../services/RadarCalculationService';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  AnalysisIssue, 
  AnalysisContext,
  CalculationStep,
  AnalysisSeverity
} from '../types';


export interface CategoryCalculationReport {
  category: string;
  expectedValue: number;
  actualValue: number;
  isCorrect: boolean;
  sourceAttributes: string[];
  calculationSteps: CalculationStep[];
  issues: string[];
  dataCompleteness: number;
  normalizedValues: Record<string, number>;
}

export interface NormalizationValidationReport {
  attribute: string;
  rawValue: number;
  normalizedValue: number;
  expectedNormalizedValue: number;
  isCorrect: boolean;
  normalizationType: 'fmi' | 'statistic';
  validationRange: { min: number; max: number };
  issues: string[];
}

export interface CalculationValidationResult {
  playerId: string;
  timestamp: Date;
  overallAccuracy: number;
  categoryReports: CategoryCalculationReport[];
  normalizationReports: NormalizationValidationReport[];
  issues: AnalysisIssue[];
  recommendations: string[];
}

export class RadarCalculationValidator {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  // Expected ranges for FMI attributes (1-20 scale)
  private readonly FMI_RANGE = { min: 1, max: 20 };

  // Expected ranges for statistical values (realistic ranges per 90 minutes)
  private readonly STAT_RANGES: Record<string, { min: number; max: number }> = {
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

  // Category mappings (copied from RadarCalculationService for validation)
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

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Validates all radar calculations for a specific player
   */
  async validatePlayerCalculations(
    _playerId: string,
    __context: AnalysisContext,
    _period: string = '2023-24'
  ): Promise<CalculationValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_calculations', playerId }
      });

      // Get player data
      const player = await this.getPlayerData(playerId);
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }

      if (!player.atributos) {
        throw new Error(`Player ${playerId} has no atributos data`);
      }

      // Get actual radar data from service
      const actualRadarData = await this.radarService.calculatePlayerRadar(playerId, period);

      // Validate each category calculation
      const categoryReports: CategoryCalculationReport[] = [];
      const normalizationReports: NormalizationValidationReport[] = [];
      const issues: AnalysisIssue[] = [];

      for (const [categoryKey, mapping] of Object.entries(this.categoryMappings)) {
        const report = await this.validateCategoryCalculation(
          categoryKey,
          player.atributos,
          player.playerStats3m,
          mapping,
          actualRadarData,
          context
        );

        categoryReports.push(report);

        // Validate normalization for each attribute in this category
        for (const { attribute, isStatistic } of mapping) {
          const normReport = await this.validateAttributeNormalization(
            attribute,
            player.atributos,
            player.playerStats3m,
            isStatistic || false,
            context
          );
          
          if (normReport) {
            normalizationReports.push(normReport);
          }
        }

        // Generate issues for calculation errors
        if (!report.isCorrect) {
          issues.push(this.createCalculationIssue(report, context));
        }

        // Add issues for each calculation step that failed
        report.issues.forEach(issueDescription => {
          issues.push({
            id: uuidv4(),
            severity: 'high' as AnalysisSeverity,
            category: 'calculation',
            title: `Calculation error in ${report.category}`,
            description: issueDescription,
            affectedComponent: `radar-calculation-${categoryKey}`,
            expectedBehavior: 'Calculation should produce accurate results',
            actualBehavior: issueDescription,
            recommendation: 'Review calculation formula and input data',
            timestamp: new Date(),
            metadata: { category: categoryKey, playerId }
          });
        });
      }

      // Add issues for normalization errors
      normalizationReports.forEach(report => {
        if (!report.isCorrect) {
          issues.push(this.createNormalizationIssue(report, context));
        }
      });

      // Calculate overall accuracy
      const correctCalculations = categoryReports.filter(r => r.isCorrect).length;
      const overallAccuracy = (correctCalculations / categoryReports.length) * 100;

      // Generate recommendations
      const recommendations = this.generateRecommendations(categoryReports, normalizationReports);

      const result: CalculationValidationResult = {
        playerId,
        timestamp: new Date(),
        overallAccuracy,
        categoryReports,
        normalizationReports,
        issues,
        recommendations
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'validate_calculations', 
          playerId, 
          duration,
          overallAccuracy,
          issuesFound: issues.length
        }
      }, result as any);

      return result;

    } catch (_error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_calculations', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates calculation for a specific category
   */
  private async validateCategoryCalculation(
    categoryKey: string,
    atributos: unknown,
    playerStats: unknown,
    mapping: AttributeWeight[],
    actualRadarData: RadarCategoryData[],
    __context: AnalysisContext
  ): Promise<CategoryCalculationReport> {
    const calculationSteps: CalculationStep[] = [];
    const issues: string[] = [];
    const normalizedValues: Record<string, number> = {};
    
    let weightedSum = 0;
    let totalWeight = 0;
    let availableAttributes = 0;
    const sourceAttributes: string[] = [];

    // Step 1: Collect and validate input data
    calculationSteps.push({
      step: 1,
      operation: 'collect_input_data',
      input: { categoryKey, mappingLength: mapping.length },
      output: { atributosAvailable: !!atributos, playerStatsAvailable: !!playerStats },
      notes: 'Collecting input data for calculation'
    });

    // Step 2: Process each attribute in the mapping
    for (let i = 0; i < mapping.length; i++) {
      const { attribute, weight, isStatistic } = mapping[i];
      let value: number | null = null;

      // Get raw value
      if (isStatistic && playerStats) {
        value = playerStats[attribute];
      } else if (!isStatistic && atributos) {
        value = atributos[attribute];
      }

      calculationSteps.push({
        step: 2 + i,
        operation: `process_attribute_${attribute}`,
        input: { attribute, weight, isStatistic, rawValue: value },
        output: { valueFound: value !== null && value !== undefined },
        notes: `Processing ${isStatistic ? 'statistic' : 'FMI'} attribute: ${attribute}`
      });

      if (value !== null && value !== undefined && !isNaN(value)) {
        // Normalize the value
        const normalizedValue = this.calculateNormalizedValue(attribute, value, isStatistic);
        normalizedValues[attribute] = normalizedValue;
        
        // Validate normalization
        if (normalizedValue < 0 || normalizedValue > 1) {
          issues.push(`Normalized value for ${attribute} is out of range: ${normalizedValue}`);
        }

        weightedSum += normalizedValue * weight;
        totalWeight += weight;
        availableAttributes++;
        sourceAttributes.push(attribute);

        calculationSteps.push({
          step: 2 + mapping.length + i,
          operation: `normalize_${attribute}`,
          input: { rawValue: value, weight },
          output: { normalizedValue, weightedContribution: normalizedValue * weight },
          formula: `normalized = (${value} - min) / (max - min) * ${weight}`,
          notes: `Normalized and weighted ${attribute}`
        });
      } else {
        issues.push(`Missing or invalid value for attribute: ${attribute}`);
      }
    }

    // Step 3: Calculate final value
    const finalValue = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    const completeness = (availableAttributes / mapping.length) * 100;

    calculationSteps.push({
      step: 2 + mapping.length * 2,
      operation: 'calculate_final_value',
      input: { weightedSum, totalWeight },
      output: { finalValue, completeness },
      formula: `finalValue = ${weightedSum} / ${totalWeight} = ${finalValue}`,
      notes: 'Calculated final category value'
    });

    // Step 4: Compare with actual radar data
    const categoryLabels = this.radarService.getCategoryLabels();
    const categoryLabel = categoryLabels[categoryKey] || categoryKey;
    const actualData = actualRadarData.find(data => data.category === categoryLabel);
    
    // Convert to 0-100 scale and round to 2 decimal places (same as RadarCalculationService)
    const expectedValue = Math.round(finalValue * 100 * 100) / 100;
    const actualValue = actualData?.playerValue || 0;
    const tolerance = 0.01; // Allow small floating point differences
    const isCorrect = Math.abs(expectedValue - actualValue) <= tolerance;

    if (!isCorrect) {
      issues.push(`Expected value ${expectedValue} but got ${actualValue} (difference: ${Math.abs(expectedValue - actualValue)})`);
    }

    calculationSteps.push({
      step: 2 + mapping.length * 2 + 1,
      operation: 'compare_with_actual',
      input: { expectedValue, actualValue },
      output: { isCorrect, difference: Math.abs(expectedValue - actualValue) },
      notes: 'Compared calculated value with actual radar data'
    });

    return {
      category: categoryLabel,
      expectedValue,
      actualValue,
      isCorrect,
      sourceAttributes,
      calculationSteps,
      issues,
      dataCompleteness: Math.round(completeness * 100) / 100,
      normalizedValues
    };
  }

  /**
   * Validates normalization for a specific attribute
   */
  private async validateAttributeNormalization(
    attribute: string,
    atributos: unknown,
    playerStats: unknown,
    isStatistic: boolean,
    __context: AnalysisContext
  ): Promise<NormalizationValidationReport | null> {
    let rawValue: number | null = null;

    // Get raw value
    if (isStatistic && playerStats) {
      rawValue = playerStats[attribute];
    } else if (!isStatistic && atributos) {
      rawValue = atributos[attribute];
    }

    if (rawValue === null || rawValue === undefined || isNaN(rawValue)) {
      return null; // Skip validation for missing values
    }

    // Calculate normalized value using our implementation
    const normalizedValue = this.calculateNormalizedValue(attribute, rawValue, isStatistic);

    // Calculate expected normalized value using the correct formula
    const expectedNormalizedValue = this.calculateExpectedNormalizedValue(attribute, rawValue, isStatistic);

    const tolerance = 0.001; // Allow small floating point differences
    const isCorrect = Math.abs(normalizedValue - expectedNormalizedValue) <= tolerance;

    const validationRange = isStatistic 
      ? (this.STAT_RANGES[attribute] || { min: 0, max: 100 })
      : this.FMI_RANGE;

    const issues: string[] = [];
    
    if (!isCorrect) {
      issues.push(`Normalization mismatch: expected ${expectedNormalizedValue}, got ${normalizedValue}`);
    }

    if (normalizedValue < 0 || normalizedValue > 1) {
      issues.push(`Normalized value ${normalizedValue} is outside valid range [0, 1]`);
    }

    if (isStatistic) {
      const range = this.STAT_RANGES[attribute];
      if (range && (rawValue < range.min || rawValue > range.max)) {
        issues.push(`Raw statistic value ${rawValue} is outside expected range [${range.min}, ${range.max}]`);
      }
    } else {
      if (rawValue < this.FMI_RANGE.min || rawValue > this.FMI_RANGE.max) {
        issues.push(`Raw FMI value ${rawValue} is outside expected range [${this.FMI_RANGE.min}, ${this.FMI_RANGE.max}]`);
      }
    }

    return {
      attribute,
      rawValue,
      normalizedValue,
      expectedNormalizedValue,
      isCorrect,
      normalizationType: isStatistic ? 'statistic' : 'fmi',
      validationRange,
      issues
    };
  }

  /**
   * Calculate normalized value using the same logic as RadarCalculationService
   */
  private calculateNormalizedValue(attribute: string, value: number, isStatistic: boolean): number {
    if (isStatistic) {
      return this.normalizeStatisticValue(attribute, value);
    } else {
      return this.normalizeAtributoValue(value);
    }
  }

  /**
   * Calculate expected normalized value for validation
   */
  private calculateExpectedNormalizedValue(attribute: string, value: number, isStatistic: boolean): number {
    if (isStatistic) {
      const range = this.STAT_RANGES[attribute];
      if (!range) {
        // Default normalization for unknown stats
        return Math.max(0, Math.min(1, value / 100));
      }

      // Clamp value to expected range
      const clampedValue = Math.max(range.min, Math.min(range.max, value));
      
      // Normalize to 0-1 scale
      return (clampedValue - range.min) / (range.max - range.min);
    } else {
      // FMI attributes are on a 1-20 scale
      const clampedValue = Math.max(this.FMI_RANGE.min, Math.min(this.FMI_RANGE.max, value));
      return (clampedValue - this.FMI_RANGE.min) / (this.FMI_RANGE.max - this.FMI_RANGE.min);
    }
  }

  /**
   * Normalize FMI attribute values (1-20 scale)
   */
  private normalizeAtributoValue(value: number): number {
    const clampedValue = Math.max(this.FMI_RANGE.min, Math.min(this.FMI_RANGE.max, value));
    return (clampedValue - this.FMI_RANGE.min) / (this.FMI_RANGE.max - this.FMI_RANGE.min);
  }

  /**
   * Normalize statistical values based on realistic ranges
   */
  private normalizeStatisticValue(attribute: string, value: number): number {
    const range = this.STAT_RANGES[attribute];
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
   * Create an analysis issue for calculation errors
   */
  private createCalculationIssue(report: CategoryCalculationReport, __context: AnalysisContext): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'critical' as AnalysisSeverity,
      category: 'calculation',
      title: `Calculation error in category: ${report.category}`,
      description: `Expected value ${report.expectedValue} but calculated ${report.actualValue}`,
      affectedComponent: `radar-calculation-${report.category}`,
      expectedBehavior: `Category should calculate to ${report.expectedValue}`,
      actualBehavior: `Category calculated to ${report.actualValue}`,
      recommendation: 'Review calculation formula and normalization logic',
      reproductionSteps: [
        `Load player ${context.playerId}`,
        `Calculate radar for category ${report.category}`,
        `Compare expected vs actual values`
      ],
      timestamp: new Date(),
      metadata: {
        category: report.category,
        expectedValue: report.expectedValue,
        actualValue: report.actualValue,
        dataCompleteness: report.dataCompleteness,
        sourceAttributes: report.sourceAttributes
      }
    };
  }

  /**
   * Create an analysis issue for normalization errors
   */
  private createNormalizationIssue(report: NormalizationValidationReport, __context: AnalysisContext): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'high' as AnalysisSeverity,
      category: 'calculation',
      title: `Normalization error for attribute: ${report.attribute}`,
      description: `Expected normalized value ${report.expectedNormalizedValue} but got ${report.normalizedValue}`,
      affectedComponent: `attribute-normalization-${report.attribute}`,
      expectedBehavior: `Attribute should normalize to ${report.expectedNormalizedValue}`,
      actualBehavior: `Attribute normalized to ${report.normalizedValue}`,
      recommendation: 'Review normalization formula and value ranges',
      timestamp: new Date(),
      metadata: {
        attribute: report.attribute,
        rawValue: report.rawValue,
        expectedNormalizedValue: report.expectedNormalizedValue,
        actualNormalizedValue: report.normalizedValue,
        normalizationType: report.normalizationType
      }
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    categoryReports: CategoryCalculationReport[],
    normalizationReports: NormalizationValidationReport[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for calculation accuracy issues
    const incorrectCalculations = categoryReports.filter(r => !r.isCorrect);
    if (incorrectCalculations.length > 0) {
      recommendations.push(`Review calculation formulas for ${incorrectCalculations.length} categories with accuracy issues`);
    }

    // Check for data completeness issues
    const lowCompletenessCategories = categoryReports.filter(r => r.dataCompleteness < 80);
    if (lowCompletenessCategories.length > 0) {
      recommendations.push(`Improve data completeness for ${lowCompletenessCategories.length} categories with missing attributes`);
    }

    // Check for normalization issues
    const normalizationErrors = normalizationReports.filter(r => !r.isCorrect);
    if (normalizationErrors.length > 0) {
      recommendations.push(`Fix normalization logic for ${normalizationErrors.length} attributes with incorrect scaling`);
    }

    // Check for out-of-range values
    const outOfRangeValues = normalizationReports.filter(r => 
      r.issues.some(issue => issue.includes('outside expected range'))
    );
    if (outOfRangeValues.length > 0) {
      recommendations.push(`Investigate ${outOfRangeValues.length} attributes with values outside expected ranges`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All calculations and normalizations are accurate');
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