import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Datos de ejemplo para poblar campos vacíos
const sampleNationalities = [
  'Spain', 'Brazil', 'Argentina', 'France', 'Germany', 'Italy', 'England', 
  'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Uruguay', 'Colombia', 
  'Mexico', 'Chile', 'Peru', 'Ecuador', 'Venezuela', 'Paraguay', 'Bolivia'
]

const samplePositions = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'
]

const sampleTeams = [
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia', 
  'Real Sociedad', 'Athletic Bilbao', 'Villarreal', 'Real Betis', 'Celta Vigo',
  'Manchester City', 'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal',
  'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
  'PSG', 'Marseille', 'Lyon', 'Monaco', 'Juventus', 'AC Milan', 'Inter Milan'
]

const sampleCompetitions = [
  'La Liga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1',
  'Primeira Liga', 'Eredivisie', 'Liga MX', 'Brazilian Serie A', 'Argentine Primera'
]

const sampleAgencies = [
  'Gestifute', 'CAA Base', 'Stellar Group', 'Wasserman', 'ICM Partners',
  'Roc Nation Sports', 'Unique Sports Group', 'You First Sports', 'Base Soccer',
  'Promoesport', 'Bahia International', 'TLA Worldwide'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomAge(): number {
  return Math.floor(Math.random() * 20) + 16 // Edades entre 16 y 35
}

function getRandomRating(): number {
  return Math.round((Math.random() * 40 + 60) * 10) / 10 // Ratings entre 6.0 y 10.0
}

function getRandomHeight(): number {
  return Math.floor(Math.random() * 30) + 160 // Alturas entre 160 y 190 cm
}

async function populatePlayerData() {
  try {
    console.log('🚀 Starting to populate player data...')

    // Obtener jugadores que necesitan datos
    const playersToUpdate = await prisma.jugador.findMany({
      where: {
        OR: [
          { nationality_1: null },
          { position_player: null },
          { team_name: null },
          { age: null },
          { player_rating: null },
          { height: null },
          { team_competition: null },
          { agency: null },
          { on_loan: null }
        ]
      },
      take: 1000 // Limitar a 1000 jugadores por vez
    })

    console.log(`📊 Found ${playersToUpdate.length} players to update`)

    let updatedCount = 0

    for (const player of playersToUpdate) {
      const updateData: any = {}

      // Poblar nacionalidad si está vacía
      if (!player.nationality_1) {
        updateData.nationality_1 = getRandomElement(sampleNationalities)
      }

      // Poblar posición si está vacía
      if (!player.position_player) {
        updateData.position_player = getRandomElement(samplePositions)
      }

      // Poblar equipo si está vacío
      if (!player.team_name) {
        updateData.team_name = getRandomElement(sampleTeams)
      }

      // Poblar edad si está vacía
      if (!player.age) {
        updateData.age = getRandomAge()
      }

      // Poblar rating si está vacío
      if (!player.player_rating) {
        updateData.player_rating = getRandomRating()
      }

      // Poblar altura si está vacía
      if (!player.height) {
        updateData.height = getRandomHeight()
      }

      // Poblar competición si está vacía
      if (!player.team_competition) {
        updateData.team_competition = getRandomElement(sampleCompetitions)
      }

      // Poblar agencia si está vacía
      if (!player.agency) {
        updateData.agency = getRandomElement(sampleAgencies)
      }

      // Poblar estado de préstamo si está vacío
      if (player.on_loan === null) {
        updateData.on_loan = Math.random() < 0.2 // 20% de probabilidad de estar cedido
      }

      // Actualizar jugador si hay datos que cambiar
      if (Object.keys(updateData).length > 0) {
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: updateData
        })
        updatedCount++

        if (updatedCount % 100 === 0) {
          console.log(`✅ Updated ${updatedCount} players...`)
        }
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} players!`)

    // Mostrar estadísticas finales
    const stats = await prisma.jugador.aggregate({
      _count: {
        id_player: true
      },
      where: {
        AND: [
          { nationality_1: { not: null } },
          { position_player: { not: null } },
          { team_name: { not: null } },
          { age: { not: null } },
          { player_rating: { not: null } }
        ]
      }
    })

    console.log(`📈 Players with complete data: ${stats._count.id_player}`)

  } catch (error) {
    console.error('❌ Error populating player data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populatePlayerData()
}

export { populatePlayerData }