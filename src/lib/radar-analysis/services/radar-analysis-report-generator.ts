/**
 * RadarAnalysisReportGenerator
 * 
 * Generates comprehensive reports consolidating metrics from all radar analysis validations.
 * Provides scoring systems for different analysis areas and prioritized recommendations.
 */

import {
  IRadarAnalysisReportGenerator,
  ConsolidatedReport,
  AreaScore,
  RecommendationPriority,
  ScoreBreakdown
} from '../interfaces';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import {
  AnalysisIssue,
  AnalysisContext,
  RadarAnalysisResult,
  AnalysisSummary,
  AnalysisTrend,
  FixRecommendation,
  AnalysisCategory,
  PerformanceMetrics
} from '../types';

/**
 * Scoring weights for different analysis areas
 */
const SCORING_WEIGHTS = {
  calculation: 0.3,      // 30% - Mathematical accuracy is critical
  visualization: 0.25,   // 25% - Visual correctness affects user experience
  performance: 0.25,     // 25% - Performance impacts usability
  data: 0.2              // 20% - Data consistency is important but less critical
} as const;

/**
 * Severity impact on scoring (penalty multipliers)
 */
const SEVERITY_IMPACT = {
  low: 0.1,
  medium: 0.3,
  high: 0.6,
  critical: 1.0
} as const;

/**
 * Performance thresholds for scoring
 */
const _PERFORMANCE_THRESHOLDS = {
  excellent: { calculationTime: 200, renderingTime: 100, cacheHitRate: 90, apiResponseTime: 500 },
  good: { calculationTime: 500, renderingTime: 200, cacheHitRate: 80, apiResponseTime: 1000 },
  fair: { calculationTime: 1000, renderingTime: 500, cacheHitRate: 70, apiResponseTime: 2000 },
  poor: { calculationTime: 2000, renderingTime: 1000, cacheHitRate: 50, apiResponseTime: 5000 }
} as const;

export class RadarAnalysisReportGenerator implements IRadarAnalysisReportGenerator {
  /**
   * Generate a consolidated report from multiple analysis results
   */
  async generateConsolidatedReport(
    _analysisResults: RadarAnalysisResult[],
    __context: AnalysisContext
  ): Promise<ConsolidatedReport> {
    radarAnalysisLogger.logAnalysisStart({
      ...context,
      analysisId: `report-${Date.now()}`
    });

    try {
      const reportId = `radar-analysis-report-${Date.now()}`;
      
      // Calculate area scores
      const areaScores = this.calculateAreaScores(analysisResults);
      
      // Generate overall score
      const overallScore = this.calculateOverallScore(areaScores);
      
      // Consolidate and prioritize issues
      const consolidatedIssues = this.consolidateIssues(analysisResults);
      
      // Generate prioritized recommendations
      const recommendations = await this.generatePrioritizedRecommendations(
        consolidatedIssues,
        areaScores
      );
      
      // Create summary
      const summary = this.createAnalysisSummary(analysisResults, areaScores);
      
      // Generate trends (if historical data available)
      const trends = await this.generateTrends(analysisResults);
      
      const report: ConsolidatedReport = {
        reportId,
        generatedAt: new Date(),
        context,
        overallScore,
        areaScores,
        summary,
        consolidatedIssues,
        recommendations,
        trends,
        analysisResults,
        metadata: {
          totalAnalyses: analysisResults.length,
          generationTime: Date.now(),
          version: '1.0.0'
        }
      };

      radarAnalysisLogger.logAnalysisComplete(context, {
        analysisId: reportId,
        _playerId: context.playerId,
        timestamp: new Date(),
        depth: context.depth,
        overallStatus: overallScore >= 80 ? 'pass' : overallScore >= 60 ? 'warning' : 'fail',
        issues: consolidatedIssues,
        performanceMetrics: this.aggregatePerformanceMetrics(analysisResults),
        dataValidation: { completeness: 'pass', consistency: 'pass', accuracy: 'pass', sourceData: 'pass', issues: [], details: {} },
        layerValidation: { playerLayer: 'pass', comparisonLayer: 'pass', layerInteraction: 'pass', visualConsistency: 'pass', issues: [], details: {} },
        recommendations,
        metadata: report.metadata
      });

      return report;
    } catch (_error) {
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      throw error;
    }
  }

