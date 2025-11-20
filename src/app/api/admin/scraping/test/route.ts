/**
 * 🧪 ENDPOINT PARA TEST DE SCRAPING
 * 
 * Este endpoint permite probar el scraping en un pequeño conjunto de jugadores/equipos
 * para verificar que todo funciona correctamente antes de ejecutar un scraping completo.
 * 
 * RUTA: POST /api/admin/scraping/test
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { addJobLog } from '@/lib/scraping/logs'
import { scrapePlayerData, scrapeTeamData } from '@/lib/scraping/scraper'
import { randomSleep } from '@/lib/scraping/user-agents'

// Configuración para el test
const TEST_CONFIG = {
  MAX_PLAYERS: 3,  // Máximo 3 jugadores para el test
  MAX_TEAMS: 2,    // Máximo 2 equipos para el test
  REQUEST_TIMEOUT: 30000,  // 30 segundos
  DELAY_BETWEEN_REQUESTS: 3000  // 3 segundos entre requests
}

interface EntityScrapingResult {
  entityType: 'player' | 'team'
  entityId: string
  entityName: string
  url: string
  success: boolean
  fieldsUpdated?: Array<{ field: string; oldValue: string | null; newValue: string | null }>
  error?: string
}

/**
 * POST /api/admin/scraping/test - Ejecutar test de scraping
 */
