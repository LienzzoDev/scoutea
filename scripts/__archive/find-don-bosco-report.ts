import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findReport() {
  try {
    console.log('🔍 Searching for "don bosco" report...\n')

    // Search for player
    const player = await prisma.jugador.findFirst({
      where: {
        player_name: {
          contains: 'don bosco',
          mode: 'insensitive'
        }
      }
    })

    if (!player) {
      console.log('❌ Player "don bosco" not found')

      // Search for similar names
      const similarPlayers = await prisma.jugador.findMany({
        where: {
          player_name: {
            contains: 'bosco',
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })

      if (similarPlayers.length > 0) {
        console.log('\nFound similar players:')
        similarPlayers.forEach(p => {
          console.log(`  - ${p.player_name} (ID: ${p.id_player}) - Created: ${p.createdAt}`)
        })
      }

      return
    }

    console.log('✅ Player found:')
    console.log(`   ID: ${player.id_player}`)
    console.log(`   Name: ${player.player_name}`)
    console.log(`   Position: ${player.position_player}`)
    console.log(`   Approval Status: ${player.approval_status}`)
    console.log(`   Created: ${player.createdAt}`)

    // Find reports for this player
    const reports = await prisma.reporte.findMany({
      where: {
        id_player: player.id_player
      },
      include: {
        scout: {
          select: {
            scout_name: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 Found ${reports.length} report(s) for this player:\n`)

    reports.forEach((report, index) => {
      const scoutName = report.scout?.name || report.scout?.scout_name || 'Unknown'
      console.log(`${index + 1}. Report ID: ${report.id_report}`)
      console.log(`   Scout: ${scoutName}`)
      console.log(`   Approval Status: ${report.approval_status || 'NULL'}`)
      console.log(`   Created: ${report.createdAt}`)
      console.log(`   Report Date: ${report.report_date}`)
      console.log(`   Text: ${report.form_text_report?.substring(0, 50) || 'N/A'}...`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findReport()
