import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkReports() {
  try {
    console.log('🔍 Checking recent reports...\n')

    // Get the 10 most recent reports
    const reports = await prisma.reporte.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        player: {
          select: {
            player_name: true
          }
        },
        scout: {
          select: {
            scout_name: true,
            name: true
          }
        }
      }
    })

    console.log(`Found ${reports.length} recent reports:\n`)

    reports.forEach((report, index) => {
      const scoutName = report.scout?.name || report.scout?.scout_name || 'Unknown'
      const playerName = report.player?.player_name || 'Unknown'

      console.log(`${index + 1}. Report ID: ${report.id_report}`)
      console.log(`   Player: ${playerName}`)
      console.log(`   Scout: ${scoutName}`)
      console.log(`   Approval Status: ${report.approval_status || 'NULL'}`)
      console.log(`   Created: ${report.createdAt}`)
      console.log(`   Report Date: ${report.report_date}`)
      console.log('')
    })

    // Count by approval status
    const pendingCount = await prisma.reporte.count({
      where: { approval_status: 'pending' }
    })

    const approvedCount = await prisma.reporte.count({
      where: { approval_status: 'approved' }
    })

    const nullCount = await prisma.reporte.count({
      where: { approval_status: null }
    })

    console.log('📊 Status Summary:')
    console.log(`   Pending: ${pendingCount}`)
    console.log(`   Approved: ${approvedCount}`)
    console.log(`   NULL: ${nullCount}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReports()
