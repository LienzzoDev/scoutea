/**
 * RadarLogger - Specialized logging for radar calculations and data operations
 * 
 * This service provides structured logging for radar calculations, data population,
 * cache operations, and performance monitoring.
 */

import { logger } from './logger';

export interface RadarLogContext {
  playerId?: string;
  operation: string;
  category?: string;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DataPopulationLogContext {
  playerId: string;
  tableName: string;
  fieldsPopulated: string[];
  populationMethod: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface CacheOperationLogContext {
  operation: 'get' | 'set' | 'invalidate' | 'miss' | 'hit';
  cacheKey: string;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class RadarLogger {
  private static instance: RadarLogger;
  private logBuffer: unknown[] = [];
  private bufferSize = 100;
  private flushInterval?: NodeJS.Timeout;

  private constructor() {
    this.startLogBuffering();
  }

  static getInstance(): RadarLogger {
    if (!this.instance) {
      this.instance = new RadarLogger();
    }
    return this.instance;
  }

  /**
   * Log radar calculation events
   */
  logRadarCalculation(__context: RadarLogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'radar_calculation',
      level: context.success ? 'info' : 'error',
      ...context
    };

    this.addToBuffer(logEntry);

    if (context.success) {
      logger.info('Radar calculation completed', {
        _playerId: context.playerId,
        operation: context.operation,
        category: context.category,
        duration: context.duration,
        metadata: context.metadata
      });
    } else {
      logger.error('Radar calculation failed', {
        _playerId: context.playerId,
        operation: context.operation,
        category: context.category,
        __error: context.error,
        metadata: context.metadata
      });
    }
  }

  /**
   * Log data population events
   */
  logDataPopulation(__context: DataPopulationLogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'data_population',
      level: context.success ? 'info' : 'error',
      ...context
    };

    this.addToBuffer(logEntry);

    if (context.success) {
      logger.info('Data population completed', {
        _playerId: context.playerId,
        tableName: context.tableName,
        fieldsPopulated: context.fieldsPopulated,
        populationMethod: context.populationMethod,
        duration: context.duration
      });
    } else {
      logger.error('Data population failed', {
        _playerId: context.playerId,
        tableName: context.tableName,
        populationMethod: context.populationMethod,
        __error: context.error
      });
    }
  }

  /**
   * Log cache operations
   */
  logCacheOperation(__context: CacheOperationLogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'cache_operation',
      level: context.success ? 'debug' : 'warn',
      ...context
    };

    this.addToBuffer(logEntry);

    const logLevel = context.success ? 'debug' : 'warn';
    const message = `Cache ${context.operation}: ${context.success ? 'success' : 'failed'}`;

    logger[logLevel](message, {
      operation: context.operation,
      cacheKey: context.cacheKey,
      duration: context.duration,
      __error: context.error,
      metadata: context.metadata
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'performance_metric',
      level: 'info',
      operation,
      duration,
      success,
      metadata
    };

    this.addToBuffer(logEntry);

    logger.info('Performance metric', {
      operation,
      duration,
      success,
      metadata
    });
  }

  /**
   * Log comparison group operations
   */
  logComparisonGroup(
    __filters: Record<string, any>,
    groupSize: number,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'comparison_group',
      level: success ? 'info' : 'error',
      filters,
      groupSize,
      duration,
      success,
      error
    };

    this.addToBuffer(logEntry);

    if (success) {
      logger.info('Comparison group calculated', {
        filters,
        groupSize,
        duration
      });
    } else {
      logger.error('Comparison group calculation failed', {
        filters,
        error
      });
    }
  }

  /**
   * Log batch operations
   */
  logBatchOperation(
    operation: string,
    batchSize: number,
    processed: number,
    failed: number,
    duration: number
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'batch_operation',
      level: failed > 0 ? 'warn' : 'info',
      operation,
      batchSize,
      processed,
      failed,
      duration,
      successRate: processed / batchSize
    };

    this.addToBuffer(logEntry);

    const level = failed > 0 ? 'warn' : 'info';
    logger[level]('Batch operation completed', {
      operation,
      batchSize,
      processed,
      failed,
      duration,
      successRate: Math.round((processed / batchSize) * 100)
    });
  }

  /**
   * Log database query performance
   */
  logDatabaseQuery(
    query: string,
    duration: number,
    rowsAffected?: number,
    success: boolean = true,
    error?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'database_query',
      level: success ? 'debug' : 'error',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''), // Truncate long queries
      duration,
      rowsAffected,
      success,
      error
    };

    this.addToBuffer(logEntry);

    if (success) {
      logger.debug('Database query executed', {
        query: logEntry.query,
        duration,
        rowsAffected
      });
    } else {
      logger.error('Database query failed', {
        query: logEntry.query,
        error
      });
    }
  }

  /**
   * Log system health events
   */
  logSystemHealth(
    memoryUsage: NodeJS.MemoryUsage,
    activeConnections: number,
    cacheHitRate: number,
    averageResponseTime: number
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'system_health',
      level: 'info',
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      activeConnections,
      cacheHitRate: Math.round(cacheHitRate * 100), // Percentage
      averageResponseTime: Math.round(averageResponseTime)
    };

    this.addToBuffer(logEntry);

    logger.info('System health check', logEntry);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50, type?: string): unknown[] {
    let logs = [...this.logBuffer];
    
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /**
   * Get log statistics
   */
  getLogStatistics(): {
    totalLogs: number;
    logsByType: Record<string, number>;
    logsByLevel: Record<string, number>;
    errorRate: number;
    recentErrors: unknown[];
  } {
    const totalLogs = this.logBuffer.length;
    const logsByType: Record<string, number> = {};
    const logsByLevel: Record<string, number> = {};
    let errorCount = 0;
    const recentErrors: unknown[] = [];

    for (const log of this.logBuffer) {
      // Count by type
      logsByType[log.type] = (logsByType[log.type] || 0) + 1;
      
      // Count by level
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      
      // Count errors
      if (log.level === 'error') {
        errorCount++;
        if (recentErrors.length < 10) {
          recentErrors.push(log);
        }
      }
    }

    return {
      totalLogs,
      logsByType,
      logsByLevel,
      errorRate: totalLogs > 0 ? errorCount / totalLogs : 0,
      recentErrors
    };
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logBuffer, null, 2);
    } else {
      // Simple CSV export
      const headers = ['timestamp', 'type', 'level', 'operation', 'duration', 'success'];
      const csvRows = [headers.join(',')];
      
      for (const log of this.logBuffer) {
        const row = headers.map(header => {
          const value = log[header];
          return typeof value === 'string' ? `"${value}"` : (value || '');
        });
        csvRows.push(row.join(','));
      }
      
      return csvRows.join('\n');
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: unknown): void {
    this.logBuffer.push(logEntry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.bufferSize);
    }
  }

  /**
   * Start log buffering with periodic flush
   */
  private startLogBuffering(): void {
    // Flush logs every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Flush logs to external system (placeholder)
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    // In a production environment, this could send logs to:
    // - Elasticsearch
    // - CloudWatch
    // - DataDog
    // - Custom logging service
    
    logger.info('Flushing radar logs', {
      logCount: this.logBuffer.length,
      types: Object.keys(this.getLogStatistics().logsByType)
    });

    // Clear buffer after flush (in real implementation, only clear after successful send)
    // this.logBuffer = [];
  }

  /**
   * Shutdown logging
   */
  shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Final flush
    this.flushLogs();
    
    logger.info('Radar logging shut down');
  }
}

// Export singleton instance
export const radarLogger = RadarLogger.getInstance();