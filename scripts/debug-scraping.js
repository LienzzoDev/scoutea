const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

const BASE_URL = "https://www.transfermarkt.es"

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}

async function debugPlayerPage(playerName) {
  try {
    console.log(`🔍 Analizando página de: ${playerName}`)
    
    // 1. Buscar el jugador
    const searchUrl = `${BASE_URL}/schnellsuche/ergebnis/schnellsuche`
    const searchResponse = await axios.get(searchUrl, {
      params: { query: playerName },
      headers,
      timeout: 10000
    })
    
    const $ = cheerio.load(searchResponse.data)
    
    // Buscar enlace del jugador
    let playerLink = $('a.spielprofil_tooltip').first()
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/profil/spieler/"]').first()
    }
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/spieler/"]').first()
    }
    
    if (playerLink.length === 0) {
      console.log(`❌ No se encontró jugador: ${playerName}`)
      return
    }
    
    const playerHref = playerLink.attr('href')
    const playerUrl = BASE_URL + playerHref
    console.log(`✅ Jugador encontrado: ${playerUrl}`)
    
    // 2. Analizar la página del jugador
    const playerResponse = await axios.get(playerUrl, {
      headers,
      timeout: 10000
    })
    
    const $player = cheerio.load(playerResponse.data)
    
    // Guardar HTML completo para análisis
    fs.writeFileSync(`debug_${playerName.replace(/\s+/g, '_')}.html`, playerResponse.data)
    console.log(`📄 HTML guardado en: debug_${playerName.replace(/\s+/g, '_')}.html`)
    
    // 3. Buscar diferentes patrones para agentes
    console.log('\n🔍 Buscando patrones de agente...')
    
    // Patrón 1: Buscar por texto "Agente:"
    const agentSpan1 = $player('span').filter(function() {
      return $(this).text().trim() === 'Agente:'
    })
    console.log(`📋 Patrón "Agente:": ${agentSpan1.length} encontrados`)
    
    // Patrón 2: Buscar por texto "Agent:"
    const agentSpan2 = $player('span').filter(function() {
      return $(this).text().trim() === 'Agent:'
    })
    console.log(`📋 Patrón "Agent:": ${agentSpan2.length} encontrados`)
    
    // Patrón 3: Buscar por texto "Berater:"
    const agentSpan3 = $player('span').filter(function() {
      return $(this).text().trim() === 'Berater:'
    })
    console.log(`📋 Patrón "Berater:": ${agentSpan3.length} encontrados`)
    
    // Patrón 4: Buscar enlaces de agentes
    const agentLinks = $player('a[href*="/berater/"]')
    console.log(`📋 Enlaces de agentes: ${agentLinks.length} encontrados`)
    
    // Patrón 5: Buscar en la sección de datos del jugador
    const dataSection = $player('.dataMain')
    console.log(`📋 Sección de datos: ${dataSection.length} encontrados`)
    
    // Patrón 6: Buscar en la tabla de información
    const infoTable = $player('table')
    console.log(`📋 Tablas de información: ${infoTable.length} encontrados`)
    
    // 4. Analizar la estructura de la página
    console.log('\n🔍 Estructura de la página:')
    
    // Buscar todos los spans que contengan "agent" o "berater"
    const allSpans = $player('span').filter(function() {
      const text = $(this).text().toLowerCase()
      return text.includes('agent') || text.includes('berater') || text.includes('agente')
    })
    
    console.log(`📋 Spans relacionados con agentes: ${allSpans.length}`)
    allSpans.each((i, span) => {
      const text = $(span).text().trim()
      const parent = $(span).parent()
      console.log(`  ${i + 1}. "${text}" (padre: ${parent.prop('tagName')})`)
    })
    
    // Buscar todos los enlaces que contengan "berater"
    const allBeraterLinks = $player('a[href*="/berater/"]')
    console.log(`📋 Enlaces de berater: ${allBeraterLinks.length}`)
    allBeraterLinks.each((i, link) => {
      const text = $(link).text().trim()
      const href = $(link).attr('href')
      console.log(`  ${i + 1}. "${text}" -> ${href}`)
    })
    
    // 5. Buscar en la sección de información personal
    const personalInfo = $player('.info-table, .dataMain, .spielerdaten')
    console.log(`📋 Secciones de información personal: ${personalInfo.length}`)
    
    personalInfo.each((i, section) => {
      const html = $(section).html()
      if (html && html.includes('agent')) {
        console.log(`  Sección ${i + 1} contiene "agent":`, html.substring(0, 200))
      }
    })
    
  } catch (error) {
    console.error(`❌ Error:`, error.message)
  }
}

// Ejecutar con un jugador específico
const playerName = process.argv[2] || "Erling Haaland"
debugPlayerPage(playerName)
