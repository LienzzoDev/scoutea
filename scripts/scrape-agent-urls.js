const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const cheerio = require('cheerio')

const prisma = new PrismaClient()

const BASE_URL = "https://www.transfermarkt.es"

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}

async function getAgentByPlayer(name) {
  try {
    console.log(`🔍 Buscando jugador: ${name}`)
    
    // 1. Buscar el jugador en Transfermarkt
    const searchUrl = `${BASE_URL}/schnellsuche/ergebnis/schnellsuche`
    const searchResponse = await axios.get(searchUrl, {
      params: { query: name },
      headers,
      timeout: 10000
    })
    
    const $ = cheerio.load(searchResponse.data)
    
    // 2. Tomar el primer resultado de jugador
    // Intentar diferentes selectores
    let playerLink = $('a.spielprofil_tooltip').first()
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/profil/spieler/"]').first()
    }
    if (playerLink.length === 0) {
      playerLink = $('a[href*="/spieler/"]').first()
    }
    
    if (playerLink.length === 0) {
      console.log(`❌ No se encontró jugador: ${name}`)
      console.log('🔍 HTML de búsqueda:', $.html().substring(0, 1000))
      return { playerUrl: null, agentInfo: null }
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
    
    // 4. Buscar la sección "Agente" - métodos mejorados
    let agentInfo = null
    
    // Método 1: Buscar en la sección de datos principales (.data-header__label)
    const dataHeaderLabel = $player('.data-header__label').filter(function() {
      return $(this).text().trim() === 'Agente:'
    }).first()
    
    if (dataHeaderLabel.length > 0) {
      const agentLink = dataHeaderLabel.find('a').first()
      if (agentLink.length > 0) {
        const agentName = agentLink.text().trim()
        const agentUrl = BASE_URL + agentLink.attr('href')
        agentInfo = { name: agentName, url: agentUrl }
      }
    }
    
    // Método 2: Buscar en la tabla de información (.info-table__content)
    if (!agentInfo) {
      const infoTableContent = $player('.info-table__content').filter(function() {
        return $(this).text().trim() === 'Agente:'
      }).first()
      
      if (infoTableContent.length > 0) {
        const agentLink = infoTableContent.next('.info-table__content').find('a').first()
        if (agentLink.length > 0) {
          const agentName = agentLink.text().trim()
          const agentUrl = BASE_URL + agentLink.attr('href')
          agentInfo = { name: agentName, url: agentUrl }
        }
      }
    }
    
    // Método 3: Buscar por texto "Agent:" (inglés)
    if (!agentInfo) {
      const agentSpan = $player('span').filter(function() {
        return $(this).text().trim() === 'Agent:'
      }).first()
      
      if (agentSpan.length > 0) {
        const agentLink = agentSpan.next('a')
        if (agentLink.length > 0) {
          const agentName = agentLink.text().trim()
          const agentUrl = BASE_URL + agentLink.attr('href')
          agentInfo = { name: agentName, url: agentUrl }
        }
      }
    }
    
    // Método 4: Buscar enlaces específicos de agentes (no páginas generales)
    if (!agentInfo) {
      const agentLinks = $player('a[href*="/berater/"]').filter(function() {
        const href = $(this).attr('href')
        // Excluir páginas generales de estadísticas
        return href && !href.includes('beraterfirmenuebersicht') && !href.includes('statistik')
      })
      
      if (agentLinks.length > 0) {
        const agentLink = agentLinks.first()
        const agentName = agentLink.text().trim()
        const agentUrl = BASE_URL + agentLink.attr('href')
        agentInfo = { name: agentName, url: agentUrl }
      }
    }
    
    if (agentInfo) {
      console.log(`✅ Agente encontrado: ${agentInfo.name} - ${agentInfo.url}`)
      return { playerUrl, agentInfo }
    } else {
      console.log(`ℹ️ Jugador sin agente registrado: ${name}`)
      return { playerUrl, agentInfo: null }
    }
    
    return { playerUrl, agentInfo: null }
    
  } catch (error) {
    console.error(`❌ Error para ${name}:`, error.message)
    return { playerUrl: null, agentInfo: null }
  }
}

async function scrapePlayersFromDatabase() {
  try {
    console.log('🚀 Iniciando scraping de URLs de agentes...')
    
    // Obtener todos los jugadores que no tienen URL de agente
    const players = await prisma.jugador.findMany({
      where: {
        OR: [
          { url_trfm_advisor: null },
          { url_trfm_advisor: '' }
        ]
      },
      select: {
        id_player: true,
        player_name: true,
        complete_player_name: true
      },
      take: 50 // Limitar a 50 jugadores por ejecución para evitar timeouts
    })
    
    console.log(`📊 Encontrados ${players.length} jugadores sin URL de agente`)
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const fullName = player.complete_player_name || player.player_name
      
      console.log(`\n[${i + 1}/${players.length}] Procesando: ${fullName}`)
      
      // Obtener información del agente
      const { playerUrl, agentInfo } = await getAgentByPlayer(fullName)
      
      // Actualizar la base de datos
      const updateData = {}
      if (playerUrl) {
        updateData.url_trfm_advisor = playerUrl
      }
      
      if (agentInfo) {
        updateData.url_trfm_advisor = agentInfo.url
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: updateData
        })
        console.log(`✅ Actualizado en BD:`, updateData)
      } else {
        console.log(`❌ No se pudo obtener información para: ${fullName}`)
      }
      
      // Pausa aleatoria para evitar ser bloqueado
      const delay = Math.random() * 2000 + 1000 // Entre 1-3 segundos
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    console.log('\n🎉 Scraping completado!')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Función para probar con un jugador específico
async function testPlayer(playerName) {
  console.log(`🧪 Probando con jugador: ${playerName}`)
  const result = await getAgentByPlayer(playerName)
  
  console.log('\n📋 Resultado:')
  console.log(`Perfil del jugador: ${result.playerUrl}`)
  if (result.agentInfo) {
    console.log(`Agente: ${result.agentInfo.name}`)
    console.log(`Enlace agente: ${result.agentInfo.url}`)
  } else {
    console.log('No tiene agente registrado.')
  }
}

// Ejecutar según los argumentos
if (process.argv.length > 2) {
  const playerName = process.argv.slice(2).join(' ')
  testPlayer(playerName)
} else {
  scrapePlayersFromDatabase()
}
