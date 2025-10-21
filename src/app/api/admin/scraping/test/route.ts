/**
 * 🧪 ENDPOINT DE TEST PARA SCRAPING
 *
 * ✅ PROPÓSITO: Probar la funcionalidad de scraping con 3 jugadores + 3 equipos
 * ✅ BENEFICIO: Verificar que el scraping funciona antes de lanzar un job completo
 * ✅ RUTA: POST /api/admin/scraping/test
 */

import { auth } from '@clerk/nextjs/server'
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getRealisticHeaders, randomSleep } from '@/lib/scraping/user-agents'

export const maxDuration = 60 // 1 minuto máximo

interface TestResult {
  entityType: 'player' | 'team'
  entityId: string
  entityName: string
  url: string
  success: boolean
  fieldsUpdated: Array<{
    field: string
    oldValue: string | null
    newValue: string | null
  }>
  error?: string
}

/**
 * POST /api/admin/scraping/test - Probar scraping con 3 jugadores + 3 equipos
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
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
        { status: 403 }
      )
    }

    console.log('🧪 Iniciando TEST de scraping (jugadores + equipos)...')

    // 📊 OBTENER PRIMEROS 3 JUGADORES CON URL
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
        url_trfm_advisor: true,
        date_of_birth: true,
        team_name: true,
        team_loan_from: true,
        position_player: true,
        foot: true,
        height: true,
        nationality_1: true,
        nationality_2: true,
        national_tier: true,
        agency: true,
        contract_end: true
      },
      take: 3,
      orderBy: {
        player_name: 'asc'
      }
    })

    // 🏟️ OBTENER PRIMEROS 3 EQUIPOS CON URL
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
      take: 3,
      orderBy: {
        team_name: 'asc'
      }
    })

    if (players.length === 0 && teams.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay jugadores ni equipos con URL de Transfermarkt para probar'
      })
    }

    console.log(`🎯 Procesando ${players.length} jugadores + ${teams.length} equipos de prueba...`)

    const results: TestResult[] = []

    // 🔄 PROCESAR CADA JUGADOR
    for (const player of players) {
      console.log(`\n🔍 Scrapeando: ${player.player_name}`)

      try {
        // Guardar valores antiguos
        const oldValues = {
          url_trfm_advisor: player.url_trfm_advisor,
          date_of_birth: player.date_of_birth,
          team_name: player.team_name,
          team_loan_from: player.team_loan_from,
          position_player: player.position_player,
          foot: player.foot,
          height: player.height,
          nationality_1: player.nationality_1,
          nationality_2: player.nationality_2,
          national_tier: player.national_tier,
          agency: player.agency,
          contract_end: player.contract_end
        }

        // Scrapear datos
        const scrapedData = await scrapePlayerData(player.url_trfm!)

        // Actualizar jugador en la base de datos
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: scrapedData
        })

        // Comparar campos actualizados
        const fieldsUpdated = []

        for (const [field, newValue] of Object.entries(scrapedData)) {
          const oldValue = oldValues[field as keyof typeof oldValues]

          // Solo incluir si el valor cambió
          if (oldValue !== newValue) {
            fieldsUpdated.push({
              field,
              oldValue: oldValue?.toString() || null,
              newValue: newValue?.toString() || null
            })
          }
        }

        results.push({
          entityType: 'player',
          entityId: player.id_player,
          entityName: player.player_name,
          url: player.url_trfm!,
          success: true,
          fieldsUpdated
        })

        console.log(`✅ ${player.player_name}: ${fieldsUpdated.length} campos actualizados`)

        // Delay aleatorio entre jugadores (3-7 segundos para test)
        if (players.indexOf(player) < players.length - 1) {
          const delay = Math.floor(Math.random() * 4000) + 3000
          await randomSleep(3000, 7000)
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        console.error(`❌ Error scrapeando ${player.player_name}:`, errorMsg)

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
    }

    // 🏟️ PROCESAR CADA EQUIPO
    for (const team of teams) {
      console.log(`\n🏟️ Scrapeando equipo: ${team.team_name}`)

      try {
        const scrapedData = await scrapeTeamData(team.url_trfm_advisor!)

        const fieldsUpdated: Array<{ field: string; oldValue: string | null; newValue: string | null }> = []

        // Comparar campos
        if (scrapedData.team_name !== undefined && scrapedData.team_name !== team.team_name) {
          fieldsUpdated.push({
            field: 'team_name',
            oldValue: team.team_name,
            newValue: scrapedData.team_name
          })
        }

        if (scrapedData.team_country !== undefined && scrapedData.team_country !== team.team_country) {
          fieldsUpdated.push({
            field: 'team_country',
            oldValue: team.team_country,
            newValue: scrapedData.team_country
          })
        }

        if (scrapedData.competition !== undefined && scrapedData.competition !== team.competition) {
          fieldsUpdated.push({
            field: 'competition',
            oldValue: team.competition,
            newValue: scrapedData.competition
          })
        }

        if (scrapedData.team_trfm_value !== undefined && scrapedData.team_trfm_value !== team.team_trfm_value) {
          fieldsUpdated.push({
            field: 'team_trfm_value',
            oldValue: team.team_trfm_value?.toString() || null,
            newValue: scrapedData.team_trfm_value?.toString() || null
          })
        }

        if (scrapedData.team_rating !== undefined && scrapedData.team_rating !== team.team_rating) {
          fieldsUpdated.push({
            field: 'team_rating',
            oldValue: team.team_rating?.toString() || null,
            newValue: scrapedData.team_rating?.toString() || null
          })
        }

        results.push({
          entityType: 'team',
          entityId: team.id_team,
          entityName: team.team_name || team.id_team,
          url: team.url_trfm_advisor!,
          success: true,
          fieldsUpdated
        })

        console.log(`✅ Scraped exitosamente: ${fieldsUpdated.length} campos detectados`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        console.error(`❌ Error: ${errorMsg}`)

        results.push({
          entityType: 'team',
          entityId: team.id_team,
          entityName: team.team_name || team.id_team,
          url: team.url_trfm_advisor!,
          success: false,
          fieldsUpdated: [],
          error: errorMsg
        })
      }

      // Pausa entre equipos
      if (teams.indexOf(team) < teams.length - 1) {
        await randomSleep(2000, 4000)
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    const playersProcessed = results.filter(r => r.entityType === 'player').length
    const teamsProcessed = results.filter(r => r.entityType === 'team').length

    console.log(`\n✅ Test completado: ${successCount} éxitos, ${errorCount} errores`)
    console.log(`📊 Jugadores: ${playersProcessed}, Equipos: ${teamsProcessed}`)

    return NextResponse.json({
      success: true,
      message: `Test completado: ${playersProcessed} jugadores + ${teamsProcessed} equipos procesados`,
      results,
      summary: {
        total: playersProcessed + teamsProcessed,
        players: playersProcessed,
        teams: teamsProcessed,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('❌ Error en test de scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante el test.' },
      { status: 500 }
    )
  }
}

/**
 * 🌐 FUNCIÓN DE SCRAPING DE TRANSFERMARKT
 */
