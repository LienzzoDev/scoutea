/**
 * Cache Efficiency Analyzer Service
 * 
 * Analyzes cache performance, hit rates, and data consistency for radar data.
 * Requirements: 8.1, 8.5
 */

import { radarCacheService } from '../../cache/radar-cache-service';
import { RadarCalculationService } from '../../services/RadarCalculationService';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  RadarFilters,
  AnalysisContext,
  ValidationResult,
  AnalysisIssue,
  AnalysisSeverity
} from '../types';

export interface CacheEfficiencyAnalysisResult {
  overallStatus: ValidationResult;
  cacheHitRate: number;
  averageResponseTime: number;
  cacheConsistency: boolean;
  performanceGain: number;
  cacheMetrics: CacheMetrics;
  consistencyReport: ConsistencyReport;
  performanceComparison: PerformanceComparison;
  issues: AnalysisIssue[];
  recommendations: string[];
}

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageCacheResponseTime: number;
  averageFreshDataResponseTime: number;
  cacheSize: number;
  memoryUsage: number;
}

export interface ConsistencyReport {
  totalComparisons: number;
  consistentResults: number;
  inconsistentResults: number;
  consistencyRate: number;
  inconsistencies: DataInconsistency[];
}

export interface DataInconsistency {
  cacheKey: string;
  cachedData: unknown;
  freshData: unknown;
  difference: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PerformanceComparison {
  cacheEnabled: PerformanceMetrics;
  cacheDisabled: PerformanceMetrics;
  performanceGain: number;
  timesSaved: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  standardDeviation: number;
  totalRequests: number;
}

export class CacheEfficiencyAnalyzer {
  private radarService: RadarCalculationService;
  private performanceThresholds = {
    minCacheHitRate: 80, // 80% minimum hit rate as per requirement 8.1
    maxResponseTime: 2000, // 2 seconds max response time as per requirement 8.1
    maxInconsistencyRate: 5, // 5% maximum inconsistency rate
    minPerformanceGain: 50 // 50% minimum performance gain from caching
  };

  constructor() {
    this.radarService = new RadarCalculationService();
  }

