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
  metadata?: Record<string, unknown>;
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
  metadata?: Record<string, unknown>;
}

// Internal log entry type
interface LogEntry {
  timestamp: string;
  type: string;
  level: string;
  operation?: string | undefined;
  duration?: number | undefined;
  success?: boolean | undefined;
  error?: string | undefined;
  [key: string]: unknown;
}

export class RadarLogger {
  private static instance: RadarLogger;
  private logBuffer: LogEntry[] = [];
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
  logRadarCalculation(ctx: RadarLogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'radar_calculation',
      level: ctx.success ? 'info' : 'error',
      ...ctx
    };

    this.addToBuffer(logEntry);

    if (ctx.success) {
      logger.info('Radar calculation completed', 'RadarLogger', {
        playerId: ctx.playerId,
        operation: ctx.operation,
        category: ctx.category,
        duration: ctx.duration,
        metadata: ctx.metadata
      });
    } else {
      logger.error('Radar calculation failed', 'RadarLogger', {
        playerId: ctx.playerId,
        operation: ctx.operation,
        category: ctx.category,
        error: ctx.error,
        metadata: ctx.metadata
      });
    }
  }

  /**
   * Log data population events
   */
  logDataPopulation(ctx: DataPopulationLogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'data_population',
      level: ctx.success ? 'info' : 'error',
      ...ctx
    };

    this.addToBuffer(logEntry);

    if (ctx.success) {
      logger.info('Data population completed', 'RadarLogger', {
        playerId: ctx.playerId,
        tableName: ctx.tableName,
        fieldsPopulated: ctx.fieldsPopulated,
        populationMethod: ctx.populationMethod,
        duration: ctx.duration
      });
    } else {
      logger.error('Data population failed', 'RadarLogger', {
        playerId: ctx.playerId,
        tableName: ctx.tableName,
        populationMethod: ctx.populationMethod,
        error: ctx.error
      });
    }
  }

  /**
   * Log cache operations
   */
  logCacheOperation(ctx: CacheOperationLogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'cache_operation',
      level: ctx.success ? 'debug' : 'warn',
      ...ctx
    };

    this.addToBuffer(logEntry);

    const logLevel = ctx.success ? 'debug' : 'warn';
    const message = `Cache ${ctx.operation}: ${ctx.success ? 'success' : 'failed'}`;

    logger[logLevel](message, 'RadarLogger', {
      operation: ctx.operation,
      cacheKey: ctx.cacheKey,
      duration: ctx.duration,
      error: ctx.error,
      metadata: ctx.metadata
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'performance_metric',
      level: 'info',
      operation,
      duration,
      success,
      metadata
    };

    this.addToBuffer(logEntry);

    logger.info('Performance metric', 'RadarLogger', {
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
    filters: Record<string, unknown>,
    groupSize: number,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const logEntry: LogEntry = {
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
      logger.info('Comparison group calculated', 'RadarLogger', {
        filters,
        groupSize,
        duration
      });
    } else {
      logger.error('Comparison group calculation failed', 'RadarLogger', {
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
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'batch_operation',
      level: failed > 0 ? 'warn' : 'info',
      operation,
      batchSize,
      processed,
      failed,
      duration,
      successRate: batchSize > 0 ? processed / batchSize : 0
    };

    this.addToBuffer(logEntry);

    const level = failed > 0 ? 'warn' : 'info';
    logger[level]('Batch operation completed', 'RadarLogger', {
      operation,
      batchSize,
      processed,
      failed,
      duration,
      successRate: batchSize > 0 ? Math.round((processed / batchSize) * 100) : 0
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
    const truncatedQuery = query.substring(0, 100) + (query.length > 100 ? '...' : '');
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: 'database_query',
      level: success ? 'debug' : 'error',
      query: truncatedQuery,
      duration,
      rowsAffected,
      success,
      error
    };

    this.addToBuffer(logEntry);

    if (success) {
      logger.debug('Database query executed', 'RadarLogger', {
        query: truncatedQuery,
        duration,
        rowsAffected
      });
    } else {
      logger.error('Database query failed', 'RadarLogger', {
        query: truncatedQuery,
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
    const logEntry: LogEntry = {
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

    logger.info('System health check', 'RadarLogger', logEntry);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50, type?: string): LogEntry[] {
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
    recentErrors: LogEntry[];
  } {
    const totalLogs = this.logBuffer.length;
    const logsByType: Record<string, number> = {};
    const logsByLevel: Record<string, number> = {};
    let errorCount = 0;
    const recentErrors: LogEntry[] = [];

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
      const headers: (keyof LogEntry)[] = ['timestamp', 'type', 'level', 'operation', 'duration', 'success'];
      const csvRows = [headers.join(',')];

      for (const log of this.logBuffer) {
        const row = headers.map(header => {
          const value = log[header];
          return typeof value === 'string' ? `"${value}"` : String(value ?? '');
        });
        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: LogEntry): void {
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
    
    logger.info('Flushing radar logs', 'RadarLogger', {
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
    
    logger.info('Radar logging shut down', 'RadarLogger');
  }
}

// Export singleton instance
export const radarLogger = RadarLogger.getInstance();