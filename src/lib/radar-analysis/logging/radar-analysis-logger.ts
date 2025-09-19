/**
 * Specialized logging service for radar analysis operations
 */

import { logger } from '../../logging/logger';
import { 
  IRadarAnalysisLogger, 
  AnalysisContext, 
  RadarAnalysisResult, 
  AnalysisLogEntry 
} from '../interfaces';
import { 
  AnalysisIssue, 
  PerformanceMetrics, 
  ValidationResult 
} from '../types';
import { ANALYSIS_LOGGING_CONFIG } from '../config/analysis-config';

export class RadarAnalysisLogger implements IRadarAnalysisLogger {
  private static instance: RadarAnalysisLogger;
  private logBuffer: AnalysisLogEntry[] = [];
  private metricsBuffer: Array<{
    timestamp: Date;
    context: AnalysisContext;
    metrics: PerformanceMetrics;
  }> = [];
  private flushInterval?: NodeJS.Timeout;

  private constructor() {
    this.startLogBuffering();
  }

  static getInstance(): RadarAnalysisLogger {
    if (!this.instance) {
      this.instance = new RadarAnalysisLogger();
    }
    return this.instance;
  }

  /**
   * Log analysis start event
   */
  logAnalysisStart(context: AnalysisContext): void {
    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message: `Starting radar analysis for player ${context.playerId}`,
      context,
      metadata: {
        depth: context.depth,
        filters: context.filters
      }
    };

    this.addToBuffer(logEntry);

