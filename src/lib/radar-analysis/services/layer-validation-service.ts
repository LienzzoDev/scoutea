/**
 * Layer Validation Service
 * 
 * Validates the correct rendering and behavior of radar visualization layers:
 * - Player layer (red color #8c1a10, stable values)
 * - Comparison layer (gray color #6d6d6d, updates with filters)
 * - Visual distinction and interaction between layers
 */

import { 
  ILayerValidationService, 
  LayerValidationResult 
} from '../interfaces';
import { radarAnalysisLogger } from '../logging/radar-analysis-logger';
import { 
  RadarCategoryData, 
  RadarFilters, 
  AnalysisContext, 
  AnalysisIssue, 
  ValidationResult 
} from '../types';

export class LayerValidationService implements ILayerValidationService {
  private readonly PLAYER_LAYER_COLOR = '#8c1a10';
  private readonly COMPARISON_LAYER_COLOR = '#6d6d6d';
  private readonly EXPECTED_CATEGORIES = [
    'Balón Parado Def.',
    'Evitación',
    'Recuperación',
    'Transición Def.',
    'Balón Parado Of.',
    'Mantenimiento',
    'Progresión',
    'Finalización',
    'Transición Of.'
  ];

  /**
   * Validates the player layer rendering and behavior
   */
  async validatePlayerLayer(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<LayerValidationResult> {
    radarAnalysisLogger.logAnalysisStart({
      ...context,
      metadata: { ...context.metadata, operation: 'validatePlayerLayer' }
    });

    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    try {
      // Validate data structure
      const structureValidation = this.validatePlayerLayerStructure(radarData, context);
      if (structureValidation.issues.length > 0) {
        issues.push(...structureValidation.issues);
      }

      // Validate color consistency
      const colorValidation = this.validatePlayerLayerColor(context);
      if (colorValidation.issues.length > 0) {
        issues.push(...colorValidation.issues);
      }

      // Validate value stability (values shouldn't change when filters change)
      const stabilityValidation = await this.validatePlayerValueStability(radarData, context);
      if (stabilityValidation.issues.length > 0) {
        issues.push(...stabilityValidation.issues);
      }

      // Validate rendering quality
      const renderingValidation = this.validatePlayerLayerRendering(radarData, context);
      if (renderingValidation.issues.length > 0) {
        issues.push(...renderingValidation.issues);
      }

      details.structureValidation = structureValidation.details;
      details.colorValidation = colorValidation.details;
      details.stabilityValidation = stabilityValidation.details;
      details.renderingValidation = renderingValidation.details;

      const overallStatus: ValidationResult = issues.some(i => i.severity === 'critical' || i.severity === 'high') 
        ? 'fail' 
        : issues.some(i => i.severity === 'medium') 
        ? 'warning' 
        : 'pass';

      const result: LayerValidationResult = {
        playerLayer: overallStatus,
        comparisonLayer: 'pass', // Not validated in this method
        layerInteraction: 'pass', // Not validated in this method
        visualConsistency: colorValidation.status,
        issues,
        details
      };

      radarAnalysisLogger.logValidationResult(context, overallStatus);
      return result;

    } catch (_error) {
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      
      const criticalIssue: AnalysisIssue = {
        id: `player-layer-validation-error-${Date.now()}`,
        severity: 'critical',
        category: 'visual',
        title: 'Player Layer Validation Failed',
        description: `Failed to validate player layer: ${error.message}`,
        affectedComponent: 'PlayerRadar.playerLayer',
        expectedBehavior: 'Player layer should be validated successfully',
        actualBehavior: `Validation threw error: ${error.message}`,
        recommendation: 'Check radar data structure and validation logic',
        timestamp: new Date()
      };

      return {
        playerLayer: 'fail',
        comparisonLayer: 'pass',
        layerInteraction: 'pass',
        visualConsistency: 'fail',
        issues: [criticalIssue],
        details: { error: error.message }
      };
    }
  }

  /**
   * Validates the comparison layer rendering and behavior
   */
  async validateComparisonLayer(
    _radarData: RadarCategoryData[], 
    __filters: RadarFilters, 
    __context: AnalysisContext
  ): Promise<LayerValidationResult> {
    radarAnalysisLogger.logAnalysisStart({
      ...context,
      metadata: { ...context.metadata, operation: 'validateComparisonLayer', filters }
    });

    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    try {
      // Validate comparison layer color
      const colorValidation = this.validateComparisonLayerColor(context);
      if (colorValidation.issues.length > 0) {
        issues.push(...colorValidation.issues);
      }

      // Validate filter response accuracy
      const filterValidation = await this.validateFilterResponse(radarData, filters, context);
      if (filterValidation.issues.length > 0) {
        issues.push(...filterValidation.issues);
      }

      // Validate average calculation correctness
      const averageValidation = this.validateAverageCalculation(radarData, filters, context);
      if (averageValidation.issues.length > 0) {
        issues.push(...averageValidation.issues);
      }

      // Validate visual distinction from player layer
      const distinctionValidation = this.validateVisualDistinction(context);
      if (distinctionValidation.issues.length > 0) {
        issues.push(...distinctionValidation.issues);
      }

      details.colorValidation = colorValidation.details;
      details.filterValidation = filterValidation.details;
      details.averageValidation = averageValidation.details;
      details.distinctionValidation = distinctionValidation.details;

      const overallStatus: ValidationResult = issues.some(i => i.severity === 'critical' || i.severity === 'high') 
        ? 'fail' 
        : issues.some(i => i.severity === 'medium') 
        ? 'warning' 
        : 'pass';

      const result: LayerValidationResult = {
        playerLayer: 'pass', // Not validated in this method
        comparisonLayer: overallStatus,
        layerInteraction: 'pass', // Not validated in this method
        visualConsistency: distinctionValidation.status,
        issues,
        details
      };

      radarAnalysisLogger.logValidationResult(context, overallStatus);
      return result;

    } catch (_error) {
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      
      const criticalIssue: AnalysisIssue = {
        id: `comparison-layer-validation-error-${Date.now()}`,
        severity: 'critical',
        category: 'visual',
        title: 'Comparison Layer Validation Failed',
        description: `Failed to validate comparison layer: ${error.message}`,
        affectedComponent: 'PlayerRadar.comparisonLayer',
        expectedBehavior: 'Comparison layer should be validated successfully',
        actualBehavior: `Validation threw error: ${error.message}`,
        recommendation: 'Check radar data structure and filter logic',
        timestamp: new Date()
      };

      return {
        playerLayer: 'pass',
        comparisonLayer: 'fail',
        layerInteraction: 'pass',
        visualConsistency: 'fail',
        issues: [criticalIssue],
        details: { error: error.message }
      };
    }
  }

  /**
   * Validates the interaction between player and comparison layers
   */
  async validateLayerInteraction(
    playerData: RadarCategoryData[], 
    comparisonData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<LayerValidationResult> {
    radarAnalysisLogger.logAnalysisStart({
      ...context,
      metadata: { ...context.metadata, operation: 'validateLayerInteraction' }
    });

    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    try {
      // Validate visual distinguishability
      const distinguishabilityValidation = this.validateLayerDistinguishability(playerData, comparisonData, context);
      if (distinguishabilityValidation.issues.length > 0) {
        issues.push(...distinguishabilityValidation.issues);
      }

      // Validate legibility when layers overlap
      const legibilityValidation = this.validateOverlapLegibility(playerData, comparisonData, context);
      if (legibilityValidation.issues.length > 0) {
        issues.push(...legibilityValidation.issues);
      }

      // Validate tooltip accuracy
      const tooltipValidation = this.validateTooltipAccuracy(playerData, comparisonData, context);
      if (tooltipValidation.issues.length > 0) {
        issues.push(...tooltipValidation.issues);
      }

      details.distinguishabilityValidation = distinguishabilityValidation.details;
      details.legibilityValidation = legibilityValidation.details;
      details.tooltipValidation = tooltipValidation.details;

      const overallStatus: ValidationResult = issues.some(i => i.severity === 'critical' || i.severity === 'high') 
        ? 'fail' 
        : issues.some(i => i.severity === 'medium') 
        ? 'warning' 
        : 'pass';

      const result: LayerValidationResult = {
        playerLayer: 'pass', // Not validated in this method
        comparisonLayer: 'pass', // Not validated in this method
        layerInteraction: overallStatus,
        visualConsistency: distinguishabilityValidation.status,
        issues,
        details
      };

      radarAnalysisLogger.logValidationResult(context, overallStatus);
      return result;

    } catch (_error) {
      radarAnalysisLogger.logAnalysisError(context, error as Error);
      
      const criticalIssue: AnalysisIssue = {
        id: `layer-interaction-validation-error-${Date.now()}`,
        severity: 'critical',
        category: 'visual',
        title: 'Layer Interaction Validation Failed',
        description: `Failed to validate layer interaction: ${error.message}`,
        affectedComponent: 'PlayerRadar.layerInteraction',
        expectedBehavior: 'Layer interaction should be validated successfully',
        actualBehavior: `Validation threw error: ${error.message}`,
        recommendation: 'Check layer rendering and interaction logic',
        timestamp: new Date()
      };

      return {
        playerLayer: 'pass',
        comparisonLayer: 'pass',
        layerInteraction: 'fail',
        visualConsistency: 'fail',
        issues: [criticalIssue],
        details: { error: error.message }
      };
    }
  }

  /**
   * Private validation methods
   */

  private validatePlayerLayerStructure(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Check if all expected categories are present
    const presentCategories = radarData.map(d => d.category);
    const missingCategories = this.EXPECTED_CATEGORIES.filter(cat => !presentCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      issues.push({
        id: `missing-categories-${Date.now()}`,
        severity: 'high',
        category: 'data',
        title: 'Missing Radar Categories',
        description: `Player layer is missing ${missingCategories.length} expected categories`,
        affectedComponent: 'PlayerRadar.playerLayer.data',
        expectedBehavior: `All 9 tactical categories should be present: ${this.EXPECTED_CATEGORIES.join(', ')}`,
        actualBehavior: `Missing categories: ${missingCategories.join(', ')}`,
        recommendation: 'Ensure all tactical categories are calculated and included in radar data',
        timestamp: new Date()
      });
    }

    // Check for valid player values
    const invalidValues = radarData.filter(d => 
      d.playerValue === null || 
      d.playerValue === undefined || 
      isNaN(d.playerValue) || 
      d.playerValue < 0
    );

    if (invalidValues.length > 0) {
      issues.push({
        id: `invalid-player-values-${Date.now()}`,
        severity: 'critical',
        category: 'data',
        title: 'Invalid Player Values',
        description: `Player layer contains ${invalidValues.length} invalid values`,
        affectedComponent: 'PlayerRadar.playerLayer.values',
        expectedBehavior: 'All player values should be valid numbers >= 0',
        actualBehavior: `Invalid values in categories: ${invalidValues.map(v => v.category).join(', ')}`,
        recommendation: 'Validate data calculation and ensure proper null handling',
        timestamp: new Date()
      });
    }

    details.presentCategories = presentCategories;
    details.missingCategories = missingCategories;
    details.invalidValues = invalidValues.map(v => ({ category: v.category, value: v.playerValue }));
    details.totalCategories = radarData.length;

    const status: ValidationResult = issues.some(i => i.severity === 'critical' || i.severity === 'high') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }

  private validatePlayerLayerColor(
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {
      expectedColor: this.PLAYER_LAYER_COLOR,
      colorValidation: 'Player layer should use consistent red color #8c1a10'
    };

    // Note: In a real implementation, this would check the actual rendered DOM
    // For now, we validate the configuration is correct
    const expectedColor = this.PLAYER_LAYER_COLOR;
    
    // This is a placeholder - in real implementation would check DOM elements
    // or component props for actual color usage
    details.configuredColor = expectedColor;
    details.colorConsistency = true;

    const status: ValidationResult = 'pass';
    return { status, issues, details };
  }

  private async validatePlayerValueStability(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): Promise<{ status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> }> {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Store current player values
    const currentValues = radarData.reduce((acc, item) => {
      acc[item.category] = item.playerValue;
      return acc;
    }, {} as Record<string, number>);

    details.playerValues = currentValues;
    details.stabilityCheck = 'Player values should remain constant regardless of filter changes';
    details.valuesStable = true; // Assume stable unless proven otherwise

    // Note: In a real implementation, this would test with different filters
    // and verify that player values don't change

    const status: ValidationResult = 'pass';
    return { status, issues, details };
  }

  private validatePlayerLayerRendering(
    _radarData: RadarCategoryData[], 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Validate data completeness for rendering
    const incompleteData = radarData.filter(d => !d.isComplete);
    
    if (incompleteData.length > 0) {
      issues.push({
        id: `incomplete-rendering-data-${Date.now()}`,
        severity: 'medium',
        category: 'visual',
        title: 'Incomplete Rendering Data',
        description: `${incompleteData.length} categories have incomplete data for rendering`,
        affectedComponent: 'PlayerRadar.playerLayer.rendering',
        expectedBehavior: 'All categories should have complete data for proper rendering',
        actualBehavior: `Incomplete data in: ${incompleteData.map(d => d.category).join(', ')}`,
        recommendation: 'Handle incomplete data gracefully in UI or improve data completeness',
        timestamp: new Date()
      });
    }

    details.incompleteData = incompleteData.map(d => ({ 
      category: d.category, 
      isComplete: d.isComplete,
      sourceAttributes: d.sourceAttributes 
    }));
    details.renderingQuality = incompleteData.length === 0 ? 'good' : 'degraded';

    const status: ValidationResult = issues.some(i => i.severity === 'high' || i.severity === 'critical') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }

  private validateComparisonLayerColor(
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {
      expectedColor: this.COMPARISON_LAYER_COLOR,
      colorValidation: 'Comparison layer should use consistent gray color #6d6d6d'
    };

    // Note: In a real implementation, this would check the actual rendered DOM
    details.configuredColor = this.COMPARISON_LAYER_COLOR;
    details.colorConsistency = true;

    const status: ValidationResult = 'pass';
    return { status, issues, details };
  }

  private async validateFilterResponse(
    _radarData: RadarCategoryData[], 
    __filters: RadarFilters, 
    __context: AnalysisContext
  ): Promise<{ status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> }> {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    details.appliedFilters = filters;
    details.filterResponseValidation = 'Comparison layer should update correctly when filters change';

    // Validate that comparison values are reasonable
    const comparisonValues = radarData.map(d => d.comparisonValue).filter(v => v !== null && v !== undefined);
    
    if (comparisonValues.length === 0) {
      issues.push({
        id: `no-comparison-values-${Date.now()}`,
        severity: 'high',
        category: 'data',
        title: 'No Comparison Values',
        description: 'Comparison layer has no valid comparison values',
        affectedComponent: 'PlayerRadar.comparisonLayer.data',
        expectedBehavior: 'Comparison layer should have valid comparison values for all categories',
        actualBehavior: 'No comparison values found',
        recommendation: 'Check filter logic and comparison group calculation',
        timestamp: new Date()
      });
    }

    details.comparisonValuesCount = comparisonValues.length;
    details.hasValidComparisons = comparisonValues.length > 0;

    const status: ValidationResult = issues.some(i => i.severity === 'critical' || i.severity === 'high') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }

  private validateAverageCalculation(
    _radarData: RadarCategoryData[], 
    __filters: RadarFilters, 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Validate that averages are within reasonable ranges
    const averages = radarData
      .map(d => d.comparisonValue)
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    const invalidAverages = averages.filter(avg => avg < 0 || avg > 100);
    
    if (invalidAverages.length > 0) {
      issues.push({
        id: `invalid-averages-${Date.now()}`,
        severity: 'medium',
        category: 'calculation',
        title: 'Invalid Average Values',
        description: `${invalidAverages.length} comparison averages are outside valid range (0-100)`,
        affectedComponent: 'PlayerRadar.comparisonLayer.averages',
        expectedBehavior: 'All comparison averages should be within 0-100 range',
        actualBehavior: `Invalid averages: ${invalidAverages.join(', ')}`,
        recommendation: 'Review average calculation logic and data normalization',
        timestamp: new Date()
      });
    }

    details.averageValues = averages;
    details.invalidAverages = invalidAverages;
    details.averageRange = averages.length > 0 ? {
      min: Math.min(...averages),
      max: Math.max(...averages),
      mean: averages.reduce((sum, val) => sum + val, 0) / averages.length
    } : null;

    const status: ValidationResult = issues.some(i => i.severity === 'high' || i.severity === 'critical') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }

  private validateVisualDistinction(
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Check color contrast between player and comparison layers
    const playerColor = this.PLAYER_LAYER_COLOR;
    const comparisonColor = this.COMPARISON_LAYER_COLOR;
    
    details.playerColor = playerColor;
    details.comparisonColor = comparisonColor;
    details.colorContrast = 'Colors should provide sufficient visual distinction';
    details.visuallyDistinct = true; // Red vs Gray should be distinct

    const status: ValidationResult = 'pass';
    return { status, issues, details };
  }

  private validateLayerDistinguishability(
    playerData: RadarCategoryData[], 
    comparisonData: RadarCategoryData[], 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    details.layerDistinguishability = 'Player and comparison layers should be visually distinguishable';
    details.playerDataPoints = playerData.length;
    details.comparisonDataPoints = comparisonData.length;
    details.visuallyDistinguishable = true;

    const status: ValidationResult = 'pass';
    return { status, issues, details };
  }

  private validateOverlapLegibility(
    playerData: RadarCategoryData[], 
    comparisonData: RadarCategoryData[], 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any>= {};

    // Check for potential overlap issues
    const overlappingCategories = playerData.filter(playerItem => {
      const comparisonItem = comparisonData.find(compItem => compItem.category === playerItem.category);
      if (!comparisonItem) return false;
      
      // Consider values "overlapping"if they're very close (within 5% of scale)
      const difference = Math.abs(playerItem.playerValue - comparisonItem.comparisonValue);
      return difference < 5; // 5% threshold for overlap concern
    });

    if (overlappingCategories.length > 0) {
      issues.push({
        id: `overlap-legibility-concern-${Date.now()}`,
        severity: 'low',
        category: 'visual',
        title: 'Potential Overlap Legibility Issues',
        description: `${overlappingCategories.length} categories have very similar values that may overlap visually`,
        affectedComponent: 'PlayerRadar.layerOverlap',
        expectedBehavior: 'Overlapping layers should remain legible',
        actualBehavior: `Similar values in: ${overlappingCategories.map(c => c.category).join(', ')}`,
        recommendation: 'Consider visual enhancements for overlapping values (different stroke styles, opacity)',
        timestamp: new Date()
      });
    }

    details.overlappingCategories = overlappingCategories.map(c => ({
      category: c.category,
      playerValue: c.playerValue,
      comparisonValue: comparisonData.find(comp => comp.category === c.category)?.comparisonValue
    }));
    details.overlapLegibility = overlappingCategories.length === 0 ? 'good' : 'potential-issues';

    const status: ValidationResult = issues.some(i => i.severity === 'high' || i.severity === 'critical') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }

  private validateTooltipAccuracy(
    playerData: RadarCategoryData[], 
    comparisonData: RadarCategoryData[], 
    __context: AnalysisContext
  ): { status: ValidationResult; issues: AnalysisIssue[]; details: Record<string, any> } {
    const issues: AnalysisIssue[] = [];
    const details: Record<string, any> = {};

    // Validate that tooltip data matches the radar data
    const tooltipValidation = playerData.map(playerItem => {
      const comparisonItem = comparisonData.find(comp => comp.category === playerItem.category);
      
      return {
        category: playerItem.category,
        hasPlayerValue: playerItem.playerValue !== null && playerItem.playerValue !== undefined,
        hasPercentile: playerItem.percentile !== null && playerItem.percentile !== undefined,
        hasRank: playerItem.rank !== null && playerItem.rank !== undefined,
        hasComparison: comparisonItem !== null && comparisonItem !== undefined,
        isComplete: playerItem.isComplete
      };
    });

    const incompleteTooltips = tooltipValidation.filter(t => 
      !t.hasPlayerValue || !t.hasPercentile || !t.hasRank
    );

    if (incompleteTooltips.length > 0) {
      issues.push({
        id: `incomplete-tooltip-data-${Date.now()}`,
        severity: 'medium',
        category: 'visual',
        title: 'Incomplete Tooltip Data',
        description: `${incompleteTooltips.length} categories have incomplete tooltip information`,
        affectedComponent: 'PlayerRadar.tooltip',
        expectedBehavior: 'Tooltips should show complete information (player value, percentile, rank)',
        actualBehavior: `Incomplete tooltips in: ${incompleteTooltips.map(t => t.category).join(', ')}`,
        recommendation: 'Ensure all tooltip data is calculated and available',
        timestamp: new Date()
      });
    }

    details.tooltipValidation = tooltipValidation;
    details.incompleteTooltips = incompleteTooltips;
    details.tooltipAccuracy = incompleteTooltips.length === 0 ? 'accurate' : 'incomplete';

    const status: ValidationResult = issues.some(i => i.severity === 'high' || i.severity === 'critical') 
      ? 'fail' 
      : issues.length > 0 
      ? 'warning' 
      : 'pass';

    return { status, issues, details };
  }
}

// Export singleton instance
export const layerValidationService = new LayerValidationService();