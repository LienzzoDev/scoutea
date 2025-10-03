import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testRelationsSimple() {
  console.log('🔍 Testing Scout-Player Relations (Simple)...\n')

  try {
    // 1. Obtener un scout y un jugador
    const scout = await prisma.scout.findFirst()
    const player = await prisma.jugador.findFirst()

    if (!scout || !player) {
      console.log('❌ No scout or player found')
      return
    }

    console.log(`📊 Scout: ${scout.scout_name || scout.name} (${scout.id_scout})`)
    console.log(`🏃 Player: ${player.player_name} (${player.id_player})`)

    // 2. Buscar reportes que conecten este scout con jugadores
    const scoutReports = await prisma.reporte.findMany({
      where: {
        scout_id: scout.id_scout
      }
    })

    console.log(`\n📈 Reports by ${scout.scout_name || scout.name}: ${scoutReports.length}`)
    
    for (const report of scoutReports) {
      if (report.id_player) {
        const reportPlayer = await prisma.jugador.findUnique({
          where: { id_player: report.id_player }
        })
        
        console.log(`   - Report on: ${reportPlayer?.player_name || 'Unknown'} (ROI: ${report.roi}%)`)
      }
    }

    // 3. Buscar reportes sobre un jugador específico
    const playerReports = await prisma.reporte.findMany({
      where: {
        id_player: player.id_player
      }
    })

    console.log(`\n📋 Reports about ${player.player_name}: ${playerReports.length}`)
    
    for (const report of playerReports) {
      if (report.scout_id) {
        const reportScout = await prisma.scout.findUnique({
          where: { id_scout: report.scout_id }
        })
        
        console.log(`   - Report by: ${reportScout?.scout_name || reportScout?.name || 'Unknown'} (${report.report_type})`)
      }
    }

    // 4. Verificar relaciones scout-player
    const relations = await prisma.scoutPlayerReport.findMany()
    console.log(`\n🔗 Scout-Player Relations: ${relations.length}`)
    
    for (const relation of relations) {
      const relScout = await prisma.scout.findUnique({
        where: { id_scout: relation.scoutId }
      })
      const relPlayer = await prisma.jugador.findUnique({
        where: { id_player: relation.playerId }
      })
      
      console.log(`   - ${relScout?.scout_name || relScout?.name} → ${relPlayer?.player_name}`)
    }

    console.log('\n✅ Relations test completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testRelationsSimple()
}

export { testRelationsSimple }