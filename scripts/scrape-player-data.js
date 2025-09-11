const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const cheerio = require('cheerio')

const prisma = new PrismaClient()

const BASE_URL = "https://www.transfermarkt.es"

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}

// Función para extraer fecha de nacimiento
function extractDateOfBirth($) {
  try {
    // Buscar en diferentes ubicaciones - basado en la estructura real
    const dateSelectors = [
      '.data-header__label:contains("Fecha de nacimiento:") + .data-header__content',
      '.info-table__content:contains("Fecha de nacimiento:") + .info-table__content',
      '.data-header__label:contains("Born:") + .data-header__content',
      '.info-table__content:contains("Born:") + .info-table__content',
      '.data-header__label:contains("F. Nacim./Edad:") + .data-header__content',
      // Buscar en el texto completo de la página
      '*:contains("Fecha de nacimiento:")',
      '*:contains("Born:")',
      '*:contains("F. Nacim./Edad:")'
    ]
    
    for (const selector of dateSelectors) {
      const elements = $(selector)
      elements.each((i, el) => {
        const text = $(el).text().trim()
        if (text.includes('Fecha de nacimiento:') || text.includes('Born:') || text.includes('F. Nacim./Edad:')) {
          // Buscar fecha en el texto del elemento
          const dateMatch = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
          if (dateMatch) {
            const [, day, month, year] = dateMatch
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
          
          // Buscar en elementos hermanos
          const siblings = $(el).siblings()
          siblings.each((j, sibling) => {
            const siblingText = $(sibling).text().trim()
            const siblingDateMatch = siblingText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
            if (siblingDateMatch) {
              const [, day, month, year] = siblingDateMatch
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            }
          })
        }
      })
    }
    
    // Buscar en el texto completo de la página por patrones de fecha
    const pageText = $.html()
    const datePatterns = [
      /(\d{1,2})[./](\d{1,2})[./](\d{4})/g
    ]
    
    for (const pattern of datePatterns) {
      const matches = pageText.match(pattern)
      if (matches) {
        // Tomar la primera fecha encontrada que parezca válida
        for (const match of matches) {
          const [, day, month, year] = match.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
          if (year >= 1950 && year <= 2010) { // Rango razonable para jugadores
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo fecha de nacimiento:', error.message)
    return null
  }
}

// Función para extraer nombre del equipo
function extractTeamName($) {
  try {
    // Buscar en el texto de la página por patrones de equipo
    const pageText = $.html()
    const teamPatterns = [
      /Club actual:\s*([^<\n\r]+)/i,
      /Current club:\s*([^<\n\r]+)/i,
      /Inter Miami CF/i,
      /Real Madrid/i,
      /Barcelona/i,
      /Manchester United/i,
      /Liverpool/i,
      /Bayern Munich/i
    ]
    
    for (const pattern of teamPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        if (pattern.source.includes('Club actual:') || pattern.source.includes('Current club:')) {
          const teamName = match[1].trim()
          if (teamName && teamName.length > 0) {
            return teamName
          }
        } else {
          const teamName = match[0].trim()
          if (teamName && teamName.length > 0) {
            return teamName
          }
        }
      }
    }
    
    // Buscar en selectores específicos
    const teamSelectors = [
      'a[href*="/verein/"]', // Enlaces de equipos
      '.data-header__label:contains("Club actual:") + .data-header__content a',
      '.info-table__content:contains("Club actual:") + .info-table__content a',
      '.data-header__label:contains("Current club:") + .data-header__content a',
      '.info-table__content:contains("Current club:") + .info-table__content a'
    ]
    
    for (const selector of teamSelectors) {
      const elements = $(selector)
      elements.each((i, el) => {
        const text = $(el).text().trim()
        const href = $(el).attr('href')
        // Filtrar enlaces de equipos (no de países)
        if (href && href.includes('/verein/') && !href.includes('/argentinien/')) {
          return text
        }
      })
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo nombre del equipo:', error.message)
    return null
  }
}

// Función para extraer equipo de préstamo
function extractLoanFrom($) {
  try {
    const loanSelectors = [
      '.data-header__label:contains("Préstamo desde:") + .data-header__content a',
      '.info-table__content:contains("Préstamo desde:") + .info-table__content a',
      '.data-header__label:contains("On loan from:") + .data-header__content a',
      '.info-table__content:contains("On loan from:") + .info-table__content a'
    ]
    
    for (const selector of loanSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        return element.text().trim()
      }
    }
    return null
  } catch (error) {
    console.log('Error extrayendo equipo de préstamo:', error.message)
    return null
  }
}

// Función para extraer posición
function extractPosition($) {
  try {
    const positionSelectors = [
      '.data-header__label:contains("Posición:") + .data-header__content',
      '.info-table__content:contains("Posición:") + .info-table__content',
      '.data-header__label:contains("Position:") + .data-header__content',
      '.info-table__content:contains("Position:") + .info-table__content',
      '.hauptlink a[href*="/pos/"]'
    ]
    
    for (const selector of positionSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        return element.text().trim()
      }
    }
    return null
  } catch (error) {
    console.log('Error extrayendo posición:', error.message)
    return null
  }
}

// Función para extraer pie preferido
function extractFoot($) {
  try {
    const footSelectors = [
      '.data-header__label:contains("Pie preferido:") + .data-header__content',
      '.info-table__content:contains("Pie preferido:") + .info-table__content',
      '.data-header__label:contains("Foot:") + .data-header__content',
      '.info-table__content:contains("Foot:") + .info-table__content',
      '.data-header__label:contains("Pie:") + .data-header__content',
      '.info-table__content:contains("Pie:") + .info-table__content'
    ]
    
    for (const selector of footSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const footText = element.text().trim()
        if (footText && footText.length < 20) { // Evitar textos largos
          return footText
        }
      }
    }
    
    // Buscar en el texto completo de la página por patrones de pie
    const pageText = $.html()
    const footPatterns = [
      /Pie:\s*([^<\n\r]+)/i,
      /Pie preferido:\s*([^<\n\r]+)/i,
      /Foot:\s*([^<\n\r]+)/i
    ]
    
    for (const pattern of footPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        const footText = match[1].trim()
        if (footText && footText.length < 20) {
          return footText
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo pie preferido:', error.message)
    return null
  }
}

// Función para extraer altura
function extractHeight($) {
  try {
    const heightSelectors = [
      '.data-header__label:contains("Altura:") + .data-header__content',
      '.info-table__content:contains("Altura:") + .info-table__content',
      '.data-header__label:contains("Height:") + .data-header__content',
      '.info-table__content:contains("Height:") + .info-table__content'
    ]
    
    for (const selector of heightSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const heightText = element.text().trim()
        // Extraer altura en cm
        const heightMatch = heightText.match(/(\d+)\s*cm/)
        if (heightMatch) {
          return parseInt(heightMatch[1])
        }
      }
    }
    
    // Buscar en el texto completo de la página por patrones de altura
    const pageText = $.html()
    const heightPatterns = [
      /(\d+,\d+)\s*m/g,  // 1,70 m
      /(\d+\.\d+)\s*m/g, // 1.70 m
      /(\d+)\s*cm/g,     // 170 cm
      /(\d+,\d+)\s*metros/g, // 1,70 metros
      /(\d+\.\d+)\s*metros/g // 1.70 metros
    ]
    
    for (const pattern of heightPatterns) {
      const matches = pageText.match(pattern)
      if (matches) {
        for (const match of matches) {
          if (match.includes('m') && !match.includes('cm')) {
            // Convertir metros a centímetros
            const heightMatch = match.match(/(\d+)[,.](\d+)\s*m/)
            if (heightMatch) {
              const meters = parseFloat(heightMatch[1] + '.' + heightMatch[2])
              return Math.round(meters * 100)
            }
          } else if (match.includes('cm')) {
            // Ya está en centímetros
            const heightMatch = match.match(/(\d+)\s*cm/)
            if (heightMatch) {
              return parseInt(heightMatch[1])
            }
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo altura:', error.message)
    return null
  }
}

// Función para extraer nacionalidades
function extractNationalities($) {
  try {
    const nationalities = []
    
    // Buscar enlaces de países (no equipos)
    const countryLinks = $('a[href*="/verein/"]')
    countryLinks.each((i, el) => {
      const text = $(el).text().trim()
      const href = $(el).attr('href')
      // Filtrar países (no equipos)
      if (href && href.includes('/argentinien/') && !nationalities.includes(text)) {
        nationalities.push(text)
      }
    })
    
    // Buscar en selectores específicos
    const nationalitySelectors = [
      '.data-header__label:contains("Nacionalidad:") + .data-header__content a',
      '.info-table__content:contains("Nacionalidad:") + .info-table__content a',
      '.data-header__label:contains("Citizenship:") + .data-header__content a',
      '.info-table__content:contains("Citizenship:") + .info-table__content a'
    ]
    
    for (const selector of nationalitySelectors) {
      const elements = $(selector)
      elements.each((i, el) => {
        const nationality = $(el).text().trim()
        if (nationality && !nationalities.includes(nationality)) {
          nationalities.push(nationality)
        }
      })
      if (nationalities.length > 0) break
    }
    
    return {
      nationality_1: nationalities[0] || null,
      nationality_2: nationalities[1] || null
    }
  } catch (error) {
    console.log('Error extrayendo nacionalidades:', error.message)
    return { nationality_1: null, nationality_2: null }
  }
}

// Función para extraer nivel nacional
function extractNationalTier($) {
  try {
    const tierSelectors = [
      '.data-header__label:contains("Nivel nacional:") + .data-header__content',
      '.info-table__content:contains("Nivel nacional:") + .info-table__content',
      '.data-header__label:contains("National tier:") + .data-header__content',
      '.info-table__content:contains("National tier:") + .info-table__content'
    ]
    
    for (const selector of tierSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        return element.text().trim()
      }
    }
    return null
  } catch (error) {
    console.log('Error extrayendo nivel nacional:', error.message)
    return null
  }
}

// Función para extraer agencia
function extractAgency($) {
  try {
    // Buscar en el texto de la página por patrones de agencia
    const pageText = $.html()
    const agencyPatterns = [
      /Agente:\s*([^<\n\r]+)/i,
      /Agent:\s*([^<\n\r]+)/i,
      /Familiar/i,
      /Gestifute/i,
      /Mino Raiola/i,
      /Jorge Mendes/i
    ]
    
    for (const pattern of agencyPatterns) {
      const match = pageText.match(pattern)
      if (match) {
        if (pattern.source.includes('Agente:') || pattern.source.includes('Agent:')) {
          return match[1].trim()
        } else {
          return match[0].trim()
        }
      }
    }
    
    // Buscar en selectores específicos
    const agencySelectors = [
      '.data-header__label:contains("Agente:") + .data-header__content a',
      '.info-table__content:contains("Agente:") + .info-table__content a',
      '.data-header__label:contains("Agent:") + .data-header__content a',
      '.info-table__content:contains("Agent:") + .info-table__content a',
      '.data-header__label:contains("Agente:") + .data-header__content',
      '.info-table__content:contains("Agente:") + .info-table__content'
    ]
    
    for (const selector of agencySelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const agencyText = element.text().trim()
        if (agencyText && agencyText.length < 50) { // Evitar textos largos
          return agencyText
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo agencia:', error.message)
    return null
  }
}

// Función para extraer fin de contrato
function extractContractEnd($) {
  try {
    const contractSelectors = [
      '.data-header__label:contains("Contrato hasta:") + .data-header__content',
      '.info-table__content:contains("Contrato hasta:") + .info-table__content',
      '.data-header__label:contains("Contract until:") + .data-header__content',
      '.info-table__content:contains("Contract until:") + .info-table__content'
    ]
    
    for (const selector of contractSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const contractText = element.text().trim()
        // Extraer fecha en formato DD/MM/YYYY o DD.MM.YYYY
        const dateMatch = contractText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
        if (dateMatch) {
          const [, day, month, year] = dateMatch
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return contractText
      }
    }
    return null
  } catch (error) {
    console.log('Error extrayendo fin de contrato:', error.message)
    return null
  }
}

// Función para extraer valor de mercado
function extractPlayerValue($) {
  try {
    // Buscar en el texto de la página por patrones de valor
    const valuePatterns = [
      /€\s*([\d,]+)\.?(\d*)\s*([km]?)/i,
      /([\d,]+)\.?(\d*)\s*([km]?)\s*€/i,
      /([\d,]+)\.?(\d*)\s*([km]?)\s*mill/i,
      /([\d,]+)\.?(\d*)\s*mill\.?\s*€/i  // 18,00 mill. €
    ]
    
    const pageText = $.html()
    
    for (const pattern of valuePatterns) {
      const match = pageText.match(pattern)
      if (match) {
        let value = parseFloat(match[1].replace(/,/g, ''))
        const decimals = match[2] || '0'
        const multiplier = match[3] ? match[3].toLowerCase() : 'm' // Si no hay multiplicador pero hay "mill", asumir millones
        
        if (decimals) {
          value = parseFloat(match[1] + '.' + decimals)
        }
        
        if (multiplier === 'k') {
          value *= 1000
        } else if (multiplier === 'm' || pattern.source.includes('mill')) {
          value *= 1000000
        }
        
        return Math.round(value)
      }
    }
    
    // Buscar en selectores específicos
    const valueSelectors = [
      '.data-header__label:contains("Valor de mercado:") + .data-header__content',
      '.info-table__content:contains("Valor de mercado:") + .info-table__content',
      '.data-header__label:contains("Market value:") + .data-header__content',
      '.info-table__content:contains("Market value:") + .info-table__content',
      '.tm-player-market-value-development__current-value'
    ]
    
    for (const selector of valueSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const valueText = element.text().trim()
        const valueMatch = valueText.match(/€?([\d,]+)\.?(\d*)\s*([km]?)/i)
        if (valueMatch) {
          let value = parseFloat(valueMatch[1].replace(/,/g, ''))
          const decimals = valueMatch[2] || '0'
          const multiplier = valueMatch[3].toLowerCase()
          
          if (decimals) {
            value = parseFloat(valueMatch[1] + '.' + decimals)
          }
          
          if (multiplier === 'k') {
            value *= 1000
          } else if (multiplier === 'm') {
            value *= 1000000
          }
          
          return Math.round(value)
        }
      }
    }
    
    return null
  } catch (error) {
    console.log('Error extrayendo valor de mercado:', error.message)
    return null
  }
}

async function scrapePlayerData(playerName) {
  try {
    console.log(`🔍 Scrapeando datos de: ${playerName}`)
    
    // 1. Buscar el jugador en Transfermarkt
    const searchUrl = `${BASE_URL}/schnellsuche/ergebnis/schnellsuche`
    const searchResponse = await axios.get(searchUrl, {
      params: { query: playerName },
      headers,
      timeout: 10000
    })
    
    const $ = cheerio.load(searchResponse.data)
    
    // 2. Tomar el primer resultado de jugador
    let playerLink = $('a.spielprofil_tooltip').first()
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/profil/spieler/"]').first()
    }
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/spieler/"]').first()
    }
    
    if (playerLink.length === 0) {
      console.log(`❌ No se encontró jugador: ${playerName}`)
      return null
    }
    
    const playerHref = playerLink.attr('href')
    const playerUrl = BASE_URL + playerHref
    console.log(`✅ Jugador encontrado: ${playerUrl}`)
    
    // 3. Entrar al perfil del jugador
    const playerResponse = await axios.get(playerUrl, {
      headers,
      timeout: 10000
    })
    
    const $player = cheerio.load(playerResponse.data)
    
    // 4. Extraer todos los datos
    const playerData = {
      url_trfm_advisor: playerUrl,
      date_of_birth: extractDateOfBirth($player),
      team_name: extractTeamName($player),
      team_loan_from: extractLoanFrom($player),
      position_player: extractPosition($player),
      foot: extractFoot($player),
      height: extractHeight($player),
      ...extractNationalities($player),
      national_tier: extractNationalTier($player),
      agency: extractAgency($player),
      contract_end: extractContractEnd($player),
      player_trfm_value: extractPlayerValue($player)
    }
    
    console.log('📊 Datos extraídos:', playerData)
    return playerData
    
  } catch (error) {
    console.error(`❌ Error para ${playerName}:`, error.message)
    return null
  }
}

async function scrapeAllPlayersFromDatabase() {
  try {
    console.log('🚀 Iniciando scraping completo de datos de jugadores...')
    
    // Obtener todos los jugadores
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        complete_player_name: true
      },
      take: 100 // Limitar para pruebas
    })
    
    console.log(`📊 Encontrados ${players.length} jugadores para procesar`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const fullName = player.complete_player_name || player.player_name
      
      console.log(`\n[${i + 1}/${players.length}] Procesando: ${fullName}`)
      
      // Obtener datos del jugador
      const playerData = await scrapePlayerData(fullName)
      
      if (playerData) {
        // Filtrar solo los campos que no son null
        const updateData = Object.fromEntries(
          Object.entries(playerData).filter(([key, value]) => value !== null)
        )
        
        if (Object.keys(updateData).length > 0) {
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: updateData
          })
          console.log(`✅ Actualizado en BD:`, updateData)
          successCount++
        } else {
          console.log(`ℹ️ No se encontraron datos nuevos para: ${fullName}`)
        }
      } else {
        console.log(`❌ No se pudo obtener datos para: ${fullName}`)
        errorCount++
      }
      
      // Pausa aleatoria para evitar ser bloqueado
      const delay = Math.random() * 3000 + 2000 // Entre 2-5 segundos
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    console.log(`\n🎉 Scraping completado!`)
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Función para probar con un jugador específico
async function testPlayer(playerName) {
  console.log(`🧪 Probando con jugador: ${playerName}`)
  const result = await scrapePlayerData(playerName)
  
  if (result) {
    console.log('\n📋 Resultado:')
    Object.entries(result).forEach(([key, value]) => {
      console.log(`${key}: ${value}`)
    })
  } else {
    console.log('❌ No se pudieron obtener datos')
  }
}

// Ejecutar según los argumentos
if (process.argv.length > 2) {
  const playerName = process.argv.slice(2).join(' ')
  testPlayer(playerName)
} else {
  scrapeAllPlayersFromDatabase()
}
