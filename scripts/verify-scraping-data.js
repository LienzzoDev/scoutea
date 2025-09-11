const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyScrapingData() {
  try {
    console.log('🔍 Verificando datos extraídos por scraping...\n')
    
    // Obtener estadísticas generales
    const totalPlayers = await prisma.jugador.count()
    console.log(`📊 Total de jugadores en la base de datos: ${totalPlayers}\n`)
    
    // Campos a verificar
    const fields = [
      { name: 'url_trfm_advisor', label: 'URL Transfermarkt', type: 'url' },
      { name: 'date_of_birth', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'team_name', label: 'Nombre del equipo', type: 'text' },
      { name: 'team_loan_from', label: 'Equipo de préstamo', type: 'text' },
      { name: 'position_player', label: 'Posición', type: 'text' },
      { name: 'foot', label: 'Pie preferido', type: 'text' },
      { name: 'height', label: 'Altura', type: 'number' },
      { name: 'nationality_1', label: 'Nacionalidad 1', type: 'text' },
      { name: 'nationality_2', label: 'Nacionalidad 2', type: 'text' },
      { name: 'national_tier', label: 'Nivel nacional', type: 'text' },
      { name: 'agency', label: 'Agencia', type: 'text' },
      { name: 'contract_end', label: 'Fin de contrato', type: 'date' },
      { name: 'player_trfm_value', label: 'Valor de mercado', type: 'number' }
    ]
    
    console.log('📈 Progreso por campo:')
    console.log('─'.repeat(60))
    
    for (const field of fields) {
      const count = await prisma.jugador.count({
        where: { [field.name]: { not: null } }
      })
      const percentage = ((count / totalPlayers) * 100).toFixed(1)
      const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2))
      
      console.log(`${field.label.padEnd(20)} │${bar}│ ${count.toString().padStart(4)}/${totalPlayers} (${percentage}%)`)
    }
    
    // Estadísticas detalladas
    console.log('\n📊 Estadísticas detalladas:')
    console.log('─'.repeat(60))
    
    // Jugadores con datos completos
    const completeData = await prisma.jugador.count({
      where: {
        AND: [
          { url_trfm_advisor: { not: null } },
          { date_of_birth: { not: null } },
          { team_name: { not: null } },
          { position_player: { not: null } },
          { height: { not: null } },
          { nationality_1: { not: null } }
        ]
      }
    })
    
    console.log(`✅ Jugadores con datos completos: ${completeData}/${totalPlayers} (${((completeData/totalPlayers)*100).toFixed(1)}%)`)
    
    // Jugadores sin datos
    const noData = await prisma.jugador.count({
      where: {
        AND: [
          { url_trfm_advisor: null },
          { date_of_birth: null },
          { team_name: null },
          { position_player: null },
          { height: null },
          { nationality_1: null }
        ]
      }
    })
    
    console.log(`❌ Jugadores sin datos: ${noData}/${totalPlayers} (${((noData/totalPlayers)*100).toFixed(1)}%)`)
    
    // Análisis por equipos más comunes
    console.log('\n🏆 Top 10 equipos:')
    console.log('─'.repeat(40))
    
    const topTeams = await prisma.jugador.groupBy({
      by: ['team_name'],
      where: { team_name: { not: null } },
      _count: { team_name: true },
      orderBy: { _count: { team_name: 'desc' } },
      take: 10
    })
    
    topTeams.forEach((team, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${team.team_name.padEnd(25)} (${team._count.team_name} jugadores)`)
    })
    
    // Análisis por posiciones
    console.log('\n⚽ Top 10 posiciones:')
    console.log('─'.repeat(40))
    
    const topPositions = await prisma.jugador.groupBy({
      by: ['position_player'],
      where: { position_player: { not: null } },
      _count: { position_player: true },
      orderBy: { _count: { position_player: 'desc' } },
      take: 10
    })
    
    topPositions.forEach((position, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${position.position_player.padEnd(25)} (${position._count.position_player} jugadores)`)
    })
    
    // Análisis por nacionalidades
    console.log('\n🌍 Top 10 nacionalidades:')
    console.log('─'.repeat(40))
    
    const topNationalities = await prisma.jugador.groupBy({
      by: ['nationality_1'],
      where: { nationality_1: { not: null } },
      _count: { nationality_1: true },
      orderBy: { _count: { nationality_1: 'desc' } },
      take: 10
    })
    
    topNationalities.forEach((nationality, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${nationality.nationality_1.padEnd(25)} (${nationality._count.nationality_1} jugadores)`)
    })
    
    // Valores de mercado
    console.log('\n💰 Análisis de valores de mercado:')
    console.log('─'.repeat(40))
    
    const valueStats = await prisma.jugador.aggregate({
      where: { player_trfm_value: { not: null } },
      _count: { player_trfm_value: true },
      _avg: { player_trfm_value: true },
      _min: { player_trfm_value: true },
      _max: { player_trfm_value: true }
    })
    
    if (valueStats._count.player_trfm_value > 0) {
      console.log(`Jugadores con valor: ${valueStats._count.player_trfm_value}`)
      console.log(`Valor promedio: €${Math.round(valueStats._avg.player_trfm_value).toLocaleString()}`)
      console.log(`Valor mínimo: €${valueStats._min.player_trfm_value.toLocaleString()}`)
      console.log(`Valor máximo: €${valueStats._max.player_trfm_value.toLocaleString()}`)
    } else {
      console.log('No hay datos de valores de mercado')
    }
    
    // Alturas
    console.log('\n📏 Análisis de alturas:')
    console.log('─'.repeat(40))
    
    const heightStats = await prisma.jugador.aggregate({
      where: { height: { not: null } },
      _count: { height: true },
      _avg: { height: true },
      _min: { height: true },
      _max: { height: true }
    })
    
    if (heightStats._count.height > 0) {
      console.log(`Jugadores con altura: ${heightStats._count.height}`)
      console.log(`Altura promedio: ${Math.round(heightStats._avg.height)} cm`)
      console.log(`Altura mínima: ${heightStats._min.height} cm`)
      console.log(`Altura máxima: ${heightStats._max.height} cm`)
    } else {
      console.log('No hay datos de alturas')
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar verificación
verifyScrapingData()
