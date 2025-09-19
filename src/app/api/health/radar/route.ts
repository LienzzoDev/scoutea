/**
 * Radar Health Check API Endpoint
 * 
 * Provides health check and monitoring information for radar calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { radarPerformanceMonitor } from '../../../../lib/monitoring/radar-performance-monitor';
import { radarLogger } from '../../../../lib/logging/radar-logger';
import { connectionPool } from '../../../../lib/db/connection-pool';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  const component = searchParams.get('component');

  try {
    const startTime = Date.now();

    // Basic health check
    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // Component-specific health checks
    if (component === 'database' || !component) {
      const dbHealth = await connectionPool.healthCheck();
      healthData.database = dbHealth;
    }

    if (component === 'cache' || !component) {
      healthData.cache = {
        status: 'healthy',
        stats: { message: 'Cache system removed' }
      };
    }

    if (component === 'performance' || !component) {
      const performanceStats = radarPerformanceMonitor.getPerformanceStats();
      const radarStats = radarPerformanceMonitor.getRadarCalculationStats();
      
      healthData.performance = {
        status: 'healthy',
        general: performanceStats,
        radar: radarStats
      };
    }

    if (component === 'system' || !component) {
      const systemMetrics = radarPerformanceMonitor.getSystemHealthMetrics();
      healthData.system = {
        status: 'healthy',
        metrics: systemMetrics
      };
    }

    if (detailed) {
      // Add detailed information
      healthData.detailed = {
        logs: {
          recent: radarLogger.getRecentLogs(20),
          statistics: radarLogger.getLogStatistics()
        },
        monitoring: radarPerformanceMonitor.exportMetrics(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          env: process.env.NODE_ENV
        }
      };
    }

    // Calculate response time
    healthData.responseTime = Date.now() - startTime;

    // Determine overall health status
    const overallStatus = determineOverallHealth(healthData);
    healthData.status = overallStatus;

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - Date.now()
    }, { status: 503 });
  }
}

/**
 * Determine overall health status based on component health
 */
function determineOverallHealth(healthData: any): 'healthy' | 'degraded' | 'unhealthy' {
  let healthyComponents = 0;
  let totalComponents = 0;

  // Check database health
  if (healthData.database) {
    totalComponents++;
    if (healthData.database.status === 'healthy') {
      healthyComponents++;
    }
  }

  // Check cache health
  if (healthData.cache) {
    totalComponents++;
    if (healthData.cache.status === 'healthy') {
      healthyComponents++;
    }
  }

  // Check performance health
  if (healthData.performance) {
    totalComponents++;
    const perfStats = healthData.performance.general;
    const radarStats = healthData.performance.radar;
    
    // Consider healthy if success rate > 90% and cache hit rate > 50%
    if (perfStats.successRate > 0.9 && radarStats.cacheHitRate > 0.5) {
      healthyComponents++;
    }
  }

  // Check system health
  if (healthData.system) {
    totalComponents++;
    const systemMetrics = healthData.system.metrics;
    
    // Consider healthy if memory usage < 80% of available and response time < 3s
    const memoryUsagePercent = systemMetrics.memoryUsage.heapUsed / systemMetrics.memoryUsage.heapTotal;
    if (memoryUsagePercent < 0.8 && systemMetrics.averageResponseTime < 3000) {
      healthyComponents++;
    }
  }

  if (totalComponents === 0) {
    return 'healthy'; // No components to check
  }

  const healthRatio = healthyComponents / totalComponents;
  
  if (healthRatio >= 1.0) {
    return 'healthy';
  } else if (healthRatio >= 0.5) {
    return 'degraded';
  } else {
    return 'unhealthy';
  }
}

/**
 * POST endpoint for triggering health checks or maintenance operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset_metrics':
        radarPerformanceMonitor.reset();
        return NextResponse.json({ 
          success: true, 
          message: 'Performance metrics reset' 
        });

      case 'export_logs':
        const logs = radarLogger.exportLogs('json');
        return NextResponse.json({ 
          success: true, 
          logs: JSON.parse(logs) 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Health check POST action failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}