/**
 * ⚙️ ENDPOINT PARA PROCESAR UN BATCH DE SCRAPING
 *
 * ✅ PROPÓSITO: Procesar un lote pequeño de jugadores (sin timeout)
 * ✅ BENEFICIO: Dividir el trabajo en múltiples requests para evitar timeouts
 * ✅ RUTA: POST /api/admin/scraping/process
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

interface ScrapingResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string
}

/**
 * POST /api/admin/scraping/process - Procesar un batch del job activo
 */
export async function POST() {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
        { status: 403 }
      )
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
          errorCount: job.errorCount
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

    // 🔄 PROCESAR CADA JUGADOR DEL BATCH
    for (let i = 0; i < playersToProcess.length; i++) {
      const player = playersToProcess[i]

      try {
        console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name || player.id_player}`)

        // 🌐 HACER SCRAPING DEL JUGADOR
        const scrapedData = await scrapePlayerData(player.url_trfm!)

        // 💾 ACTUALIZAR EN BASE DE DATOS
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
          fieldsUpdated
        })

        batchSuccessCount++
        console.log(`✅ Actualizado: ${fieldsUpdated.length} campos`)

        // ⏱️ PAUSA ENTRE JUGADORES (3 segundos para evitar rate limiting)
        if (i < playersToProcess.length - 1) {
          await sleep(3000)
        }

      } catch (error) {
        batchErrorCount++
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'

        results.push({
          playerId: player.id_player,
          playerName: player.player_name || player.id_player,
          url: player.url_trfm!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg
        })

        console.log(`❌ Error: ${errorMsg}`)

        // Continuar con el siguiente jugador
        await sleep(1000)
      }
    }

    // 📊 ACTUALIZAR PROGRESO DEL JOB
    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        processedCount: job.processedCount + playersToProcess.length,
        successCount: job.successCount + batchSuccessCount,
        errorCount: job.errorCount + batchErrorCount,
        currentBatch: job.currentBatch + 1,
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
        progress: Math.round((updatedJob.processedCount / updatedJob.totalPlayers) * 100)
      },
      results
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in scraping process:', error)

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
 * 🕷️ FUNCIÓN DE SCRAPING DE UN JUGADOR
 *
 * Esta función extrae los 14 campos de Transfermarkt
 */
async function scrapePlayerData(url: string): Promise<Record<string, any>> {
  // 🌐 HACER REQUEST A TRANSFERMARKT
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://www.transfermarkt.es/',
      'Cache-Control': 'no-cache'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()

  // 📊 EXTRAER DATOS USANDO REGEX Y PARSING
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
}

/**
 * 📅 PARSEAR FECHA EN FORMATO ESPAÑOL
 */
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

/**
 * 📅 PARSEAR FECHA DE CONTRATO
 */
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

/**
 * ⏱️ FUNCIÓN DE PAUSA
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
