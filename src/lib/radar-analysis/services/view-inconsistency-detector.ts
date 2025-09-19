/**
 * ViewInconsistencyDetector - Service for detecting inconsistencies between radar and other views
 * 
 * This service automatically compares radar data with player profile data,
 * creates alert system for discrepancies, and logs inconsistencies for analysis.
 */

import { PrismaClient } from '@prisma/client';
import { PlayerService } from '../../services/player-service';
import { RadarCalculationService, RadarCategoryData } from '../../services/RadarCalculationService';
import { connectionPool } from '../../db/connection-pool';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  AnalysisIssue, 
  AnalysisContext, 
  ValidationResult,
  AnalysisSeverity
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ViewInconsistencyResult {
  playerId: string;
  timestamp: Date;
  inconsistencies: ViewInconsistency[];
  alerts: InconsistencyAlert[];
  overallConsistencyScore: number;
  affectedViews: string[];
  recommendations: string[];
}

export interface ViewInconsistency {
  id: string;
  type: InconsistencyType;
  severity: AnalysisSeverity;
  sourceView: string;
  targetView: string;
  field: string;
  sourceValue: any;
  targetValue: any;
  discrepancy: number;
  tolerance: number;
  description: string;
  detectedAt: Date;
  metadata: Record<string, any>;
}

export interface InconsistencyAlert {
  id: string;
  playerId: string;
  inconsistencyId: string;
  severity: AnalysisSeverity;
  title: string;
  message: string;
  actionRequired: string;
  createdAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface ViewComparisonConfig {
  sourceView: string;
  targetView: string;
  fieldMappings: FieldMapping[];
  tolerances: Record<string, number>;
  enabled: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformFunction?: (value: any) => any;
  comparisonType: 'exact' | 'numeric' | 'percentage' | 'categorical';
  tolerance?: number;
}

export type InconsistencyType = 
  | 'value_mismatch' 
  | 'missing_data' 
  | 'data_type_mismatch' 
  | 'calculation_error'
  | 'synchronization_lag'
  | 'business_logic_violation';

export class ViewInconsistencyDetector {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  // Comparison configurations for different view pairs
  private readonly VIEW_COMPARISONS: ViewComparisonConfig[] = [
    {
      sourceView: 'radar',
      targetView: 'player_profile',
      fieldMappings: [
        {
          sourceField: 'overall_radar_average',
          targetField: 'player_rating',
          comparisonType: 'numeric',
          tolerance: 10,
          transformFunction: (radarAvg: number) => radarAvg // Both should be 0-100 scale
        },
        {
          sourceField: 'finishing_category',
          targetField: 'goals_p90_3m',
          comparisonType: 'percentage',
          tolerance: 15,
          transformFunction: (finishingScore: number) => finishingScore / 100 // Convert to 0-1 scale
        }
      ],
      tolerances: {
        'default': 5,
        'rating': 10,
        'percentage': 15
      },
      enabled: true
    },
    {
      sourceView: 'radar',
      targetView: 'player_stats',
      fieldMappings: [
        {
          sourceField: 'maintenance_category',
          targetField: 'accurate_passes_percent_3m',
          comparisonType: 'percentage',
          tolerance: 10
        },
        {
          sourceField: 'progression_category',
          targetField: 'forward_passes_p90_3m',
          comparisonType: 'numeric',
          tolerance: 20
        }
      ],
      tolerances: {
        'default': 10,
        'passes': 15,
        'goals': 20
      },
      enabled: true
    }
  ];

