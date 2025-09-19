/**
 * 📊 RADAR METRICS SERVICE - SERVICIO DE MÉTRICAS DE RADAR
 * 
 * Servicio para gestionar métricas de radar de jugadores sin sistema de cache
 */

import { db } from '../db'
import { logger } from '../logging/logger'
import { getUniversalEnvironmentDetector } from '../utils/server-environment-detector'

// Tipos para las métricas de radar
export interface RadarMetricsData {
  id: string
  playerId: string
  category: string
  playerValue: number
  period: string
  calculatedAt: Date
  dataCompleteness: number
  sourceAttributes: string[]
  comparisonAverage?: number
  percentile?: number
  rank?: number
  totalPlayers?: number
}

export interface RadarCategoryData {
  category: string
  playerValue: number
  dataCompleteness: number
  sourceAttributes: string[]
}

export interface RadarFilters {
  position?: string
  nationality?: string
  ageMin?: number
  ageMax?: number
  ratingMin?: number
  ratingMax?: number
}

export class RadarMetricsService {
  private static instance: RadarMetricsService
  private environmentDetector = getUniversalEnvironmentDetector()

  static getInstance(): RadarMetricsService {
    if (!RadarMetricsService.instance) {
      RadarMetricsService.instance = new RadarMetricsService()
    }
    return RadarMetricsService.instance
  }

  // 📊 MÉTODOS DE LECTURA

