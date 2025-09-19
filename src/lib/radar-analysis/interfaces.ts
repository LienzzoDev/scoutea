/**
 * Core interfaces for radar analysis system
 */

import { 
  AnalysisIssue, 
  AnalysisContext, 
  RadarCategoryData, 
  RadarFilters, 
  PerformanceMetrics,
  PerformanceThresholds,
  FixRecommendation,
  ValidationResult,
  AnalysisDepth
} from './types';

/**
 * Main radar visualization analyzer interface
 */
export interface IRadarVisualizationAnalyzer {
  analyzeRadarVisualization(
    playerId: string, 
    filters?: RadarFilters, 
    depth?: AnalysisDepth
  ): Promise<RadarAnalysisResult>;
  
  validateDataCoherence(
    radarData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<ValidationResult>;
  
  analyzePerformance(
    context: AnalysisContext
  ): Promise<PerformanceAnalysisResult>;
  
  generateReport(
    analysisResults: RadarAnalysisResult[]
  ): Promise<AnalysisReport>;
}

/**
 * Layer validation service interface
 */
export interface ILayerValidationService {
  validatePlayerLayer(
    radarData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<LayerValidationResult>;
  
  validateComparisonLayer(
    radarData: RadarCategoryData[], 
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<LayerValidationResult>;
  
  validateLayerInteraction(
    playerData: RadarCategoryData[], 
    comparisonData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<LayerValidationResult>;
}

/**
 * Data coherence validator interface
 */
export interface IDataCoherenceValidator {
  validateDataCompleteness(
    radarData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<ValidationResult>;
  
  validateDataConsistency(
    radarData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<ValidationResult>;
  
  validateCalculationAccuracy(
    radarData: RadarCategoryData[], 
    context: AnalysisContext
  ): Promise<ValidationResult>;
  
  validateSourceData(
    playerId: string, 
    context: AnalysisContext
  ): Promise<ValidationResult>;
}

/**
 * Filter performance analyzer interface
 */
export interface IFilterPerformanceAnalyzer {
  analyzeFilterPerformance(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<FilterPerformanceResult>;
  
  validateFilterLogic(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<ValidationResult>;
  
  optimizeFilters(
    filters: RadarFilters, 
    context: AnalysisContext
  ): Promise<OptimizedFilters>;
}

/**
 * Analysis logger interface
 */
export interface IRadarAnalysisLogger {
  logAnalysisStart(context: AnalysisContext): void;
  logAnalysisComplete(context: AnalysisContext, result: RadarAnalysisResult): void;
  logAnalysisError(context: AnalysisContext, error: Error): void;
  logValidationResult(context: AnalysisContext, result: ValidationResult): void;
  logPerformanceMetrics(context: AnalysisContext, metrics: PerformanceMetrics): void;
  logIssueDetected(context: AnalysisContext, issue: AnalysisIssue): void;
  getAnalysisLogs(analysisId: string): Promise<AnalysisLogEntry[]>;
}

/**
 * Result interfaces
 */
export interface RadarAnalysisResult {
  analysisId: string;
  playerId: string;
  timestamp: Date;
  depth: AnalysisDepth;
  filters?: RadarFilters;
  overallStatus: ValidationResult;
  issues: AnalysisIssue[];
  performanceMetrics: PerformanceMetrics;
  dataValidation: DataValidationResult;
  layerValidation: LayerValidationResult;
  recommendations: FixRecommendation[];
  metadata: Record<string, any>;
}

export interface DataValidationResult {
  completeness: ValidationResult;
  consistency: ValidationResult;
  accuracy: ValidationResult;
  sourceData: ValidationResult;
  issues: AnalysisIssue[];
  details: Record<string, any>;
}

export interface LayerValidationResult {
  playerLayer: ValidationResult;
  comparisonLayer: ValidationResult;
  layerInteraction: ValidationResult;
  visualConsistency: ValidationResult;
  issues: AnalysisIssue[];
  details: Record<string, any>;
}

export interface PerformanceAnalysisResult {
  metrics: PerformanceMetrics;
  thresholds: PerformanceThresholds;
  status: ValidationResult;
  bottlenecks: string[];
  recommendations: string[];
  issues: AnalysisIssue[];
}

export interface FilterPerformanceResult {
  executionTime: number;
  resultSetSize: number;
  cacheUtilization: number;
  queryOptimization: ValidationResult;
  recommendations: string[];
  issues: AnalysisIssue[];
}

export interface OptimizedFilters {
  original: RadarFilters;
  optimized: RadarFilters;
  improvements: string[];
  expectedPerformanceGain: number;
}

export interface AnalysisReport {
  reportId: string;
  generatedAt: Date;
  summary: AnalysisSummary;
  analysisResults: RadarAnalysisResult[];
  aggregatedIssues: AnalysisIssue[];
  recommendations: FixRecommendation[];
  trends: AnalysisTrend[];
  exportFormats: string[];
}

export interface AnalysisSummary {
  totalAnalyses: number;
  passRate: number;
  criticalIssues: number;
  averagePerformance: PerformanceMetrics;
  mostCommonIssues: string[];
  improvementAreas: string[];
}

export interface AnalysisTrend {
  metric: string;
  timeframe: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  dataPoints: Array<{ timestamp: Date; value: number }>;
}

export interface AnalysisLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: AnalysisContext;
  metadata?: Record<string, any>;
}

/**
 * Radar Analysis Report Generator interface
 */
export interface IRadarAnalysisReportGenerator {
  generateConsolidatedReport(
    analysisResults: RadarAnalysisResult[],
    context: AnalysisContext
  ): Promise<ConsolidatedReport>;
}

/**
 * Consolidated report structure
 */
export interface ConsolidatedReport {
  reportId: string;
  generatedAt: Date;
  context: AnalysisContext;
  overallScore: number;
  areaScores: AreaScore[];
  summary: AnalysisSummary;
  consolidatedIssues: AnalysisIssue[];
  recommendations: FixRecommendation[];
  trends: AnalysisTrend[];
  analysisResults: RadarAnalysisResult[];
  metadata: Record<string, any>;
}

/**
 * Area score breakdown
 */
export interface AreaScore {
  area: string;
  score: number;
  maxScore: number;
  breakdown: ScoreBreakdown;
  issues: AnalysisIssue[];
  recommendations: string[];
}

/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  performanceMetrics?: PerformanceMetrics;
}

/**
 * Recommendation priority levels
 */
export type RecommendationPriority = 'low' | 'medium' | 'high';

/**
 * Enhanced analysis summary
 */
export interface AnalysisSummary {
  totalAnalyses: number;
  passRate: number;
  criticalIssues: number;
  averagePerformance: PerformanceMetrics;
  mostCommonIssues: string[];
  improvementAreas: string[];
  overallHealth: string;
  trendsAvailable: boolean;
}

/**
 * Radar Alert System interface
 */
export interface IRadarAlertSystem {
  analyzeAndAlert(report: ConsolidatedReport): Promise<AlertNotification[]>;
  registerNotificationHandler(
    channel: string, 
    handler: (alert: any) => Promise<void>
  ): void;
  updateConfig(config: any): void;
  getConfig(): any;
  clearHistory(): void;
  getHistory(): any[];
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: string;
  enabled: boolean;
  channels: string[];
}

/**
 * Alert notification result
 */
export interface AlertNotification {
  alertId: string;
  timestamp: Date;
  channels: string[];
  success: boolean;
  errors: string[];
  escalationLevel: number;
  metadata?: Record<string, any>;
}

/**
 * Alert escalation configuration
 */
export interface AlertEscalation {
  level: number;
  delay: number; // minutes
  channels: string[];
  condition: string;
}

/**
 * Alert channel configuration
 */
export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  metric: string;
  operator: '<' | '<=' | '>' | '>=' | '=' | '!=';
  value: number;
  severity: AnalysisSeverity;
}