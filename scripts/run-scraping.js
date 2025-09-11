const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function runScraping() {
  try {
    console.log('🚀 Iniciando proceso de scraping completo...')
    
    // 1. Verificar estado actual
    console.log('\n📊 Verificando estado actual...')
    const currentStats = await getCurrentStats()
    console.log(`  Jugadores sin URL de agente: ${currentStats.withoutAgent}`)
    console.log(`  Jugadores con agente: ${currentStats.withAgent}`)
    console.log(`  Jugadores solo con perfil: ${currentStats.withProfile}`)
    
    if (currentStats.withoutAgent === 0) {
      console.log('✅ Todos los jugadores ya tienen información de agente')
      return
    }
    
    // 2. Ejecutar scraping
    console.log('\n🔍 Ejecutando scraping...')
    try {
      execSync('node scripts/scrape-agent-urls.js', { stdio: 'inherit' })
    } catch (error) {
      console.error('❌ Error durante el scraping:', error.message)
      return
    }
    
    // 3. Verificar resultados
    console.log('\n📈 Verificando resultados...')
    const finalStats = await getCurrentStats()
    console.log(`  Jugadores sin URL de agente: ${finalStats.withoutAgent}`)
    console.log(`  Jugadores con agente: ${finalStats.withAgent}`)
    console.log(`  Jugadores solo con perfil: ${finalStats.withProfile}`)
    
    // 4. Mostrar mejoras
    const improvements = {
      newAgents: finalStats.withAgent - currentStats.withAgent,
      newProfiles: finalStats.withProfile - currentStats.withProfile
    }
    
    console.log('\n🎯 Mejoras obtenidas:')
    console.log(`  Nuevos agentes encontrados: ${improvements.newAgents}`)
    console.log(`  Nuevos perfiles agregados: ${improvements.newProfiles}`)
    
    console.log('\n🎉 Proceso de scraping completado!')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function getCurrentStats() {
  const players = await prisma.jugador.findMany({
    select: {
      url_trfm_advisor: true
    }
  })
  
  const withAgent = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/berater/')).length
  const withProfile = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/profil/spieler/')).length
  const withoutAgent = players.filter(p => !p.url_trfm_advisor).length
  
  return { withAgent, withProfile, withoutAgent }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runScraping()
}

module.exports = { runScraping }