  /**
   * Obtener métricas de radar para un jugador
   */
  async getPlayerRadarMetrics(playerId: string, period: string = '2023-24'): Promise<RadarMetricsData[]> {
    try {
      const metrics = await db.radarMetrics.findMany({
        where: {
          playerId,
          period
        },
        include: {
          player: {
            select: {
              id_player: true,
              player_name: true,
              position_player: true,
              nationality_1: true,
              team_name: true,
              player_rating: true
            }
          }
        },
        orderBy: {
          category: 'asc'
        }
      })

      return metrics.map(metric => ({
        id: metric.id,
        playerId: metric.playerId,
        category: metric.category,
        playerValue: metric.playerValue,
        period: metric.period,
        calculatedAt: metric.calculatedAt,
        dataCompleteness: metric.dataCompleteness,
        sourceAttributes: metric.sourceAttributes as string[],
        comparisonAverage: metric.comparisonAverage || undefined,
        percentile: metric.percentile || undefined,
        rank: metric.rank || undefined,
        totalPlayers: metric.totalPlayers || undefined
      }))
    } catch (error) {
      logger.error(`Error getting player radar metrics for ${playerId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        playerId,
        period,
        environment: this.environmentDetector.isServer() ? 'server' : 'client'
      })
      throw error
    }
  }

  /**
   * Obtener métricas de una categoría específica para múltiples jugadores
   */
  async getCategoryMetrics(category: string, period: string = '2023-24', filters?: RadarFilters): Promise<RadarMetricsData[]> {
    try {
      const whereClause: any = {
        category,
        period
      }

      // Aplicar filtros si se proporcionan
      if (filters) {
        if (filters.position) {
          whereClause.player = {
            ...whereClause.player,
            position_player: filters.position
          }
        }
        if (filters.nationality) {
          whereClause.player = {
            ...whereClause.player,
            nationality_1: filters.nationality
          }
        }
        if (filters.ratingMin || filters.ratingMax) {
          whereClause.player = {
            ...whereClause.player,
            player_rating: {
              ...(filters.ratingMin && { gte: filters.ratingMin }),
              ...(filters.ratingMax && { lte: filters.ratingMax })
            }
          }
        }
      }

      const metrics = await db.radarMetrics.findMany({
        where: whereClause,
        include: {
          player: {
            select: {
              id_player: true,
              player_name: true,
              position_player: true,
              nationality_1: true,
              team_name: true,
              player_rating: true
            }
          }
        },
        orderBy: {
          playerValue: 'desc'
        }
      })

      return metrics.map(metric => ({
        id: metric.id,
        playerId: metric.playerId,
        category: metric.category,
        playerValue: metric.playerValue,
        period: metric.period,
        calculatedAt: metric.calculatedAt,
        dataCompleteness: metric.dataCompleteness,
        sourceAttributes: metric.sourceAttributes as string[],
        comparisonAverage: metric.comparisonAverage || undefined,
        percentile: metric.percentile || undefined,
        rank: metric.rank || undefined,
        totalPlayers: metric.totalPlayers || undefined
      }))
    } catch (error) {
      logger.error(`Error getting category metrics for ${category}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        category,
        period,
        filters,
        environment: this.environmentDetector.isServer() ? 'server' : 'client'
      })
      throw error
    }
  }

  // ✍️ MÉTODOS DE ESCRITURA

  /**
   * Guardar o actualizar métricas de radar para un jugador
   */
  async savePlayerRadarMetrics(playerId: string, categories: RadarCategoryData[], period: string = '2023-24'): Promise<void> {
    try {
      // Usar transacción para asegurar consistencia
      await db.$transaction(async (tx) => {
        // Eliminar métricas existentes para este jugador y período
        await tx.radarMetrics.deleteMany({
          where: {
            playerId,
            period
          }
        })

        // Crear nuevas métricas
        const metricsToCreate = categories.map(category => ({
          playerId,
          category: category.category,
          playerValue: category.playerValue,
          period,
          dataCompleteness: category.dataCompleteness,
          sourceAttributes: category.sourceAttributes
        }))

        await tx.radarMetrics.createMany({
          data: metricsToCreate
        })
      })

      logger.info(`Radar metrics saved for player ${playerId}`, {
        playerId,
        categoriesCount: categories.length,
        period
      })
    } catch (error) {
      logger.error(`Error saving radar metrics for player ${playerId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        playerId,
        period
      })
      throw error
    }
  }

  /**
   * Actualizar datos de comparación para una categoría
   */
  async updateComparisonData(category: string, comparisonData: Array<{
    playerId: string
    comparisonAverage: number
    percentile: number
    rank: number
    totalPlayers: number
  }>, period: string = '2023-24'): Promise<void> {
    try {
      await db.$transaction(async (tx) => {
        for (const data of comparisonData) {
          await tx.radarMetrics.updateMany({
            where: {
              playerId: data.playerId,
              category,
              period
            },
            data: {
              comparisonAverage: data.comparisonAverage,
              percentile: data.percentile,
              rank: data.rank,
              totalPlayers: data.totalPlayers
            }
          })
        }
      })

      logger.info(`Comparison data updated for category ${category}`, {
        category,
        period,
        playersUpdated: comparisonData.length
      })
    } catch (error) {
      logger.error(`Error updating comparison data for category ${category}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        category,
        period
      })
      throw error
    }
  }

  /**
   * Eliminar métricas de radar para un jugador
   */
  async deletePlayerRadarMetrics(playerId: string, period?: string): Promise<void> {
    try {
      const whereClause: any = { playerId }
      if (period) {
        whereClause.period = period
      }

      await db.radarMetrics.deleteMany({
        where: whereClause
      })

      logger.info(`Radar metrics deleted for player ${playerId}`, {
        playerId,
        period: period || 'all periods'
      })
    } catch (error) {
      logger.error(`Error deleting radar metrics for player ${playerId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        playerId,
        period
      })
      throw error
    }
  }

  // 🔄 MÉTODOS DE PROCESAMIENTO

  /**
   * Procesar métricas de radar para múltiples jugadores
   */
  async processRadarMetricsForPlayers(playerIds: string[], period: string = '2023-24'): Promise<{
    processed: number
    failed: number
    errors: string[]
  }> {
    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const playerId of playerIds) {
      try {
        // Aquí se llamaría al servicio de cálculo de radar
        // Por ahora solo registramos el procesamiento
        logger.info(`Processing radar metrics for player ${playerId}`)
        processed++
      } catch (error) {
        failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Player ${playerId}: ${errorMessage}`)
        logger.error(`Failed to process radar metrics for player ${playerId}:`, error)
      }
    }

    logger.info(`Radar metrics processing completed`, {
      total: playerIds.length,
      processed,
      failed,
      period
    })

    return { processed, failed, errors }
  }
}

// Exportar instancia singleton
export const radarMetricsService = RadarMetricsService.getInstance()