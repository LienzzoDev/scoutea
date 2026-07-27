/**
 * ⚙️ ENDPOINT PARA PROCESAR UN BATCH DE SCRAPING (MEJORADO ANTI-DDOS)
 *
 * ✅ PROPÓSITO: Procesar un lote pequeño de jugadores con protección anti-DDoS
 * ✅ BENEFICIO: Evita detección como ataque mediante pausas aleatorias, rotación de UA y manejo de rate limits
 * ✅ FALLBACK: Si Transfermarkt falla para un jugador, se intenta PlaymakerStats por nombre
 * ✅ RUTA: POST /api/admin/scraping/process
 */

import { NextResponse } from 'next/server'

import { requireAdminOrInternal } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db'
import { registerScrapingAlert, resolvePlayerScrapingAlerts, classifyScrapingError } from '@/lib/scraping/alerts'
import { addJobLog } from '@/lib/scraping/logs'
import { PlaymakerUnavailableError } from '@/lib/scraping/playmaker'
import { RateLimiter, AdaptiveThrottler } from '@/lib/scraping/rate-limiter'
import { scrapePlayerData, scrapePlayerWithFallback, ScrapingHttpError } from '@/lib/scraping/scraper'
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

// 🎛️ CONFIGURACIÓN DE SCRAPING (optimizada para velocidad)
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_PLAYERS: 2000,  // 2 segundos mínimo
  MAX_DELAY_BETWEEN_PLAYERS: 5000,  // 5 segundos máximo
  MAX_RETRIES_PER_PLAYER: 3,
}

/**
 * POST /api/admin/scraping/process - Procesar un batch del job activo
 */
