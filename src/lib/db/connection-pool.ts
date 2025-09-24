/**
 * Database Connection Pool Configuration
 * 
 * Optimizes database connections for radar calculations and high-throughput operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/production-logger';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  createTimeoutMillis: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  pendingRequests: number;
  maxConnections: number;
}

export class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private prismaClient: PrismaClient;
  private config: ConnectionPoolConfig;
  private stats: ConnectionPoolStats;

  private constructor() {
    this.config = this.getOptimalPoolConfig();
    this.stats = {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      pendingRequests: 0,
      maxConnections: this.config.maxConnections
    };

    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: this.buildOptimizedConnectionString()
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });

    this.setupConnectionPoolMonitoring();
  }

  static getInstance(): DatabaseConnectionPool {
    if (!this.instance) {
      this.instance = new DatabaseConnectionPool();
    }
    return this.instance;
  }

  /**
   * Get optimized Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * Get connection pool statistics
   */
  getStats(): ConnectionPoolStats {
    return { ...this.stats };
  }

  /**
   * Get optimal connection pool configuration based on environment
   */
  private getOptimalPoolConfig(): ConnectionPoolConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isHighLoad = process.env.HIGH_LOAD_MODE === 'true';

    if (isProduction && isHighLoad) {
      // High-load production configuration
      return {
        maxConnections: 50,
        minConnections: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 300000, // 5 minutes
        reapIntervalMillis: 60000,  // 1 minute
        createRetryIntervalMillis: 2000,
        createTimeoutMillis: 10000
      };
    } else if (isProduction) {
      // Standard production configuration
      return {
        maxConnections: 25,
        minConnections: 5,
        acquireTimeoutMillis: 20000,
        idleTimeoutMillis: 180000, // 3 minutes
        reapIntervalMillis: 30000,  // 30 seconds
        createRetryIntervalMillis: 1000,
        createTimeoutMillis: 8000
      };
    } else {
      // Development configuration
      return {
        maxConnections: 10,
        minConnections: 2,
        acquireTimeoutMillis: 10000,
        idleTimeoutMillis: 60000,  // 1 minute
        reapIntervalMillis: 15000, // 15 seconds
        createRetryIntervalMillis: 500,
        createTimeoutMillis: 5000
      };
    }
  }

  /**
   * Build optimized connection string with pool parameters
   */
  private buildOptimizedConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL or DIRECT_URL must be defined');
    }

    const url = new URL(baseUrl);
    
    // Add connection pool parameters
    url.searchParams.set('connection_limit', this.config.maxConnections.toString());
    url.searchParams.set('pool_timeout', (this.config.acquireTimeoutMillis / 1000).toString());
    
    // PostgreSQL specific optimizations
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      url.searchParams.set('connect_timeout', '10');
      url.searchParams.set('application_name', 'radar-calculations');
      url.searchParams.set('statement_timeout', '30000'); // 30 seconds
      url.searchParams.set('idle_in_transaction_session_timeout', '60000'); // 1 minute
    }

    return url.toString();
  }

  /**
   * Setup connection pool monitoring
   */
  private setupConnectionPoolMonitoring(): void {
    // Monitor connection pool every 30 seconds
    setInterval(() => {
      this.updateConnectionStats();
    }, 30000);

    // Log connection pool stats every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        logger.info('Connection Pool Stats', this.stats);
      }, 300000);
    }
  }

  /**
   * Update connection pool statistics
   */
  private updateConnectionStats(): void {
    // This would typically require database-specific queries
    // For now, we'll simulate the stats based on configuration
    this.stats = {
      ...this.stats,
      maxConnections: this.config.maxConnections,
      // In a real implementation, these would be queried from the database
      totalConnections: Math.min(this.config.maxConnections, this.stats.activeConnections + this.stats.idleConnections),
      idleConnections: Math.max(0, this.config.minConnections - this.stats.activeConnections),
      // activeConnections and pendingRequests would be updated by actual usage
    };
  }

  /**
   * Execute a query with connection pool optimization
   */
  async executeWithOptimization<T>(
    operation: (client: PrismaClient) => Promise<T>,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<T> {
    const { timeout = 30000, retries = 3 } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.stats.activeConnections++;
        
        const result = await Promise.race([
          operation(this.prismaClient),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          )
        ]);

        this.stats.activeConnections--;
        return result;
      } catch (_error) {
        this.stats.activeConnections--;
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Execute batch operations with connection optimization
   */
  async executeBatch<T>(
    operations: ((client: PrismaClient) => Promise<T>)[],
    options: { batchSize?: number; concurrency?: number } = {}
  ): Promise<T[]> {
    const { batchSize = 10, concurrency = 3 } = options;
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      // Execute batch with limited concurrency
      const batchPromises = batch.map(operation => 
        this.executeWithOptimization(operation)
      );

      // Process in chunks to limit concurrent connections
      for (let j = 0; j < batchPromises.length; j += concurrency) {
        const chunk = batchPromises.slice(j, j + concurrency);
        const chunkResults = await Promise.allSettled(chunk);
        
        for (const result of chunkResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch operation failed:', result.reason);
            throw result.reason;
          }
        }
      }
    }

    return results;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const start = Date.now();
      await this.prismaClient.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        details: {
          responseTime,
          connectionPool: this.stats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connectionPool: this.stats,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.prismaClient.$disconnect();
      logger.info('Database connection pool shut down gracefully');
    } catch (error) {
      logger.error('Error during database shutdown', error as Error);
    }
  }
}

// Export singleton instance
export const connectionPool = DatabaseConnectionPool.getInstance();
export const optimizedPrisma = connectionPool.getClient();