const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyScrapingResults() {
  try {
    console.log('🔍 Verificando resultados del scraping...')
    
    // Obtener todos los jugadores con sus URLs de agente
    const players = await prisma.jugador.findMany({
      select: {
        player_name: true,
        complete_player_name: true,
        url_trfm_advisor: true
      },
      orderBy: {
        player_name: 'asc'
      }
    })
    
    console.log(`📊 Total de jugadores: ${players.length}`)
    
    // Categorizar resultados
    const withAgent = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/berater/'))
    const withProfile = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/profil/spieler/'))
    const withoutInfo = players.filter(p => !p.url_trfm_advisor)
    
    console.log(`\n📈 Estadísticas:`)
    console.log(`  ✅ Con agente específico: ${withAgent.length}`)
    console.log(`  📄 Solo con perfil: ${withProfile.length}`)
    console.log(`  ❌ Sin información: ${withoutInfo.length}`)
    
    // Mostrar jugadores con agente
    if (withAgent.length > 0) {
      console.log(`\n🎯 Jugadores con agente específico:`)
      withAgent.forEach((player, index) => {
        const name = player.complete_player_name || player.player_name
        const agentName = player.url_trfm_advisor.split('/').pop()
        console.log(`  ${index + 1}. ${name} -> ${agentName}`)
      })
    }
    
    // Mostrar jugadores solo con perfil
    if (withProfile.length > 0) {
      console.log(`\n📄 Jugadores solo con perfil (sin agente):`)
      withProfile.forEach((player, index) => {
        const name = player.complete_player_name || player.player_name
        console.log(`  ${index + 1}. ${name}`)
      })
    }
    
    // Mostrar jugadores sin información
    if (withoutInfo.length > 0) {
      console.log(`\n❌ Jugadores sin información:`)
      withoutInfo.forEach((player, index) => {
        const name = player.complete_player_name || player.player_name
        console.log(`  ${index + 1}. ${name}`)
      })
    }
    
    console.log(`\n🎉 Verificación completada!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyScrapingResults()
