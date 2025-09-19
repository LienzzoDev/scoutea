/**
 * ErrorTracker - Error tracking and alerting for radar calculations
 * 
 * This service tracks errors, patterns, and provides alerting for production issues
 */

import { logger } from '../logging/logger';
import { radarLogger } from '../logging/radar-logger';

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  type: 'radar_calculation' | 'data_population' | 'cache_operation' | 'database_query' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  playerId?: string;
  operation?: string;
  resolved: boolean;
}

export interface ErrorPattern {
  type: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedPlayers: Set<string>;
  commonContext: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (errors: ErrorEvent[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
  lastTriggered?: Date;
  enabled: boolean;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorEvent[] = [];
  private patterns: Map<string, ErrorPattern> = new Map();
  private alertRules: AlertRule[] = [];
  private maxErrors = 1000;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.setupDefaultAlertRules();
    this.startCleanupProcess();
  }

  static getInstance(): ErrorTracker {
    if (!this.instance) {
      this.instance = new ErrorTracker();
    }
    return this.instance;
  }

  /**
   * Track an error event
   */
  trackError(
    type: ErrorEvent['type'],
    message: string,
    severity: ErrorEvent['severity'] = 'medium',
    context?: Record<string, any>,
    stack?: string
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date(),
      type,
      severity,
      message,
      stack,
      context,
      playerId: context?.playerId,
      operation: context?.operation,
      resolved: false
    };

    this.errors.push(errorEvent);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Update error patterns
    this.updateErrorPatterns(errorEvent);

    // Check alert rules
    this.checkAlertRules();

    // Log the error
    logger.error(`Error tracked: ${message}`, {
      errorId,
      type,
      severity,
      context
    });

    // Log to radar logger if radar-related
    if (type === 'radar_calculation' || type === 'data_population') {
      radarLogger.logRadarCalculation({
        _playerId: context?.playerId,
        operation: context?.operation || 'unknown',
        success: false,
        __error: message,
        metadata: context
      });
    }

    return errorId;
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string): boolean {
    const _error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      logger.info(`Error resolved: ${errorId}`);
      return true;
    }
    return false;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(
    count: number = 50,
    type?: ErrorEvent['type'],
    severity?: ErrorEvent['severity']
  ): ErrorEvent[] {
    let filteredErrors = [...this.errors];

    if (type) {
      filteredErrors = filteredErrors.filter(e => e.type === type);
    }

    if (severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === severity);
    }

