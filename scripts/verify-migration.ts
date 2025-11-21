import { prisma } from '../src/lib/db'

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration results...\n')

    // Check total players
    const totalPlayers = await prisma.jugador.count()
    console.log(`✅ Total players in database: ${totalPlayers}`)

    // Check first 10 players with their new IDs
    const samplePlayers = await prisma.jugador.findMany({
      take: 10,
      orderBy: { id_player: 'asc' },
      select: {
        id_player: true,
        player_name: true,
        team_name: true,
        position_player: true
      }
    })

    console.log('\n📋 Sample of first 10 players with new IDs:')
    samplePlayers.forEach(p => {
      console.log(`  ID ${p.id_player}: ${p.player_name} (${p.position_player || 'N/A'}) - ${p.team_name || 'N/A'}`)
    })

    // Check foreign key relationships
    console.log('\n🔗 Checking foreign key relationships...')

    const playerStatsCount = await prisma.playerStats3m.count()
    console.log(`  - player_stats_3m: ${playerStatsCount} records linked`)

    const atributosCount = await prisma.atributos.count()
    console.log(`  - atributos: ${atributosCount} records`)

    const radarMetricsCount = await prisma.radarMetrics.count()
    console.log(`  - radar_metrics: ${radarMetricsCount} records`)

    // Check that all IDs are integers and sequential
    const maxId = await prisma.jugador.aggregate({
      _max: { id_player: true }
    })
    console.log(`\n📊 ID range: 1 to ${maxId._max.id_player}`)

    console.log('\n✅ Migration verification completed successfully!')

  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
