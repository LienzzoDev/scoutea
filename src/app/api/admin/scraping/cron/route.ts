/**
 * ⏰ ENDPOINT DE CRON PARA SCRAPING AUTOMÁTICO
 *
 * ✅ PROPÓSITO: Procesar batches automáticamente en el backend sin intervención del usuario
 * ✅ BENEFICIO: El scraping continúa aunque el usuario cierre la página
 * ✅ RUTA: GET /api/admin/scraping/cron
 * ✅ FRECUENCIA: Se ejecuta DIARIAMENTE a las 2am vía Vercel Cron (Plan Hobby)
 * ✅ BATCH SIZE: 100 jugadores por día (~10-20 minutos de procesamiento)
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { RateLimiter, AdaptiveThrottler } from '@/lib/scraping/rate-limiter'
import { getRealisticHeaders, randomSleep } from '@/lib/scraping/user-agents'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

interface ScrapingResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string
  retries?: number
}

// 🎛️ CONFIGURACIÓN DE SCRAPING (más conservadora)
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_PLAYERS: 5000,  // 5 segundos mínimo
  MAX_DELAY_BETWEEN_PLAYERS: 15000, // 15 segundos máximo
  REQUEST_TIMEOUT: 30000,            // 30 segundos timeout
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
    // 🔐 VERIFICAR AUTENTICACIÓN DE CRON (Vercel pasa headers específicos)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // En producción, verificar el secret del cron
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

    // Si no hay job activo, terminar silenciosamente
    if (!job) {
      console.log('ℹ️ No hay jobs activos. Cron terminando...')
      return NextResponse.json({
        success: true,
        message: 'No hay jobs activos para procesar'
      })
    }

    console.log(`📋 Job encontrado: ${job.id}`)
    console.log(`📊 Progreso: ${job.processedCount}/${job.totalPlayers} (${Math.round((job.processedCount / job.totalPlayers) * 100)}%)`)

    // ✅ VERIFICAR SI YA SE COMPLETÓ
    if (job.processedCount >= job.totalPlayers) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      console.log('✅ Job completado!')

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
    const playersToProcess = await prisma.jugador.findMany({
      where: {
        url_trfm: {
          not: null,
          not: ''
        }
      },
      select: {
        id_player: true,
        player_name: true,
        url_trfm: true
      },
      skip: job.processedCount,
      take: job.batchSize,
      orderBy: {
        player_name: 'asc'
      }
    })

    if (playersToProcess.length === 0) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      console.log('✅ No hay más jugadores. Job completado!')

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

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]

      console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)

      // 🌐 HACER SCRAPING CON RETRY LOGIC Y RATE LIMITING
      const result = await rateLimiter.executeWithRetry(
        async () => {
          return await scrapePlayerData(player.url_trfm!)
        },
        (attempt, delay) => {
          console.log(`  🔄 Reintento ${attempt} en ${delay / 1000}s para ${player.player_name}`)
        }
      )

      if (result.success && result.data) {
        // ✅ ÉXITO - Actualizar en base de datos
        const scrapedData = result.data

        if (Object.keys(scrapedData).length > 0) {
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: scrapedData
          })
        }

        const fieldsUpdated = Object.keys(scrapedData)

        results.push({
          playerId: player.id_player,
          playerName: player.player_name || player.id_player,
          url: player.url_trfm!,
          success: true,
          fieldsUpdated,
          retries: result.retries
        })

        batchSuccessCount++
        batchRetryCount += result.retries
        console.log(`  ✅ Actualizado: ${fieldsUpdated.length} campos (${result.retries} reintentos)`)

      } else {
        // ❌ ERROR - Registrar fallo
        results.push({
          playerId: player.id_player,
          playerName: player.player_name || player.id_player,
          url: player.url_trfm!,
          success: false,
          fieldsUpdated: [],
          error: result.error,
          retries: result.retries
        })

        batchErrorCount++
        batchRetryCount += result.retries || 0

        if (result.wasRateLimited) {
          batchRateLimitCount++
        }

        console.log(`  ❌ Error: ${result.error} (${result.retries} reintentos)`)
      }

      // 📊 ACTUALIZAR THROTTLER BASÁNDOSE EN MÉTRICAS
      const metrics = rateLimiter.getMetrics()
      throttler.adjustSpeed(metrics.errorRate)

      // ⏱️ PAUSA ADAPTATIVA ENTRE JUGADORES
      if (i < playersToProcess.length - 1) {
        const delays = throttler.getCurrentDelays()
        console.log(`  ⏳ Pausa: ${delays.min / 1000}-${delays.max / 1000}s (multiplier: ${throttler.getMultiplier().toFixed(2)}x)`)
        await randomSleep(delays.min, delays.max)
      }

      // 🚨 VERIFICAR SI HAY DEMASIADOS RATE LIMITS CONSECUTIVOS
      if (rateLimiter.getConsecutiveRateLimits() >= 5) {
        console.error('🛑 CRÍTICO: Demasiados rate limits consecutivos. Pausando job.')

        await prisma.scrapingJob.update({
          where: { id: job.id },
          data: {
            status: 'paused',
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
    }

    // 📊 CALCULAR MÉTRICAS DEL BATCH
    const finalMetrics = rateLimiter.getMetrics()
    const totalProcessed = job.processedCount + playersToProcess.length
    const newTotalSuccess = job.successCount + batchSuccessCount
    const newTotalErrors = job.errorCount + batchErrorCount
    const newErrorRate = totalProcessed > 0
      ? Math.round((newTotalErrors / totalProcessed) * 1000) / 10
      : 0

    // 📊 ACTUALIZAR PROGRESO DEL JOB
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
    console.log(`   - Error Rate: ${newErrorRate}%`)
    console.log(`   - Speed Multiplier: ${throttler.getMultiplier().toFixed(2)}x`)
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
        progress: Math.round((updatedJob.processedCount / updatedJob.totalPlayers) * 100)
      },
      metrics: {
        ...finalMetrics,
        throttlerMultiplier: throttler.getMultiplier()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in cron scraping process:', error)

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

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE UN JUGADOR (MEJORADA)
 */
