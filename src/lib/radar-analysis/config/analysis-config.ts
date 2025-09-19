/**
 * Configuration for radar analysis system
 */

import { PerformanceThresholds, AnalysisDepth } from '../types';

/**
 * Default performance thresholds for analysis validation
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  maxCalculationTime: 2000, // 2 seconds
  maxRenderingTime: 1000, // 1 second
  minCacheHitRate: 0.8, // 80%
  maxApiResponseTime: 1500, // 1.5 seconds
  maxMemoryUsage: 100, // 100 MB
  maxInteractionLatency: 300 // 300ms
};

/**
 * Analysis configuration by depth level
 */
export const ANALYSIS_DEPTH_CONFIG: Record<AnalysisDepth, {
  includePerformanceAnalysis: boolean;
  includeDataValidation: boolean;
  includeLayerValidation: boolean;
  includeFilterAnalysis: boolean;
  maxTestCases: number;
  detailedLogging: boolean;
}> = {
  basic: {
    includePerformanceAnalysis: false,
    includeDataValidation: true,
    includeLayerValidation: false,
    includeFilterAnalysis: false,
    maxTestCases: 5,
    detailedLogging: false
  },
  comprehensive: {
    includePerformanceAnalysis: true,
    includeDataValidation: true,
    includeLayerValidation: true,
    includeFilterAnalysis: true,
    maxTestCases: 15,
    detailedLogging: true
  },
  deep: {
    includePerformanceAnalysis: true,
    includeDataValidation: true,
    includeLayerValidation: true,
    includeFilterAnalysis: true,
    maxTestCases: 50,
    detailedLogging: true
  }
};

/**
 * Logging configuration for radar analysis
 */
export const ANALYSIS_LOGGING_CONFIG = {
  bufferSize: 1000,
  flushIntervalMs: 30000, // 30 seconds
  logLevels: {
    development: ['debug', 'info', 'warn', 'error'],
    production: ['info', 'warn', 'error'],
    test: ['warn', 'error']
  },
  enableMetrics: true,
  enableTracing: process.env.NODE_ENV === 'development'
};

/**
 * Test case categories for validation
 */
export const TEST_CASE_CATEGORIES = {
  DATA_COMPLETENESS: 'data_completeness',
  VISUAL_CONSISTENCY: 'visual_consistency',
  PERFORMANCE: 'performance',
  FILTER_BEHAVIOR: 'filter_behavior',
  LAYER_INTERACTION: 'layer_interaction',
  CALCULATION_ACCURACY: 'calculation_accuracy'
};

/**
 * Issue severity weights for prioritization
 */
export const SEVERITY_WEIGHTS = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 10
};

/**
 * Analysis timeout configurations
 */
export const ANALYSIS_TIMEOUTS = {
  basic: 30000, // 30 seconds
  comprehensive: 120000, // 2 minutes
  deep: 300000 // 5 minutes
};

/**
 * Cache configuration for analysis results
 */
export const ANALYSIS_CACHE_CONFIG = {
  ttl: 3600000, // 1 hour
  maxSize: 100, // Maximum cached results
  keyPrefix: 'radar_analysis_',
  enableCompression: true
};

/**
 * Export formats supported for analysis reports
 */
export const SUPPORTED_EXPORT_FORMATS = [
  'json',
  'csv',
  'pdf',
  'html'
] as const;

export type ExportFormat = typeof SUPPORTED_EXPORT_FORMATS[number];