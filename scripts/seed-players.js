const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const samplePlayers = [
  {
    player_name: "Lionel Messi",
    complete_player_name: "Lionel Andrés Messi Cuccittini",
    date_of_birth: new Date("1987-06-24"),
    age: 36,
    position_player: "RW",
    foot: "Left",
    height: 170,
    nationality_1: "Argentina",
    team_name: "Inter Miami CF",
    team_country: "United States",
    team_competition: "MLS",
    competition_country: "United States",
    player_rating: 9.2,
    player_elo: 2850,
    player_level: "World Class",
    player_ranking: 1,
    community_potential: 9.5,
    url_instagram: "https://instagram.com/leomessi",
    existing_club: "Inter Miami CF"
  },
  {
    player_name: "Kylian Mbappé",
    complete_player_name: "Kylian Mbappé Lottin",
    date_of_birth: new Date("1998-12-20"),
    age: 25,
    position_player: "ST",
    foot: "Right",
    height: 178,
    nationality_1: "France",
    team_name: "Real Madrid",
    team_country: "Spain",
    team_competition: "La Liga",
    competition_country: "Spain",
    player_rating: 9.0,
    player_elo: 2800,
    player_level: "World Class",
    player_ranking: 2,
    community_potential: 9.8,
    url_instagram: "https://instagram.com/k.mbappe",
    existing_club: "Real Madrid"
  },
  {
    player_name: "Erling Haaland",
    complete_player_name: "Erling Braut Haaland",
    date_of_birth: new Date("2000-07-21"),
    age: 23,
    position_player: "ST",
    foot: "Left",
    height: 194,
    nationality_1: "Norway",
    team_name: "Manchester City",
    team_country: "England",
    team_competition: "Premier League",
    competition_country: "England",
    player_rating: 8.8,
    player_elo: 2750,
    player_level: "World Class",
    player_ranking: 3,
    community_potential: 9.3,
    url_instagram: "https://instagram.com/erling.haaland",
    existing_club: "Manchester City"
  },
  {
    player_name: "Kevin De Bruyne",
    complete_player_name: "Kevin De Bruyne",
    date_of_birth: new Date("1991-06-28"),
    age: 32,
    position_player: "CAM",
    foot: "Right",
    height: 181,
    nationality_1: "Belgium",
    team_name: "Manchester City",
    team_country: "England",
    team_competition: "Premier League",
    competition_country: "England",
    player_rating: 8.7,
    player_elo: 2700,
    player_level: "World Class",
    player_ranking: 4,
    community_potential: 8.9,
    existing_club: "Manchester City"
  },
  {
    player_name: "Luka Modrić",
    complete_player_name: "Luka Modrić",
    date_of_birth: new Date("1985-09-09"),
    age: 38,
    position_player: "CM",
    foot: "Right",
    height: 172,
    nationality_1: "Croatia",
    team_name: "Real Madrid",
    team_country: "Spain",
    team_competition: "La Liga",
    competition_country: "Spain",
    player_rating: 8.5,
    player_elo: 2650,
    player_level: "World Class",
    player_ranking: 5,
    community_potential: 8.7,
    existing_club: "Real Madrid"
  },
  {
    player_name: "Virgil van Dijk",
    complete_player_name: "Virgil van Dijk",
    date_of_birth: new Date("1991-07-08"),
    age: 32,
    position_player: "CB",
    foot: "Right",
    height: 193,
    nationality_1: "Netherlands",
    team_name: "Liverpool",
    team_country: "England",
    team_competition: "Premier League",
    competition_country: "England",
    player_rating: 8.4,
    player_elo: 2600,
    player_level: "World Class",
    player_ranking: 6,
    community_potential: 8.5,
    existing_club: "Liverpool"
  },
  {
    player_name: "Neymar Jr",
    complete_player_name: "Neymar da Silva Santos Júnior",
    date_of_birth: new Date("1992-02-05"),
    age: 31,
    position_player: "LW",
    foot: "Right",
    height: 175,
    nationality_1: "Brazil",
    team_name: "Al-Hilal",
    team_country: "Saudi Arabia",
    team_competition: "Saudi Pro League",
    competition_country: "Saudi Arabia",
    player_rating: 8.3,
    player_elo: 2550,
    player_level: "World Class",
    player_ranking: 7,
    community_potential: 9.1,
    url_instagram: "https://instagram.com/neymarjr",
    existing_club: "Al-Hilal"
  },
  {
    player_name: "Robert Lewandowski",
    complete_player_name: "Robert Lewandowski",
    date_of_birth: new Date("1988-08-21"),
    age: 35,
    position_player: "ST",
    foot: "Right",
    height: 185,
    nationality_1: "Poland",
    team_name: "FC Barcelona",
    team_country: "Spain",
    team_competition: "La Liga",
    competition_country: "Spain",
    player_rating: 8.2,
    player_elo: 2500,
    player_level: "World Class",
    player_ranking: 8,
    community_potential: 8.8,
    existing_club: "FC Barcelona"
  },
  {
    player_name: "Mohamed Salah",
    complete_player_name: "Mohamed Salah Hamed Mahrous Ghaly",
    date_of_birth: new Date("1992-06-15"),
    age: 31,
    position_player: "RW",
    foot: "Left",
    height: 175,
    nationality_1: "Egypt",
    team_name: "Liverpool",
    team_country: "England",
    team_competition: "Premier League",
    competition_country: "England",
    player_rating: 8.1,
    player_elo: 2450,
    player_level: "World Class",
    player_ranking: 9,
    community_potential: 8.6,
    url_instagram: "https://instagram.com/mosalah",
    existing_club: "Liverpool"
  },
  {
    player_name: "Karim Benzema",
    complete_player_name: "Karim Mostafa Benzema",
    date_of_birth: new Date("1987-12-19"),
    age: 36,
    position_player: "ST",
    foot: "Right",
    height: 185,
    nationality_1: "France",
    team_name: "Al-Ittihad",
    team_country: "Saudi Arabia",
    team_competition: "Saudi Pro League",
    competition_country: "Saudi Arabia",
    player_rating: 8.0,
    player_elo: 2400,
    player_level: "World Class",
    player_ranking: 10,
    community_potential: 8.4,
    existing_club: "Al-Ittihad"
  }
]

async function seedPlayers() {
  try {
    console.log('🌱 Iniciando seed de jugadores...')
    
    // Limpiar datos existentes
    await prisma.jugador.deleteMany({})
    console.log('🗑️ Datos existentes eliminados')
    
    // Insertar jugadores de ejemplo
    for (const player of samplePlayers) {
      await prisma.jugador.create({
        data: player
      })
    }
    
    console.log(`✅ ${samplePlayers.length} jugadores insertados exitosamente`)
    
    // Verificar inserción
    const count = await prisma.jugador.count()
    console.log(`📊 Total de jugadores en la base de datos: ${count}`)
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedPlayers()