async function scrapePlayerData(url: string): Promise<Record<string, any>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SCRAPING_CONFIG.REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders('https://www.transfermarkt.es/'),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const data: Record<string, any> = {}

    // 1. URL del advisor
    const advisorMatch = html.match(/<a href="(\/berater\/[^"]+)"/)
    if (advisorMatch) {
      data.url_trfm_advisor = `https://www.transfermarkt.es${advisorMatch[1]}`
    }

    // 2. Fecha de nacimiento
    const birthDateMatch = html.match(/<span itemprop="birthDate">([^<]+)<\/span>/)
    if (birthDateMatch) {
      const parsedDate = parseDateString(birthDateMatch[1].trim())
      if (parsedDate) {
        data.date_of_birth = parsedDate
      }
    }

    // 3. Equipo actual
    const teamMatch = html.match(/<span class="[^"]*hauptverein[^"]*"[^>]*>([^<]+)<\/span>/)
    if (teamMatch) {
      data.team_name = teamMatch[1].trim()
    }

    // 4. Equipo de cesión
    const loanMatch = html.match(/cedido de[^>]*>([^<]+)</)
    if (loanMatch) {
      data.team_loan_from = loanMatch[1].trim()
    }

    // 5. Posición
    const positionMatch = html.match(/<span class="[^"]*position[^"]*"[^>]*>([^<]+)<\/span>/)
    if (positionMatch) {
      data.position_player = positionMatch[1].trim()
    }

    // 6. Pie dominante
    const footMatch = html.match(/Pie:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (footMatch) {
      data.foot = footMatch[1].trim()
    }

    // 7. Altura
    const heightMatch = html.match(/Altura:<\/span>\s*<span[^>]*>([0-9,]+)\s*m<\/span>/)
    if (heightMatch) {
      const heightInMeters = parseFloat(heightMatch[1].replace(',', '.'))
      data.height = Math.round(heightInMeters * 100)
    }

    // 8. Nacionalidad 1
    const nat1Match = html.match(/<img[^>]+title="([^"]+)"[^>]+alt="[^"]*bandera[^"]*"/)
    if (nat1Match) {
      data.nationality_1 = nat1Match[1].trim()
    }

    // 9. Nacionalidad 2
    const nat2Matches = html.matchAll(/<img[^>]+title="([^"]+)"[^>]+alt="[^"]*bandera[^"]*"/g)
    const nationalities = Array.from(nat2Matches).map(m => m[1].trim())
    if (nationalities.length > 1) {
      data.nationality_2 = nationalities[1]
    }

    // 10. Nivel de selección nacional
    const nationalTeamMatch = html.match(/Selección nacional:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (nationalTeamMatch) {
      data.national_tier = nationalTeamMatch[1].trim()
    }

    // 11. Agencia
    const agencyMatch = html.match(/Agencia:<\/span>\s*<a[^>]*>([^<]+)<\/a>/)
    if (agencyMatch) {
      data.agency = agencyMatch[1].trim()
    }

    // 12. Fin de contrato
    const contractMatch = html.match(/Contrato hasta:<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
    if (contractMatch) {
      const parsedDate = parseContractDate(contractMatch[1].trim())
      if (parsedDate) {
        data.contract_end = parsedDate
      }
    }

    // 13. Valor de mercado
    const valueMatch = html.match(/Valor de mercado:<\/span>\s*<a[^>]*>([0-9,.]+)\s*(mil|mill?\.?)\s*€<\/a>/)
    if (valueMatch) {
      const value = parseFloat(valueMatch[1].replace(',', '.'))
      const multiplier = valueMatch[2].toLowerCase().includes('mill') ? 1000000 : 1000
      data.player_trfm_value = value * multiplier
    }

    // 14. Nombre del advisor
    const advisorNameMatch = html.match(/Agente:<\/span>\s*<a[^>]*>([^<]+)<\/a>/)
    if (advisorNameMatch) {
      data.advisor = advisorNameMatch[1].trim()
    }

    return data

  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout después de ${SCRAPING_CONFIG.REQUEST_TIMEOUT / 1000}s`)
      }
      throw error
    }

    throw new Error('Error desconocido durante el scraping')
  }
}

function parseDateString(dateStr: string): Date | null {
  try {
    const months: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
      'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
      'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    }

    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    const match = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/)
    if (match) {
      const [, day, month, year] = match
      const monthIndex = months[month.toLowerCase()]
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day))
      }
    }

    return null
  } catch {
    return null
  }
}

function parseContractDate(dateStr: string): Date | null {
  try {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    return parseDateString(dateStr)
  } catch {
    return null
  }
}
