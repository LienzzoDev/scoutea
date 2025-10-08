import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting to populate scout reports for player-sample-1...')

  // 1. Verificar que el jugador existe
  const playerId = 'player-sample-1'
  let player = await prisma.jugador.findUnique({
    where: { id_player: playerId }
  })

  if (!player) {
    console.log('⚠️  Player not found, fetching first player from database...')
    player = await prisma.jugador.findFirst({
      orderBy: {
        player_rating: 'desc'
      }
    })

    if (!player) {
      console.error('❌ No players found in database!')
      return
    }
    console.log(`✅ Using player: ${player.player_name} (${player.id_player})`)
  } else {
    console.log(`✅ Found player: ${player.player_name}`)
  }

  // 2. Obtener scouts con alto ELO
  const scouts = await prisma.scout.findMany({
    take: 5,
    where: {
      scout_elo: {
        not: null
      }
    },
    orderBy: {
      scout_elo: 'desc'
    }
  })

  if (scouts.length === 0) {
    console.error('❌ No scouts found in database!')
    return
  }

  console.log(`📊 Found ${scouts.length} scouts to create reports from`)

  // 3. Tipos de reportes y descripciones
  const reportConfigs = [
    {
      type: 'Scouting',
      description: 'Exceptional player with great technical ability. Shows excellent vision and passing range. Recommended for immediate signing. Has the potential to become a key player in the squad.'
    },
    {
      type: 'Technical',
      description: 'Outstanding technical skills with excellent ball control and dribbling ability. First touch is exceptional and can beat defenders in tight spaces. Needs to improve weaker foot.'
    },
    {
      type: 'Physical',
      description: 'Strong physical presence with good pace and stamina. Athletic build allows domination in aerial duels. Good recovery speed but could improve sprint endurance.'
    },
    {
      type: 'Tactical',
      description: 'Tactically intelligent player with excellent positioning. Understands team shape well and makes smart runs. Leadership qualities evident on the pitch. Can read the game excellently.'
    },
    {
      type: 'Mental',
      description: 'Strong mental attributes with good composure under pressure. Shows maturity beyond years and handles high-pressure situations well. Good decision making in critical moments.'
    }
  ]

  // 4. Crear reportes
  const reportsCreated = []

  for (let i = 0; i < Math.min(scouts.length, 5); i++) {
    const scout = scouts[i]
    const config = reportConfigs[i]

    // Generar valores aleatorios para las métricas
    const potential = 65 + Math.random() * 35 // 65-100
    const roi = 8 + Math.random() * 12 // 8-20
    const profit = 2 + Math.random() * 8 // 2-10M

    // Fecha aleatoria en los últimos 120 días
    const daysAgo = Math.floor(Math.random() * 120)
    const reportDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    const report = await prisma.reporte.create({
      data: {
        scout: {
          connect: {
            id_scout: scout.id_scout
          }
        },
        player: {
          connect: {
            id_player: player.id_player
          }
        },
        player_name: player.player_name,
        report_date: reportDate,
        report_type: config.type,
        report_status: 'completed',
        form_text_report: config.description,

        // Player info
        position_player: player.position_player,
        nationality_1: player.nationality_1,
        team_name: player.team_name,
        date_of_birth: player.date_of_birth,

        // Metrics
        form_potential: `${potential.toFixed(1)}%`,
        roi: roi,
        profit: profit,

        // URLs (50% tendrán videos)
        form_url_video: i % 2 === 0 ? `https://youtube.com/watch?v=example_${player.id_player}_${i}` : null,
        form_url_report: `https://scoutea.com/reports/${scout.id_scout}/${player.id_player}`,
      }
    })

    reportsCreated.push(report)
    console.log(`✅ Created ${config.type} report from ${scout.name || scout.scout_name} (ELO: ${scout.scout_elo})`)
    console.log(`   - Potential: ${potential.toFixed(1)}% | ROI: ${roi.toFixed(1)}% | Profit: €${profit.toFixed(2)}M`)
  }

  console.log(`\n🎉 Successfully created ${reportsCreated.length} reports!`)
  console.log(`\n📍 View at: http://localhost:3000/member/player/${player.id_player}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
