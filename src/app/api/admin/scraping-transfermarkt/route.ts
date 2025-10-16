/**
 * 📥 ENDPOINT DE SCRAPING DE TRANSFERMARKT
 *
 * ✅ PROPÓSITO: Extraer datos de jugadores desde Transfermarkt automáticamente
 * ✅ BENEFICIO: Actualiza 13 campos de perfil para jugadores con URL de Transfermarkt
 * ✅ RUTA: POST /api/admin/scraping-transfermarkt
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * Campos que se extraerán de Transfermarkt (13 campos):
 * - advisor (agente/asesor)
 * - date_of_birth (fecha de nacimiento)
 * - team_name (equipo actual)
 * - team_loan_from (equipo de cesión)
 * - position_player (posición)
 * - foot (pie dominante)
 * - height (altura en cm)
 * - nationality_1 (nacionalidad principal)
 * - nationality_2 (nacionalidad secundaria)
 * - national_tier (nivel selección nacional)
 * - agency (agencia)
 * - contract_end (fin de contrato)
 * - player_trfm_value (valor de mercado)
 */

interface ScrapingResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string
}

/**
 * POST /api/admin/scraping-transfermarkt - Iniciar scraping de jugadores
 */
export async function POST(request: NextRequest) {
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

    // 📊 OBTENER JUGADORES CON URL DE TRANSFERMARKT
    const playersWithUrls = await prisma.jugador.findMany({
      where: {
        url_trfm: {
          not: null,
          not: ''
        }
      },
      select: {
        id_player: true,
        player_name: true,
        url_trfm: true,
        wyscout_id_1: true
      },
      orderBy: {
        player_name: 'asc'
      }
    })

    if (playersWithUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay jugadores con URL de Transfermarkt para procesar',
        results: {
          total: 0,
          processed: 0,
          success: 0,
          errors: 0,
          details: []
        }
      })
    }

    // 📝 CONFIGURACIÓN DE SCRAPING
    const BATCH_SIZE = 5 // Jugadores por lote
    const DELAY_BETWEEN_PLAYERS = 5000 // 5 segundos
    const DELAY_BETWEEN_BATCHES = 30000 // 30 segundos

    const results: ScrapingResult[] = []
    let successCount = 0
    let errorCount = 0

    // 🔄 PROCESAR EN LOTES
    const batches = []
    for (let i = 0; i < playersWithUrls.length; i += BATCH_SIZE) {
      batches.push(playersWithUrls.slice(i, i + BATCH_SIZE))
    }

    console.log(`🚀 Iniciando scraping de ${playersWithUrls.length} jugadores en ${batches.length} lotes`)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`\n📦 LOTE ${batchIndex + 1}/${batches.length}`)
      console.log(`📊 Procesando ${batch.length} jugadores en este lote...`)

      for (let playerIndex = 0; playerIndex < batch.length; playerIndex++) {
        const player = batch[playerIndex]

        try {
          console.log(`\n[${playerIndex + 1}/${batch.length}] ${player.player_name || player.id_player}`)

          // 🌐 HACER SCRAPING DEL JUGADOR
          const scrapedData = await scrapePlayerData(player.url_trfm!)

          // 💾 ACTUALIZAR EN BASE DE DATOS
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: scrapedData
          })

          const fieldsUpdated = Object.keys(scrapedData)

          results.push({
            playerId: player.id_player,
            playerName: player.player_name || player.id_player,
            url: player.url_trfm!,
            success: true,
            fieldsUpdated
          })

          successCount++
          console.log(`✅ Actualizado: ${fieldsUpdated.join(', ')}`)

          // ⏱️ PAUSA ENTRE JUGADORES (excepto el último del lote)
          if (playerIndex < batch.length - 1) {
            await sleep(DELAY_BETWEEN_PLAYERS)
          }

        } catch (error) {
          errorCount++
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
        }
      }

      console.log(`\n📊 Resumen del lote ${batchIndex + 1}:`)
      console.log(`✅ Exitosos: ${successCount}`)
      console.log(`❌ Errores: ${errorCount}`)

      // ⏳ PAUSA ENTRE LOTES (excepto después del último)
      if (batchIndex < batches.length - 1) {
        console.log(`\n⏳ Pausa entre lotes: ${DELAY_BETWEEN_BATCHES / 1000} segundos...`)
        await sleep(DELAY_BETWEEN_BATCHES)
      }
    }

    // 📊 LOG DE AUDITORÍA
    console.log('\n🎉 Scraping completado!')
    console.log(`📊 Total procesados: ${playersWithUrls.length}`)
    console.log(`✅ Total exitosos: ${successCount}`)
    console.log(`❌ Total errores: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Scraping completado: ${successCount} exitosos, ${errorCount} errores`,
      results: {
        total: playersWithUrls.length,
        processed: playersWithUrls.length,
        success: successCount,
        errors: errorCount,
        details: results
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in Transfermarkt scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante el scraping.' },
      { status: 500 }
    )
  }
}

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE UN JUGADOR
 *
 * Esta función extrae los 13 campos de Transfermarkt
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

  // 2. Fecha de nacimiento (formato: "1 de enero de 1990")
  const birthDateMatch = html.match(/<span itemprop="birthDate">([^<]+)<\/span>/)
  if (birthDateMatch) {
    data.date_of_birth = parseDateString(birthDateMatch[1].trim())
  }

  // 3. Equipo actual
  const teamMatch = html.match(/<span class="[^"]*hauptverein[^"]*"[^>]*>([^<]+)<\/span>/)
  if (teamMatch) {
    data.team_name = teamMatch[1].trim()
  }

  // 4. Equipo de cesión (si está cedido)
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

  // 7. Altura (convertir a número)
  const heightMatch = html.match(/Altura:<\/span>\s*<span[^>]*>([0-9,]+)\s*m<\/span>/)
  if (heightMatch) {
    const heightInMeters = parseFloat(heightMatch[1].replace(',', '.'))
    data.height = Math.round(heightInMeters * 100) // Convertir a cm
  }

  // 8. Nacionalidad 1 (principal)
  const nat1Match = html.match(/<img[^>]+title="([^"]+)"[^>]+alt="[^"]*bandera[^"]*"/)
  if (nat1Match) {
    data.nationality_1 = nat1Match[1].trim()
  }

  // 9. Nacionalidad 2 (secundaria, si existe)
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
    data.contract_end = parseContractDate(contractMatch[1].trim())
  }

  // 13. Valor de mercado (convertir a número)
  const valueMatch = html.match(/Valor de mercado:<\/span>\s*<a[^>]*>([0-9,.]+)\s*(mil|mill?\.?)\s*€<\/a>/)
  if (valueMatch) {
    const value = parseFloat(valueMatch[1].replace(',', '.'))
    const multiplier = valueMatch[2].toLowerCase().includes('mill') ? 1000000 : 1000
    data.player_trfm_value = value * multiplier
  }

  // 🔍 EXTRAER NOMBRE DEL ADVISOR (no URL)
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
    // Formato: "1 de enero de 1990" o "1/1/1990"
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
    // Formato: "30/06/2025" o "30 de junio de 2025"
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