    return filteredErrors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorRate: number;
    topErrors: { message: string; count: number }[];
    unresolvedErrors: number;
  } {
    const _totalErrors = this.errors.length;
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};
    let unresolvedErrors = 0;

    for (const error of this.errors) {
      // Count by type
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Count by message
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
      
      // Count unresolved
      if (!error.resolved) {
        unresolvedErrors++;
      }
    }

    // Get top errors
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    // Calculate error rate (errors per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > oneHourAgo);
    const errorRate = recentErrors.length;

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      errorRate,
      topErrors,
      unresolvedErrors
    };
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    logger.info(`Alert rule added: ${rule.name}`);
  }

  /**
   * Update error patterns
   */
  private updateErrorPatterns(__error: ErrorEvent): void {
    const patternKey = `${error.type}:${error.message}`;
    
    if (this.patterns.has(patternKey)) {
      const pattern = this.patterns.get(patternKey)!;
      pattern.count++;
      pattern.lastOccurrence = error.timestamp;
      
      if (error.playerId) {
        pattern.affectedPlayers.add(error.playerId);
      }
      
      // Update common context
      if (error.context) {
        for (const [key, value] of Object.entries(error.context)) {
          if (pattern.commonContext[key] === value) {
            continue; // Already common
          } else if (pattern.commonContext[key] === undefined) {
            pattern.commonContext[key] = value;
          } else {
            delete pattern.commonContext[key]; // Not common anymore
          }
        }
      }
    } else {
      const pattern: ErrorPattern = {
        type: error.type,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp,
        affectedPlayers: error.playerId ? new Set([error.playerId]) : new Set(),
        commonContext: error.context ? { ...error.context } : {}
      };
      
      this.patterns.set(patternKey, pattern);
    }
  }

  /**
   * Check alert rules
   */
  private checkAlertRules(): void {
    const now = new Date();
    
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (now < cooldownEnd) continue;
      }
      
      // Check condition
      if (rule.condition(this.errors)) {
        this.triggerAlert(rule);
        rule.lastTriggered = now;
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule): void {
    const alertData = {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      errorStats: this.getErrorStatistics(),
      recentErrors: this.getRecentErrors(10)
    };

    logger.warn(`Alert triggered: ${rule.name}`, alertData);

    // In production, this could send alerts to:
    // - Slack
    // - PagerDuty
    // - Email
    // - SMS
    // - Custom webhook
    
    if (process.env.NODE_ENV === 'production') {
      this.sendProductionAlert(rule, alertData);
    }
  }

  /**
   * Send production alert (placeholder)
   */
  private sendProductionAlert(rule: AlertRule, alertData: unknown): void {
    // Placeholder for production alerting
    console.warn('PRODUCTION ALERT:', {
      rule: rule.name,
      severity: rule.severity,
      timestamp: alertData.timestamp
    });
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    // High error rate alert
    this.alertRules.push({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (errors) => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentErrors = errors.filter(e => e.timestamp > oneHourAgo);
        return recentErrors.length > 50; // More than 50 errors per hour
      },
      severity: 'high',
      cooldownMinutes: 30,
      enabled: true
    });

    // Critical errors alert
    this.alertRules.push({
      id: 'critical_errors',
      name: 'Critical Errors',
      condition: (errors) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const criticalErrors = errors.filter(e => 
          e.timestamp > fiveMinutesAgo && e.severity === 'critical'
        );
        return criticalErrors.length > 0;
      },
      severity: 'critical',
      cooldownMinutes: 5,
      enabled: true
    });

    // Radar calculation failures alert
    this.alertRules.push({
      id: 'radar_calc_failures',
      name: 'Radar Calculation Failures',
      condition: (errors) => {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const radarErrors = errors.filter(e => 
          e.timestamp > tenMinutesAgo && 
          e.type === 'radar_calculation' &&
          e.severity !== 'low'
        );
        return radarErrors.length > 10; // More than 10 radar errors in 10 minutes
      },
      severity: 'medium',
      cooldownMinutes: 15,
      enabled: true
    });

    // Database connection issues alert
    this.alertRules.push({
      id: 'database_issues',
      name: 'Database Connection Issues',
      condition: (errors) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const dbErrors = errors.filter(e => 
          e.timestamp > fiveMinutesAgo && 
          e.type === 'database_query' &&
          (e.message.includes('connection') || e.message.includes('timeout'))
        );
        return dbErrors.length > 5;
      },
      severity: 'high',
      cooldownMinutes: 10,
      enabled: true
    });
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    // Clean up old errors every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Remove errors older than 24 hours
    const initialCount = this.errors.length;
    this.errors = this.errors.filter(e => e.timestamp > twentyFourHoursAgo);
    
    // Clean up patterns that haven't occurred recently
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastOccurrence < twentyFourHoursAgo) {
        this.patterns.delete(key);
      }
    }
    
    if (initialCount > this.errors.length) {
      logger.info(`Cleaned up ${initialCount - this.errors.length} old error records`);
    }
  }

  /**
   * Export error data
   */
  exportErrorData(): {
    errors: ErrorEvent[];
    patterns: ErrorPattern[];
    statistics: unknown;
  } {
    return {
      errors: this.errors,
      patterns: Array.from(this.patterns.values()),
      statistics: this.getErrorStatistics()
    };
  }

  /**
   * Shutdown error tracker
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    logger.info('Error tracker shut down');
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();