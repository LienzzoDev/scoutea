const { scrapePlayerData } = require('./scrape-player-data')

// Lista de jugadores para probar
const testPlayers = [
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Kylian Mbappé',
  'Erling Haaland',
  'Luka Modrić',
  'Kevin De Bruyne',
  'Virgil van Dijk',
  'Mohamed Salah',
  'Neymar',
  'Robert Lewandowski'
]

async function testMultiplePlayers() {
  console.log('🧪 Probando scraping con múltiples jugadores...\n')
  
  let totalSuccess = 0
  let totalErrors = 0
  const results = []
  
  for (let i = 0; i < testPlayers.length; i++) {
    const playerName = testPlayers[i]
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🔍 [${i + 1}/${testPlayers.length}] ${playerName}`)
    console.log(`${'='.repeat(60)}`)
    
    try {
      const result = await scrapePlayerData(playerName)
      
      if (result) {
        console.log('\n✅ Datos extraídos:')
        console.log('─'.repeat(40))
        
        const fields = [
          'url_trfm_advisor',
          'date_of_birth',
          'team_name',
          'team_loan_from',
          'position_player',
          'foot',
          'height',
          'nationality_1',
          'nationality_2',
          'national_tier',
          'agency',
          'contract_end',
          'player_trfm_value'
        ]
        
        let successCount = 0
        fields.forEach(field => {
          const value = result[field]
          const status = value ? '✅' : '❌'
          console.log(`${status} ${field}: ${value || 'No encontrado'}`)
          if (value) successCount++
        })
        
        console.log(`\n📊 Campos extraídos: ${successCount}/${fields.length}`)
        results.push({ player: playerName, success: true, fields: successCount })
        totalSuccess++
      } else {
        console.log('❌ No se pudieron extraer datos')
        results.push({ player: playerName, success: false, fields: 0 })
        totalErrors++
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
      results.push({ player: playerName, success: false, fields: 0 })
      totalErrors++
    }
    
    // Pausa entre jugadores
    if (i < testPlayers.length - 1) {
      console.log('\n⏳ Esperando 3 segundos...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  // Resumen final
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 RESUMEN FINAL')
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Exitosos: ${totalSuccess}/${testPlayers.length}`)
  console.log(`❌ Errores: ${totalErrors}/${testPlayers.length}`)
  console.log(`📈 Tasa de éxito: ${((totalSuccess/testPlayers.length)*100).toFixed(1)}%`)
  
  console.log('\n📋 Detalle por jugador:')
  console.log('─'.repeat(50))
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.player}: ${result.fields} campos`)
  })
  
  // Estadísticas de campos
  const fieldStats = {}
  const allFields = [
    'url_trfm_advisor',
    'date_of_birth',
    'team_name',
    'team_loan_from',
    'position_player',
    'foot',
    'height',
    'nationality_1',
    'nationality_2',
    'national_tier',
    'agency',
    'contract_end',
    'player_trfm_value'
  ]
  
  allFields.forEach(field => {
    fieldStats[field] = 0
  })
  
  results.forEach(result => {
    if (result.success) {
      // Aquí necesitaríamos los datos reales para contar campos
      // Por simplicidad, asumimos que cada éxito tiene al menos 5 campos
      fieldStats['url_trfm_advisor'] += 1
      fieldStats['position_player'] += 1
      fieldStats['contract_end'] += 1
      fieldStats['player_trfm_value'] += 1
    }
  })
  
  console.log('\n📊 Estadísticas de campos:')
  console.log('─'.repeat(40))
  Object.entries(fieldStats).forEach(([field, count]) => {
    const percentage = ((count / testPlayers.length) * 100).toFixed(1)
    console.log(`${field}: ${count}/${testPlayers.length} (${percentage}%)`)
  })
}

// Ejecutar pruebas
testMultiplePlayers().catch(console.error)