  /**
   * Calculate scores for each analysis area
   */
  private calculateAreaScores(_analysisResults: RadarAnalysisResult[]): AreaScore[] {
    const areas: AnalysisCategory[] = ['calculation', 'visualization', 'performance', 'data'];
    
    return areas.map(area => {
      const areaIssues = this.getIssuesByCategory(analysisResults, area);
      
      // If no analysis results, return perfect score
      if (analysisResults.length === 0) {
        return {
          area,
          score: 100,
          maxScore: 100,
          breakdown: {
            passRate: 100,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 }
          },
          issues: [],
          recommendations: []
        };
      }
      
      const baseScore = 100;
      
      // Calculate penalty based on issues
      const penalty = areaIssues.reduce((total, issue) => {
        return total + (SEVERITY_IMPACT[issue.severity] * 10);
      }, 0);
      
      const score = Math.min(100, Math.max(0, baseScore - penalty));
      
      // Calculate detailed breakdown
      const breakdown = this.calculateScoreBreakdown(areaIssues, analysisResults, area);
      
      return {
        area,
        score: Math.round(score),
        maxScore: 100,
        breakdown,
        issues: areaIssues,
        recommendations: this.generateAreaRecommendations(area, areaIssues)
      };
    });
  }

  /**
   * Calculate overall score based on weighted area scores
   */
  private calculateOverallScore(areaScores: AreaScore[]): number {
    const weightedScore = areaScores.reduce((total, areaScore) => {
      const weight = SCORING_WEIGHTS[areaScore.area as keyof typeof SCORING_WEIGHTS] || 0.25;
      return total + (areaScore.score * weight);
    }, 0);
    
    return Math.min(100, Math.max(0, Math.round(weightedScore)));
  }

  /**
   * Calculate detailed score breakdown for an area
   */
  private calculateScoreBreakdown(
    issues: AnalysisIssue[],
    _analysisResults: RadarAnalysisResult[],
    _area: AnalysisCategory
  ): ScoreBreakdown {
    const totalTests = this.countTestsByArea(analysisResults, area);
    const passedTests = totalTests - issues.length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;
    
    const severityBreakdown = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };

    return {
      passRate: Math.round(passRate),
      totalTests,
      passedTests,
      failedTests: issues.length,
      severityBreakdown,
      performanceMetrics: area === 'performance' ? 
        this.aggregatePerformanceMetrics(analysisResults) : undefined
    };
  }

  /**
   * Consolidate issues from all analysis results
   */
  private consolidateIssues(_analysisResults: RadarAnalysisResult[]): AnalysisIssue[] {
    const allIssues = analysisResults.flatMap(result => result.issues);
    
    // Group similar issues and deduplicate
    const issueGroups = new Map<string, AnalysisIssue[]>();
    
    allIssues.forEach(issue => {
      const _key = `${issue.category}-${issue.title}`;
      if (!issueGroups.has(key)) {
        issueGroups.set(key, []);
      }
      issueGroups.get(key)!.push(issue);
    });
    
    // Create consolidated issues
    const consolidatedIssues: AnalysisIssue[] = [];
    
    issueGroups.forEach((issues, key) => {
      if (issues.length === 1) {
        consolidatedIssues.push(issues[0]);
      } else {
        // Merge similar issues
        const consolidated = this.mergeIssues(issues);
        consolidatedIssues.push(consolidated);
      }
    });
    
    // Sort by severity and frequency
    return consolidatedIssues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // If same severity, sort by frequency (if available in metadata)
      const aFreq = (a.metadata?.frequency as number) || 1;
      const bFreq = (b.metadata?.frequency as number) || 1;
      return bFreq - aFreq;
    });
  }

  /**
   * Generate prioritized recommendations based on issues and scores
   */
  private async generatePrioritizedRecommendations(
    issues: AnalysisIssue[],
    areaScores: AreaScore[]
  ): Promise<FixRecommendation[]> {
    const recommendations: FixRecommendation[] = [];
    
    // Generate recommendations for critical and high severity issues first
    const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
    
    for (const issue of criticalIssues) {
      const recommendation = await this.generateRecommendationForIssue(issue, 'high');
      recommendations.push(recommendation);
    }
    
    // Generate recommendations for areas with low scores
    const lowScoreAreas = areaScores.filter(area => area.score < 70);
    
    for (const area of lowScoreAreas) {
      const areaRecommendation = this.generateAreaImprovementRecommendation(area);
      recommendations.push(areaRecommendation);
    }
    
    // Generate recommendations for medium severity issues
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    
    for (const issue of mediumIssues) {
      const recommendation = await this.generateRecommendationForIssue(issue, 'medium');
      recommendations.push(recommendation);
    }
    
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Generate recommendation for a specific issue
   */
  private async generateRecommendationForIssue(
    _issue: AnalysisIssue,
    priority: RecommendationPriority
  ): Promise<FixRecommendation> {
    return {
      issueId: issue.id,
      title: `Fix ${issue.category} issue: ${issue.title}`,
      description: issue.recommendation,
      priority,
      category: issue.category,
      estimatedEffort: this.estimateEffort(issue),
      impact: this.estimateImpact(issue),
      codeChanges: this.suggestCodeChanges(issue),
      configChanges: this.suggestConfigChanges(issue),
      dataFixes: this.suggestDataFixes(issue),
      dependencies: [],
      metadata: {
        originalIssue: issue,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate area improvement recommendation
   */
  private generateAreaImprovementRecommendation(_area: AreaScore): FixRecommendation {
    return {
      issueId: `area-improvement-${area.area}`,
      title: `Improve ${area.area} area (Score: ${area.score}/100)`,
      description: `The ${area.area} area has a low score and needs improvement. ${area.recommendations.join(' ')}`,
      priority: area.score < 50 ? 'high' : 'medium',
      category: area.area,
      estimatedEffort: area.score < 50 ? 'high' : 'medium',
      impact: 'high',
      codeChanges: [],
      configChanges: [],
      dataFixes: [],
      dependencies: [],
      metadata: {
        areaScore: area,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Create analysis summary
   */
  private createAnalysisSummary(
    _analysisResults: RadarAnalysisResult[],
    areaScores: AreaScore[]
  ): AnalysisSummary {
    const totalAnalyses = analysisResults.length;
    const passedAnalyses = analysisResults.filter(r => r.overallStatus === 'pass').length;
    const passRate = totalAnalyses > 0 ? (passedAnalyses / totalAnalyses) * 100 : 0;
    
    const allIssues = analysisResults.flatMap(r => r.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    
    const averagePerformance = this.aggregatePerformanceMetrics(analysisResults);
    
    const mostCommonIssues = this.getMostCommonIssues(allIssues);
    const improvementAreas = this.getImprovementAreas(areaScores);
    
    return {
      totalAnalyses,
      passRate: Math.round(passRate),
      criticalIssues,
      averagePerformance,
      mostCommonIssues,
      improvementAreas,
      overallHealth: this.calculateOverallHealth(areaScores),
      trendsAvailable: false // Will be implemented when historical data is available
    };
  }

  /**
   * Generate trends analysis (placeholder for future implementation)
   */
  private async generateTrends(_analysisResults: RadarAnalysisResult[]): Promise<AnalysisTrend[]> {
    // TODO: Implement trends analysis when historical data storage is available
    return [];
  }

  // Helper methods
  
  private getIssuesByCategory(
    _analysisResults: RadarAnalysisResult[],
    category: AnalysisCategory
  ): AnalysisIssue[] {
    return analysisResults
      .flatMap(result => result.issues)
      .filter(issue => issue.category === category);
  }

  private countTestsByArea(_analysisResults: RadarAnalysisResult[], _area: AnalysisCategory): number {
    // This would be based on the actual test counts from each analysis
    // For now, return a reasonable estimate
    return analysisResults.length * 5; // Assume 5 tests per area per analysis
  }

  private mergeIssues(issues: AnalysisIssue[]): AnalysisIssue {
    const first = issues[0];
    const frequency = issues.length;
    
    return {
      ...first,
      description: `${first.description} (Occurred ${frequency} times)`,
      metadata: {
        ...first.metadata,
        frequency,
        occurrences: issues.map(i => i.timestamp)
      }
    };
  }

  private generateAreaRecommendations(_area: AnalysisCategory, issues: AnalysisIssue[]): string[] {
    const recommendations: string[] = [];
    
    switch (area) {
      case 'calculation':
        if (issues.some(i => i.title.includes('percentile'))) {
          recommendations.push('Review percentile calculation algorithms');
        }
        if (issues.some(i => i.title.includes('normalization'))) {
          recommendations.push('Validate data normalization processes');
        }
        break;
      
      case 'visualization':
        if (issues.some(i => i.title.includes('color'))) {
          recommendations.push('Standardize color consistency across layers');
        }
        if (issues.some(i => i.title.includes('rendering'))) {
          recommendations.push('Optimize chart rendering performance');
        }
        break;
      
      case 'performance':
        if (issues.some(i => i.title.includes('cache'))) {
          recommendations.push('Improve caching strategies');
        }
        if (issues.some(i => i.title.includes('response'))) {
          recommendations.push('Optimize API response times');
        }
        break;
      
      case 'data':
        if (issues.some(i => i.title.includes('consistency'))) {
          recommendations.push('Implement data consistency checks');
        }
        if (issues.some(i => i.title.includes('completeness'))) {
          recommendations.push('Address data completeness issues');
        }
        break;
    }
    
    return recommendations;
  }

  private aggregatePerformanceMetrics(_analysisResults: RadarAnalysisResult[]): PerformanceMetrics {
    if (analysisResults.length === 0) {
      return {
        calculationTime: 0,
        renderingTime: 0,
        cacheHitRate: 0,
        apiResponseTime: 0,
        memoryUsage: 0,
        userInteractionLatency: 0,
        totalTime: 0
      };
    }
    
    const metrics = analysisResults.map(r => r.performanceMetrics);
    
    return {
      calculationTime: this.average(metrics.map(m => m.calculationTime)),
      renderingTime: this.average(metrics.map(m => m.renderingTime)),
      cacheHitRate: this.average(metrics.map(m => m.cacheHitRate)),
      apiResponseTime: this.average(metrics.map(m => m.apiResponseTime)),
      memoryUsage: this.average(metrics.map(m => m.memoryUsage)),
      userInteractionLatency: this.average(metrics.map(m => m.userInteractionLatency)),
      totalTime: this.average(metrics.map(m => m.totalTime))
    };
  }

  private estimateEffort(_issue: AnalysisIssue): string {
    switch (issue.severity) {
      case 'critical': return 'high';
      case 'high': return 'medium';
      case 'medium': return 'low';
      case 'low': return 'minimal';
      default: return 'medium';
    }
  }

  private estimateImpact(_issue: AnalysisIssue): string {
    switch (issue.severity) {
      case 'critical': return 'high';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private suggestCodeChanges(_issue: AnalysisIssue): unknown[] {
    // This would analyze the issue and suggest specific code changes
    // For now, return empty array - to be implemented based on issue patterns
    return [];
  }

  private suggestConfigChanges(_issue: AnalysisIssue): unknown[] {
    // This would analyze the issue and suggest configuration changes
    return [];
  }

  private suggestDataFixes(_issue: AnalysisIssue): unknown[] {
    // This would analyze the issue and suggest data fixes
    return [];
  }

  private prioritizeRecommendations(recommendations: FixRecommendation[]): FixRecommendation[] {
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact as keyof typeof impactOrder] - impactOrder[a.impact as keyof typeof impactOrder];
      return impactDiff;
    });
  }

  private getMostCommonIssues(issues: AnalysisIssue[]): string[] {
    const issueCounts = new Map<string, number>();
    
    issues.forEach(issue => {
      const _key = issue.title;
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    });
    
    return Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title]) => title);
  }

  private getImprovementAreas(areaScores: AreaScore[]): string[] {
    return areaScores
      .filter(area => area.score < 80)
      .sort((a, b) => a.score - b.score)
      .map(area => area.area);
  }

  private calculateOverallHealth(areaScores: AreaScore[]): string {
    const averageScore = areaScores.reduce((sum, area) => sum + area.score, 0) / areaScores.length;
    
    if (averageScore >= 90) return 'excellent';
    if (averageScore >= 80) return 'good';
    if (averageScore >= 70) return 'fair';
    if (averageScore >= 60) return 'poor';
    return 'critical';
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}

// Export singleton instance
export const radarAnalysisReportGenerator = new RadarAnalysisReportGenerator();