export async function POST(request: Request) {
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
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER PARÁMETROS DEL BODY
    const body = await request.json()
    const { testId } = body

    if (!testId) {
      return NextResponse.json(
        { error: 'testId es requerido' },
        { status: 400 }
      )
    }

    addJobLog(testId, '🧪 Iniciando test de scraping...')
    addJobLog(testId, '')

    const results: EntityScrapingResult[] = []

    // 🏃 OBTENER JUGADORES PARA EL TEST
    addJobLog(testId, '👥 Buscando jugadores para el test...')
    const players = await prisma.jugador.findMany({
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
        height: true,
        foot: true,
        nationality_1: true,
        team_name: true,
        position_player: true,
        agency: true,
        contract_end: true,
        player_trfm_value: true
      },
      take: TEST_CONFIG.MAX_PLAYERS,
      orderBy: {
        player_name: 'asc'
      }
    })

    addJobLog(testId, `✅ Encontrados ${players.length} jugadores para el test`)
    addJobLog(testId, '')

    // 🏟️ OBTENER EQUIPOS PARA EL TEST
    addJobLog(testId, '🏟️ Buscando equipos para el test...')
    const teams = await prisma.equipo.findMany({
      where: {
        AND: [
          { url_trfm_advisor: { not: null } },
          { url_trfm_advisor: { not: '' } }
        ]
      },
      select: {
        id_team: true,
        team_name: true,
        url_trfm_advisor: true,
        team_country: true,
        competition: true,
        team_trfm_value: true,
        team_rating: true
      },
      take: TEST_CONFIG.MAX_TEAMS,
      orderBy: {
        team_name: 'asc'
      }
    })

    addJobLog(testId, `✅ Encontrados ${teams.length} equipos para el test`)
    addJobLog(testId, '')
    addJobLog(testId, '🕷️ Iniciando scraping REAL...')
    addJobLog(testId, '')

    // SCRAPING REAL DE JUGADORES
    for (const player of players) {
      addJobLog(testId, `👤 ${player.player_name}`)
      addJobLog(testId, `   URL: ${player.url_trfm}`)

      try {
        // Hacer scraping real
        const scrapedData = await scrapePlayerData(player.url_trfm!)

        // Comparar con datos existentes y detectar cambios
        const fieldsUpdated: Array<{ field: string; oldValue: string | null; newValue: string | null }> = []

        // Comparar campos clave
        const fieldsToCheck = [
          { key: 'date_of_birth', existing: player.date_of_birth, scraped: scrapedData.date_of_birth },
          { key: 'height', existing: player.height, scraped: scrapedData.height },
          { key: 'foot', existing: player.foot, scraped: scrapedData.foot },
          { key: 'position_player', existing: player.position_player, scraped: scrapedData.position_player },
          { key: 'nationality_1', existing: player.nationality_1, scraped: scrapedData.nationality_1 },
          { key: 'team_name', existing: player.team_name, scraped: scrapedData.team_name },
          { key: 'agency', existing: player.agency, scraped: scrapedData.agency },
        ]

        for (const field of fieldsToCheck) {
          const oldVal = field.existing ? String(field.existing) : null
          const newVal = field.scraped ? String(field.scraped) : null

          if (oldVal !== newVal && newVal !== null) {
            fieldsUpdated.push({
              field: field.key,
              oldValue: oldVal,
              newValue: newVal
            })
          }
        }

        addJobLog(testId, `   ✅ Scraping exitoso - ${fieldsUpdated.length} campos actualizables`)

        if (fieldsUpdated.length > 0) {
          fieldsUpdated.forEach(f => {
            addJobLog(testId, `      • ${f.field}: ${f.oldValue || 'null'} → ${f.newValue}`)
          })
        }

        results.push({
          entityType: 'player',
          entityId: player.id_player,
          entityName: player.player_name,
          url: player.url_trfm!,
          success: true,
          fieldsUpdated
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        addJobLog(testId, `   ❌ Error: ${errorMsg}`)

        results.push({
          entityType: 'player',
          entityId: player.id_player,
          entityName: player.player_name,
          url: player.url_trfm!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg
        })
      }

      // Pausa entre jugadores (respetando rate limits)
      await randomSleep(TEST_CONFIG.DELAY_BETWEEN_REQUESTS, TEST_CONFIG.DELAY_BETWEEN_REQUESTS + 2000)
    }

    addJobLog(testId, '')

    // SCRAPING REAL DE EQUIPOS
    for (const team of teams) {
      addJobLog(testId, `🏟️ ${team.team_name}`)
      addJobLog(testId, `   URL: ${team.url_trfm_advisor}`)

      try {
        // Hacer scraping real
        const scrapedData = await scrapeTeamData(team.url_trfm_advisor!)

        // Comparar con datos existentes
        const fieldsUpdated: Array<{ field: string; oldValue: string | null; newValue: string | null }> = []

        const fieldsToCheck = [
          { key: 'team_name', existing: team.team_name, scraped: scrapedData.team_name },
          { key: 'team_country', existing: team.team_country, scraped: scrapedData.team_country },
          { key: 'competition', existing: team.competition, scraped: scrapedData.competition },
          { key: 'team_trfm_value', existing: team.team_trfm_value, scraped: scrapedData.team_trfm_value },
        ]

        for (const field of fieldsToCheck) {
          const oldVal = field.existing ? String(field.existing) : null
          const newVal = field.scraped ? String(field.scraped) : null

          if (oldVal !== newVal && newVal !== null) {
            fieldsUpdated.push({
              field: field.key,
              oldValue: oldVal,
              newValue: newVal
            })
          }
        }

        addJobLog(testId, `   ✅ Scraping exitoso - ${fieldsUpdated.length} campos actualizables`)

        if (fieldsUpdated.length > 0) {
          fieldsUpdated.forEach(f => {
            addJobLog(testId, `      • ${f.field}: ${f.oldValue || 'null'} → ${f.newValue}`)
          })
        }

        results.push({
          entityType: 'team',
          entityId: team.id_team,
          entityName: team.team_name,
          url: team.url_trfm_advisor!,
          success: true,
          fieldsUpdated
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        addJobLog(testId, `   ❌ Error: ${errorMsg}`)

        results.push({
          entityType: 'team',
          entityId: team.id_team,
          entityName: team.team_name,
          url: team.url_trfm_advisor!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg
        })
      }

      // Pausa entre equipos
      await randomSleep(TEST_CONFIG.DELAY_BETWEEN_REQUESTS, TEST_CONFIG.DELAY_BETWEEN_REQUESTS + 2000)
    }

    addJobLog(testId, '')
    addJobLog(testId, '═'.repeat(60))
    addJobLog(testId, '✅ TEST COMPLETADO')
    addJobLog(testId, '')
    addJobLog(testId, `📊 Resumen:`)
    addJobLog(testId, `   • Jugadores testeados: ${players.length}`)
    addJobLog(testId, `   • Equipos testeados: ${teams.length}`)
    addJobLog(testId, `   • Total entidades: ${results.length}`)
    addJobLog(testId, `   • Exitosos: ${results.filter(r => r.success).length}`)
    addJobLog(testId, `   • Fallidos: ${results.filter(r => !r.success).length}`)
    addJobLog(testId, `   • Campos actualizables: ${results.reduce((sum, r) => sum + r.fieldsUpdated.length, 0)}`)
    addJobLog(testId, '')
    addJobLog(testId, '💡 Test completado. Si todo funciona bien, usa "Iniciar Scraping" para el proceso completo.')
    addJobLog(testId, '⚠️ NOTA: Este test NO guarda cambios en la BD, solo muestra qué se actualizaría.')

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Test de scraping completado',
      results,
      summary: {
        totalPlayers: players.length,
        totalTeams: teams.length,
        totalEntities: results.length,
        successfulScrapings: results.filter(r => r.success).length,
        failedScrapings: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('❌ Error en test de scraping:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json(
      { error: `Error en test de scraping: ${errorMsg}` },
      { status: 500 }
    )
  }
}

