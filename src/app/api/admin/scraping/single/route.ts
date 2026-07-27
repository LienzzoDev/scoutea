/**
 * 🔍 ENDPOINT PARA SCRAPING DE UNA URL INDIVIDUAL
 *
 * ✅ PROPÓSITO: Scrapear un solo jugador desde el formulario de nuevo jugador
 * ✅ BENEFICIO: Permite cargar automáticamente datos desde Transfermarkt
 * ✅ RUTA: POST /api/admin/scraping/single
 */

import { auth } from '@clerk/nextjs/server'
import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'

import { getRealisticHeaders } from '@/lib/scraping/user-agents'

export const maxDuration = 30 // 30 segundos máximo

/**
 * POST /api/admin/scraping/single - Scrapear una URL individual
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
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER URL DEL BODY
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'La URL es requerida' },
        { status: 400 }
      )
    }

    // Validar que sea una URL de Transfermarkt
    if (!url.includes('transfermarkt')) {
      return NextResponse.json(
        { error: 'La URL debe ser de Transfermarkt' },
        { status: 400 }
      )
    }

    console.log(`🔍 Scrapeando URL individual: ${url}`)

    // 🌐 HACER SCRAPING
    const scrapedData = await scrapePlayerData(url)

    if (!scrapedData || Object.keys(scrapedData).length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer datos de la URL proporcionada' },
        { status: 500 }
      )
    }

    console.log(`✅ Scraping exitoso: ${Object.keys(scrapedData).length} campos extraídos`)

    return NextResponse.json({
      success: true,
      message: 'Scraping completado exitosamente',
      data: scrapedData,
      fieldsExtracted: Object.keys(scrapedData).length
    })

  } catch (error) {
    console.error('❌ Error en scraping individual:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: `Error al hacer scraping: ${errorMsg}` },
      { status: 500 }
    )
  }
}

/**
 * 🕷️ FUNCIÓN DE SCRAPING DE JUGADOR
 */
async function scrapePlayerData(url: string): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

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
    const data: Record<string, unknown> = {}

    // 1. Nombre del jugador
    const nameElement = $('h1[class*="data-header__headline"]').first()
    if (nameElement.length > 0) {
      let playerName = nameElement.text().trim()
      // Eliminar prefijos de número como "#36 ", "# 36 ", etc.
      playerName = playerName.replace(/^#?\s*\d+\s+/, '').trim()
      data.player_name = playerName
    }

    // 2. Fecha de nacimiento
    const birthDateElement = $('span[itemprop="birthDate"]')
    if (birthDateElement.length > 0) {
      const birthDateText = birthDateElement.text().trim()
      data.date_of_birth = birthDateText
    }

    // 3. Posición
    const positionElement = $('dd[class*="detail-position"]').first()
    if (positionElement.length > 0) {
      data.position_player = positionElement.text().trim()
    }

    // 4. Equipo actual
    const teamElement = $('span[class*="data-header__club"]').first()
    if (teamElement.length > 0) {
      data.team_name = teamElement.text().trim()
    }

    // 5. Altura
    const heightElement = $('span[itemprop="height"]')
    if (heightElement.length > 0) {
      const heightText = heightElement.text().trim()
      const heightMatch = heightText.match(/(\d+,\d+)\s*m/)
      if (heightMatch?.[1]) {
        const heightInMeters = parseFloat(heightMatch[1].replace(',', '.'))
        data.height = Math.round(heightInMeters * 100) // Convertir a cm
      }
    }

    // 6. Pie dominante
    const footElement = $('span:contains("Pie:")').parent().find('span').last()
    if (footElement.length > 0) {
      data.foot = footElement.text().trim()
    }

    // 7. Nacionalidad 1
    const nat1Element = $('span[itemprop="nationality"]').first()
    if (nat1Element.length > 0) {
      data.nationality_1 = nat1Element.text().trim()
    }

    // 8. Nacionalidad 2
    const nat2Element = $('span[itemprop="nationality"]').eq(1)
    if (nat2Element.length > 0) {
      data.nationality_2 = nat2Element.text().trim()
    }

    // 9. Valor de mercado
    const valueElement = $('a[class*="data-header__market-value-wrapper"]').first()
    if (valueElement.length > 0) {
      const valueText = valueElement.text().trim()
      data.player_trfm_value_text = valueText
    }

    // 10. Agencia
    const agencyElement = $('span:contains("Agente:")').parent().find('a').first()
    if (agencyElement.length > 0) {
      data.agency = agencyElement.text().trim()
    }

    // 11. Fin de contrato
    const contractElement = $('span:contains("Contrato hasta:")').parent().find('span').last()
    if (contractElement.length > 0) {
      data.contract_end = contractElement.text().trim()
    }

    return data

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout: La petición tardó más de 25 segundos')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