    logger.info('Radar analysis started', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      depth: context.depth,
      filters: context.filters
    });
  }

  /**
   * Log analysis completion
   */
  logAnalysisComplete(context: AnalysisContext, result: RadarAnalysisResult): void {
    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message: `Radar analysis completed for player ${context.playerId}`,
      context,
      metadata: {
        status: result.overallStatus,
        issueCount: result.issues.length,
        criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
        performanceMetrics: result.performanceMetrics
      }
    };

    this.addToBuffer(logEntry);

    logger.info('Radar analysis completed', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      status: result.overallStatus,
      issueCount: result.issues.length,
      criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
      duration: result.performanceMetrics.totalTime
    });
  }

  /**
   * Log analysis error
   */
  logAnalysisError(context: AnalysisContext, error: Error): void {
    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level: 'error',
      message: `Radar analysis failed for player ${context.playerId}: ${error.message}`,
      context,
      metadata: {
        error: error.message,
        stack: error.stack
      }
    };

    this.addToBuffer(logEntry);

    logger.error('Radar analysis failed', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Log validation result
   */
  logValidationResult(context: AnalysisContext, result: ValidationResult): void {
    const level = result === 'fail' ? 'warn' : 'info';
    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level,
      message: `Validation result: ${result} for analysis ${context.analysisId}`,
      context,
      metadata: {
        validationResult: result
      }
    };

    this.addToBuffer(logEntry);

    logger[level]('Validation completed', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      result
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(context: AnalysisContext, metrics: PerformanceMetrics): void {
    // Add to metrics buffer for trend analysis
    this.metricsBuffer.push({
      timestamp: new Date(),
      context,
      metrics
    });

    // Keep metrics buffer manageable
    if (this.metricsBuffer.length > 500) {
      this.metricsBuffer = this.metricsBuffer.slice(-500);
    }

    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message: `Performance metrics recorded for analysis ${context.analysisId}`,
      context,
      metadata: {
        metrics
      }
    };

    this.addToBuffer(logEntry);

    logger.info('Performance metrics', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      calculationTime: metrics.calculationTime,
      renderingTime: metrics.renderingTime,
      totalTime: metrics.totalTime,
      cacheHitRate: metrics.cacheHitRate,
      memoryUsage: metrics.memoryUsage
    });
  }

  /**
   * Log issue detection
   */
  logIssueDetected(context: AnalysisContext, issue: AnalysisIssue): void {
    const level = issue.severity === 'critical' ? 'error' : 
                  issue.severity === 'high' ? 'warn' : 'info';

    const logEntry: AnalysisLogEntry = {
      timestamp: new Date(),
      level,
      message: `Issue detected: ${issue.title}`,
      context,
      metadata: {
        issue: {
          id: issue.id,
          severity: issue.severity,
          category: issue.category,
          title: issue.title,
          affectedComponent: issue.affectedComponent
        }
      }
    };

    this.addToBuffer(logEntry);

    logger[level]('Analysis issue detected', {
      analysisId: context.analysisId,
      playerId: context.playerId,
      issueId: issue.id,
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      component: issue.affectedComponent
    });
  }

  /**
   * Get analysis logs for specific analysis
   */
  async getAnalysisLogs(analysisId: string): Promise<AnalysisLogEntry[]> {
    return this.logBuffer.filter(log => 
      log.context.analysisId === analysisId
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(playerId?: string, timeframe?: { start: Date; end: Date }): Array<{
    timestamp: Date;
    metrics: PerformanceMetrics;
    context: AnalysisContext;
  }> {
    let filtered = [...this.metricsBuffer];

    if (playerId) {
      filtered = filtered.filter(entry => entry.context.playerId === playerId);
    }

    if (timeframe) {
      filtered = filtered.filter(entry => 
        entry.timestamp >= timeframe.start && entry.timestamp <= timeframe.end
      );
    }

    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStatistics(): {
    totalAnalyses: number;
    analysesByDepth: Record<string, number>;
    analysesByStatus: Record<string, number>;
    averageAnalysisTime: number;
    issuesByCategory: Record<string, number>;
    issuesBySeverity: Record<string, number>;
  } {
    const completedAnalyses = this.logBuffer.filter(log => 
      log.message.includes('completed')
    );

    const totalAnalyses = completedAnalyses.length;
    const analysesByDepth: Record<string, number> = {};
    const analysesByStatus: Record<string, number> = {};
    const issuesByCategory: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};
    let totalAnalysisTime = 0;

    for (const log of completedAnalyses) {
      // Count by depth
      const depth = log.context.depth;
      analysesByDepth[depth] = (analysesByDepth[depth] || 0) + 1;

      // Count by status
      const status = log.metadata?.status || 'unknown';
      analysesByStatus[status] = (analysesByStatus[status] || 0) + 1;

      // Sum analysis time
      if (log.metadata?.performanceMetrics?.totalTime) {
        totalAnalysisTime += log.metadata.performanceMetrics.totalTime;
      }
    }

    // Count issues
    const issueEntries = this.logBuffer.filter(log => 
      log.message.includes('Issue detected')
    );

    for (const log of issueEntries) {
      const issue = log.metadata?.issue;
      if (issue) {
        issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
        issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
      }
    }

    return {
      totalAnalyses,
      analysesByDepth,
      analysesByStatus,
      averageAnalysisTime: totalAnalyses > 0 ? totalAnalysisTime / totalAnalyses : 0,
      issuesByCategory,
      issuesBySeverity
    };
  }

  /**
   * Export logs in various formats
   */
  exportLogs(format: 'json' | 'csv' = 'json', analysisId?: string): string {
    let logs = [...this.logBuffer];
    
    if (analysisId) {
      logs = logs.filter(log => log.context.analysisId === analysisId);
    }

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV export
      const headers = ['timestamp', 'level', 'message', 'analysisId', 'playerId', 'depth'];
      const csvRows = [headers.join(',')];
      
      for (const log of logs) {
        const row = [
          log.timestamp.toISOString(),
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.context.analysisId,
          log.context.playerId,
          log.context.depth
        ];
        csvRows.push(row.join(','));
      }
      
      return csvRows.join('\n');
    }
  }

  /**
   * Clear old logs to manage memory
   */
  clearOldLogs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    this.logBuffer = this.logBuffer.filter(log => log.timestamp > cutoffTime);
    this.metricsBuffer = this.metricsBuffer.filter(entry => entry.timestamp > cutoffTime);

    logger.info('Old analysis logs cleared', {
      cutoffTime: cutoffTime.toISOString(),
      remainingLogs: this.logBuffer.length,
      remainingMetrics: this.metricsBuffer.length
    });
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: AnalysisLogEntry): void {
    this.logBuffer.push(logEntry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > ANALYSIS_LOGGING_CONFIG.bufferSize) {
      this.logBuffer = this.logBuffer.slice(-ANALYSIS_LOGGING_CONFIG.bufferSize);
    }
  }

  /**
   * Start log buffering with periodic flush
   */
  private startLogBuffering(): void {
    if (process.env.NODE_ENV === 'production') {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, ANALYSIS_LOGGING_CONFIG.flushIntervalMs);
    }
  }

  /**
   * Flush logs to external system
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    // In production, this could send logs to external systems
    logger.info('Flushing radar analysis logs', {
      logCount: this.logBuffer.length,
      metricsCount: this.metricsBuffer.length
    });
  }

  /**
   * Shutdown logging service
   */
  shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushLogs();
    logger.info('Radar analysis logging shut down');
  }
}

// Export singleton instance
export const radarAnalysisLogger = RadarAnalysisLogger.getInstance();