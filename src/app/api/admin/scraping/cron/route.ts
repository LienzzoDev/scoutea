/**
 * ⏰ ENDPOINT DE PROCESAMIENTO CONTINUO (VERCEL CRON)
 *
 * ✅ PROPÓSITO: Procesar batches en el backend sin intervención del usuario
 * ✅ BENEFICIO: El scraping continúa aunque el usuario cierre la página
 * ✅ FALLBACK: Si Transfermarkt falla para un jugador, se intenta PlaymakerStats
 * ✅ RUTA: GET /api/admin/scraping/cron
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { registerScrapingAlert, resolvePlayerScrapingAlerts, classifyScrapingError } from '@/lib/scraping/alerts'
import { RateLimiter, AdaptiveThrottler } from '@/lib/scraping/rate-limiter'
import { scrapePlayerData, scrapePlayerWithFallback } from '@/lib/scraping/scraper'
import { applyScrapedDataRules, isLikelySamePlayer } from '@/lib/scraping/update-rules'
import { randomSleep } from '@/lib/scraping/user-agents'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

interface ScrapingResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  source?: 'transfermarkt' | 'playmakerstats'
  error?: string | undefined
  retries?: number | undefined
}

// 🎛️ CONFIGURACIÓN DE SCRAPING (más conservadora que /process)
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_PLAYERS: 5000,  // 5 segundos mínimo
  MAX_DELAY_BETWEEN_PLAYERS: 15000, // 15 segundos máximo
  MAX_RETRIES_PER_PLAYER: 3,
}

/**
 * GET /api/admin/scraping/cron - Procesar batch automáticamente (ejecutado por Vercel Cron)
 */
