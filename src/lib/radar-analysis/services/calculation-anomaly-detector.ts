/**
 * CalculationAnomalyDetector - Service for detecting anomalies in radar calculations
 * 
 * This service detects values outside expected ranges, validates data completeness,
 * and verifies consistency between source attributes and calculated values.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { connectionPool } from '../../db/connection-pool';
import { RadarCalculationService, RadarCategoryData } from '../../services/RadarCalculationService';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  AnalysisIssue, 
  AnalysisContext, 
  ValidationResult,
  AnalysisSeverity
} from '../types';


export interface AnomalyDetectionReport {
  playerId: string;
  timestamp: Date;
  overallStatus: ValidationResult;
  anomalies: CalculationAnomaly[];
  dataCompletenessReport: DataCompletenessReport;
  consistencyReport: ConsistencyReport;
  rangeValidationReport: RangeValidationReport;
  issues: AnalysisIssue[];
  recommendations: string[];
}

export interface CalculationAnomaly {
  id: string;
  type: 'out_of_range' | 'data_inconsistency' | 'calculation_error' | 'missing_data' | 'extreme_value';
  severity: AnalysisSeverity;
  category: string;
  description: string;
  expectedValue?: number;
  actualValue?: number;
  sourceData: Record<string, any>;
  metadata: Record<string, any>;
}

export interface DataCompletenessReport {
  overallCompleteness: number;
  categoryCompleteness: Array<{
    category: string;
    completeness: number;
    missingAttributes: string[];
    availableAttributes: string[];
  }>;
  criticalMissingData: string[];
  recommendations: string[];
}

export interface ConsistencyReport {
  overallConsistency: number;
  inconsistencies: Array<{
    category: string;
    sourceAttribute: string;
    expectedRange: { min: number; max: number };
    actualValue: number;
    normalizedValue: number;
    isConsistent: boolean;
  }>;
  crossCategoryConsistencies: Array<{
    categories: string[];
    sharedAttributes: string[];
    isConsistent: boolean;
    details: string;
  }>;
}

export interface RangeValidationReport {
  overallValid: boolean;
  categoryValidations: Array<{
    category: string;
    playerValue: number;
    isInValidRange: boolean;
    expectedRange: { min: number; max: number };
    deviationFromMean?: number;
    standardDeviations?: number;
  }>;
  extremeValues: Array<{
    category: string;
    value: number;
    type: 'extremely_high' | 'extremely_low';
    percentile: number;
  }>;
}

export class CalculationAnomalyDetector {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  // Expected ranges for radar category values (0-100 scale)
  private readonly CATEGORY_RANGES = {
    min: 0,
    max: 100,
    extremeThreshold: 3 // Standard deviations for extreme value detection
  };

  // Expected ranges for FMI attributes (1-20 scale)
  private readonly FMI_RANGES = {
    min: 1,
    max: 20,
    typical: { min: 8, max: 16 } // Typical range for most players
  };

  // Expected ranges for statistical values
  private readonly STAT_RANGES: Record<string, { min: number; max: number; typical: { min: number; max: number } }> = {
    'goals_p90_3m': { min: 0, max: 1.5, typical: { min: 0, max: 0.8 } },
    'assists_p90_3m': { min: 0, max: 1.0, typical: { min: 0, max: 0.6 } },
    'shots_p90_3m': { min: 0, max: 8.0, typical: { min: 1, max: 5 } },
    'passes_p90_3m': { min: 10, max: 100, typical: { min: 20, max: 80 } },
    'forward_passes_p90_3m': { min: 5, max: 50, typical: { min: 10, max: 35 } },
    'accurate_passes_percent_3m': { min: 50, max: 100, typical: { min: 70, max: 95 } },
    'crosses_p90_3m': { min: 0, max: 10, typical: { min: 0, max: 5 } },
    'tackles_p90_3m': { min: 0, max: 6, typical: { min: 1, max: 4 } },
    'interceptions_p90_3m': { min: 0, max: 5, typical: { min: 0.5, max: 3 } },
    'def_duels_won_percent_3m': { min: 30, max: 80, typical: { min: 45, max: 70 } },
    'off_duels_won_percent_3m': { min: 30, max: 80, typical: { min: 40, max: 65 } },
    'aerials_duels_won_percent_3m': { min: 30, max: 90, typical: { min: 40, max: 75 } },
    'effectiveness_percent_3m': { min: 0, max: 50, typical: { min: 5, max: 30 } }
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Detects anomalies in radar calculations for a specific player
   */
  async detectCalculationAnomalies(
    playerId: string,
    context: AnalysisContext,
    period: string = '2023-24'
  ): Promise<AnomalyDetectionReport> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'detect_anomalies', playerId }
      });

      // Get player data
      const player = await this.getPlayerData(playerId);
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }

      // Get radar data
      const radarData = await this.radarService.calculatePlayerRadar(playerId, period);

      const anomalies: CalculationAnomaly[] = [];
      const issues: AnalysisIssue[] = [];

      // 1. Detect range anomalies
      const rangeValidationReport = await this.validateValueRanges(radarData, player, context);
      anomalies.push(...this.extractAnomaliesFromRangeReport(rangeValidationReport));

      // 2. Detect data completeness issues
      const dataCompletenessReport = await this.analyzeDataCompleteness(radarData, player, context);
      anomalies.push(...this.extractAnomaliesFromCompletenessReport(dataCompletenessReport));

      // 3. Detect consistency issues
      const consistencyReport = await this.analyzeDataConsistency(radarData, player, context);
      anomalies.push(...this.extractAnomaliesFromConsistencyReport(consistencyReport));

      // 4. Detect extreme values
      const extremeValueAnomalies = await this.detectExtremeValues(radarData, context);
      anomalies.push(...extremeValueAnomalies);

      // 5. Detect calculation errors
      const calculationAnomalies = await this.detectCalculationErrors(radarData, player, context);
      anomalies.push(...calculationAnomalies);

      // Convert anomalies to issues
      for (const anomaly of anomalies) {
        issues.push(this.createIssueFromAnomaly(anomaly, context));
      }

      // Determine overall status
      const overallStatus = this.determineOverallStatus(anomalies);

      // Generate recommendations
      const recommendations = this.generateRecommendations(anomalies, dataCompletenessReport, consistencyReport);

      const result: AnomalyDetectionReport = {
        playerId,
        timestamp: new Date(),
        overallStatus,
        anomalies,
        dataCompletenessReport,
        consistencyReport,
        rangeValidationReport,
        issues,
        recommendations
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'detect_anomalies', 
          playerId, 
          duration,
          anomaliesFound: anomalies.length,
          overallStatus
        }
      }, result as any);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'detect_anomalies', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates that calculated values are within expected ranges
   */
  private async validateValueRanges(
    radarData: RadarCategoryData[],
    player: any,
    context: AnalysisContext
  ): Promise<RangeValidationReport> {
    const categoryValidations = [];
    const extremeValues = [];
    let overallValid = true;

    for (const categoryData of radarData) {
      // Check if value is in valid range (0-100)
      const isInValidRange = 
        categoryData.playerValue >= this.CATEGORY_RANGES.min && 
        categoryData.playerValue <= this.CATEGORY_RANGES.max;

      if (!isInValidRange) {
        overallValid = false;
      }

      // Calculate statistics for extreme value detection
      // This would typically use historical data, but for now we'll use simple thresholds
      const deviationFromMean = Math.abs(categoryData.playerValue - 50); // Assuming 50 as mean
      const standardDeviations = deviationFromMean / 20; // Assuming std dev of 20

      categoryValidations.push({
        category: categoryData.category,
        playerValue: categoryData.playerValue,
        isInValidRange,
        expectedRange: { min: this.CATEGORY_RANGES.min, max: this.CATEGORY_RANGES.max },
        deviationFromMean,
        standardDeviations
      });

      // Detect extreme values
      if (standardDeviations > this.CATEGORY_RANGES.extremeThreshold) {
        extremeValues.push({
          category: categoryData.category,
          value: categoryData.playerValue,
          type: categoryData.playerValue > 50 ? 'extremely_high' as const : 'extremely_low' as const,
          percentile: categoryData.percentile || 0
        });
      }
    }

    return {
      overallValid,
      categoryValidations,
      extremeValues
    };
  }

  /**
   * Analyzes data completeness across categories
   */
  private async analyzeDataCompleteness(
    radarData: RadarCategoryData[],
    player: any,
    context: AnalysisContext
  ): Promise<DataCompletenessReport> {
    const categoryCompleteness = [];
    const criticalMissingData = [];
    let totalCompleteness = 0;

    // Get category mappings to check expected attributes
    const categoryMappings = (this.radarService as any).categoryMappings;

    for (const categoryData of radarData) {
      const categoryKey = Object.entries((this.radarService as any).categoryLabels)
        .find(([key, label]) => label === categoryData.category)?.[0];

      if (categoryKey && categoryMappings[categoryKey]) {
        const expectedAttributes = categoryMappings[categoryKey];
        const availableAttributes = categoryData.sourceAttributes || [];
        const missingAttributes = expectedAttributes
          .map((attr: any) => attr.attribute)
          .filter((attr: string) => !availableAttributes.includes(attr));

        const completeness = categoryData.dataCompleteness || 0;
        totalCompleteness += completeness;

        categoryCompleteness.push({
          category: categoryData.category,
          completeness,
          missingAttributes,
          availableAttributes
        });

        // Identify critical missing data (completeness < 50%)
        if (completeness < 50) {
          criticalMissingData.push(`${categoryData.category}: ${completeness}% complete`);
        }
      }
    }

    const overallCompleteness = radarData.length > 0 ? totalCompleteness / radarData.length : 0;

    const recommendations = [];
    if (overallCompleteness < 80) {
      recommendations.push('Improve overall data completeness (currently below 80%)');
    }
    if (criticalMissingData.length > 0) {
      recommendations.push(`Address critical missing data in ${criticalMissingData.length} categories`);
    }

    return {
      overallCompleteness,
      categoryCompleteness,
      criticalMissingData,
      recommendations
    };
  }

  /**
   * Analyzes consistency between source attributes and calculated values
   */
  private async analyzeDataConsistency(
    radarData: RadarCategoryData[],
    player: any,
    context: AnalysisContext
  ): Promise<ConsistencyReport> {
    const inconsistencies = [];
    const crossCategoryConsistencies = [];
    let consistentCount = 0;
    let totalChecks = 0;

    // Check each category's source attributes
    for (const categoryData of radarData) {
      if (categoryData.sourceAttributes) {
        for (const attribute of categoryData.sourceAttributes) {
          totalChecks++;
          
          // Get actual value from player data
          let actualValue: number | null = null;
          let expectedRange: { min: number; max: number };
          
          if (player.atributos && player.atributos[attribute] !== undefined) {
            actualValue = player.atributos[attribute];
            expectedRange = this.FMI_RANGES;
          } else if (player.playerStats3m && player.playerStats3m[attribute] !== undefined) {
            actualValue = player.playerStats3m[attribute];
            expectedRange = this.STAT_RANGES[attribute] || { min: 0, max: 100 };
          } else {
            continue; // Skip if attribute not found
          }

          // Check if value is in expected range
          const isInRange = actualValue >= expectedRange.min && actualValue <= expectedRange.max;
          const normalizedValue = this.calculateNormalizedValue(attribute, actualValue);
          
          const isConsistent = isInRange && normalizedValue >= 0 && normalizedValue <= 1;
          
          if (isConsistent) {
            consistentCount++;
          } else {
            inconsistencies.push({
              category: categoryData.category,
              sourceAttribute: attribute,
              expectedRange,
              actualValue,
              normalizedValue,
              isConsistent: false
            });
          }
        }
      }
    }

    // Check cross-category consistency (attributes used in multiple categories)
    const attributeUsage: Record<string, string[]> = {};
    for (const categoryData of radarData) {
      if (categoryData.sourceAttributes) {
        for (const attribute of categoryData.sourceAttributes) {
          if (!attributeUsage[attribute]) {
            attributeUsage[attribute] = [];
          }
          attributeUsage[attribute].push(categoryData.category);
        }
      }
    }

    for (const [attribute, categories] of Object.entries(attributeUsage)) {
      if (categories.length > 1) {
        // This attribute is used in multiple categories - check consistency
        crossCategoryConsistencies.push({
          categories,
          sharedAttributes: [attribute],
          isConsistent: true, // Simplified - would need more complex logic
          details: `Attribute ${attribute} used in ${categories.length} categories`
        });
      }
    }

    const overallConsistency = totalChecks > 0 ? (consistentCount / totalChecks) * 100 : 100;

    return {
      overallConsistency,
      inconsistencies,
      crossCategoryConsistencies
    };
  }

  /**
   * Detects extreme values that might indicate calculation errors
   */
  private async detectExtremeValues(
    radarData: RadarCategoryData[],
    context: AnalysisContext
  ): Promise<CalculationAnomaly[]> {
    const anomalies: CalculationAnomaly[] = [];

    for (const categoryData of radarData) {
      // Check for impossible values
      if (categoryData.playerValue < 0 || categoryData.playerValue > 100) {
        anomalies.push({
          id: uuidv4(),
          type: 'out_of_range',
          severity: 'critical',
          category: categoryData.category,
          description: `Value ${categoryData.playerValue} is outside valid range [0, 100]`,
          actualValue: categoryData.playerValue,
          expectedValue: undefined,
          sourceData: { category: categoryData.category },
          metadata: { 
            validRange: { min: 0, max: 100 },
            dataCompleteness: categoryData.dataCompleteness
          }
        });
      }

      // Check for extreme percentiles
      if (categoryData.percentile !== undefined) {
        if (categoryData.percentile < 0 || categoryData.percentile > 100) {
          anomalies.push({
            id: uuidv4(),
            type: 'calculation_error',
            severity: 'high',
            category: categoryData.category,
            description: `Percentile ${categoryData.percentile} is outside valid range [0, 100]`,
            actualValue: categoryData.percentile,
            sourceData: { category: categoryData.category, playerValue: categoryData.playerValue },
            metadata: { type: 'percentile_error' }
          });
        }
      }

      // Check for suspicious data completeness
      if (categoryData.dataCompleteness < 25) {
        anomalies.push({
          id: uuidv4(),
          type: 'missing_data',
          severity: 'medium',
          category: categoryData.category,
          description: `Very low data completeness: ${categoryData.dataCompleteness}%`,
          actualValue: categoryData.dataCompleteness,
          sourceData: { 
            category: categoryData.category,
            sourceAttributes: categoryData.sourceAttributes || []
          },
          metadata: { type: 'low_completeness' }
        });
      }
    }

    return anomalies;
  }

  /**
   * Detects calculation errors by comparing expected vs actual results
   */
  private async detectCalculationErrors(
    radarData: RadarCategoryData[],
    player: any,
    context: AnalysisContext
  ): Promise<CalculationAnomaly[]> {
    const anomalies: CalculationAnomaly[] = [];

    // Check for NaN or undefined values
    for (const categoryData of radarData) {
      if (isNaN(categoryData.playerValue) || categoryData.playerValue === undefined) {
        anomalies.push({
          id: uuidv4(),
          type: 'calculation_error',
          severity: 'critical',
          category: categoryData.category,
          description: 'Calculated value is NaN or undefined',
          actualValue: categoryData.playerValue,
          sourceData: { 
            category: categoryData.category,
            sourceAttributes: categoryData.sourceAttributes || []
          },
          metadata: { type: 'nan_value' }
        });
      }

      // Check for impossible combinations (e.g., high value with very low completeness)
      if (categoryData.playerValue > 90 && categoryData.dataCompleteness < 50) {
        anomalies.push({
          id: uuidv4(),
          type: 'data_inconsistency',
          severity: 'medium',
          category: categoryData.category,
          description: `High calculated value (${categoryData.playerValue}) with low data completeness (${categoryData.dataCompleteness}%)`,
          actualValue: categoryData.playerValue,
          sourceData: { 
            category: categoryData.category,
            dataCompleteness: categoryData.dataCompleteness
          },
          metadata: { type: 'value_completeness_mismatch' }
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate normalized value for validation
   */
  private calculateNormalizedValue(attribute: string, value: number): number {
    if (this.STAT_RANGES[attribute]) {
      const range = this.STAT_RANGES[attribute];
      const clampedValue = Math.max(range.min, Math.min(range.max, value));
      return (clampedValue - range.min) / (range.max - range.min);
    } else {
      // Assume FMI attribute
      const clampedValue = Math.max(this.FMI_RANGES.min, Math.min(this.FMI_RANGES.max, value));
      return (clampedValue - this.FMI_RANGES.min) / (this.FMI_RANGES.max - this.FMI_RANGES.min);
    }
  }

  /**
   * Extract anomalies from range validation report
   */
  private extractAnomaliesFromRangeReport(report: RangeValidationReport): CalculationAnomaly[] {
    const anomalies: CalculationAnomaly[] = [];

    for (const validation of report.categoryValidations) {
      if (!validation.isInValidRange) {
        anomalies.push({
          id: uuidv4(),
          type: 'out_of_range',
          severity: 'high',
          category: validation.category,
          description: `Value ${validation.playerValue} is outside expected range [${validation.expectedRange.min}, ${validation.expectedRange.max}]`,
          actualValue: validation.playerValue,
          sourceData: { category: validation.category },
          metadata: { expectedRange: validation.expectedRange }
        });
      }
    }

    for (const extremeValue of report.extremeValues) {
      anomalies.push({
        id: uuidv4(),
        type: 'extreme_value',
        severity: 'medium',
        category: extremeValue.category,
        description: `${extremeValue.type.replace('_', ' ')} value detected: ${extremeValue.value}`,
        actualValue: extremeValue.value,
        sourceData: { category: extremeValue.category },
        metadata: { 
          type: extremeValue.type,
          percentile: extremeValue.percentile
        }
      });
    }

    return anomalies;
  }

  /**
   * Extract anomalies from completeness report
   */
  private extractAnomaliesFromCompletenessReport(report: DataCompletenessReport): CalculationAnomaly[] {
    const anomalies: CalculationAnomaly[] = [];

    for (const categoryReport of report.categoryCompleteness) {
      if (categoryReport.completeness < 50) {
        anomalies.push({
          id: uuidv4(),
          type: 'missing_data',
          severity: categoryReport.completeness < 25 ? 'high' : 'medium',
          category: categoryReport.category,
          description: `Low data completeness: ${categoryReport.completeness}%`,
          actualValue: categoryReport.completeness,
          sourceData: { 
            category: categoryReport.category,
            missingAttributes: categoryReport.missingAttributes
          },
          metadata: { 
            missingAttributes: categoryReport.missingAttributes,
            availableAttributes: categoryReport.availableAttributes
          }
        });
      }
    }

    return anomalies;
  }

  /**
   * Extract anomalies from consistency report
   */
  private extractAnomaliesFromConsistencyReport(report: ConsistencyReport): CalculationAnomaly[] {
    const anomalies: CalculationAnomaly[] = [];

    for (const inconsistency of report.inconsistencies) {
      anomalies.push({
        id: uuidv4(),
        type: 'data_inconsistency',
        severity: 'medium',
        category: inconsistency.category,
        description: `Inconsistent source data for attribute ${inconsistency.sourceAttribute}`,
        actualValue: inconsistency.actualValue,
        sourceData: { 
          category: inconsistency.category,
          attribute: inconsistency.sourceAttribute
        },
        metadata: { 
          expectedRange: inconsistency.expectedRange,
          normalizedValue: inconsistency.normalizedValue
        }
      });
    }

    return anomalies;
  }

  /**
   * Get player data with attributes and statistics
   */
  private async getPlayerData(playerId: string) {
    return await this.prisma.jugador.findUnique({
      where: { id_player: playerId },
      include: {
        atributos: true,
        playerStats3m: true
      }
    });
  }

  /**
   * Create an analysis issue from an anomaly
   */
  private createIssueFromAnomaly(anomaly: CalculationAnomaly, context: AnalysisContext): AnalysisIssue {
    return {
      id: anomaly.id,
      severity: anomaly.severity,
      category: 'calculation',
      title: `${anomaly.type.replace('_', ' ')} in ${anomaly.category}`,
      description: anomaly.description,
      affectedComponent: `radar-calculation-${anomaly.category}`,
      expectedBehavior: this.getExpectedBehaviorForAnomaly(anomaly),
      actualBehavior: anomaly.description,
      recommendation: this.getRecommendationForAnomaly(anomaly),
      timestamp: new Date(),
      metadata: {
        anomalyType: anomaly.type,
        category: anomaly.category,
        ...anomaly.metadata
      }
    };
  }

  /**
   * Get expected behavior description for an anomaly
   */
  private getExpectedBehaviorForAnomaly(anomaly: CalculationAnomaly): string {
    switch (anomaly.type) {
      case 'out_of_range':
        return 'Values should be within valid range [0, 100]';
      case 'data_inconsistency':
        return 'Source data should be consistent with calculated values';
      case 'calculation_error':
        return 'Calculations should produce valid numeric results';
      case 'missing_data':
        return 'All required attributes should be available for calculation';
      case 'extreme_value':
        return 'Values should be within typical ranges for the player population';
      default:
        return 'Calculations should be accurate and consistent';
    }
  }

  /**
   * Get recommendation for an anomaly
   */
  private getRecommendationForAnomaly(anomaly: CalculationAnomaly): string {
    switch (anomaly.type) {
      case 'out_of_range':
        return 'Review calculation logic and input data validation';
      case 'data_inconsistency':
        return 'Verify source data integrity and normalization logic';
      case 'calculation_error':
        return 'Debug calculation formulas and handle edge cases';
      case 'missing_data':
        return 'Improve data collection and population processes';
      case 'extreme_value':
        return 'Investigate if extreme value is legitimate or calculation error';
      default:
        return 'Review calculation system for potential issues';
    }
  }

  /**
   * Determine overall status based on anomalies
   */
  private determineOverallStatus(anomalies: CalculationAnomaly[]): ValidationResult {
    if (anomalies.some(a => a.severity === 'critical')) return 'fail';
    if (anomalies.some(a => a.severity === 'high')) return 'warning';
    if (anomalies.length > 0) return 'warning';
    return 'pass';
  }

  /**
   * Generate recommendations based on detected anomalies
   */
  private generateRecommendations(
    anomalies: CalculationAnomaly[],
    completenessReport: DataCompletenessReport,
    consistencyReport: ConsistencyReport
  ): string[] {
    const recommendations: string[] = [];

    // Group anomalies by type
    const anomaliesByType = anomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.type]) acc[anomaly.type] = [];
      acc[anomaly.type].push(anomaly);
      return acc;
    }, {} as Record<string, CalculationAnomaly[]>);

    // Generate type-specific recommendations
    if (anomaliesByType.out_of_range) {
      recommendations.push(`Fix ${anomaliesByType.out_of_range.length} out-of-range value issues`);
    }

    if (anomaliesByType.calculation_error) {
      recommendations.push(`Address ${anomaliesByType.calculation_error.length} calculation errors`);
    }

    if (anomaliesByType.missing_data) {
      recommendations.push(`Improve data completeness for ${anomaliesByType.missing_data.length} categories`);
    }

    if (anomaliesByType.data_inconsistency) {
      recommendations.push(`Resolve ${anomaliesByType.data_inconsistency.length} data consistency issues`);
    }

    if (anomaliesByType.extreme_value) {
      recommendations.push(`Investigate ${anomaliesByType.extreme_value.length} extreme values`);
    }

    // Add completeness-specific recommendations
    recommendations.push(...completenessReport.recommendations);

    // Add consistency-specific recommendations
    if (consistencyReport.overallConsistency < 80) {
      recommendations.push('Improve overall data consistency (currently below 80%)');
    }

    if (recommendations.length === 0) {
      recommendations.push('No significant anomalies detected - calculations appear accurate');
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