/**
 * 🏟️ ENDPOINT DE SCRAPING POR LOTES DE EQUIPOS
 *
 * ✅ PROPÓSITO: Ejecutar scraping de todos los equipos en batches
 * ✅ BENEFICIO: Actualizar datos de equipos desde Transfermarkt
 * ✅ RUTA: POST /api/admin/scraping/teams/batch
 *
 * Body opcional: { skip?: number } — offset del batch. Al terminar un batch,
 * el endpoint se encadena a sí mismo (server-to-server con CRON_SECRET)
 * hasta cubrir todos los equipos.
 */

import { NextResponse } from 'next/server'

import { requireAdminOrInternal, internalApiHeaders } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db'
import { scrapeTeamData } from '@/lib/scraping/scraper'
import { randomSleep } from '@/lib/scraping/user-agents'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

interface TeamScrapingResult {
  teamId: string
  teamName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string | undefined
}

// 🎛️ CONFIGURACIÓN DE SCRAPING
const SCRAPING_CONFIG = {
  MIN_DELAY_BETWEEN_TEAMS: 3000,  // 3 segundos mínimo
  MAX_DELAY_BETWEEN_TEAMS: 8000,  // 8 segundos máximo
  BATCH_SIZE: 30,                 // 30 equipos ≈ 30×(delay medio 5,5s + fetch) < 300s
}

/**
 * 🌍 MAPEO DE CORRECCIÓN DE PAÍSES (TEAM COUNTRY)
 */
const COUNTRY_CORRECTIONS: Record<string, string> = {
  'Botsuana': 'Botswana',
  'Hongkong': 'Hong Kong',
  'Curacao': 'Curaçao',
  'Neukaledonien': 'New Caledonia',
  "Cote d'Ivoire": 'Ivory Coast',
  'Timor-Leste': 'East Timor',
  'Federated States of Micronesia': 'Micronesia',
  'St. Kitts & Nevis': 'Saint Kitts & Nevis',
  'St. Lucia': 'Saint Lucia',
  'St. Vincent and Grenadinen': 'Saint Vincent & Grenadines',
  'Southern Sudan': 'South Sudan',
  'Chinese Taipei': 'Taiwan',
  'Macao': 'Macau',
  'Turks- and Caicosinseln': 'Turks & Caicos Islands',
  'Antigua and Barbuda': 'Antigua & Barbuda',
  'Sao Tome and Principe': 'Sao Tome & Principe',
  'Trinidad and Tobago': 'Trinidad & Tobago',
  'Korea, South': 'South Korea'
}

function correctCountry(country: string | null): string | null {
  if (!country || country.trim() === '') {
    return null
  }

  const trimmedCountry = country.trim()

  if (COUNTRY_CORRECTIONS[trimmedCountry]) {
    return COUNTRY_CORRECTIONS[trimmedCountry]
  }

  const lowerCountry = trimmedCountry.toLowerCase()
  for (const [incorrect, correct] of Object.entries(COUNTRY_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerCountry) {
      return correct
    }
  }

  return trimmedCountry
}

/**
 * 🏆 MAPEO DE COMPETICIONES DUPLICADAS POR PAÍS
 */
const DUPLICATE_COMPETITION_MAPPINGS: Record<string, Record<string, string>> = {
  '1.Division': {
    'Russia': 'FNL',
    'Denmark': '1.Division'
  },
  'Bundesliga': {
    'Germany': 'Bundesliga',
    'Austria': 'Austrian Bundesliga'
  },
  'Challenge League': {
    'Switzerland': 'Challenge League',
    'Malta': 'Maltese Challenge League'
  },
  'Championship': {
    'England': 'Championship',
    'Northern Ireland': 'NIFL Championship'
  },
  'Druga Liga': {
    'Slovenia': '2. SNL',
    'Ukraine': 'Druha Liha'
  },
  'Liga 2': {
    'Peru': 'Liga 2 Peru',
    'Romania': 'Liga II'
  },
  'Ligue Professionnelle 1': {
    'Algeria': 'Algerian Ligue Professionnelle 1',
    'Tunisia': 'Tunisian Ligue Professionnelle 1'
  },
  'Premier Liga': {
    'Russia': 'Russia Premier Liga',
    'Ukraine': 'Premier Liha',
    'Kazakhstan': 'Premer Lïgasi'
  },
  'Primera División Apertura': {
    'Uruguay': 'Primera División Uruguay',
    'Paraguay': 'Primera División Paraguay',
    'Costa Rica': 'Primera División Costa Rica',
    'El Salvador': 'Primera División El Salvador'
  },
  'Primera División Clausura': {
    'Uruguay': 'Primera División Uruguay',
    'Paraguay': 'Primera División Paraguay',
    'Costa Rica': 'Primera División Costa Rica',
    'El Salvador': 'Primera División El Salvador'
  },
  'Regionalliga West': {
    'Germany': 'Regionalliga West',
    'Austria': 'Austrian Regionalliga West'
  },
  'Superliga': {
    'Denmark': 'Superligaen',
    'Romania': 'Liga I'
  },
  'SuperLiga': {
    'Denmark': 'Superligaen',
    'Romania': 'Liga I'
  }
}

function resolveCompetitionByCountry(competition: string, teamCountry: string): string {
  const normalizedCompetition = competition.trim()
  const mapping = DUPLICATE_COMPETITION_MAPPINGS[normalizedCompetition]

  if (mapping) {
    const resolvedCompetition = mapping[teamCountry]
    if (resolvedCompetition) {
      return resolvedCompetition
    }
  }

  return normalizedCompetition
}

/**
 * POST /api/admin/scraping/teams/batch - Ejecutar scraping de equipos en batch
 */
