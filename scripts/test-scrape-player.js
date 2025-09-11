const { scrapePlayerData } = require('./scrape-player-data')

// Función para probar el scraping con un jugador específico
async function testScraping() {
  const testPlayers = [
    'Lionel Messi',
    'Cristiano Ronaldo',
    'Kylian Mbappé',
    'Erling Haaland',
    'Luka Modrić'
  ]
  
  console.log('🧪 Iniciando pruebas de scraping...\n')
  
  for (const playerName of testPlayers) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`🔍 Probando con: ${playerName}`)
    console.log(`${'='.repeat(50)}`)
    
    try {
      const result = await scrapePlayerData(playerName)
      
      if (result) {
        console.log('\n✅ Datos extraídos exitosamente:')
        console.log('─'.repeat(30))
        Object.entries(result).forEach(([key, value]) => {
          const status = value ? '✅' : '❌'
          console.log(`${status} ${key}: ${value || 'No encontrado'}`)
        })
      } else {
        console.log('❌ No se pudieron extraer datos')
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    
    // Pausa entre pruebas
    console.log('\n⏳ Esperando 3 segundos...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('\n🎉 Pruebas completadas!')
}

// Ejecutar las pruebas
testScraping().catch(console.error)