  /**
   * Analyzes cache efficiency for radar data operations
   * Requirements: 8.1, 8.5
   */
  async analyzeCacheEfficiency(
    _playerId: string,
    testFilters: RadarFilters[],
    __context: AnalysisContext
  ): Promise<CacheEfficiencyAnalysisResult> {
    radarAnalysisLogger.logAnalysisStart(context);
    
    const issues: AnalysisIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Measure cache hit rate
      const cacheMetrics = await this.measureCacheMetrics(playerId, testFilters, context);
      
      // Test cache consistency
      const consistencyReport = await this.testCacheConsistency(playerId, testFilters, context);
      
      // Compare performance with and without cache
      const performanceComparison = await this.comparePerformance(playerId, testFilters, context);
      
      // Calculate overall metrics
      const cacheHitRate = cacheMetrics.hitRate;
      const averageResponseTime = cacheMetrics.averageCacheResponseTime;
      const cacheConsistency = consistencyReport.consistencyRate >= (100 - this.performanceThresholds.maxInconsistencyRate);
      const performanceGain = performanceComparison.performanceGain;

      // Generate issues based on thresholds
      if (cacheHitRate < this.performanceThresholds.minCacheHitRate) {
        issues.push(this.createCacheIssue(
          'low_cache_hit_rate',
          'medium',
          `Cache hit rate ${cacheHitRate.toFixed(1)}% is below threshold of ${this.performanceThresholds.minCacheHitRate}%`,
          context
        ));
        recommendations.push('Review cache TTL settings and cache key strategies');
        recommendations.push('Consider pre-warming cache for frequently accessed data');
      }

      if (averageResponseTime > this.performanceThresholds.maxResponseTime) {
        issues.push(this.createCacheIssue(
          'slow_cache_response',
          'high',
          `Average cache response time ${averageResponseTime}ms exceeds threshold of ${this.performanceThresholds.maxResponseTime}ms`,
          context
        ));
        recommendations.push('Optimize cache storage mechanism and data serialization');
      }

      if (!cacheConsistency) {
        issues.push(this.createCacheIssue(
          'cache_inconsistency',
          'critical',
          `Cache consistency rate ${consistencyReport.consistencyRate.toFixed(1)}% is below acceptable threshold`,
          context
        ));
        recommendations.push('Implement cache invalidation strategies');
        recommendations.push('Review cache update mechanisms for data changes');
      }

      if (performanceGain < this.performanceThresholds.minPerformanceGain) {
        issues.push(this.createCacheIssue(
          'low_performance_gain',
          'medium',
          `Cache performance gain ${performanceGain.toFixed(1)}% is below expected threshold of ${this.performanceThresholds.minPerformanceGain}%`,
          context
        ));
        recommendations.push('Analyze cache overhead and optimize cache operations');
      }

      // Determine overall status
      const overallStatus = this.determineOverallStatus(issues);

      return {
        overallStatus,
        cacheHitRate,
        averageResponseTime,
        cacheConsistency,
        performanceGain,
        cacheMetrics,
        consistencyReport,
        performanceComparison,
        issues,
        recommendations
      };

    } catch (_error) {
      const issue = this.createCacheIssue(
        'analysis_error',
        'critical',
        `Cache efficiency analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
      issues.push(issue);
      
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      
      return {
        overallStatus: 'fail',
        cacheHitRate: 0,
        averageResponseTime: -1,
        cacheConsistency: false,
        performanceGain: 0,
        cacheMetrics: this.getEmptyCacheMetrics(),
        consistencyReport: this.getEmptyConsistencyReport(),
        performanceComparison: this.getEmptyPerformanceComparison(),
        issues,
        recommendations: ['Fix analysis errors before proceeding with cache efficiency analysis']
      };
    }
  }

  /**
   * Measures cache hit rate and response times for different operations
   */
  private async measureCacheMetrics(
    _playerId: string,
    testFilters: RadarFilters[],
    __context: AnalysisContext
  ): Promise<CacheMetrics> {
    let totalRequests = 0;
    let cacheHits = 0;
    let cacheMisses = 0;
    let totalCacheResponseTime = 0;
    let totalFreshDataResponseTime = 0;

    // Test cache performance for different filter combinations
    for (const filters of testFilters) {
      totalRequests++;
      
      // Test cache hit
      const cacheStartTime = performance.now();
      const cachedData = await radarCacheService.getCachedComparisonGroup(filters);
      const cacheResponseTime = performance.now() - cacheStartTime;
      
      if (cachedData) {
        cacheHits++;
        totalCacheResponseTime += cacheResponseTime;
      } else {
        cacheMisses++;
        
        // Measure fresh data retrieval time
        const freshStartTime = performance.now();
        await this.radarService.getComparisonGroup(filters);
        const freshResponseTime = performance.now() - freshStartTime;
        totalFreshDataResponseTime += freshResponseTime;
      }
    }

    // Test radar data caching
    const radarCacheStartTime = performance.now();
    const cachedRadarData = await radarCacheService.getCachedRadarData(playerId, '2023-24');
    const radarCacheResponseTime = performance.now() - radarCacheStartTime;
    
    totalRequests++;
    if (cachedRadarData) {
      cacheHits++;
      totalCacheResponseTime += radarCacheResponseTime;
    } else {
      cacheMisses++;
      
      const freshRadarStartTime = performance.now();
      await this.radarService.calculatePlayerRadarWithComparison(playerId, {}, '2023-24');
      const freshRadarResponseTime = performance.now() - freshRadarStartTime;
      totalFreshDataResponseTime += freshRadarResponseTime;
    }

    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    const averageCacheResponseTime = cacheHits > 0 ? totalCacheResponseTime / cacheHits : 0;
    const averageFreshDataResponseTime = cacheMisses > 0 ? totalFreshDataResponseTime / cacheMisses : 0;

    return {
      totalRequests,
      cacheHits,
      cacheMisses,
      hitRate,
      averageCacheResponseTime,
      averageFreshDataResponseTime,
      cacheSize: await this.estimateCacheSize(),
      memoryUsage: await this.estimateMemoryUsage()
    };
  }

  /**
   * Tests cache consistency by comparing cached data with fresh data
   */
  private async testCacheConsistency(
    _playerId: string,
    testFilters: RadarFilters[],
    __context: AnalysisContext
  ): Promise<ConsistencyReport> {
    let totalComparisons = 0;
    let consistentResults = 0;
    let inconsistentResults = 0;
    const inconsistencies: DataInconsistency[] = [];

    // Test consistency for comparison groups
    for (const filters of testFilters) {
      totalComparisons++;
      
      const cachedData = await radarCacheService.getCachedComparisonGroup(filters);
      if (cachedData) {
        const freshData = await this.radarService.getComparisonGroup(filters);
        
        if (this.areArraysEqual(cachedData, freshData)) {
          consistentResults++;
        } else {
          inconsistentResults++;
          inconsistencies.push({
            cacheKey: this.generateCacheKey('comparison_group', filters),
            cachedData,
            freshData,
            difference: `Cached: ${cachedData.length} items, Fresh: ${freshData.length} items`,
            severity: this.calculateInconsistencySeverity(cachedData, freshData)
          });
        }
      }
    }

    // Test consistency for radar data
    totalComparisons++;
    const cachedRadarData = await radarCacheService.getCachedRadarData(playerId, '2023-24');
    if (cachedRadarData) {
      const freshRadarData = await this.radarService.calculatePlayerRadarWithComparison(playerId, {}, '2023-24');
      
      if (this.areRadarDataEqual(cachedRadarData.categories, freshRadarData)) {
        consistentResults++;
      } else {
        inconsistentResults++;
        inconsistencies.push({
          cacheKey: this.generateCacheKey('radar_data', { playerId }),
          cachedData: cachedRadarData.categories,
          freshData: freshRadarData,
          difference: 'Radar data values differ between cached and fresh data',
          severity: 'high'
        });
      }
    }

    const consistencyRate = totalComparisons > 0 ? (consistentResults / totalComparisons) * 100 : 100;

    return {
      totalComparisons,
      consistentResults,
      inconsistentResults,
      consistencyRate,
      inconsistencies
    };
  }

  /**
   * Compares performance with and without cache
   */
  private async comparePerformance(
    _playerId: string,
    testFilters: RadarFilters[],
    __context: AnalysisContext
  ): Promise<PerformanceComparison> {
    const cacheEnabledMetrics = await this.measurePerformanceWithCache(playerId, testFilters);
    const cacheDisabledMetrics = await this.measurePerformanceWithoutCache(playerId, testFilters);
    
    const performanceGain = cacheDisabledMetrics.averageResponseTime > 0 
      ? ((cacheDisabledMetrics.averageResponseTime - cacheEnabledMetrics.averageResponseTime) / cacheDisabledMetrics.averageResponseTime) * 100
      : 0;
    
    const timesSaved = cacheDisabledMetrics.averageResponseTime > 0 
      ? cacheDisabledMetrics.averageResponseTime / cacheEnabledMetrics.averageResponseTime
      : 1;

    return {
      cacheEnabled: cacheEnabledMetrics,
      cacheDisabled: cacheDisabledMetrics,
      performanceGain,
      timesSaved
    };
  }

  /**
   * Measures performance with cache enabled
   */
  private async measurePerformanceWithCache(
    _playerId: string,
    testFilters: RadarFilters[]
  ): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];

    for (const filters of testFilters) {
      const startTime = performance.now();
      
      // Try cache first, then fresh data if not cached
      let cachedData = await radarCacheService.getCachedComparisonGroup(filters);
      if (!cachedData) {
        cachedData = await this.radarService.getComparisonGroup(filters);
      }
      
      const responseTime = performance.now() - startTime;
      responseTimes.push(responseTime);
    }

    // Test radar data with cache
    const radarStartTime = performance.now();
    const cachedRadarData = await radarCacheService.getCachedRadarData(playerId, '2023-24');
    if (!cachedRadarData) {
      await this.radarService.calculatePlayerRadarWithComparison(playerId, {}, '2023-24');
    }
    const radarResponseTime = performance.now() - radarStartTime;
    responseTimes.push(radarResponseTime);

    return this.calculatePerformanceMetrics(responseTimes);
  }

  /**
   * Measures performance without cache (fresh data only)
   */
  private async measurePerformanceWithoutCache(
    _playerId: string,
    testFilters: RadarFilters[]
  ): Promise<PerformanceMetrics> {
    const responseTimes: number[] = [];

    for (const filters of testFilters) {
      const startTime = performance.now();
      await this.radarService.getComparisonGroup(filters);
      const responseTime = performance.now() - startTime;
      responseTimes.push(responseTime);
    }

    // Test radar data without cache
    const radarStartTime = performance.now();
    await this.radarService.calculatePlayerRadarWithComparison(playerId, {}, '2023-24');
    const radarResponseTime = performance.now() - radarStartTime;
    responseTimes.push(radarResponseTime);

    return this.calculatePerformanceMetrics(responseTimes);
  }

  /**
   * Helper methods
   */
  private calculatePerformanceMetrics(responseTimes: number[]): PerformanceMetrics {
    if (responseTimes.length === 0) {
      return {
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        standardDeviation: 0,
        totalRequests: 0
      };
    }

    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / responseTimes.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      averageResponseTime: average,
      minResponseTime: min,
      maxResponseTime: max,
      standardDeviation,
      totalRequests: responseTimes.length
    };
  }

  private areArraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }

  private areRadarDataEqual(cached: unknown[], fresh: unknown[]): boolean {
    if (cached.length !== fresh.length) return false;
    
    return cached.every((cachedItem, index) => {
      const freshItem = fresh[index];
      return cachedItem.category === freshItem.category &&
             Math.abs(cachedItem.playerValue - freshItem.playerValue) < 0.01 &&
             Math.abs(cachedItem.comparisonAverage - freshItem.comparisonAverage) < 0.01;
    });
  }

  private calculateInconsistencySeverity(cached: unknown, fresh: unknown): 'low' | 'medium' | 'high' {
    if (Array.isArray(cached) && Array.isArray(fresh)) {
      const sizeDifference = Math.abs(cached.length - fresh.length);
      if (sizeDifference === 0) return 'low';
      if (sizeDifference <= 2) return 'medium';
      return 'high';
    }
    return 'medium';
  }

  private generateCacheKey(type: string, data: unknown): string {
    return `${type}_${JSON.stringify(data)}`;
  }

  private async estimateCacheSize(): Promise<number> {
    // In a real implementation, this would query the actual cache size
    return 1024 * 1024; // 1MB simulated
  }

  private async estimateMemoryUsage(): Promise<number> {
    // In a real implementation, this would measure actual memory usage
    return 512 * 1024; // 512KB simulated
  }

  private determineOverallStatus(issues: AnalysisIssue[]): ValidationResult {
    if (issues.some(issue => issue.severity === 'critical')) return 'fail';
    if (issues.some(issue => issue.severity === 'high')) return 'fail';
    if (issues.some(issue => issue.severity === 'medium')) return 'warning';
    return 'pass';
  }

  private createCacheIssue(
    id: string,
    severity: AnalysisSeverity,
    description: string,
    __context: AnalysisContext
  ): AnalysisIssue {
    return {
      id: `${context.analysisId}_${id}`,
      severity,
      category: 'performance',
      title: `Cache Efficiency Issue: ${id}`,
      description,
      affectedComponent: 'CacheEfficiencyAnalyzer',
      expectedBehavior: 'Cache should provide efficient and consistent data access',
      actualBehavior: description,
      recommendation: 'Review and optimize cache configuration and strategies',
      timestamp: new Date()
    };
  }

  private getEmptyCacheMetrics(): CacheMetrics {
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageCacheResponseTime: 0,
      averageFreshDataResponseTime: 0,
      cacheSize: 0,
      memoryUsage: 0
    };
  }

  private getEmptyConsistencyReport(): ConsistencyReport {
    return {
      totalComparisons: 0,
      consistentResults: 0,
      inconsistentResults: 0,
      consistencyRate: 0,
      inconsistencies: []
    };
  }

  private getEmptyPerformanceComparison(): PerformanceComparison {
    const emptyMetrics: PerformanceMetrics = {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      standardDeviation: 0,
      totalRequests: 0
    };

    return {
      cacheEnabled: emptyMetrics,
      cacheDisabled: emptyMetrics,
      performanceGain: 0,
      timesSaved: 0
    };
  }
}

// Export singleton instance
export const cacheEfficiencyAnalyzer = new CacheEfficiencyAnalyzer();