async function scrapePlayerData(url: string): Promise<Record<string, any>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders('https://www.transfermarkt.es/'),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 📊 EXTRAER DATOS
    const data: Record<string, any> = {}

    // 1. URL del Advisor (Agente/Asesor)
    const advisorElement = $('span.info-table__content:contains("Agente:")').parent().next()
    if (advisorElement.length > 0) {
      const advisorLink = advisorElement.find('a').attr('href')
      if (advisorLink) {
        data.url_trfm_advisor = `https://www.transfermarkt.es${advisorLink}`
      }
    }

    // 2. Fecha de nacimiento
    const birthDateElement = $('span.info-table__content:contains("Fecha de nacimiento:")').parent().next()
    if (birthDateElement.length > 0) {
      const birthDateText = birthDateElement.text().trim().split('(')[0].trim()
      if (birthDateText && birthDateText !== '-') {
        data.date_of_birth = birthDateText
      }
    }

    // 3. Equipo actual
    const teamElement = $('span.data-header__club').text().trim()
    if (teamElement && teamElement !== '-') {
      data.team_name = teamElement
    }

    // 4. Equipo de cesión
    const loanElement = $('span:contains("Cedido por:")').next().text().trim()
    if (loanElement && loanElement !== '-') {
      data.team_loan_from = loanElement
    }

    // 5. Posición
    const positionElement = $('span.info-table__content:contains("Posición:")').parent().next()
    if (positionElement.length > 0) {
      const positionText = positionElement.text().trim()
      if (positionText && positionText !== '-') {
        data.position_player = positionText
      }
    }

    // 6. Pie dominante
    const footElement = $('span.info-table__content:contains("Pie:")').parent().next()
    if (footElement.length > 0) {
      const footText = footElement.text().trim()
      if (footText && footText !== '-') {
        data.foot = footText
      }
    }

    // 7. Altura
    const heightElement = $('span.info-table__content:contains("Altura:")').parent().next()
    if (heightElement.length > 0) {
      const heightText = heightElement.text().trim().replace(/\s*m$/, '').replace(',', '.')
      const heightNum = parseFloat(heightText)
      if (!isNaN(heightNum)) {
        data.height = Math.round(heightNum * 100) // Convertir metros a centímetros
      }
    }

    // 8. Nacionalidad principal
    const nationalityElement = $('span.info-table__content:contains("Nacionalidad:")').parent().next()
    if (nationalityElement.length > 0) {
      const nationalities = nationalityElement.find('img')
      if (nationalities.length > 0) {
        data.nationality_1 = nationalities.eq(0).attr('title') || nationalities.eq(0).attr('alt')
        if (nationalities.length > 1) {
          data.nationality_2 = nationalities.eq(1).attr('title') || nationalities.eq(1).attr('alt')
        }
      }
    }

    // 9. Selección nacional
    const nationalTeamElement = $('span.info-table__content:contains("Selección:")').parent().next()
    if (nationalTeamElement.length > 0) {
      const nationalTeamText = nationalTeamElement.text().trim()
      if (nationalTeamText && nationalTeamText !== '-') {
        data.national_tier = nationalTeamText
      }
    }

    // 10. Agencia
    const agencyElement = $('span.info-table__content:contains("Agencia:")').parent().next()
    if (agencyElement.length > 0) {
      const agencyText = agencyElement.text().trim()
      if (agencyText && agencyText !== '-') {
        data.agency = agencyText
      }
    }

    // 11. Fin de contrato
    const contractElement = $('span.info-table__content:contains("Contrato hasta:")').parent().next()
    if (contractElement.length > 0) {
      const contractText = contractElement.text().trim()
      if (contractText && contractText !== '-') {
        data.contract_end = contractText
      }
    }

    // 12. Valor de mercado (OMITIDO en test - requiere parsing complejo)
    // El campo player_trfm_value es Float en BD y requiere parsing del string
    // Lo omitimos en el test para simplificar

    console.log(`🔍 Datos extraídos: ${Object.keys(data).length} campos`)

    return data

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La petición tardó más de 30 segundos')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 🏟️ FUNCIÓN DE SCRAPING DE EQUIPOS
 */
async function scrapeTeamData(url: string): Promise<Record<string, any>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      headers: getRealisticHeaders('https://www.transfermarkt.es/'),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const data: Record<string, any> = {}

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
        data.team_country = country
      }
    }

    // 3. Competición
    const competitionElement = $('span.data-header__club span.data-header__content').first()
    if (competitionElement.length > 0) {
      const competition = competitionElement.text().trim()
      if (competition && competition !== '') {
        data.competition = competition
      }
    }

    // 4. Valor de mercado del equipo
    const teamValueElement = $('a.data-header__market-value-wrapper').first()
    if (teamValueElement.length > 0) {
      const valueText = teamValueElement.text().trim()
      const valueMatch = valueText.match(/([0-9,.]+)\s*(mil|mill?\.?)\s*€/)

      if (valueMatch) {
        let cleanValue = valueMatch[1]

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

    return data

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La petición tardó más de 30 segundos')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
