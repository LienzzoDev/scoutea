import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRecentPlayers() {
  try {
    console.log('🔍 Checking recent players...\n')

    // Get the 10 most recent players
    const players = await prisma.jugador.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${players.length} recent players:\n`)

    players.forEach((player, index) => {
      console.log(`${index + 1}. Player ID: ${player.id_player}`)
      console.log(`   Name: ${player.player_name}`)
      console.log(`   Position: ${player.position_player || 'N/A'}`)
      console.log(`   Team: ${player.team_name || 'N/A'}`)
      console.log(`   Approval Status: ${player.approval_status || 'NULL'}`)
      console.log(`   Created: ${player.createdAt}`)
      console.log('')
    })

    // Check for reports for recent players
    console.log('\n🔍 Checking reports for recent players...\n')
    for (const player of players.slice(0, 5)) {
      const reports = await prisma.reporte.findMany({
        where: { id_player: player.id_player }
      })
      console.log(`Player "${player.player_name}" (${player.id_player}): ${reports.length} reports`)
      if (reports.length === 0) {
        console.log(`  ⚠️  NO REPORTS FOUND for this player!`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentPlayers()
