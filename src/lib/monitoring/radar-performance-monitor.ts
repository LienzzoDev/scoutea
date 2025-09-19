/**
 * 📊 RADAR PERFORMANCE MONITOR - MONITOREO DE RENDIMIENTO DE RADAR
 * 
 * Sistema de monitoreo para métricas de radar sin sistema de cache
 */

import { logger } from '../logging/logger'

export interface RadarCalculationMetrics {
  playerId: string;
  calculationTime: number;
  categoriesCalculated: number;
  dataCompleteness: number;
  // cacheHit removed - cache system eliminated
  comparisonGroupSize?: number;
  timestamp: Date;
}

export interface SystemHealthMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
  databaseConnections: number;
  // cacheHitRate removed - cache system eliminated
  activeCalculations: number;
  averageResponseTime: number;
}

export interface PerformanceThresholds {
  maxCalculationTime: number;
  maxMemoryUsage: number;
  // minCacheHitRate removed - cache system eliminated
  maxActiveCalculations: number;
  maxResponseTime: number;
}

export class RadarPerformanceMonitor {
  private static instance: RadarPerformanceMonitor;
  private radarMetrics: RadarCalculationMetrics[] = [];
  private activeOperations = new Map<string, Date>();
  private performanceThresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.performanceThresholds = {
      maxCalculationTime: 5000, // 5 seconds
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      // minCacheHitRate removed - cache system eliminated
      maxActiveCalculations: 50,
      maxResponseTime: 2000 // 2 seconds
    };