export async function GET(request: Request) {
  const rateLimiter = new RateLimiter({
    maxRetriesPerRequest: SCRAPING_CONFIG.MAX_RETRIES_PER_PLAYER,
    baseRetryDelay: 5000,
    maxRetryDelay: 120000,
    errorThresholdPercent: 20
  })

  const throttler = new AdaptiveThrottler(
    SCRAPING_CONFIG.MIN_DELAY_BETWEEN_PLAYERS,
    SCRAPING_CONFIG.MAX_DELAY_BETWEEN_PLAYERS
  )

  try {
    // 🔐 VERIFICAR AUTENTICACIÓN DE CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.error('❌ Unauthorized cron request')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('\n⏰ CRON JOB EJECUTÁNDOSE:', new Date().toISOString())

    // 🔍 OBTENER JOB ACTIVO
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      console.log('ℹ️ No hay jobs activos. Cron terminando...')
      return NextResponse.json({
        success: true,
        message: 'No hay jobs activos para procesar'
      })
    }

    console.log(`📋 Job encontrado: ${job.id}`)

    // ✅ VERIFICAR SI YA SE COMPLETÓ
    if (job.processedCount >= job.totalPlayers) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'Scraping completado',
        job: {
          id: job.id,
          status: 'completed',
          totalPlayers: job.totalPlayers,
          processedCount: job.processedCount,
          successCount: job.successCount,
          errorCount: job.errorCount,
          rateLimitCount: job.rateLimitCount,
          errorRate: job.errorRate
        }
      })
    }

    // 🔄 MARCAR COMO RUNNING
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: { status: 'running' }
    })

    // 📊 OBTENER SIGUIENTE BATCH (orden total estable: ver /process)
    const playersToProcess = await prisma.jugador.findMany({
      where: {
        AND: [
          { url_trfm: { not: null } },
          { url_trfm: { not: '' } }
        ]
      },
      select: {
        id_player: true,
        player_name: true,
        url_trfm: true,
        date_of_birth: true,
        team_name: true,
        team_country: true,
        team_loan_from: true,
        position_player: true,
        height: true,
        agency: true
      },
      skip: job.processedCount,
      take: job.batchSize,
      orderBy: [
        { player_name: 'asc' },
        { id_player: 'asc' }
      ]
    })

    if (playersToProcess.length === 0) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'No hay más jugadores para procesar'
      })
    }

    console.log(`\n📦 Procesando batch ${job.currentBatch + 1}: ${playersToProcess.length} jugadores`)

    const results: ScrapingResult[] = []
    let batchSuccessCount = 0
    let batchErrorCount = 0
    let batchRetryCount = 0
    let batchRateLimitCount = 0
    let processedInBatch = 0
    let playmakerAvailable = true

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]
      if (!player) continue

      console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)

      const result = await rateLimiter.executeWithRetry(
        async () => {
          if (playmakerAvailable) {
            return await scrapePlayerWithFallback({
              url: player.url_trfm!,
              playerName: player.player_name
            })
          }
          const data = await scrapePlayerData(player.url_trfm!)
          return { data, source: 'transfermarkt' as const, fallbackUsed: false }
        },
        (attempt, delay) => {
          console.log(`  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
        }
      )

      processedInBatch++

      if (result.success && result.data) {
        const scrapeOutcome = result.data

        if (!scrapeOutcome.fallbackUsed) {
          // ✅ Transfermarkt volvió a funcionar: resolver alertas pendientes
          // (quita el triángulo rojo de la tabla de jugadores)
          await resolvePlayerScrapingAlerts(player.id_player)
        }

        if (scrapeOutcome.fallbackUsed) {
          // 👥 Salvaguarda de homónimos: el fallback busca por nombre
          if (!isLikelySamePlayer(player.date_of_birth, scrapeOutcome.data.date_of_birth)) {
            console.log(`  ⚠️ Fallback descartado: fecha de nacimiento no coincide (posible homónimo)`)
            scrapeOutcome.data = {}
          } else {
            console.log(`  🛟 Transfermarkt falló; fallback ZeroZero (ceroacero.es)`)
          }

          // La URL de TM falló aunque el fallback funcionara: registrar alerta
          const { errorType, httpStatus } = classifyScrapingError(scrapeOutcome.transfermarktError ?? '')
          await registerScrapingAlert({
            entityType: 'player',
            entityId: String(player.id_player),
            entityName: player.player_name,
            url: player.url_trfm!,
            errorType,
            ...(scrapeOutcome.transfermarktError !== undefined && { errorMessage: scrapeOutcome.transfermarktError }),
            ...(httpStatus !== undefined && { httpStatus })
          })
        }

        const cleanedData = applyScrapedDataRules(
          player,
          scrapeOutcome.data,
          message => console.log(`  ${message}`)
        )

        if (Object.keys(cleanedData).length > 0) {
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: cleanedData
          })
        }

        const fieldsUpdated = Object.keys(cleanedData)

        results.push({
          playerId: String(player.id_player),
          playerName: player.player_name || String(player.id_player),
          url: player.url_trfm!,
          success: true,
          fieldsUpdated,
          source: scrapeOutcome.source,
          retries: result.retries
        })

        batchSuccessCount++
        batchRetryCount += result.retries
        console.log(`  ✅ Actualizado: ${fieldsUpdated.length} campos (${result.retries} reintentos)`)

      } else {
        const errorMsg = result.error ?? 'Error desconocido'

        if (errorMsg.includes('Cloudflare') && playmakerAvailable) {
          playmakerAvailable = false
          console.log('  ⚠️ PlaymakerStats bloqueado por Cloudflare: fallback deshabilitado')
        }

        // 🚨 Registrar alerta persistente (triángulo rojo en la tabla admin)
        const { errorType, httpStatus } = classifyScrapingError(errorMsg)
        await registerScrapingAlert({
          entityType: 'player',
          entityId: String(player.id_player),
          entityName: player.player_name,
          url: player.url_trfm!,
          errorType,
          errorMessage: errorMsg,
          ...(httpStatus !== undefined && { httpStatus })
        })

        results.push({
          playerId: String(player.id_player),
          playerName: player.player_name || String(player.id_player),
          url: player.url_trfm!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg,
          retries: result.retries
        })

        batchErrorCount++
        batchRetryCount += result.retries || 0

        if (result.wasRateLimited) {
          batchRateLimitCount++
        }

        console.log(`  ❌ Error: ${errorMsg} (${result.retries} reintentos)`)
      }

      // 🚨 DEMASIADOS RATE LIMITS CONSECUTIVOS → PAUSAR JOB
      if (rateLimiter.getConsecutiveRateLimits() >= 5) {
        console.error('🛑 CRÍTICO: Demasiados rate limits consecutivos. Pausando job.')

        await prisma.scrapingJob.update({
          where: { id: job.id },
          data: {
            status: 'paused',
            processedCount: job.processedCount + processedInBatch,
            successCount: job.successCount + batchSuccessCount,
            errorCount: job.errorCount + batchErrorCount,
            rateLimitCount: (job.rateLimitCount || 0) + batchRateLimitCount,
            lastError: 'Demasiados rate limits (429). Job pausado automáticamente.',
            last429At: new Date()
          }
        })

        return NextResponse.json({
          success: false,
          error: 'Job pausado automáticamente por exceso de rate limiting',
          job: {
            id: job.id,
            status: 'paused',
            rateLimitCount: job.rateLimitCount + batchRateLimitCount
          }
        }, { status: 429 })
      }

      // 📊 THROTTLING ADAPTATIVO
      const metrics = rateLimiter.getMetrics()
      throttler.adjustSpeed(metrics.errorRate)

      if (i < playersToProcess.length - 1) {
        const delays = throttler.getCurrentDelays()
        await randomSleep(delays.min, delays.max)
      }
    }

    // 📊 ACTUALIZAR PROGRESO DEL JOB
    const finalMetrics = rateLimiter.getMetrics()
    const totalProcessed = job.processedCount + processedInBatch
    const newTotalSuccess = job.successCount + batchSuccessCount
    const newTotalErrors = job.errorCount + batchErrorCount
    const newErrorRate = totalProcessed > 0
      ? Math.round((newTotalErrors / totalProcessed) * 1000) / 10
      : 0

    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        processedCount: totalProcessed,
        successCount: newTotalSuccess,
        errorCount: newTotalErrors,
        currentBatch: job.currentBatch + 1,
        retryCount: (job.retryCount || 0) + batchRetryCount,
        rateLimitCount: (job.rateLimitCount || 0) + batchRateLimitCount,
        errorRate: newErrorRate,
        speedMultiplier: throttler.getMultiplier(),
        slowModeActive: finalMetrics.shouldSlowDown,
        lastProcessedAt: new Date(),
        lastError: batchErrorCount > 0 ? `${batchErrorCount} errores en este batch` : null
      }
    })

    console.log(`\n✅ Batch completado: ${batchSuccessCount} exitosos, ${batchErrorCount} errores`)
    console.log(`📊 Progreso total: ${updatedJob.processedCount}/${updatedJob.totalPlayers}`)

    const isCompleted = updatedJob.processedCount >= updatedJob.totalPlayers

    if (isCompleted) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
      console.log('🎉 ¡JOB COMPLETADO!')
    }

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      message: `Batch procesado: ${batchSuccessCount} exitosos, ${batchErrorCount} errores`,
      job: {
        id: updatedJob.id,
        status: isCompleted ? 'completed' : 'running',
        totalPlayers: updatedJob.totalPlayers,
        processedCount: updatedJob.processedCount,
        successCount: updatedJob.successCount,
        errorCount: updatedJob.errorCount,
        currentBatch: updatedJob.currentBatch,
        retryCount: updatedJob.retryCount,
        rateLimitCount: updatedJob.rateLimitCount,
        errorRate: updatedJob.errorRate,
        speedMultiplier: updatedJob.speedMultiplier,
        slowModeActive: updatedJob.slowModeActive,
        progress: updatedJob.totalPlayers > 0
          ? Math.round((updatedJob.processedCount / updatedJob.totalPlayers) * 100)
          : 0
      },
      metrics: {
        ...finalMetrics,
        throttlerMultiplier: throttler.getMultiplier()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in cron scraping process:', error)

    try {
      const failedJob = await prisma.scrapingJob.findFirst({
        where: {
          status: {
            in: ['pending', 'running']
          }
        }
      })

      if (failedJob) {
        await prisma.scrapingJob.update({
          where: { id: failedJob.id },
          data: {
            status: 'failed',
            lastError: error instanceof Error ? error.message : 'Error desconocido'
          }
        })
      }
    } catch (updateError) {
      console.error('Error updating job status:', updateError)
    }

    return NextResponse.json(
      { error: 'Error interno del servidor durante el scraping.' },
      { status: 500 }
    )
  }
}
