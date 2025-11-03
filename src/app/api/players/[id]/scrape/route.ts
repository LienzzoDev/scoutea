import { auth } from '@clerk/nextjs/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

const BASE_URL = "https://www.transfermarkt.es"

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}

// Función para extraer altura
function extractHeight($: cheerio.CheerioAPI) {
  try {
    // Buscar en la tabla de datos del jugador usando la estructura correcta
    const heightSelectors = [
      '.info-table__content:contains("Altura:") + .info-table__content--bold',
      '.info-table__content:contains("Height:") + .info-table__content--bold',
      '.info-table__content:contains("Größe:") + .info-table__content--bold'
    ]
    
    for (const selector of heightSelectors) {
      const element = $(selector).first()
      if (element.length >0) {
        const heightText = element.text().trim()
        console.log('Altura encontrada en selector:', selector, 'Texto:', heightText)
        
        // Buscar patrones de altura
        const heightMatch = heightText.match(/(\d+)[,.](\d+)\s*m/)
        if (heightMatch) {
          const meters = parseFloat(heightMatch[1] + '.' + heightMatch[2])
          return Math.round(meters * 100)
        }
        
        const cmMatch = heightText.match(/(\d+)\s*cm/)
        if (cmMatch) {
          return parseInt(cmMatch[1])
        }
      }
    }
    
    // Buscar en el texto completo de la página
    const pageText = $.html()
    const heightPatterns = [
      /Altura:\s*(\d+)[,.](\d+)\s*m/i,
      /Height:\s*(\d+)[,.](\d+)\s*m/i,
      /Größe:\s*(\d+)[,.](\d+)\s*m/i
    ]
    
    for (const pattern of heightPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        console.log('Altura encontrada en patrón:', pattern, 'Match:', match)
        if (match[1] && match[2]) {
          const meters = parseFloat(match[1] + '.' + match[2])
          return Math.round(meters * 100)
        }
      }
    }
    
    return null
  } catch (_error) {
    console.log('Error extrayendo altura:', error)
    return null
  }
}

// Función para extraer pie preferido
function extractFoot($: cheerio.CheerioAPI) {
  try {
    const footSelectors = [
      '.info-table__content:contains("Pie:") + .info-table__content--bold',
      '.info-table__content:contains("Pie preferido:") + .info-table__content--bold',
      '.info-table__content:contains("Foot:") + .info-table__content--bold',
      '.info-table__content:contains("Fuß:") + .info-table__content--bold'
    ]
    
    for (const selector of footSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const footText = element.text().trim()
        console.log('Pie encontrado en selector:', selector, 'Texto:', footText)
        if (footText && footText.length < 20) {
          return footText
        }
      }
    }
    
    // Buscar en el texto completo de la página
    const pageText = $.html()
    const footPatterns = [
      /Pie:\s*([^<\n\r]+)/i,
      /Pie preferido:\s*([^<\n\r]+)/i,
      /Foot:\s*([^<\n\r]+)/i,
      /Fuß:\s*([^<\n\r]+)/i
    ]
    
    for (const pattern of footPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        console.log('Pie encontrado en patrón:', pattern, 'Match:', match)
        const footText = match[1].trim()
        if (footText && footText.length < 20) {
          return footText
        }
      }
    }
    
    return null
  } catch (_error) {
    console.log('Error extrayendo pie preferido:', error)
    return null
  }
}

