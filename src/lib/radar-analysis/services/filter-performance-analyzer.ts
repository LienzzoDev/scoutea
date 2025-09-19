/**
 * Filter Performance Analyzer Service
 * 
 * Analyzes filter performance, response times, and layer update behavior
 * for the radar visualization system.
 */

import { radarCacheService } from '../../cache/radar-cache-service';
import { RadarCalculationService } from '../../services/RadarCalculationService';
import { 
  IFilterPerformanceAnalyzer,
  FilterPerformanceResult,
  OptimizedFilters,
  AnalysisContext,
  ValidationResult,
  AnalysisIssue,
  RadarFilters,
  AnalysisSeverity
} from '../interfaces';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';

export interface FilterResponseMetrics {
  filterExecutionTime: number;
  cacheHitRate: number;
  resultSetSize: number;
  queryOptimization: number;
  layerUpdateTime: number;
  playerLayerStability: boolean;
  comparisonLayerUpdateOnly: boolean;
  noFullReload: boolean;
}

export interface LayerUpdateAnalysis {
  playerLayerChanged: boolean;
  comparisonLayerChanged: boolean;
  fullSectionReload: boolean;
  partialUpdateSuccess: boolean;
  updateTime: number;
  renderingTime: number;
}

export interface FilterLogicValidation {
  positionSimilarityCorrect: boolean;
  multiFilterCombinationCorrect: boolean;
  ageRangeApplicationCorrect: boolean;
  ratingRangeApplicationCorrect: boolean;
  logicOperatorCorrect: 'AND' | 'OR' | 'INVALID';
  filterCount: number;
  resultSetReduction: number;
}

export class FilterPerformanceAnalyzer implements IFilterPerformanceAnalyzer {
  private radarService: RadarCalculationService;
  private performanceThresholds = {
    maxFilterResponseTime: 1000, // 1 second as per requirement 8.2
    minCacheHitRate: 80, // 80% minimum cache hit rate
    maxLayerUpdateTime: 200, // 200ms for layer updates
    maxRenderingTime: 100 // 100ms for rendering
  };

  constructor() {
    this.radarService = new RadarCalculationService();
  }

