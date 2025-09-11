const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const testPlayers = [
  {
    player_name: "Cristiano Ronaldo",
    complete_player_name: "Cristiano Ronaldo dos Santos Aveiro",
    position_player: "Delantero",
    team_name: "Al-Nassr",
    nationality_1: "Portugal"
  },
  {
    player_name: "Luka Modrić",
    complete_player_name: "Luka Modrić",
    position_player: "Centrocampista",
    team_name: "Real Madrid",
    nationality_1: "Croacia"
  },
  {
    player_name: "Neymar",
    complete_player_name: "Neymar da Silva Santos Júnior",
    position_player: "Delantero",
    team_name: "Al-Hilal",
    nationality_1: "Brasil"
  },
  {
    player_name: "Kylian Mbappé",
    complete_player_name: "Kylian Mbappé Lottin",
    position_player: "Delantero",
    team_name: "Real Madrid",
    nationality_1: "Francia"
  },
  {
    player_name: "Mohamed Salah",
    complete_player_name: "Mohamed Salah Hamed Mahrous Ghaly",
    position_player: "Delantero",
    team_name: "Liverpool",
    nationality_1: "Egipto"
  }
]

async function addTestPlayers() {
  try {
    console.log('🚀 Agregando jugadores de prueba...')
    
    for (const player of testPlayers) {
      try {
        // Verificar si el jugador ya existe
        const existingPlayer = await prisma.jugador.findFirst({
          where: {
            OR: [
              { player_name: player.player_name },
              { complete_player_name: player.complete_player_name }
            ]
          }
        })
        
        if (existingPlayer) {
          console.log(`⚠️ Jugador ya existe: ${player.player_name}`)
          continue
        }
        
        // Crear nuevo jugador
        const newPlayer = await prisma.jugador.create({
          data: {
            ...player,
            url_trfm_advisor: null // Sin URL de agente para probar el scraping
          }
        })
        
        console.log(`✅ Jugador agregado: ${player.player_name} (ID: ${newPlayer.id_player})`)
        
      } catch (error) {
        console.error(`❌ Error agregando ${player.player_name}:`, error.message)
      }
    }
    
    console.log('\n🎉 Proceso completado!')
    
    // Mostrar estadísticas finales
    const totalPlayers = await prisma.jugador.count()
    const withoutAgent = await prisma.jugador.count({
      where: {
        OR: [
          { url_trfm_advisor: null },
          { url_trfm_advisor: '' }
        ]
      }
    })
    
    console.log(`\n📊 Estadísticas:`)
    console.log(`  Total de jugadores: ${totalPlayers}`)
    console.log(`  Sin URL de agente: ${withoutAgent}`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestPlayers()
