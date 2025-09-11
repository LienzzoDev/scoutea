const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPlayers() {
  try {
    console.log('🔍 Verificando jugadores en la base de datos...\n')
    
    // Contar total de jugadores
    const totalPlayers = await prisma.jugador.count()
    console.log(`📊 Total de jugadores: ${totalPlayers}\n`)
    
    // Obtener todos los jugadores
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        age: true,
        team_name: true,
        nationality_1: true,
        player_rating: true,
        player_ranking: true
      },
      orderBy: { player_ranking: 'asc' }
    })
    
    console.log('🏆 Top 10 jugadores:')
    console.log('=' .repeat(80))
    console.log('Rank | Nombre                | Posición | Edad | Equipo              | Nacionalidad | Rating')
    console.log('-' .repeat(80))
    
    players.forEach(player => {
      const rank = player.player_ranking?.toString().padStart(4) || 'N/A'
      const name = player.player_name.padEnd(20)
      const position = (player.position_player || 'N/A').padEnd(8)
      const age = (player.age?.toString() || 'N/A').padEnd(4)
      const team = (player.team_name || 'N/A').padEnd(18)
      const nationality = (player.nationality_1 || 'N/A').padEnd(12)
      const rating = player.player_rating?.toFixed(1) || 'N/A'
      
      console.log(`${rank} | ${name} | ${position} | ${age} | ${team} | ${nationality} | ${rating}`)
    })
    
    console.log('\n📈 Estadísticas por posición:')
    const positionStats = await prisma.jugador.groupBy({
      by: ['position_player'],
      _count: { position_player: true },
      where: { position_player: { not: null } },
      orderBy: { _count: { position_player: 'desc' } }
    })
    
    positionStats.forEach(stat => {
      console.log(`  ${stat.position_player}: ${stat._count.position_player} jugadores`)
    })
    
    console.log('\n🌍 Estadísticas por nacionalidad:')
    const nationalityStats = await prisma.jugador.groupBy({
      by: ['nationality_1'],
      _count: { nationality_1: true },
      where: { nationality_1: { not: null } },
      orderBy: { _count: { nationality_1: 'desc' } }
    })
    
    nationalityStats.forEach(stat => {
      console.log(`  ${stat.nationality_1}: ${stat._count.nationality_1} jugadores`)
    })
    
    console.log('\n⚽ Estadísticas por equipo:')
    const teamStats = await prisma.jugador.groupBy({
      by: ['team_name'],
      _count: { team_name: true },
      where: { team_name: { not: null } },
      orderBy: { _count: { team_name: 'desc' } }
    })
    
    teamStats.forEach(stat => {
      console.log(`  ${stat.team_name}: ${stat._count.team_name} jugadores`)
    })
    
    // Promedio de rating
    const avgRating = await prisma.jugador.aggregate({
      _avg: { player_rating: true },
      where: { player_rating: { not: null } }
    })
    
    console.log(`\n⭐ Rating promedio: ${avgRating._avg.player_rating?.toFixed(2) || 'N/A'}`)
    
  } catch (error) {
    console.error('❌ Error verificando jugadores:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPlayers()