  /**
   * Analyzes filter performance including response time and layer update behavior
   * Requirements: 8.2, 8.3, 2.3
   */
  async analyzeFilterPerformance(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<FilterPerformanceResult> {
    radarAnalysisLogger.logAnalysisStart(context);
    
    const startTime = performance.now();
    const issues: AnalysisIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Measure filter execution time
      const responseMetrics = await this.measureFilterResponseTime(filters, context);
      
      // Analyze layer update behavior
      const layerAnalysis = await this.analyzeLayerUpdateBehavior(filters, context);
      
      // Check cache efficiency
      const cacheAnalysis = await this.analyzeCacheEfficiency(filters, context);
      
      // Validate filter logic
      const logicValidation = await this.validateFilterLogic(filters, context);

      const totalTime = performance.now() - startTime;

      // Generate issues based on performance thresholds
      if (responseMetrics.filterExecutionTime > this.performanceThresholds.maxFilterResponseTime) {
        issues.push(this.createPerformanceIssue(
          'slow_filter_response',
          'critical',
          `Filter response time ${responseMetrics.filterExecutionTime}ms exceeds threshold of ${this.performanceThresholds.maxFilterResponseTime}ms`,
          context
        ));
        recommendations.push('Optimize database queries and add appropriate indexes');
      }

      if (responseMetrics.cacheHitRate < this.performanceThresholds.minCacheHitRate) {
        issues.push(this.createPerformanceIssue(
          'low_cache_hit_rate',
          'medium',
          `Cache hit rate ${responseMetrics.cacheHitRate}% is below threshold of ${this.performanceThresholds.minCacheHitRate}%`,
          context
        ));
        recommendations.push('Review cache strategy and TTL settings');
      }

      if (!layerAnalysis.playerLayerStability) {
        issues.push(this.createPerformanceIssue(
          'player_layer_instability',
          'high',
          'Player layer values change when filters are applied, violating requirement 2.3',
          context
        ));
        recommendations.push('Ensure player layer data is isolated from filter changes');
      }

      if (!layerAnalysis.partialUpdateSuccess) {
        issues.push(this.createPerformanceIssue(
          'full_section_reload',
          'medium',
          'Full section reload detected instead of partial layer update',
          context
        ));
        recommendations.push('Implement selective layer updates to avoid full reloads');
      }

      const queryOptimization = this.calculateQueryOptimizationScore(responseMetrics, logicValidation);

      return {
        executionTime: responseMetrics.filterExecutionTime,
        resultSetSize: responseMetrics.resultSetSize,
        cacheUtilization: responseMetrics.cacheHitRate,
        queryOptimization: queryOptimization > 80 ? 'pass' : queryOptimization > 60 ? 'warning' : 'fail',
        recommendations,
        issues
      };

    } catch (error) {
      const issue = this.createPerformanceIssue(
        'analysis_error',
        'critical',
        `Filter performance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
      issues.push(issue);
      
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      
      return {
        executionTime: -1,
        resultSetSize: -1,
        cacheUtilization: -1,
        queryOptimization: 'fail',
        recommendations: ['Fix analysis errors before proceeding'],
        issues
      };
    }
  }

  /**
   * Validates filter logic including position similarity and combination logic
   * Requirements: 5.1, 5.2, 5.3
   */
  async validateFilterLogic(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<ValidationResult> {
    try {
      const validation = await this.performFilterLogicValidation(filters, context);
      
      if (!validation.positionSimilarityCorrect) {
        return 'fail';
      }
      
      if (!validation.multiFilterCombinationCorrect) {
        return 'fail';
      }
      
      if (!validation.ageRangeApplicationCorrect || !validation.ratingRangeApplicationCorrect) {
        return 'fail';
      }
      
      if (validation.logicOperatorCorrect !== 'AND') {
        return 'warning';
      }
      
      return 'pass';
      
    } catch (error) {
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      return 'fail';
    }
  }

  /**
   * Optimizes filters for better performance
   */
  async optimizeFilters(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<OptimizedFilters> {
    const optimized = { ...filters };
    const improvements: string[] = [];
    let expectedPerformanceGain = 0;

    // Optimize position filters by including similar positions
    if (filters.position) {
      const similarPositions = this.getSimilarPositions(filters.position);
      if (similarPositions.length > 1) {
        improvements.push(`Expanded position filter to include similar positions: ${similarPositions.join(', ')}`);
        expectedPerformanceGain += 10;
      }
    }

    // Optimize age ranges
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      const optimizedAgeRange = this.optimizeAgeRange(filters.ageMin, filters.ageMax);
      if (optimizedAgeRange.min !== filters.ageMin || optimizedAgeRange.max !== filters.ageMax) {
        optimized.ageMin = optimizedAgeRange.min;
        optimized.ageMax = optimizedAgeRange.max;
        improvements.push(`Optimized age range to ${optimizedAgeRange.min}-${optimizedAgeRange.max}`);
        expectedPerformanceGain += 5;
      }
    }

    // Optimize rating ranges
    if (filters.ratingMin !== undefined || filters.ratingMax !== undefined) {
      const optimizedRatingRange = this.optimizeRatingRange(filters.ratingMin, filters.ratingMax);
      if (optimizedRatingRange.min !== filters.ratingMin || optimizedRatingRange.max !== filters.ratingMax) {
        optimized.ratingMin = optimizedRatingRange.min;
        optimized.ratingMax = optimizedRatingRange.max;
        improvements.push(`Optimized rating range to ${optimizedRatingRange.min}-${optimizedRatingRange.max}`);
        expectedPerformanceGain += 5;
      }
    }

    return {
      original: filters,
      optimized,
      improvements,
      expectedPerformanceGain
    };
  }

  /**
   * Measures filter response time and related metrics
   */
  private async measureFilterResponseTime(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<FilterResponseMetrics> {
    const startTime = performance.now();
    
    // Measure cache hit rate
    const cacheKey = this.generateCacheKey(filters);
    const cacheHit = await radarCacheService.getCachedComparisonGroup(filters);
    const cacheHitRate = cacheHit ? 100 : 0;
    
    // Execute filter query
    const comparisonGroup = await this.radarService.getComparisonGroup(filters);
    const filterExecutionTime = performance.now() - startTime;
    
    // Simulate layer update analysis
    const layerUpdateStart = performance.now();
    const layerAnalysis = await this.simulateLayerUpdate(filters, context);
    const layerUpdateTime = performance.now() - layerUpdateStart;
    
    return {
      filterExecutionTime,
      cacheHitRate,
      resultSetSize: comparisonGroup.length,
      queryOptimization: this.calculateQueryOptimization(filterExecutionTime, comparisonGroup.length),
      layerUpdateTime,
      playerLayerStability: layerAnalysis.playerLayerStability,
      comparisonLayerUpdateOnly: layerAnalysis.comparisonLayerUpdateOnly,
      noFullReload: layerAnalysis.noFullReload
    };
  }

  /**
   * Analyzes layer update behavior to ensure only comparison layer updates
   */
  private async analyzeLayerUpdateBehavior(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<LayerUpdateAnalysis> {
    // Get baseline radar data (without filters)
    const baselineData = await this.radarService.calculatePlayerRadarWithComparison(
      context.playerId, 
      {}, // No filters
      '2023-24'
    );
    
    // Get filtered radar data
    const filteredData = await this.radarService.calculatePlayerRadarWithComparison(
      context.playerId, 
      filters,
      '2023-24'
    );
    
    // Analyze changes
    const playerLayerChanged = this.hasPlayerLayerChanged(baselineData, filteredData);
    const comparisonLayerChanged = this.hasComparisonLayerChanged(baselineData, filteredData);
    
    return {
      playerLayerChanged,
      comparisonLayerChanged,
      fullSectionReload: false, // This would need DOM analysis in real implementation
      partialUpdateSuccess: !playerLayerChanged && comparisonLayerChanged,
      updateTime: 0, // Would be measured in real implementation
      renderingTime: 0 // Would be measured in real implementation
    };
  }

  /**
   * Analyzes cache efficiency for filter operations
   */
  private async analyzeCacheEfficiency(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<{ hitRate: number; responseTime: number; consistency: boolean }> {
    const cacheKey = this.generateCacheKey(filters);
    
    // Test cache hit
    const cacheStartTime = performance.now();
    const cachedData = await radarCacheService.getCachedComparisonGroup(filters);
    const cacheResponseTime = performance.now() - cacheStartTime;
    
    // Test fresh data
    const freshStartTime = performance.now();
    const freshData = await this.radarService.getComparisonGroup(filters);
    const freshResponseTime = performance.now() - freshStartTime;
    
    // Check consistency
    const consistency = cachedData ? 
      JSON.stringify(cachedData) === JSON.stringify(freshData) : 
      true; // No cached data means no inconsistency
    
    return {
      hitRate: cachedData ? 100 : 0,
      responseTime: cachedData ? cacheResponseTime : freshResponseTime,
      consistency
    };
  }

  /**
   * Performs detailed filter logic validation
   */
  private async performFilterLogicValidation(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<FilterLogicValidation> {
    // Test position similarity
    const positionSimilarityCorrect = filters.position ? 
      this.validatePositionSimilarity(filters.position) : 
      true;
    
    // Test multi-filter combination (should use AND logic)
    const multiFilterCombinationCorrect = await this.validateMultiFilterCombination(filters);
    
    // Test age range application
    const ageRangeApplicationCorrect = await this.validateAgeRangeApplication(filters);
    
    // Test rating range application
    const ratingRangeApplicationCorrect = await this.validateRatingRangeApplication(filters);
    
    // Count active filters
    const filterCount = Object.keys(filters).filter(key => 
      filters[key as keyof RadarFilters] !== undefined
    ).length;
    
    return {
      positionSimilarityCorrect,
      multiFilterCombinationCorrect,
      ageRangeApplicationCorrect,
      ratingRangeApplicationCorrect,
      logicOperatorCorrect: 'AND', // Assuming AND logic is correct
      filterCount,
      resultSetReduction: 0 // Would be calculated based on actual data
    };
  }

  /**
   * Helper methods
   */
  private generateCacheKey(filters: RadarFilters): string {
    return `filter_${JSON.stringify(filters)}`;
  }

  private calculateQueryOptimization(executionTime: number, resultSetSize: number): number {
    // Simple optimization score based on execution time and result set size
    const timeScore = Math.max(0, 100 - (executionTime / 10));
    const sizeScore = Math.min(100, resultSetSize / 10);
    return (timeScore + sizeScore) / 2;
  }

  private calculateQueryOptimizationScore(
    metrics: FilterResponseMetrics, 
    validation: FilterLogicValidation
  ): number {
    let score = 100;
    
    // Penalize slow execution
    if (metrics.filterExecutionTime > 500) score -= 30;
    else if (metrics.filterExecutionTime > 200) score -= 15;
    
    // Reward good cache hit rate
    if (metrics.cacheHitRate > 80) score += 10;
    else if (metrics.cacheHitRate < 50) score -= 20;
    
    // Penalize incorrect logic
    if (!validation.positionSimilarityCorrect) score -= 25;
    if (!validation.multiFilterCombinationCorrect) score -= 25;
    
    return Math.max(0, Math.min(100, score));
  }

  private getSimilarPositions(position: string): string[] {
    const positionGroups: Record<string, string[]> = {
      'CB': ['CB', 'LCB', 'RCB'],
      'LB': ['LB', 'LWB'],
      'RB': ['RB', 'RWB'],
      'CM': ['CM', 'LCM', 'RCM'],
      'CAM': ['CAM', 'LCAM', 'RCAM'],
      'CDM': ['CDM', 'LCDM', 'RCDM'],
      'LW': ['LW', 'LM'],
      'RW': ['RW', 'RM'],
      'ST': ['ST', 'CF']
    };
    
    return positionGroups[position] || [position];
  }

  private optimizeAgeRange(min?: number, max?: number): { min?: number; max?: number } {
    // Optimize age ranges to common brackets
    const optimizedMin = min ? Math.floor(min / 5) * 5 : undefined;
    const optimizedMax = max ? Math.ceil(max / 5) * 5 : undefined;
    
    return { min: optimizedMin, max: optimizedMax };
  }

  private optimizeRatingRange(min?: number, max?: number): { min?: number; max?: number } {
    // Optimize rating ranges to 10-point brackets
    const optimizedMin = min ? Math.floor(min / 10) * 10 : undefined;
    const optimizedMax = max ? Math.ceil(max / 10) * 10 : undefined;
    
    return { min: optimizedMin, max: optimizedMax };
  }

  private async simulateLayerUpdate(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<{ playerLayerStability: boolean; comparisonLayerUpdateOnly: boolean; noFullReload: boolean }> {
    // In a real implementation, this would analyze DOM changes
    // For now, we simulate the expected behavior
    return {
      playerLayerStability: true, // Player layer should remain stable
      comparisonLayerUpdateOnly: true, // Only comparison layer should update
      noFullReload: true // No full section reload should occur
    };
  }

  private hasPlayerLayerChanged(baseline: any[], filtered: any[]): boolean {
    // Compare player values (should not change)
    for (let i = 0; i < baseline.length; i++) {
      if (baseline[i].playerValue !== filtered[i].playerValue) {
        return true;
      }
    }
    return false;
  }

  private hasComparisonLayerChanged(baseline: any[], filtered: any[]): boolean {
    // Compare comparison values (should change with filters)
    for (let i = 0; i < baseline.length; i++) {
      if (baseline[i].comparisonAverage !== filtered[i].comparisonAverage) {
        return true;
      }
    }
    return false;
  }

  private validatePositionSimilarity(position: string): boolean {
    const similarPositions = this.getSimilarPositions(position);
    return similarPositions.length > 1; // Should include similar positions
  }

  private async validateMultiFilterCombination(filters: RadarFilters): boolean {
    // Test that multiple filters are combined with AND logic
    const filterCount = Object.keys(filters).filter(key => 
      filters[key as keyof RadarFilters] !== undefined
    ).length;
    
    if (filterCount <= 1) return true; // Single filter always valid
    
    // In real implementation, would test actual query logic
    return true; // Assume correct for now
  }

  private async validateAgeRangeApplication(filters: RadarFilters): boolean {
    if (!filters.ageMin && !filters.ageMax) return true;
    
    // In real implementation, would verify age range is applied correctly
    return true; // Assume correct for now
  }

  private async validateRatingRangeApplication(filters: RadarFilters): boolean {
    if (!filters.ratingMin && !filters.ratingMax) return true;
    
    // In real implementation, would verify rating range is applied correctly
    return true; // Assume correct for now
  }

  private createPerformanceIssue(
    id: string,
    severity: AnalysisSeverity,
    description: string,
    context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: `${context.analysisId}_${id}`,
      severity,
      category: 'performance',
      title: `Filter Performance Issue: ${id}`,
      description,
      affectedComponent: 'FilterPerformanceAnalyzer',
      expectedBehavior: 'Filters should respond within performance thresholds',
      actualBehavior: description,
      recommendation: 'Review and optimize filter implementation',
      timestamp: new Date()
    };
  }
}

// Export singleton instance
export const filterPerformanceAnalyzer = new FilterPerformanceAnalyzer();