export async function POST(request: Request) {
  console.log('🎯 [PROCESS] Endpoint /process ejecutándose...')

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
    // 🔐 VERIFICAR AUTENTICACIÓN
    // Este endpoint puede ser llamado por un admin autenticado o internamente
    // (server-to-server) con el header Authorization: Bearer CRON_SECRET.
    const authResult = await requireAdminOrInternal(request)
    if (!authResult.ok) {
      return authResult.response
    }

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
      return NextResponse.json(
        { error: 'No hay ningún trabajo de scraping activo.' },
        { status: 404 }
      )
    }

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

    // 📊 OBTENER SIGUIENTE BATCH DE JUGADORES
    // orderBy con id_player como desempate: player_name no es único (y puede
    // ser null), y sin orden total estable la paginación por skip puede
    // saltarse jugadores o repetirlos entre batches.
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
    addJobLog(job.id, '')
    addJobLog(job.id, `📦 Procesando batch ${job.currentBatch + 1}: ${playersToProcess.length} jugadores`)
    addJobLog(job.id, '')

    const results: ScrapingResult[] = []
    let batchSuccessCount = 0
    let batchErrorCount = 0
    let batchRetryCount = 0
    let batchRateLimitCount = 0
    let processedInBatch = 0
    // Si Cloudflare bloquea PlaymakerStats, no insistir en el resto del batch
    let playmakerAvailable = true

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]
      if (!player) continue

      // ⏸️ RESPETAR PAUSA/CANCELACIÓN A MITAD DE BATCH
      if (i > 0 && i % 5 === 0) {
        const currentStatus = await prisma.scrapingJob.findUnique({
          where: { id: job.id },
          select: { status: true }
        })
        if (currentStatus && currentStatus.status !== 'running') {
          console.log(`⏸️ Job ${currentStatus.status} a mitad de batch. Deteniendo.`)
          addJobLog(job.id, `⏸️ Job ${currentStatus.status}: batch interrumpido tras ${processedInBatch} jugadores`)
          break
        }
      }

      console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)
      addJobLog(job.id, `🔍 [${i + 1}/${playersToProcess.length}] Scrapeando: ${player.player_name || player.id_player}`)
      addJobLog(job.id, `   🌐 URL: ${player.url_trfm}`)

      // 🌐 SCRAPING CON RETRY, RATE LIMITING Y FALLBACK A PLAYMAKERSTATS
      const result = await rateLimiter.executeWithRetry(
        async () => {
          if (playmakerAvailable) {
            return await scrapePlayerWithFallback({
              url: player.url_trfm!,
              playerName: player.player_name
            })
          }
          // Fallback deshabilitado (Cloudflare): solo Transfermarkt
          const data = await scrapePlayerData(player.url_trfm!)
          return { data, source: 'transfermarkt' as const, fallbackUsed: false }
        },
        (attempt, delay) => {
          console.log(`  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
          addJobLog(job.id, `  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
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
          // 👥 Salvaguarda de homónimos: el fallback busca por nombre. Si la
          // fecha de nacimiento no coincide con la conocida, descartar datos.
          if (!isLikelySamePlayer(player.date_of_birth, scrapeOutcome.data.date_of_birth)) {
            addJobLog(job.id, `  ⚠️ Fallback descartado: la fecha de nacimiento no coincide (posible homónimo en ZeroZero)`)
            scrapeOutcome.data = {}
          }
          addJobLog(job.id, `  🛟 Transfermarkt falló (${scrapeOutcome.transfermarktError}); fallback ZeroZero (ceroacero.es)`)
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

        // 🧹 APLICAR REGLAS DE ACTUALIZACIÓN (módulo compartido)
        const cleanedData = applyScrapedDataRules(
          player,
          scrapeOutcome.data,
          message => {
            console.log(`  ${message}`)
            addJobLog(job.id, `  ${message}`)
          }
        )

        // Actualizar en base de datos solo si hay campos que actualizar
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
        const sourceTag = scrapeOutcome.fallbackUsed ? ' (fuente: PlaymakerStats)' : ''
        console.log(`  ✅ Actualizado: ${fieldsUpdated.length} campos (${result.retries} reintentos)${sourceTag}`)
        addJobLog(job.id, `  ✅ ${player.player_name}: ${fieldsUpdated.length} campos actualizados${sourceTag}`)

        // Mostrar los campos actualizados (máximo 3)
        const fieldsToShow = fieldsUpdated.slice(0, 3)
        for (const field of fieldsToShow) {
          const oldValue = (player as Record<string, unknown>)[field]
          const newValue = cleanedData[field]
          addJobLog(job.id, `     • ${field}: "${String(oldValue ?? 'null')}" → "${String(newValue ?? 'null')}"`)
        }
        if (fieldsUpdated.length > 3) {
          addJobLog(job.id, `     ... y ${fieldsUpdated.length - 3} campos más`)
        }

      } else {
        // ❌ ERROR - Registrar fallo y alerta
        const errorMsg = result.error ?? 'Error desconocido'

        // Si el fallback murió por Cloudflare, deshabilitarlo para el resto del batch
        if (errorMsg.includes('Cloudflare')) {
          if (playmakerAvailable) {
            playmakerAvailable = false
            addJobLog(job.id, '  ⚠️ PlaymakerStats bloqueado por Cloudflare: fallback deshabilitado para este batch')
          }
        }

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
        addJobLog(job.id, `  ❌ ${player.player_name}: ${errorMsg} (${result.retries} reintentos)`)
      }

      // 🚨 DEMASIADOS RATE LIMITS CONSECUTIVOS → PAUSAR JOB
      if (rateLimiter.getConsecutiveRateLimits() >= 5) {
        console.error('🛑 CRÍTICO: Demasiados rate limits consecutivos. Pausando job.')
        addJobLog(job.id, '🛑 Demasiados rate limits (429). Job pausado automáticamente.')

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

      // 📊 ACTUALIZAR THROTTLER BASÁNDOSE EN MÉTRICAS
      const metrics = rateLimiter.getMetrics()
      throttler.adjustSpeed(metrics.errorRate)

      // ⏱️ PAUSA ADAPTATIVA ENTRE JUGADORES
      if (i < playersToProcess.length - 1) {
        const delays = throttler.getCurrentDelays()
        addJobLog(job.id, `  ⏸️  Pausa antes del siguiente jugador (${(delays.min / 1000).toFixed(1)}-${(delays.max / 1000).toFixed(1)}s)...`)
        await randomSleep(delays.min, delays.max)
      }
    }

    // 📊 CALCULAR MÉTRICAS DEL BATCH
    const finalMetrics = rateLimiter.getMetrics()
    const totalProcessed = job.processedCount + processedInBatch
    const newTotalSuccess = job.successCount + batchSuccessCount
    const newTotalErrors = job.errorCount + batchErrorCount
    const newErrorRate = totalProcessed > 0
      ? Math.round((newTotalErrors / totalProcessed) * 1000) / 10
      : 0

    // 📊 ACTUALIZAR PROGRESO DEL JOB (sin sobrescribir un estado pausado/cancelado)
    const currentJobState = await prisma.scrapingJob.findUnique({
      where: { id: job.id },
      select: { status: true }
    })

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

    console.log(`\n✅ Batch completado:`)
    console.log(`   - Exitosos: ${batchSuccessCount}`)
    console.log(`   - Errores: ${batchErrorCount}`)
    console.log(`   - Reintentos: ${batchRetryCount}`)
    console.log(`   - Rate Limits: ${batchRateLimitCount}`)
    console.log(`📊 Progreso total: ${updatedJob.processedCount}/${updatedJob.totalPlayers}`)

    addJobLog(job.id, '')
    addJobLog(job.id, `✅ Batch ${updatedJob.currentBatch} completado`)
    addJobLog(job.id, `   - Exitosos: ${batchSuccessCount}, Errores: ${batchErrorCount}`)
    const progressPercent = updatedJob.totalPlayers > 0
      ? Math.round((updatedJob.processedCount / updatedJob.totalPlayers) * 100)
      : 0
    addJobLog(job.id, `📊 Progreso total: ${updatedJob.processedCount}/${updatedJob.totalPlayers} (${progressPercent}%)`)
    addJobLog(job.id, '')

    const wasInterrupted = currentJobState && currentJobState.status !== 'running'
    const isCompleted = !wasInterrupted && updatedJob.processedCount >= updatedJob.totalPlayers

    if (wasInterrupted && currentJobState) {
      // Restaurar el estado que puso el usuario (pause/cancel) durante el batch
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: { status: currentJobState.status }
      })
    }

    if (isCompleted) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
      addJobLog(job.id, '')
      addJobLog(job.id, `🎉 ¡Scraping completado exitosamente!`)
      addJobLog(job.id, `📊 Total de jugadores procesados: ${updatedJob.processedCount}`)
      addJobLog(job.id, `✅ Exitosos: ${updatedJob.successCount}`)
      addJobLog(job.id, `❌ Errores: ${updatedJob.errorCount}`)
      if (updatedJob.processedCount > 0) {
        addJobLog(job.id, `📈 Tasa de éxito: ${((updatedJob.successCount / updatedJob.processedCount) * 100).toFixed(1)}%`)
      }
    }

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      message: `Batch procesado: ${batchSuccessCount} exitosos, ${batchErrorCount} errores`,
      job: {
        id: updatedJob.id,
        status: isCompleted ? 'completed' : (currentJobState?.status ?? 'running'),
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
      },
      results
    }, { status: 200 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    console.error('❌ [PROCESS] Error in scraping process:', error)

    // Los errores del fallback no deberían tumbar el job entero
    if (error instanceof PlaymakerUnavailableError || error instanceof ScrapingHttpError) {
      console.error(`❌ [PROCESS] Error de scraping no capturado en el loop: ${errorMessage}`)
    }

    // Intentar marcar el job como failed
    try {
      const failedJob = await prisma.scrapingJob.findFirst({
        where: {
          status: {
            in: ['pending', 'running']
          }
        }
      })

      if (failedJob) {
        console.error(`❌ [PROCESS] Marcando job ${failedJob.id} como failed con error: ${errorMessage}`)
        await prisma.scrapingJob.update({
          where: { id: failedJob.id },
          data: {
            status: 'failed',
            lastError: errorMessage
          }
        })
      }
    } catch (updateError) {
      console.error('❌ [PROCESS] Error updating job status:', updateError)
    }

    return NextResponse.json(
      { error: `Error interno del servidor durante el scraping: ${errorMessage}` },
      { status: 500 }
    )
  }
}
