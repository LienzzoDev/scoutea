/**
 * Radar Analysis System
 * 
 * This module provides comprehensive analysis capabilities for the radar visualization system.
 * It validates data coherence, visual rendering, performance, and provides detailed reporting.
 */

export * from './types';
export * from './interfaces';
export * from './services/radar-visualization-analyzer';
export * from './services/radar-calculation-validator';
export * from './services/percentile-ranking-validator';
export * from './services/calculation-anomaly-detector';
export * from './services/layer-validation-service';
export * from './services/filter-performance-analyzer';
export * from './services/filter-logic-validator';
export * from './services/cache-efficiency-analyzer';
export * from './services/data-coherence-validator';
export * from './services/comparison-group-validator';
export * from './services/view-inconsistency-detector';
export * from './services/radar-analysis-report-generator';
export * from './services/radar-alert-system';
export * from './logging/radar-analysis-logger';
export * from './config/analysis-config';

// Export singleton instances for easy access
export { radarVisualizationAnalyzer } from './services/radar-visualization-analyzer';
export { layerValidationService } from './services/layer-validation-service';
export { filterPerformanceAnalyzer } from './services/filter-performance-analyzer';
export { filterLogicValidator } from './services/filter-logic-validator';
export { cacheEfficiencyAnalyzer } from './services/cache-efficiency-analyzer';
export { dataCoherenceValidator } from './services/data-coherence-validator';
export { comparisonGroupValidator } from './services/comparison-group-validator';
export { viewInconsistencyDetector } from './services/view-inconsistency-detector';
export { radarAnalysisReportGenerator } from './services/radar-analysis-report-generator';
export { radarAlertSystem } from './services/radar-alert-system';
export { radarAnalysisLogger } from './logging/radar-analysis-logger';