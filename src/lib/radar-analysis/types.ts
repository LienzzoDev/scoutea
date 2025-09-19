/**
 * Core types for radar analysis system
 */

export type AnalysisSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnalysisCategory = 'data' | 'visual' | 'performance' | 'calculation';
export type AnalysisStatus = 'pass' | 'fail' | 'warning';
export type AnalysisDepth = 'basic' | 'comprehensive' | 'deep';
export type ValidationResult = 'pass' | 'fail' | 'warning';

/**
 * Radar category data structure for analysis
 */
export interface RadarCategoryData {
  category: string;
  playerValue: number;
  comparisonValue: number;
  percentile: number;
  rank?: number;
  totalPlayers?: number;
  isComplete: boolean;
  sourceAttributes: string[];
}

/**
 * Radar filters for comparison analysis
 */
export interface RadarFilters {
  position?: string;
  age?: { min: number; max: number };
  nationality?: string;
  competition?: string;
  trfmValue?: { min: number; max: number };
  team?: string;
}

/**
 * Analysis issue representation
 */
export interface AnalysisIssue {
  id: string;
  severity: AnalysisSeverity;
  category: AnalysisCategory;
  title: string;
  description: string;
  affectedComponent: string;
  expectedBehavior: string;
  actualBehavior: string;
  recommendation: string;
  reproductionSteps?: string[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Analysis context for operations
 */
export interface AnalysisContext {
  playerId: string;
  analysisId: string;
  timestamp: Date;
  depth: AnalysisDepth;
  filters?: RadarFilters;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics for analysis
 */
export interface PerformanceMetrics {
  calculationTime: number;
  renderingTime: number;
  cacheHitRate: number;
  apiResponseTime: number;
  memoryUsage: number;
  userInteractionLatency: number;
  totalTime: number;
}

/**
 * Performance thresholds for validation
 */
export interface PerformanceThresholds {
  maxCalculationTime: number; // ms
  maxRenderingTime: number; // ms
  minCacheHitRate: number; // %
  maxApiResponseTime: number; // ms
  maxMemoryUsage: number; // MB
  maxInteractionLatency: number; // ms
}

/**
 * Calculation step for debugging
 */
export interface CalculationStep {
  step: number;
  operation: string;
  input: unknown;
  output: unknown;
  formula?: string;
  notes?: string;
}

/**
 * Test case for validation
 */
export interface RadarTestCase {
  id: string;
  name: string;
  description: string;
  playerId: string;
  filters?: RadarFilters;
  expectedBehavior: ExpectedBehavior;
  validationCriteria: ValidationCriteria[];
}

/**
 * Expected behavior for test cases
 */
export interface ExpectedBehavior {
  playerLayerColor: string;
  comparisonLayerColor: string;
  playerValuesStable: boolean;
  comparisonValuesChange: boolean;
  noFullReload: boolean;
  responseTimeMs: number;
}

/**
 * Validation criteria for test cases
 */
export interface ValidationCriteria {
  criterion: string;
  validator: (result: unknown) => boolean;
  errorMessage: string;
}

/**
 * Fix recommendation for issues
 */
export interface FixRecommendation {
  issueId: string;
  title: string;
  description: string;
  priority: AnalysisSeverity;
  category: AnalysisCategory;
  estimatedEffort: string;
  impact: string;
  codeChanges?: CodeChange[];
  configChanges?: ConfigChange[];
  dataFixes?: DataFix[];
  dependencies?: string[];
  metadata?: Record<string, any>;
}

/**
 * Code change recommendation
 */
export interface CodeChange {
  file: string;
  type: 'modify' | 'create' | 'delete';
  description: string;
  diff?: string;
}

/**
 * Configuration change recommendation
 */
export interface ConfigChange {
  file: string;
  setting: string;
  currentValue: unknown;
  recommendedValue: unknown;
  reason: string;
}

/**
 * Data fix recommendation
 */
export interface DataFix {
  table: string;
  operation: 'update' | 'insert' | 'delete';
  condition: string;
  description: string;
  impact: string;
}