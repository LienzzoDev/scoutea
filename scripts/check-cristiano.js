const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCristiano() {
  try {
    console.log('🔍 Buscando Cristiano Ronaldo en la base de datos...')
    
    // Buscar por diferentes variaciones del nombre
    const searches = [
      'Cristiano Ronaldo',
      'Cristiano',
      'Ronaldo',
      'CR7',
      'C. Ronaldo'
    ]
    
    for (const searchTerm of searches) {
      console.log(`\n📝 Buscando: "${searchTerm}"`)
      
      const players = await prisma.jugador.findMany({
        where: {
          OR: [
            { player_name: { contains: searchTerm, mode: 'insensitive' } },
            { complete_player_name: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id_player: true,
          player_name: true,
          complete_player_name: true,
          team_name: true,
          position_player: true,
          nationality_1: true
        }
      })
      
      if (players.length > 0) {
        console.log(`✅ Encontrados ${players.length} jugador(es):`)
        players.forEach(player => {
          console.log(`  - ID: ${player.id_player}`)
          console.log(`    Nombre: ${player.player_name}`)
          console.log(`    Nombre completo: ${player.complete_player_name || 'N/A'}`)
          console.log(`    Equipo: ${player.team_name || 'N/A'}`)
          console.log(`    Posición: ${player.position_player || 'N/A'}`)
          console.log(`    Nacionalidad: ${player.nationality_1 || 'N/A'}`)
          console.log('')
        })
      } else {
        console.log('❌ No encontrado')
      }
    }
    
    // También buscar todos los jugadores para ver qué hay
    console.log('\n📊 Total de jugadores en la base de datos:')
    const totalPlayers = await prisma.jugador.count()
    console.log(`Total: ${totalPlayers}`)
    
    if (totalPlayers > 0) {
      console.log('\n👥 Primeros 10 jugadores:')
      const firstPlayers = await prisma.jugador.findMany({
        take: 10,
        select: {
          id_player: true,
          player_name: true,
          team_name: true,
          position_player: true
        },
        orderBy: { player_name: 'asc' }
      })
      
      firstPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.player_name} (${player.team_name || 'Sin equipo'}) - ${player.position_player || 'Sin posición'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCristiano()
