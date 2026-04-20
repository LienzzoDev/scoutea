/**
 * 🏟️ ENDPOINT DE SCRAPING POR LOTES DE EQUIPOS
 *
 * ✅ PROPÓSITO: Ejecutar scraping de todos los equipos en batches
 * ✅ BENEFICIO: Actualizar datos de equipos desde Transfermarkt
 * ✅ RUTA: POST /api/admin/scraping/teams/batch
 */

import { auth } from '@clerk/nextjs/server'
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getRealisticHeaders, randomSleep } from '@/lib/scraping/user-agents'

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
  REQUEST_TIMEOUT: 30000,          // 30 segundos timeout
  BATCH_SIZE: 50,                  // 50 equipos por batch (hay menos equipos que jugadores)
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

/**
 * 🌍 CORREGIR Y NORMALIZAR PAÍS
 */
function correctCountry(country: string | null): string | null {
  if (!country || country.trim() === '') {
    return null
  }

  const trimmedCountry = country.trim()

  // Búsqueda exacta en el mapeo
  if (COUNTRY_CORRECTIONS[trimmedCountry]) {
    return COUNTRY_CORRECTIONS[trimmedCountry]
  }

  // Búsqueda case-insensitive como fallback
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
 * Formato: { 'Nombre Genérico': { 'País': 'Nombre Correcto' } }
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

/**
 * 🏆 RESOLVER NOMBRE DE COMPETICIÓN BASADO EN EL PAÍS
 */
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
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    // Permitir llamadas internas desde el servidor (header especial)
    const adminUserId = request.headers.get('x-admin-user-id')
    const isInternalCall = !!adminUserId

    if (!isInternalCall) {
      // Si no es llamada interna, verificar autenticación normal
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
    } else {
      console.log(`🔑 Llamada interna autorizada desde usuario: ${adminUserId}`)
    }

    console.log('\n🏟️ INICIANDO SCRAPING DE EQUIPOS...')

    // 📊 OBTENER EQUIPOS CON URL DE TRANSFERMARKT
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
        url_trfm_advisor: true
      },
      take: SCRAPING_CONFIG.BATCH_SIZE,
      orderBy: {
        team_name: 'asc'
      }
    })

    if (teams.length === 0) {
      console.log('ℹ️ No hay equipos para procesar')
      return NextResponse.json({
        success: true,
        message: 'No hay equipos para procesar',
        processed: 0,
        total: 0
      })
    }

    console.log(`📦 Procesando ${teams.length} equipos`)

    const results: TeamScrapingResult[] = []
    let successCount = 0
    let errorCount = 0

    // 🔄 PROCESAR CADA EQUIPO
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      if (!team) continue

      console.log(`[${i + 1}/${teams.length}] ${team.team_name || team.id_team}`)

      try {
        // 🌐 HACER SCRAPING DEL EQUIPO
        const {
          data: scrapedData,
          countryWasCorrected,
          originalCountry,
          correctedCountry,
          competitionWasCorrected,
          originalCompetition,
          correctedCompetition
        } = await scrapeTeamData(team.url_trfm_advisor!)

        if (scrapedData && Object.keys(scrapedData).length > 0) {
          // Actualizar en base de datos
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

          // Log de corrección de país si aplica
          if (countryWasCorrected && originalCountry && correctedCountry) {
            console.log(`  🌍 País corregido: "${originalCountry}" → "${correctedCountry}"`)
          }

          // Log de corrección de competición si aplica
          if (competitionWasCorrected && originalCompetition && correctedCompetition) {
            console.log(`  🏆 Competición corregida: "${originalCompetition}" → "${correctedCompetition}"`)
          }
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

    console.log(`\n✅ Scraping de equipos completado:`)
    console.log(`   - Exitosos: ${successCount}`)
    console.log(`   - Errores: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Scraping completado: ${successCount} exitosos, ${errorCount} errores`,
      processed: teams.length,
      total: teams.length,
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

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE UN EQUIPO
 */
async function scrapeTeamData(url: string): Promise<{
  data: Record<string, unknown>
  countryWasCorrected: boolean
  originalCountry?: string | undefined
  correctedCountry?: string | undefined
  competitionWasCorrected: boolean
  originalCompetition?: string | undefined
  correctedCompetition?: string | undefined
}> {
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
    const $ = cheerio.load(html)
    const data: Record<string, unknown> = {}
    let countryWasCorrected = false
    let originalCountry: string | undefined
    let correctedCountry: string | undefined
    let competitionWasCorrected = false
    let originalCompetition: string | undefined
    let correctedCompetition: string | undefined

    // 1. Nombre del equipo
    const teamNameElement = $('h1.data-header__headline-wrapper').first()
    if (teamNameElement.length > 0) {
      const teamName = teamNameElement.text().trim()
      if (teamName && teamName !== '') {
        data.team_name = teamName
      }
    }

    // 2. País del equipo
    const countryElement = $('span.data-header__club span[class*="flag"]').first()
    if (countryElement.length > 0) {
      const country = countryElement.attr('title')?.trim()
      if (country && country !== '') {
        // Aplicar correcciones de países
        const corrected = correctCountry(country)
        if (corrected) {
          data.team_country = corrected

          // Registrar si hubo corrección
          if (corrected !== country) {
            countryWasCorrected = true
            originalCountry = country
            correctedCountry = corrected
          }
        }
      }
    }

    // 3. Competición
    const competitionElement = $('span.data-header__club span.data-header__content').first()
    if (competitionElement.length > 0) {
      const competition = competitionElement.text().trim()
      if (competition && competition !== '') {
        // Resolver competición basada en el país del equipo
        // Usar el país ya corregido (si existe en data.team_country)
        const countryForResolution = typeof data.team_country === 'string' ? data.team_country : ''
        const resolved = resolveCompetitionByCountry(competition, countryForResolution)

        data.competition = resolved

        // Registrar si hubo corrección
        if (resolved !== competition) {
          competitionWasCorrected = true
          originalCompetition = competition
          correctedCompetition = resolved
        }
      }
    }

    // 4. Valor de mercado del equipo
    const teamValueElement = $('a.data-header__market-value-wrapper').first()
    if (teamValueElement.length > 0) {
      const valueText = teamValueElement.text().trim()
      const valueMatch = valueText.match(/([0-9,.]+)\s*(mil|mill?\.?)\s*€/)

      if (valueMatch?.[1] && valueMatch?.[2]) {
        let cleanValue: string = valueMatch[1]

        // Limpiar formato numérico
        if (cleanValue.includes('.') && cleanValue.includes(',')) {
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
        } else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
          const dotCount = (cleanValue.match(/\./g) || []).length
          if (dotCount > 1 || cleanValue.split('.')[1]?.length === 3) {
            cleanValue = cleanValue.replace(/\./g, '')
          }
        } else if (cleanValue.includes(',')) {
          cleanValue = cleanValue.replace(',', '.')
        }

        const value = parseFloat(cleanValue)
        const multiplier = valueMatch[2].toLowerCase().includes('mill') ? 1000000 : 1000
        data.team_trfm_value = value * multiplier
      }
    }

    // 5. Rating del equipo (si existe)
    const ratingElement = $('span.data-header__label').filter(function() {
      return $(this).text().includes('Rating')
    }).next('span.data-header__content')

    if (ratingElement.length > 0) {
      const ratingText = ratingElement.text().trim()
      const rating = parseFloat(ratingText)
      if (!isNaN(rating)) {
        data.team_rating = rating
      }
    }

    return {
      data,
      countryWasCorrected,
      originalCountry,
      correctedCountry,
      competitionWasCorrected,
      originalCompetition,
      correctedCompetition
    }

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