export async function POST(request: Request) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN: admin autenticado o llamada interna con
    // CRON_SECRET. (Antes se aceptaba un header x-admin-user-id sin verificar,
    // lo que permitía saltarse la autenticación por completo.)
    const authResult = await requireAdminOrInternal(request)
    if (!authResult.ok) {
      return authResult.response
    }

    // 📄 OFFSET DEL BATCH (para encadenar hasta cubrir todos los equipos)
    let skip = 0
    try {
      const body = await request.json()
      if (typeof body?.skip === 'number' && body.skip >= 0) {
        skip = Math.floor(body.skip)
      }
    } catch {
      // Sin body o body inválido → primer batch
    }

    console.log(`\n🏟️ INICIANDO SCRAPING DE EQUIPOS (skip=${skip})...`)

    const teamFilter = {
      AND: [
        { url_trfm_advisor: { not: null } },
        { url_trfm_advisor: { not: '' } }
      ]
    }

    const totalTeams = await prisma.equipo.count({ where: teamFilter })

    // 📊 OBTENER BATCH DE EQUIPOS (orden estable por PK)
    const teams = await prisma.equipo.findMany({
      where: teamFilter,
      select: {
        id_team: true,
        team_name: true,
        url_trfm_advisor: true
      },
      skip,
      take: SCRAPING_CONFIG.BATCH_SIZE,
      orderBy: [
        { team_name: 'asc' },
        { id_team: 'asc' }
      ]
    })

    if (teams.length === 0) {
      console.log('ℹ️ No hay más equipos para procesar')
      return NextResponse.json({
        success: true,
        message: 'No hay más equipos para procesar',
        processed: 0,
        total: totalTeams,
        skip
      })
    }

    console.log(`📦 Procesando ${teams.length} equipos (${skip + 1}-${skip + teams.length} de ${totalTeams})`)

    const results: TeamScrapingResult[] = []
    let successCount = 0
    let errorCount = 0

    // 🔄 PROCESAR CADA EQUIPO
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      if (!team) continue

      console.log(`[${skip + i + 1}/${totalTeams}] ${team.team_name || team.id_team}`)

      try {
        const rawData = await scrapeTeamData(team.url_trfm_advisor!)
        const scrapedData: Record<string, unknown> = { ...rawData }

        // 🌍 Correcciones de país
        if (typeof scrapedData.team_country === 'string') {
          const corrected = correctCountry(scrapedData.team_country)
          if (corrected && corrected !== scrapedData.team_country) {
            console.log(`  🌍 País corregido: "${scrapedData.team_country}" → "${corrected}"`)
          }
          if (corrected) {
            scrapedData.team_country = corrected
          } else {
            delete scrapedData.team_country
          }
        }

        // 🏆 Correcciones de competición (usando el país ya corregido)
        if (typeof scrapedData.competition === 'string') {
          const countryForResolution = typeof scrapedData.team_country === 'string'
            ? scrapedData.team_country
            : ''
          const resolved = resolveCompetitionByCountry(scrapedData.competition, countryForResolution)
          if (resolved !== scrapedData.competition) {
            console.log(`  🏆 Competición corregida: "${scrapedData.competition}" → "${resolved}"`)
          }
          scrapedData.competition = resolved
        }

        if (Object.keys(scrapedData).length > 0) {
          await prisma.equipo.update({
            where: { id_team: team.id_team },
            data: scrapedData
          })

          const fieldsUpdated = Object.keys(scrapedData)

          results.push({
            teamId: team.id_team,
            teamName: team.team_name || team.id_team,
            url: team.url_trfm_advisor!,
            success: true,
            fieldsUpdated
          })

          successCount++
          console.log(`  ✅ Actualizado: ${fieldsUpdated.length} campos`)
        } else {
          results.push({
            teamId: team.id_team,
            teamName: team.team_name || team.id_team,
            url: team.url_trfm_advisor!,
            success: false,
            fieldsUpdated: [],
            error: 'No se pudo extraer datos del equipo'
          })
          errorCount++
          console.log(`  ❌ Error: No se pudo extraer datos`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        results.push({
          teamId: team.id_team,
          teamName: team.team_name || team.id_team,
          url: team.url_trfm_advisor!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg
        })
        errorCount++
        console.log(`  ❌ Error: ${errorMsg}`)
      }

      // ⏱️ PAUSA ENTRE EQUIPOS (excepto el último)
      if (i < teams.length - 1) {
        await randomSleep(
          SCRAPING_CONFIG.MIN_DELAY_BETWEEN_TEAMS,
          SCRAPING_CONFIG.MAX_DELAY_BETWEEN_TEAMS
        )
      }
    }

    console.log(`\n✅ Batch de equipos completado: ${successCount} exitosos, ${errorCount} errores`)

    // 🔗 ENCADENAR SIGUIENTE BATCH SI QUEDAN EQUIPOS
    const nextSkip = skip + teams.length
    const hasMore = nextSkip < totalTeams
    if (hasMore) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      console.log(`🔗 Encadenando siguiente batch de equipos (skip=${nextSkip})...`)
      fetch(`${baseUrl}/api/admin/scraping/teams/batch`, {
        method: 'POST',
        headers: internalApiHeaders(),
        body: JSON.stringify({ skip: nextSkip })
      }).catch(err => {
        console.error('⚠️ Error encadenando siguiente batch de equipos:', err)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Scraping completado: ${successCount} exitosos, ${errorCount} errores`,
      processed: teams.length,
      total: totalTeams,
      skip,
      nextSkip: hasMore ? nextSkip : null,
      successCount,
      errorCount,
      results
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in team batch scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante el scraping de equipos.' },
      { status: 500 }
    )
  }
}