    if (thresholds) {
      this.performanceThresholds = { ...this.performanceThresholds, ...thresholds };
    }
  }

  static getInstance(thresholds?: Partial<PerformanceThresholds>): RadarPerformanceMonitor {
    if (!this.instance) {
      this.instance = new RadarPerformanceMonitor(thresholds);
    }
    return this.instance;
  }

  /**
   * Registrar inicio de operación
   */
  startOperation(operationId: string): void {
    this.activeOperations.set(operationId, new Date());
    
    if (this.activeOperations.size > this.performanceThresholds.maxActiveCalculations) {
      logger.warn('⚠️ High number of active radar calculations', {
        activeCount: this.activeOperations.size,
        threshold: this.performanceThresholds.maxActiveCalculations
      });
    }
  }

  /**
   * Registrar finalización de operación
   */
  endOperation(operationId: string): number {
    const startTime = this.activeOperations.get(operationId);
    this.activeOperations.delete(operationId);
    
    if (!startTime) {
      logger.warn('⚠️ Operation end called without start', { operationId });
      return 0;
    }
    
    return Date.now() - startTime.getTime();
  }

  /**
   * Registrar métricas de cálculo de radar
   */
  recordRadarCalculation(metrics: RadarCalculationMetrics): void {
    // Mantener solo las últimas 1000 métricas
    if (this.radarMetrics.length >= 1000) {
      this.radarMetrics = this.radarMetrics.slice(-500);
    }
    
    this.radarMetrics.push(metrics);
    
    // Verificar umbrales de rendimiento
    this.checkPerformanceThresholds(metrics);
    
    // Log detallado en desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.debug('📊 Radar calculation recorded', {
        playerId: metrics.playerId,
        calculationTime: metrics.calculationTime,
        categoriesCalculated: metrics.categoriesCalculated,
        dataCompleteness: metrics.dataCompleteness,
        // cacheHit removed - cache system eliminated
        comparisonGroupSize: metrics.comparisonGroupSize
      });
    }
  }

  /**
   * Verificar umbrales de rendimiento
   */
  private checkPerformanceThresholds(metrics: RadarCalculationMetrics): void {
    const warnings: string[] = [];
    
    if (metrics.calculationTime > this.performanceThresholds.maxCalculationTime) {
      warnings.push(`Calculation time exceeded: ${metrics.calculationTime}ms > ${this.performanceThresholds.maxCalculationTime}ms`);
    }
    
    if (metrics.dataCompleteness < 0.5) {
      warnings.push(`Low data completeness: ${Math.round(metrics.dataCompleteness * 100)}%`);
    }
    
    if (warnings.length > 0) {
      logger.warn('⚠️ Radar performance threshold exceeded', {
        playerId: metrics.playerId,
        warnings,
        metrics
      });
    }
  }

  /**
   * Obtener estadísticas de radar
   */
  getRadarStats(): {
    totalCalculations: number;
    averageCalculationTime: number;
    // cacheHitRate removed - cache system eliminated
    averageDataCompleteness: number;
    calculationsByHour: Record<string, number>;
  } {
    if (this.radarMetrics.length === 0) {
      return {
        totalCalculations: 0,
        averageCalculationTime: 0,
        // cacheHitRate removed - cache system eliminated
        averageDataCompleteness: 0,
        calculationsByHour: {}
      };
    }

    const totalCalculations = this.radarMetrics.length;
    const totalTime = this.radarMetrics.reduce((sum, m) => sum + m.calculationTime, 0);
    const averageCalculationTime = totalTime / totalCalculations;

    // cacheHit calculations removed - cache system eliminated

    const totalCompleteness = this.radarMetrics.reduce((sum, m) => sum + m.dataCompleteness, 0);
    const averageDataCompleteness = totalCompleteness / totalCalculations;

    // Agrupar por hora
    const calculationsByHour: Record<string, number> = {};
    this.radarMetrics.forEach(metric => {
      const hour = metric.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      calculationsByHour[hour] = (calculationsByHour[hour] || 0) + 1;
    });

    return {
      totalCalculations,
      averageCalculationTime,
      // cacheHitRate removed - cache system eliminated
      averageDataCompleteness,
      calculationsByHour
    };
  }

  /**
   * Obtener métricas de salud del sistema
   */
  getSystemHealthMetrics(): SystemHealthMetrics {
    const memoryUsage = process.memoryUsage();
    const radarStats = this.getRadarStats();

    return {
      memoryUsage,
      databaseConnections: this.activeOperations.size, // Approximation
      // cacheHitRate removed - cache system eliminated
      activeCalculations: this.activeOperations.size,
      averageResponseTime: radarStats.averageCalculationTime
    };
  }

  /**
   * Verificar salud del sistema
   */
  checkSystemHealth(): {
    isHealthy: boolean;
    issues: string[];
    metrics: SystemHealthMetrics;
  } {
    const healthMetrics = this.getSystemHealthMetrics();
    const issues: string[] = [];

    // Verificar memoria
    if (healthMetrics.memoryUsage.heapUsed > this.performanceThresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${Math.round(healthMetrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }

    // Verificar operaciones activas
    if (healthMetrics.activeCalculations > this.performanceThresholds.maxActiveCalculations) {
      issues.push(`Too many active calculations: ${healthMetrics.activeCalculations}`);
    }

    // Verificar tiempo de respuesta
    if (healthMetrics.averageResponseTime > this.performanceThresholds.maxResponseTime) {
      issues.push(`Slow response time: ${Math.round(healthMetrics.averageResponseTime)}ms`);
    }

    const isHealthy = issues.length === 0;

    if (!isHealthy) {
      logger.warn('🚨 System health issues detected', {
        issues,
        metrics: {
          memoryUsage: Math.round(healthMetrics.memoryUsage.heapUsed / 1024 / 1024), // MB
          activeCalculations: healthMetrics.activeCalculations,
          // cacheHitRate removed - cache system eliminated
          averageResponseTime: Math.round(healthMetrics.averageResponseTime)
        }
      });
    }

    return {
      isHealthy,
      issues,
      metrics: healthMetrics
    };
  }

  /**
   * Limpiar métricas antiguas
   */
  cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAge);
    const initialCount = this.radarMetrics.length;
    
    this.radarMetrics = this.radarMetrics.filter(metric => metric.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.radarMetrics.length;
    if (removedCount > 0) {
      logger.info(`🧹 Cleaned up ${removedCount} old radar metrics`);
    }
  }

  /**
   * Obtener resumen de rendimiento
   */
  getPerformanceSummary(): {
    period: string;
    totalCalculations: number;
    averageTime: number;
    // cacheHitRate removed - cache system eliminated
    dataCompleteness: number;
    systemHealth: boolean;
    recommendations: string[];
  } {
    const radarStats = this.getRadarStats();
    const healthCheck = this.checkSystemHealth();
    const recommendations: string[] = [];

    // Generar recomendaciones
    if (radarStats.averageCalculationTime > 3000) {
      recommendations.push('Consider optimizing radar calculation algorithms');
    }

    if (radarStats.averageDataCompleteness < 0.7) {
      recommendations.push('Improve data quality and completeness');
    }

    if (!healthCheck.isHealthy) {
      recommendations.push('Address system health issues: ' + healthCheck.issues.join(', '));
    }

    return {
      period: 'Last 24 hours',
      totalCalculations: radarStats.totalCalculations,
      averageTime: Math.round(radarStats.averageCalculationTime),
      // cacheHitRate removed - cache system eliminated
      dataCompleteness: Math.round(radarStats.averageDataCompleteness * 100),
      systemHealth: healthCheck.isHealthy,
      recommendations
    };
  }

  /**
   * Actualizar umbrales de rendimiento
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.performanceThresholds = { ...this.performanceThresholds, ...newThresholds };
    logger.info('🔧 Performance thresholds updated', this.performanceThresholds);
  }

  /**
   * Resetear métricas
   */
  reset(): void {
    this.radarMetrics = [];
    this.activeOperations.clear();
    logger.info('🔄 Radar performance monitor reset');
  }
}

// Singleton instance
export const radarPerformanceMonitor = RadarPerformanceMonitor.getInstance()

/**
 * Wrapper para medir tiempo de operación
 */
export async function measureRadarOperation<T>(
  operationId: string,
  operation: () => Promise<T>
): Promise<T> {
  radarPerformanceMonitor.startOperation(operationId);
  
  try {
    const result = await operation();
    return result;
  } finally {
    radarPerformanceMonitor.endOperation(operationId);
  }
}