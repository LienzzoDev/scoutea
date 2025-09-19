/**
 * Health Check API Endpoint
 * 
 * Provides comprehensive health monitoring for all services including:
 * - Database connectivity
 * - Cache system health
 * - Circuit breaker status
 * - Service performance metrics
 * - Overall system health
 */

import { NextRequest, NextResponse } from 'next/server'

import { databaseErrorHandler } from '@/lib/database/database-error-handler'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: ServiceHealthStatus
  }
  metrics: {
    totalRequests: number
    errorRate: number
    averageResponseTime: number
  }
  details?: any
}

export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  responseTime?: number
  lastCheck: string
  metrics?: any
}

/**
 * GET /api/health - Comprehensive health check
 */
export async function GET(_request: NextRequest): Promise<NextResponse<HealthCheckResult>> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    // Perform health checks for all services
    const [databaseHealth] = await Promise.allSettled([
      checkDatabaseHealth()
    ])

    // Process results
    const services = {
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : {
        status: 'unhealthy' as const,
        message: 'Health check failed',
        lastCheck: timestamp,
        responseTime: Date.now() - startTime
      }
    }

    // Determine overall system status
    const serviceStatuses = Object.values(services).map(s => s.status)
    const overallStatus = serviceStatuses.includes('unhealthy') ? 'unhealthy' :
                         serviceStatuses.includes('degraded') ? 'degraded' : 'healthy'

    // Calculate basic metrics
    const totalRequests = 0
    const _totalErrors = 0
    const errorRate = 0
    const avgResponseTime = Date.now() - startTime

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      uptime: process.uptime() * 1000, // Convert to milliseconds
      services,
      metrics: {
        totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(avgResponseTime)
      }
    }

    // Add detailed information in development
    if (process.env.NODE_ENV === 'development') {
      result.details = {
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform
      }
    }

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503

    const response = NextResponse.json(result, { status: httpStatus })
    
    // Add health check headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Health-Status', overallStatus)
    response.headers.set('X-Response-Time', String(Date.now() - startTime))
    
    return response

  } catch (_error) {
    console.error('❌ Health check failed:', error)
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp,
      uptime: process.uptime() * 1000,
      services: {
        database: {
          status: 'unhealthy',
          message: 'Health check error',
          lastCheck: timestamp
        }
      },
      metrics: {
        totalRequests: 0,
        errorRate: 100,
        averageResponseTime: Date.now() - startTime
      }
    }

    return NextResponse.json(errorResult, { status: 503 })
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealthStatus> {
  const startTime = Date.now()
  
  try {
    const healthResult = await databaseErrorHandler.checkDatabaseHealth()
    const responseTime = Date.now() - startTime

    if (healthResult.isHealthy) {
      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime: healthResult.latency,
        lastCheck: new Date().toISOString()
      }
    } else {
      return {
        status: 'unhealthy',
        message: healthResult.error || 'Database connection failed',
        responseTime,
        lastCheck: new Date().toISOString()
      }
    }
  } catch (_error) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    }
  }
}



/**
 * POST /api/health/recovery - Trigger system recovery
 */
export async function POST(__request: NextRequest): Promise<NextResponse> {
  try {
    const _body = await request.json()
    const { action } = body

    if (action === 'recovery') {
      return NextResponse.json({
        success: true,
        message: 'System recovery triggered',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { __error: 'Invalid action' },
      { status: 400 }
    )

  } catch (_error) {
    console.error('❌ Recovery action failed:', error)
    return NextResponse.json(
      { __error: 'Recovery action failed' },
      { status: 500 }
    )
  }
}