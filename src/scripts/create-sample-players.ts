import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createSamplePlayers() {
  try {
    console.log('🚀 Creating sample players...')

    // Verificar si ya existen jugadores
    const existingPlayers = await prisma.jugador.count()
    if (existingPlayers > 0) {
      console.log('✅ Players already exist in database:', existingPlayers)
      return {
        success: true,
        message: `Database already has ${existingPlayers} players`,
      }
    }

    // Datos de jugadores de prueba
    const samplePlayersData = [
      {
        id_player: 'player-sample-1',
        player_name: 'Alejandro Martínez',
        complete_player_name: 'Alejandro Martínez García',
        date_of_birth: new Date('2001-03-15'),
        age: 23,
        position_player: 'Midfielder',
        correct_position_player: 'Central Midfielder',
        foot: 'Right',
        height: 178,
        nationality_1: 'Spain',
        correct_nationality_1: 'Spain',
        team_name: 'Real Betis',
        correct_team_name: 'Real Betis Balompié',
        team_country: 'Spain',
        team_competition: 'La Liga',
        competition_country: 'Spain',
        player_rating: 78.5,
        player_trfm_value: 8500000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_player: 'player-sample-2',
        player_name: 'Lucas Silva',
        complete_player_name: 'Lucas Silva Santos',
        date_of_birth: new Date('2000-07-22'),
        age: 24,
        position_player: 'Forward',
        correct_position_player: 'Centre-Forward',
        foot: 'Left',
        height: 185,
        nationality_1: 'Brazil',
        correct_nationality_1: 'Brazil',
        team_name: 'Flamengo',
        correct_team_name: 'Clube de Regatas do Flamengo',
        team_country: 'Brazil',
        team_competition: 'Brasileirão',
        competition_country: 'Brazil',
        player_rating: 82.1,
        player_trfm_value: 15000000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_player: 'player-sample-3',
        player_name: 'Antoine Dubois',
        complete_player_name: 'Antoine Dubois',
        date_of_birth: new Date('1999-11-08'),
        age: 25,
        position_player: 'Defender',
        correct_position_player: 'Centre-Back',
        foot: 'Right',
        height: 190,
        nationality_1: 'France',
        correct_nationality_1: 'France',
        team_name: 'Olympique Lyon',
        correct_team_name: 'Olympique Lyonnais',
        team_country: 'France',
        team_competition: 'Ligue 1',
        competition_country: 'France',
        player_rating: 75.8,
        player_trfm_value: 12000000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_player: 'player-sample-4',
        player_name: 'Marco Verratti Jr',
        complete_player_name: 'Marco Verratti Junior',
        date_of_birth: new Date('2002-01-12'),
        age: 22,
        position_player: 'Midfielder',
        correct_position_player: 'Attacking Midfielder',
        foot: 'Right',
        height: 175,
        nationality_1: 'Italy',
        correct_nationality_1: 'Italy',
        team_name: 'AC Milan',
        correct_team_name: 'Associazione Calcio Milan',
        team_country: 'Italy',
        team_competition: 'Serie A',
        competition_country: 'Italy',
        player_rating: 79.3,
        player_trfm_value: 18000000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_player: 'player-sample-5',
        player_name: 'Diego Hernández',
        complete_player_name: 'Diego Hernández López',
        date_of_birth: new Date('2001-09-30'),
        age: 23,
        position_player: 'Goalkeeper',
        correct_position_player: 'Goalkeeper',
        foot: 'Right',
        height: 188,
        nationality_1: 'Mexico',
        correct_nationality_1: 'Mexico',
        team_name: 'Club América',
        correct_team_name: 'Club de Fútbol América',
        team_country: 'Mexico',
        team_competition: 'Liga MX',
        competition_country: 'Mexico',
        player_rating: 76.2,
        player_trfm_value: 6500000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Crear jugadores en la base de datos
    const createdPlayers = await prisma.jugador.createMany({
      data: samplePlayersData,
      skipDuplicates: true
    })

    console.log('✅ Sample players created:', createdPlayers.count)

    return {
      success: true,
      message: `Created ${createdPlayers.count} sample players`,
      players: samplePlayersData
    }
  } catch (error) {
    console.error('❌ Error creating sample players:', error)
    return {
      success: false,
      message: `Failed to create sample players: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSamplePlayers()
}