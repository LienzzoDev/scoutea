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
    
    // 2. Encontrar enlace del jugador
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
    
    // 3. Obtener página del jugador
    const playerResponse = await axios.get(playerUrl, {
      headers,
      timeout: 10000
    })
    
    const $player = cheerio.load(playerResponse.data)
    
    // 4. Guardar HTML para análisis
    const htmlContent = $player.html()
    fs.writeFileSync(`debug-${playerName.replace(/\s+/g, '-').toLowerCase()}.html`, htmlContent)
    console.log(`💾 HTML guardado en: debug-${playerName.replace(/\s+/g, '-').toLowerCase()}.html`)
    
    // 5. Analizar estructura de datos
    console.log('\n📊 Análisis de estructura:')
    console.log('─'.repeat(50))
    
    // Buscar todas las etiquetas que contengan datos
    const dataElements = $player('.data-header__label, .info-table__content, .data-header__content')
    console.log(`\n🔍 Elementos de datos encontrados: ${dataElements.length}`)
    
    dataElements.each((i, el) => {
      const text = $player(el).text().trim()
      if (text && text.length < 100) { // Solo textos cortos
        console.log(`${i.toString().padStart(3)}: "${text}"`)
      }
    })
    
    // Buscar información específica
    console.log('\n🎯 Búsqueda específica:')
    console.log('─'.repeat(30))
    
    const specificSearches = [
      'Fecha de nacimiento',
      'Born',
      'Club actual',
      'Current club',
      'Posición',
      'Position',
      'Altura',
      'Height',
      'Nacionalidad',
      'Citizenship',
      'Pie preferido',
      'Foot',
      'Agente',
      'Agent',
      'Contrato',
      'Contract',
      'Valor',
      'Value'
    ]
    
    specificSearches.forEach(searchTerm => {
      const elements = $player('*').filter(function() {
        return $(this).text().includes(searchTerm)
      })
      
      if (elements.length > 0) {
        console.log(`\n🔍 "${searchTerm}":`)
        elements.each((i, el) => {
          const text = $player(el).text().trim()
          const parent = $player(el).parent()
          const parentText = parent.text().trim()
          
          console.log(`  ${i + 1}. Elemento: "${text}"`)
          console.log(`     Padre: "${parentText.substring(0, 100)}..."`)
        })
      }
    })
    
    // Buscar enlaces de equipos
    console.log('\n🏆 Enlaces de equipos:')
    const teamLinks = $player('a[href*="/verein/"]')
    teamLinks.each((i, el) => {
      const text = $player(el).text().trim()
      const href = $player(el).attr('href')
      console.log(`  ${i + 1}. ${text} (${href})`)
    })
    
    // Buscar enlaces de posiciones
    console.log('\n⚽ Enlaces de posiciones:')
    const positionLinks = $player('a[href*="/pos/"]')
    positionLinks.each((i, el) => {
      const text = $player(el).text().trim()
      const href = $player(el).attr('href')
      console.log(`  ${i + 1}. ${text} (${href})`)
    })
    
    // Buscar valores de mercado
    console.log('\n💰 Valores de mercado:')
    const valueElements = $player('*').filter(function() {
      return $(this).text().includes('€') || $(this).text().includes('mill')
    })
    
    valueElements.each((i, el) => {
      const text = $player(el).text().trim()
      if (text.length < 50) {
        console.log(`  ${i + 1}. "${text}"`)
      }
    })
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
  }
}

// Ejecutar con el jugador especificado
const playerName = process.argv[2] || 'Lionel Messi'
debugPlayerPage(playerName)