  // Inconsistency logging storage
  private inconsistencyLog: ViewInconsistency[] = [];
  private alertQueue: InconsistencyAlert[] = [];

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Detect inconsistencies between radar and other player views
   */
  async detectViewInconsistencies(
    playerId: string,
    context: AnalysisContext
  ): Promise<ViewInconsistencyResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'detect_view_inconsistencies', playerId }
      });

      // Get data from all relevant views
      const [radarData, playerProfile, playerStats] = await Promise.all([
        this.radarService.calculatePlayerRadar(playerId, '2023-24'),
        PlayerService.getPlayerById(playerId),
        this.getPlayerStats(playerId)
      ]);

      if (!playerProfile) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const inconsistencies: ViewInconsistency[] = [];
      const alerts: InconsistencyAlert[] = [];

      // Compare radar with player profile
      const profileInconsistencies = await this.compareRadarWithProfile(
        radarData,
        playerProfile,
        context
      );
      inconsistencies.push(...profileInconsistencies);

      // Compare radar with player stats
      if (playerStats) {
        const statsInconsistencies = await this.compareRadarWithStats(
          radarData,
          playerStats,
          context
        );
        inconsistencies.push(...statsInconsistencies);
      }

      // Generate alerts for critical inconsistencies
      const criticalInconsistencies = inconsistencies.filter(
        inc => inc.severity === 'critical' || inc.severity === 'high'
      );

      for (const inconsistency of criticalInconsistencies) {
        const alert = this.createInconsistencyAlert(playerId, inconsistency);
        alerts.push(alert);
        this.alertQueue.push(alert);
      }

      // Log all inconsistencies
      this.inconsistencyLog.push(...inconsistencies);

      // Calculate overall consistency score
      const totalComparisons = this.calculateTotalComparisons(radarData);
      const consistentComparisons = totalComparisons - inconsistencies.length;
      const overallConsistencyScore = totalComparisons > 0 ? 
        (consistentComparisons / totalComparisons) * 100 : 100;

      // Identify affected views
      const affectedViews = [...new Set(inconsistencies.map(inc => inc.targetView))];

      // Generate recommendations
      const recommendations = this.generateInconsistencyRecommendations(inconsistencies);

      const result: ViewInconsistencyResult = {
        playerId,
        timestamp: new Date(),
        inconsistencies,
        alerts,
        overallConsistencyScore: Math.round(overallConsistencyScore * 100) / 100,
        affectedViews,
        recommendations
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'detect_view_inconsistencies', 
          playerId, 
          duration,
          inconsistenciesFound: inconsistencies.length,
          alertsGenerated: alerts.length,
          consistencyScore: overallConsistencyScore
        }
      }, result as any);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'detect_view_inconsistencies', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Compare radar data with player profile
   */
  private async compareRadarWithProfile(
    radarData: RadarCategoryData[],
    playerProfile: any,
    context: AnalysisContext
  ): Promise<ViewInconsistency[]> {
    const inconsistencies: ViewInconsistency[] = [];

    // Calculate overall radar average
    const radarAverage = radarData.reduce((sum, data) => sum + data.playerValue, 0) / radarData.length;

    // Compare with player rating
    if (playerProfile.player_rating) {
      const discrepancy = Math.abs(radarAverage - playerProfile.player_rating);
      const tolerance = 10; // 10 point tolerance for overall rating comparison

      if (discrepancy > tolerance) {
        inconsistencies.push({
          id: uuidv4(),
          type: 'value_mismatch',
          severity: discrepancy > 20 ? 'high' : 'medium',
          sourceView: 'radar',
          targetView: 'player_profile',
          field: 'overall_rating',
          sourceValue: radarAverage,
          targetValue: playerProfile.player_rating,
          discrepancy,
          tolerance,
          description: `Radar average (${radarAverage.toFixed(1)}) differs from player rating (${playerProfile.player_rating}) by ${discrepancy.toFixed(1)} points`,
          detectedAt: new Date(),
          metadata: {
            playerId: context.playerId,
            radarCategories: radarData.length,
            profileLastUpdated: playerProfile.updatedAt
          }
        });
      }
    }

    // Compare age consistency (radar calculations should use current age)
    if (playerProfile.age) {
      // Check if radar calculations are using the correct age for age-based comparisons
      // This is more of a data integrity check
      const expectedAgeRange = { min: playerProfile.age - 1, max: playerProfile.age + 1 };
      
      // In a real implementation, you would check if the radar calculations
      // are using the correct age for percentile calculations
      // For now, we'll assume age consistency unless there's a clear mismatch
    }

    return inconsistencies;
  }

  /**
   * Compare radar data with player statistics
   */
  private async compareRadarWithStats(
    radarData: RadarCategoryData[],
    playerStats: any,
    context: AnalysisContext
  ): Promise<ViewInconsistency[]> {
    const inconsistencies: ViewInconsistency[] = [];

    // Define mappings between radar categories and stats
    const categoryStatMappings = [
      {
        category: 'finishing',
        statField: 'goals_p90_3m',
        expectedCorrelation: 'positive',
        tolerance: 0.3 // Correlation tolerance
      },
      {
        category: 'maintenance',
        statField: 'accurate_passes_percent_3m',
        expectedCorrelation: 'positive',
        tolerance: 0.2
      },
      {
        category: 'progression',
        statField: 'forward_passes_p90_3m',
        expectedCorrelation: 'positive',
        tolerance: 0.25
      },
      {
        category: 'recovery',
        statField: 'interceptions_p90_3m',
        expectedCorrelation: 'positive',
        tolerance: 0.3
      }
    ];

    for (const mapping of categoryStatMappings) {
      const categoryData = radarData.find(data => 
        data.category.toLowerCase().includes(mapping.category)
      );
      
      if (!categoryData || !playerStats[mapping.statField]) {
        continue;
      }

      // Normalize stat value to 0-100 scale for comparison
      const normalizedStatValue = this.normalizeStatValue(
        mapping.statField,
        playerStats[mapping.statField]
      );

      const discrepancy = Math.abs(categoryData.playerValue - normalizedStatValue);
      const tolerance = mapping.tolerance * 100; // Convert to 0-100 scale

      if (discrepancy > tolerance) {
        inconsistencies.push({
          id: uuidv4(),
          type: 'calculation_error',
          severity: discrepancy > tolerance * 2 ? 'high' : 'medium',
          sourceView: 'radar',
          targetView: 'player_stats',
          field: mapping.category,
          sourceValue: categoryData.playerValue,
          targetValue: normalizedStatValue,
          discrepancy,
          tolerance,
          description: `Radar ${mapping.category} (${categoryData.playerValue.toFixed(1)}) doesn't correlate well with ${mapping.statField} (normalized: ${normalizedStatValue.toFixed(1)})`,
          detectedAt: new Date(),
          metadata: {
            playerId: context.playerId,
            statField: mapping.statField,
            rawStatValue: playerStats[mapping.statField],
            expectedCorrelation: mapping.expectedCorrelation
          }
        });
      }
    }

    return inconsistencies;
  }

  /**
   * Normalize statistical values to 0-100 scale for comparison
   */
  private normalizeStatValue(statField: string, value: number): number {
    // Define realistic ranges for different statistics
    const statRanges: Record<string, { min: number; max: number }> = {
      'goals_p90_3m': { min: 0, max: 1.5 },
      'assists_p90_3m': { min: 0, max: 1.0 },
      'accurate_passes_percent_3m': { min: 50, max: 100 },
      'forward_passes_p90_3m': { min: 0, max: 50 },
      'interceptions_p90_3m': { min: 0, max: 5 }
    };

    const range = statRanges[statField];
    if (!range) {
      // Default normalization for unknown stats
      return Math.max(0, Math.min(100, value));
    }

    // Clamp value to expected range and normalize to 0-100
    const clampedValue = Math.max(range.min, Math.min(range.max, value));
    return ((clampedValue - range.min) / (range.max - range.min)) * 100;
  }

  /**
   * Get player statistics data
   */
  private async getPlayerStats(playerId: string) {
    return await this.prisma.playerStats3m.findUnique({
      where: { id_player: playerId }
    });
  }

  /**
   * Calculate total number of comparisons made
   */
  private calculateTotalComparisons(radarData: RadarCategoryData[]): number {
    // Base comparisons: overall rating + category-specific comparisons
    let totalComparisons = 1; // Overall rating comparison

    // Add category-specific comparisons
    const categoryStatMappings = ['finishing', 'maintenance', 'progression', 'recovery'];
    totalComparisons += categoryStatMappings.length;

    return totalComparisons;
  }

  /**
   * Create inconsistency alert
   */
  private createInconsistencyAlert(
    playerId: string,
    inconsistency: ViewInconsistency
  ): InconsistencyAlert {
    return {
      id: uuidv4(),
      playerId,
      inconsistencyId: inconsistency.id,
      severity: inconsistency.severity,
      title: `Data Inconsistency Detected: ${inconsistency.field}`,
      message: inconsistency.description,
      actionRequired: this.getActionRequired(inconsistency),
      createdAt: new Date(),
      acknowledged: false
    };
  }

  /**
   * Get required action based on inconsistency type and severity
   */
  private getActionRequired(inconsistency: ViewInconsistency): string {
    switch (inconsistency.type) {
      case 'value_mismatch':
        return inconsistency.severity === 'critical' ? 
          'Immediate data synchronization required' :
          'Review data sources and update calculations';
      
      case 'calculation_error':
        return 'Review calculation formulas and validate input data';
      
      case 'missing_data':
        return 'Populate missing data or update data completeness indicators';
      
      case 'synchronization_lag':
        return 'Trigger data synchronization between views';
      
      default:
        return 'Investigate and resolve data inconsistency';
    }
  }

  /**
   * Generate recommendations for resolving inconsistencies
   */
  private generateInconsistencyRecommendations(
    inconsistencies: ViewInconsistency[]
  ): string[] {
    const recommendations: string[] = [];

    // Group inconsistencies by type
    const byType = inconsistencies.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate type-specific recommendations
    if (byType.value_mismatch > 0) {
      recommendations.push(
        `Review data synchronization processes (${byType.value_mismatch} value mismatches found)`
      );
    }

    if (byType.calculation_error > 0) {
      recommendations.push(
        `Validate calculation formulas and input data (${byType.calculation_error} calculation errors found)`
      );
    }

    if (byType.missing_data > 0) {
      recommendations.push(
        `Improve data completeness and update indicators (${byType.missing_data} missing data issues found)`
      );
    }

    // Severity-based recommendations
    const criticalCount = inconsistencies.filter(inc => inc.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(
        `Address ${criticalCount} critical inconsistencies immediately to maintain data integrity`
      );
    }

    // View-specific recommendations
    const affectedViews = [...new Set(inconsistencies.map(inc => inc.targetView))];
    if (affectedViews.length > 1) {
      recommendations.push(
        `Implement cross-view validation checks for ${affectedViews.join(', ')}`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No inconsistencies detected - data views are properly synchronized');
    }

    return recommendations;
  }

  /**
   * Get inconsistency log for analysis
   */
  getInconsistencyLog(playerId?: string): ViewInconsistency[] {
    if (playerId) {
      return this.inconsistencyLog.filter(inc => 
        inc.metadata.playerId === playerId
      );
    }
    return [...this.inconsistencyLog];
  }

  /**
   * Get pending alerts
   */
  getPendingAlerts(playerId?: string): InconsistencyAlert[] {
    let alerts = this.alertQueue.filter(alert => !alert.acknowledged);
    
    if (playerId) {
      alerts = alerts.filter(alert => alert.playerId === playerId);
    }
    
    return alerts;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertQueue.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clear old inconsistency logs (keep last 1000 entries)
   */
  clearOldLogs(): void {
    if (this.inconsistencyLog.length > 1000) {
      this.inconsistencyLog = this.inconsistencyLog.slice(-1000);
    }
    
    // Remove acknowledged alerts older than 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.alertQueue = this.alertQueue.filter(alert => 
      !alert.acknowledged || alert.createdAt > weekAgo
    );
  }

  /**
   * Cleanup method
   */
  async disconnect(): Promise<void> {
    await this.radarService.disconnect();
  }
}

// Export singleton instance
export const viewInconsistencyDetector = new ViewInconsistencyDetector();