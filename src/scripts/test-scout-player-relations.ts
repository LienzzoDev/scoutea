import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testScoutPlayerRelations() {
  console.log('🔍 Testing Scout-Player Relations...\n')

  try {
    // 1. Verificar scouts existentes
    console.log('1. Checking existing scouts...')
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true
      },
      take: 3
    })
    console.log(`Found ${scouts.length} scouts:`)
    scouts.forEach(scout => {
      console.log(`   - ${scout.scout_name || scout.name} (${scout.id_scout})`)
    })

    // 2. Verificar jugadores existentes
    console.log('\n2. Checking existing players...')
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        position_player: true
      },
      take: 3
    })
    console.log(`Found ${players.length} players:`)
    players.forEach(player => {
      console.log(`   - ${player.player_name} (${player.position_player}) - ${player.id_player}`)
    })

    // 3. Crear reportes de ejemplo con relaciones
    console.log('\n3. Creating sample reports with scout-player relations...')
    
    if (scouts.length > 0 && players.length > 0) {
      const sampleReport = await prisma.reporte.create({
        data: {
          report_status: 'completed',
          report_validation: 'validated',
          report_author: scouts[0].scout_name || scouts[0].name || 'Test Scout',
          scout_id: scouts[0].id_scout,
          report_date: new Date(),
          report_type: 'performance',
          id_player: players[0].id_player,
          player_name: players[0].player_name,
          position_player: players[0].position_player,
          roi: 15.5,
          profit: 2500000,
          form_potential: 'High',
          form_text_report: 'Excellent technical skills and great potential for development.'
        }
      })

      console.log(`   ✅ Created report: ${sampleReport.id_report}`)

      // 4. Crear relación scout-player-report
      const relation = await prisma.scoutPlayerReport.create({
        data: {
          scoutId: scouts[0].id_scout,
          playerId: players[0].id_player,
          reportId: sampleReport.id_report
        }
      })

      console.log(`   ✅ Created scout-player relation: ${relation.id}`)

      // 5. Probar consultas con relaciones
      console.log('\n4. Testing relationship queries...')
      
      // Reportes de un scout específico
      const scoutReports = await prisma.reporte.findMany({
        where: {
          scout_id: scouts[0].id_scout
        },
        include: {
          player: {
            select: {
              player_name: true,
              position_player: true,
              team_name: true
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

      console.log(`   📊 Scout ${scouts[0].scout_name || scouts[0].name} has ${scoutReports.length} reports:`)
      scoutReports.forEach(report => {
        console.log(`      - Report on ${report.player?.player_name} (${report.player?.position_player})`)
        console.log(`        ROI: ${report.roi}%, Profit: €${report.profit?.toLocaleString()}`)
      })

      // Reportes sobre un jugador específico
      const playerReports = await prisma.reporte.findMany({
        where: {
          id_player: players[0].id_player
        },
        include: {
          scout: {
            select: {
              scout_name: true,
              name: true,
              scout_level: true
            }
          }
        }
      })

      console.log(`\n   📊 Player ${players[0].player_name} has ${playerReports.length} reports:`)
      playerReports.forEach(report => {
        const scoutName = report.scout?.scout_name || report.scout?.name || 'Unknown Scout'
        console.log(`      - Report by ${scoutName} (${report.scout?.scout_level || 'N/A'})`)
        console.log(`        Date: ${report.report_date?.toLocaleDateString()}, Type: ${report.report_type}`)
      })

      // Historial completo de relaciones
      const allRelations = await prisma.scoutPlayerReport.findMany({
        include: {
          scout: {
            select: {
              scout_name: true,
              name: true
            }
          },
          player: {
            select: {
              player_name: true,
              position_player: true
            }
          },
          report: {
            select: {
              report_date: true,
              report_type: true,
              roi: true
            }
          }
        }
      })

      console.log(`\n   📈 Total scout-player relations: ${allRelations.length}`)
      allRelations.forEach(rel => {
        const scoutName = rel.scout.scout_name || rel.scout.name
        console.log(`      - ${scoutName} → ${rel.player.player_name} (${rel.report.report_type})`)
      })

    } else {
      console.log('   ⚠️  No scouts or players found. Please seed the database first.')
    }

    console.log('\n✅ Scout-Player Relations test completed successfully!')

  } catch (error) {
    console.error('❌ Error testing scout-player relations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testScoutPlayerRelations()
}

export { testScoutPlayerRelations }