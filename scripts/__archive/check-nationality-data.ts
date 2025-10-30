import { prisma } from '@/lib/db'

async function main() {
  // Check nationality_1 field
  const playersWithNationality = await prisma.jugador.findMany({
    where: {
      nationality_1: { not: null }
    },
    select: {
      player_name: true,
      nationality_1: true,
      correct_nationality_1: true,
      player_trfm_value: true
    },
    take: 20
  })

  console.log('Players with nationality_1:')
  console.table(playersWithNationality)

  console.log('\nUnique nationalities:')
  const uniqueNationalities = await prisma.jugador.groupBy({
    by: ['nationality_1'],
    where: {
      nationality_1: { not: null }
    },
    _count: true
  })
  console.table(uniqueNationalities)

  // Check if we should use correct_nationality_1 instead
  const playersWithCorrectNationality = await prisma.jugador.findMany({
    where: {
      correct_nationality_1: { not: null }
    },
    select: {
      player_name: true,
      nationality_1: true,
      correct_nationality_1: true,
      player_trfm_value: true
    },
    take: 20
  })

  console.log('\nPlayers with correct_nationality_1:')
  console.table(playersWithCorrectNationality)

  process.exit(0)
}

main()