// Función para extraer agencia
function extractAgency($: cheerio.CheerioAPI) {
  try {
    const agencySelectors = [
      '.info-table__content:contains("Agente:") + .info-table__content--bold a',
      '.info-table__content:contains("Agent:") + .info-table__content--bold a',
      '.info-table__content:contains("Berater:") + .info-table__content--bold a',
      '.info-table__content:contains("Agente:") + .info-table__content--bold',
      '.info-table__content:contains("Agent:") + .info-table__content--bold',
      '.info-table__content:contains("Berater:") + .info-table__content--bold'
    ]
    
    for (const selector of agencySelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const agencyText = element.text().trim()
        console.log('Agencia encontrada en selector:', selector, 'Texto:', agencyText)
        if (agencyText && agencyText.length < 50) {
          return agencyText
        }
      }
    }
    
    // Buscar en el texto completo de la página
    const pageText = $.html()
    const agencyPatterns = [
      /Agente:\s*([^<\n\r]+)/i,
      /Agent:\s*([^<\n\r]+)/i,
      /Berater:\s*([^<\n\r]+)/i,
      /Gestifute/i,
      /Mino Raiola/i,
      /Jorge Mendes/i
    ]
    
    for (const pattern of agencyPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        console.log('Agencia encontrada en patrón:', pattern, 'Match:', match)
        if (pattern.source.includes('Agente:') || pattern.source.includes('Agent:') || pattern.source.includes('Berater:')) {
          return match[1].trim()
        } else {
          return match[0].trim()
        }
      }
    }
    
    return null
  } catch (_error) {
    console.log('Error extrayendo agencia:', error)
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Iniciando API de scraping...')

    const { id: playerId } = await params
    console.log('📝 Player ID:', playerId)

    // Obtener el jugador de la base de datos
    const player = await prisma.jugador.findUnique({
      where: { id___player: playerId },
      select: {
        id_player: true,
        player_name: true,
        complete_player_name: true
      }
    })

    if (!player) {
      console.log('❌ Jugador no encontrado')
      return NextResponse.json({ __error: 'Jugador no encontrado' }, { status: 404 })
    }

    console.log('✅ Jugador encontrado:', player)

    // Realizar scraping simple
    const fullName = player.complete_player_name || player.player_name
    console.log('🔍 Iniciando scraping para:', fullName)
    
    try {
      // 1. Buscar el jugador en Transfermarkt
      const searchUrl = `${BASE_URL}/schnellsuche/ergebnis/schnellsuche`
      console.log('🌐 Buscando en:', searchUrl)
      
      const searchResponse = await axios.get(searchUrl, {
        params: { query: fullName },
        headers,
        timeout: 10000
      })
      
      console.log('✅ Búsqueda completada, status:', searchResponse.status)
      
      const $ = cheerio.load(searchResponse.data)
      
      // 2. Buscar enlaces de jugadores
      let playerLink = $('a.spielprofil_tooltip').first()
      if (playerLink.length === 0) {
        playerLink = $('a[href*="/profil/spieler/"]').first()
      }
      if (playerLink.length === 0) {
        playerLink = $('a[href*="/spieler/"]').first()
      }
      
      if (playerLink.length === 0) {
        console.log('❌ No se encontró enlace del jugador')
        return NextResponse.json({ 
          __error: 'No se encontró enlace del jugador' 
        }, { status: 400 })
      }
      
      const playerHref = playerLink.attr('href')
      const playerUrl = BASE_URL + playerHref
      console.log('✅ URL del jugador:', playerUrl)
      
      // 3. Entrar al perfil del jugador
      const playerResponse = await axios.get(playerUrl, {
        headers,
        timeout: 10000
      })
      
      console.log('✅ Perfil del jugador obtenido, status:', playerResponse.status)
      
      const $player = cheerio.load(playerResponse.data)
      
      // 4. Extraer datos del jugador
      const playerData = {
        url_trfm_advisor: playerUrl,
        player_name: player.player_name,
        complete_player_name: player.complete_player_name,
        height: extractHeight($player),
        foot: extractFoot($player),
        agency: extractAgency($player)
      }
      
      console.log('📊 Datos extraídos:', playerData)
      
      // Filtrar solo los campos que no son null
      const filteredData = Object.fromEntries(
        Object.entries(playerData).filter(([_key, value]) => value !== null)
      )
      
      console.log('✅ Datos filtrados para el formulario:', filteredData)
      
      return NextResponse.json({
        success: true,
        message: 'Datos extraídos correctamente',
        data: filteredData
      })
      
    } catch (scrapeError) {
      console.error('❌ Error en scraping:', scrapeError)
      return NextResponse.json({ 
        __error: 'Error en scraping: ' + scrapeError.message 
      }, { status: 500 })
    }

  } catch (_error) {
    console.error('❌ Error en API:', error)
    return NextResponse.json(
      { __error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
