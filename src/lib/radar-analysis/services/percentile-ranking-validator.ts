/**
 * PercentileRankingValidator - Service for validating percentile and ranking calculations
 * 
 * This service validates the algorithms used for calculating percentiles and rankings,
 * verifies handling of tied values, and ensures consistency in player comparisons.
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


export interface PercentileValidationReport {
  category: string;
  playerValue: number;
  calculatedPercentile: number;
  expectedPercentile: number;
  rank: number;
  expectedRank: number;
  totalPlayers: number;
  isPercentileCorrect: boolean;
  isRankCorrect: boolean;
  comparisonValues: number[];
  tiedValues: number;
  issues: string[];
}

export interface RankingValidationReport {
  category: string;
  playerValue: number;
  rank: number;
  expectedRank: number;
  totalPlayers: number;
  isCorrect: boolean;
  tiedPlayersCount: number;
  playersAbove: number;
  playersBelow: number;
  playersEqual: number;
  issues: string[];
}

export interface PercentileRankingValidationResult {
  playerId: string;
  timestamp: Date;
  filters?: RadarFilters;
  overallAccuracy: number;
  percentileReports: PercentileValidationReport[];
  rankingReports: RankingValidationReport[];
  issues: AnalysisIssue[];
  recommendations: string[];
  comparisonGroupSize: number;
}

export class PercentileRankingValidator {
  private prisma: PrismaClient;
  private radarService: RadarCalculationService;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || connectionPool.getClient();
    this.radarService = new RadarCalculationService(this.prisma);
  }

  /**
   * Validates percentile and ranking calculations for a specific player
   */
  async validatePlayerPercentiles(
    playerId: string,
    context: AnalysisContext,
    filters?: RadarFilters,
    period: string = '2023-24'
  ): Promise<PercentileRankingValidationResult> {
    const startTime = Date.now();
    
    try {
      radarAnalysisLogger.logAnalysisStart({
        ...context,
        metadata: { operation: 'validate_percentiles', playerId, filters }
      });

      // Get player radar data with comparison
      const playerRadarData = await this.radarService.calculatePlayerRadarWithComparison(
        playerId, 
        filters || {}, 
        period
      );

      // Get comparison group
      const comparisonGroup = await this.radarService.getComparisonGroup(filters || {});

      const percentileReports: PercentileValidationReport[] = [];
      const rankingReports: RankingValidationReport[] = [];
      const issues: AnalysisIssue[] = [];

      // Validate each category
      for (const categoryData of playerRadarData) {
        if (categoryData.percentile !== undefined && categoryData.rank !== undefined) {
          // Get comparison values for this category
          const comparisonValues = await this.getComparisonValuesForCategory(
            categoryData.category,
            comparisonGroup,
            period
          );

          // Validate percentile calculation
          const percentileReport = await this.validatePercentileCalculation(
            categoryData,
            comparisonValues,
            context
          );
          percentileReports.push(percentileReport);

          // Validate ranking calculation
          const rankingReport = await this.validateRankingCalculation(
            categoryData,
            comparisonValues,
            context
          );
          rankingReports.push(rankingReport);

          // Generate issues for errors
          if (!percentileReport.isPercentileCorrect) {
            issues.push(this.createPercentileIssue(percentileReport, context));
          }

          if (!rankingReport.isCorrect) {
            issues.push(this.createRankingIssue(rankingReport, context));
          }
        }
      }

      // Calculate overall accuracy
      const totalValidations = percentileReports.length + rankingReports.length;
      const correctValidations = 
        percentileReports.filter(r => r.isPercentileCorrect && r.isRankCorrect).length +
        rankingReports.filter(r => r.isCorrect).length;
      const overallAccuracy = totalValidations > 0 ? (correctValidations / totalValidations) * 100 : 0;

      // Generate recommendations
      const recommendations = this.generateRecommendations(percentileReports, rankingReports);

      const result: PercentileRankingValidationResult = {
        playerId,
        timestamp: new Date(),
        filters,
        overallAccuracy,
        percentileReports,
        rankingReports,
        issues,
        recommendations,
        comparisonGroupSize: comparisonGroup.length
      };

      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisComplete({
        ...context,
        metadata: { 
          operation: 'validate_percentiles', 
          playerId, 
          duration,
          overallAccuracy,
          issuesFound: issues.length,
          comparisonGroupSize: comparisonGroup.length
        }
      }, result as any);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      radarAnalysisLogger.logAnalysisError({
        ...context,
        metadata: { operation: 'validate_percentiles', playerId, duration }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Validates percentile calculation for a specific category
   */
  private async validatePercentileCalculation(
    categoryData: any,
    comparisonValues: number[],
    context: AnalysisContext
  ): Promise<PercentileValidationReport> {
    const issues: string[] = [];
    
    // Calculate expected percentile using correct algorithm
    const expectedPercentile = this.calculateExpectedPercentile(
      categoryData.playerValue,
      comparisonValues
    );

    // Calculate expected rank
    const expectedRank = this.calculateExpectedRank(
      categoryData.playerValue,
      comparisonValues
    );

    // Count tied values
    const tiedValues = comparisonValues.filter(v => v === categoryData.playerValue).length;

    // Validate percentile
    const percentileTolerance = 0.1; // Allow small differences due to rounding
    const isPercentileCorrect = Math.abs(categoryData.percentile - expectedPercentile) <= percentileTolerance;

    // Validate rank
    const isRankCorrect = categoryData.rank === expectedRank;

    if (!isPercentileCorrect) {
      issues.push(`Percentile mismatch: expected ${expectedPercentile}, got ${categoryData.percentile}`);
    }

    if (!isRankCorrect) {
      issues.push(`Rank mismatch: expected ${expectedRank}, got ${categoryData.rank}`);
    }

    // Validate percentile range
    if (categoryData.percentile < 0 || categoryData.percentile > 100) {
      issues.push(`Percentile ${categoryData.percentile} is outside valid range [0, 100]`);
    }

    // Validate rank range
    if (categoryData.rank < 1 || categoryData.rank > comparisonValues.length + 1) {
      issues.push(`Rank ${categoryData.rank} is outside valid range [1, ${comparisonValues.length + 1}]`);
    }

    return {
      category: categoryData.category,
      playerValue: categoryData.playerValue,
      calculatedPercentile: categoryData.percentile,
      expectedPercentile,
      rank: categoryData.rank,
      expectedRank,
      totalPlayers: comparisonValues.length,
      isPercentileCorrect,
      isRankCorrect,
      comparisonValues,
      tiedValues,
      issues
    };
  }

  /**
   * Validates ranking calculation for a specific category
   */
  private async validateRankingCalculation(
    categoryData: any,
    comparisonValues: number[],
    context: AnalysisContext
  ): Promise<RankingValidationReport> {
    const issues: string[] = [];
    
    // Calculate expected rank
    const expectedRank = this.calculateExpectedRank(categoryData.playerValue, comparisonValues);

    // Count players in different categories
    const playersAbove = comparisonValues.filter(v => v > categoryData.playerValue).length;
    const playersBelow = comparisonValues.filter(v => v < categoryData.playerValue).length;
    const playersEqual = comparisonValues.filter(v => v === categoryData.playerValue).length;

    // Validate rank calculation
    const isCorrect = categoryData.rank === expectedRank;

    if (!isCorrect) {
      issues.push(`Rank calculation error: expected ${expectedRank}, got ${categoryData.rank}`);
    }

    // Validate rank consistency
    const totalPlayersCheck = playersAbove + playersBelow + playersEqual;
    if (totalPlayersCheck !== comparisonValues.length) {
      issues.push(`Player count inconsistency: ${totalPlayersCheck} vs ${comparisonValues.length}`);
    }

    // Validate tied values handling
    if (playersEqual > 1) {
      // For tied values, rank should be calculated as average rank
      const minRank = playersAbove + 1;
      const maxRank = playersAbove + playersEqual;
      const averageRank = (minRank + maxRank) / 2;
      
      if (Math.abs(categoryData.rank - averageRank) > 0.5) {
        issues.push(`Tied values not handled correctly: expected average rank ${averageRank}, got ${categoryData.rank}`);
      }
    }

    return {
      category: categoryData.category,
      playerValue: categoryData.playerValue,
      rank: categoryData.rank,
      expectedRank,
      totalPlayers: comparisonValues.length,
      isCorrect,
      tiedPlayersCount: playersEqual,
      playersAbove,
      playersBelow,
      playersEqual,
      issues
    };
  }

  /**
   * Calculate expected percentile using the correct algorithm
   */
  private calculateExpectedPercentile(playerValue: number, comparisonValues: number[]): number {
    if (comparisonValues.length === 0) {
      return 100;
    }

    // Count players with lower or equal values
    const playersWithLowerOrEqualValues = comparisonValues.filter(v => v <= playerValue).length;
    
    // Calculate percentile (percentage of players with lower or equal values)
    const percentile = (playersWithLowerOrEqualValues / comparisonValues.length) * 100;
    
    return Math.max(0, Math.min(100, Math.round(percentile * 100) / 100));
  }

  /**
   * Calculate expected rank using the correct algorithm
   */
  private calculateExpectedRank(playerValue: number, comparisonValues: number[]): number {
    if (comparisonValues.length === 0) {
      return 1;
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

    return Math.round(rank);
  }

  /**
   * Get comparison values for a specific category
   */
  private async getComparisonValuesForCategory(
    categoryLabel: string,
    playerIds: string[],
    period: string
  ): Promise<number[]> {
    const values: number[] = [];

    // Find the category key from the label
    const categoryLabels = this.radarService.getCategoryLabels();
    const categoryKey = Object.entries(categoryLabels)
      .find(([key, label]) => label === categoryLabel)?.[0];

    if (!categoryKey) {
      return values;
    }

    // Process players in batches
    const batchSize = 50;
    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      
      try {
        // Get radar data for each player in the batch
        for (const playerId of batch) {
          try {
            const playerRadarData = await this.radarService.calculatePlayerRadar(playerId, period);
            const categoryData = playerRadarData.find(data => data.category === categoryLabel);
            
            if (categoryData && categoryData.dataCompleteness >= 50) {
              values.push(categoryData.playerValue);
            }
          } catch (error) {
            // Skip players with calculation errors
            console.warn(`Error calculating radar for player ${playerId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
      }
    }

    return values;
  }

  /**
   * Test percentile calculation with specific test cases
   */
  async testPercentileCalculationWithCases(): Promise<{
    testCases: Array<{
      name: string;
      playerValue: number;
      comparisonValues: number[];
      expectedPercentile: number;
      expectedRank: number;
      calculatedPercentile: number;
      calculatedRank: number;
      passed: boolean;
    }>;
    overallPassed: boolean;
  }> {
    const testCases = [
      {
        name: 'Player at top',
        playerValue: 100,
        comparisonValues: [90, 80, 70, 60, 50],
        expectedPercentile: 100,
        expectedRank: 1
      },
      {
        name: 'Player at bottom',
        playerValue: 40,
        comparisonValues: [90, 80, 70, 60, 50],
        expectedPercentile: 0,
        expectedRank: 6
      },
      {
        name: 'Player in middle',
        playerValue: 70,
        comparisonValues: [90, 80, 70, 60, 50],
        expectedPercentile: 60, // 3 out of 5 players have <= 70
        expectedRank: 3
      },
      {
        name: 'Tied values - multiple players with same score',
        playerValue: 70,
        comparisonValues: [90, 80, 70, 70, 70, 60, 50],
        expectedPercentile: 71.43, // 5 out of 7 players have <= 70
        expectedRank: 4 // Average of ranks 3, 4, 5 = 4
      },
      {
        name: 'All tied values',
        playerValue: 70,
        comparisonValues: [70, 70, 70, 70, 70],
        expectedPercentile: 100, // All players have <= 70
        expectedRank: 3 // Average of ranks 1, 2, 3, 4, 5 = 3
      },
      {
        name: 'Single comparison player',
        playerValue: 80,
        comparisonValues: [70],
        expectedPercentile: 100, // 1 out of 1 player has <= 80
        expectedRank: 1
      }
    ];

    const results = testCases.map(testCase => {
      const calculatedPercentile = this.calculateExpectedPercentile(
        testCase.playerValue,
        testCase.comparisonValues
      );
      const calculatedRank = this.calculateExpectedRank(
        testCase.playerValue,
        testCase.comparisonValues
      );

      const percentilePassed = Math.abs(calculatedPercentile - testCase.expectedPercentile) <= 0.1;
      const rankPassed = calculatedRank === testCase.expectedRank;
      const passed = percentilePassed && rankPassed;

      return {
        ...testCase,
        calculatedPercentile,
        calculatedRank,
        passed
      };
    });

    const overallPassed = results.every(result => result.passed);

    return {
      testCases: results,
      overallPassed
    };
  }

  /**
   * Create an analysis issue for percentile errors
   */
  private createPercentileIssue(report: PercentileValidationReport, context: AnalysisContext): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'high' as AnalysisSeverity,
      category: 'calculation',
      title: `Percentile calculation error in category: ${report.category}`,
      description: `Expected percentile ${report.expectedPercentile} but calculated ${report.calculatedPercentile}`,
      affectedComponent: `percentile-calculation-${report.category}`,
      expectedBehavior: `Percentile should be ${report.expectedPercentile}`,
      actualBehavior: `Percentile calculated as ${report.calculatedPercentile}`,
      recommendation: 'Review percentile calculation algorithm and tied values handling',
      timestamp: new Date(),
      metadata: {
        category: report.category,
        playerValue: report.playerValue,
        expectedPercentile: report.expectedPercentile,
        calculatedPercentile: report.calculatedPercentile,
        tiedValues: report.tiedValues,
        totalPlayers: report.totalPlayers
      }
    };
  }

  /**
   * Create an analysis issue for ranking errors
   */
  private createRankingIssue(report: RankingValidationReport, context: AnalysisContext): AnalysisIssue {
    return {
      id: uuidv4(),
      severity: 'high' as AnalysisSeverity,
      category: 'calculation',
      title: `Ranking calculation error in category: ${report.category}`,
      description: `Expected rank ${report.expectedRank} but calculated ${report.rank}`,
      affectedComponent: `ranking-calculation-${report.category}`,
      expectedBehavior: `Rank should be ${report.expectedRank}`,
      actualBehavior: `Rank calculated as ${report.rank}`,
      recommendation: 'Review ranking calculation algorithm and tied values handling',
      timestamp: new Date(),
      metadata: {
        category: report.category,
        playerValue: report.playerValue,
        expectedRank: report.expectedRank,
        calculatedRank: report.rank,
        tiedPlayersCount: report.tiedPlayersCount,
        totalPlayers: report.totalPlayers
      }
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    percentileReports: PercentileValidationReport[],
    rankingReports: RankingValidationReport[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for percentile calculation issues
    const incorrectPercentiles = percentileReports.filter(r => !r.isPercentileCorrect);
    if (incorrectPercentiles.length > 0) {
      recommendations.push(`Fix percentile calculation algorithm for ${incorrectPercentiles.length} categories`);
    }

    // Check for ranking calculation issues
    const incorrectRankings = rankingReports.filter(r => !r.isCorrect);
    if (incorrectRankings.length > 0) {
      recommendations.push(`Fix ranking calculation algorithm for ${incorrectRankings.length} categories`);
    }

    // Check for tied values handling issues
    const tiedValuesIssues = rankingReports.filter(r => 
      r.tiedPlayersCount > 1 && r.issues.some(issue => issue.includes('tied values'))
    );
    if (tiedValuesIssues.length > 0) {
      recommendations.push(`Improve tied values handling in ranking calculations`);
    }

    // Check for small comparison groups
    const smallGroups = percentileReports.filter(r => r.totalPlayers < 10);
    if (smallGroups.length > 0) {
      recommendations.push(`Consider expanding comparison groups (${smallGroups.length} categories have < 10 players)`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All percentile and ranking calculations are accurate');
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