import { PrismaClient } from '@prisma/client'
import { generatePlayerId, generateReportId } from '@/lib/utils/id-generator'

const prisma = new PrismaClient()

async function testCreatePlayerAndReport() {
  try {
    console.log('🧪 Testing player + report creation...\n')

    // Buscar un scout existente
    const scout = await prisma.scout.findFirst({
      where: {
        clerkId: { not: null }
      }
    })

    if (!scout) {
      console.log('❌ No scout found with clerkId')
      return
    }

    console.log('✅ Found scout:', {
      id: scout.id_scout,
      name: scout.scout_name || scout.name
    })

    // Generar IDs
    const playerId = await generatePlayerId()
    const reportId = await generateReportId()

    console.log('\n📝 Generated IDs:')
    console.log('   Player ID:', playerId)
    console.log('   Report ID:', reportId)

    // Crear jugador de prueba
    const player = await prisma.jugador.create({
      data: {
        id_player: playerId,
        player_name: 'Test Player ' + Date.now(),
        date_of_birth: new Date('2000-01-01'),
        position_player: 'midfielder',
        height: 180,
        foot: 'Right',
        team_name: 'Test Team',
        team_country: 'Spain',
        nationality_1: 'Spanish',
        url_trfm: 'https://example.com/test',
        approval_status: 'pending',
        created_by_scout_id: scout.id_scout,
      }
    })

    console.log('\n✅ Player created:', {
      id: player.id_player,
      name: player.player_name,
      status: player.approval_status
    })

    // Crear reporte usando relaciones
    const report = await prisma.reporte.create({
      data: {
        id_report: reportId,
        report_date: new Date(),
        report_type: 'original',
        report_status: 'completed',
        approval_status: 'pending',
        form_text_report: 'This is a test report',
        form_potential: '8',
        initial_age: player.age,
        initial_team: player.team_name,
        scout: {
          connect: { id_scout: scout.id_scout }
        },
        player: {
          connect: { id_player: player.id_player }
        }
      }
    })

    console.log('\n✅ Report created:', {
      id: report.id_report,
      player_id: report.id_player,
      status: report.approval_status,
      potential: report.potential
    })

    // Verificar que el reporte esté asociado al jugador
    const playerWithReports = await prisma.jugador.findUnique({
      where: { id_player: player.id_player },
      include: {
        reportes: true
      }
    })

    console.log('\n📊 Player with reports:', {
      player: playerWithReports?.player_name,
      reports_count: playerWithReports?.reportes.length
    })

    console.log('\n✅ TEST PASSED! Player and report created successfully')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreatePlayerAndReport()
