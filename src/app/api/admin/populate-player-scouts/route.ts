import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { generateReportId } from '@/lib/utils/id-generator'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID requerido' }, { status: 400 })
    }

    console.log('🔄 Populating scout reports for player:', playerId)

    // Verificar que el jugador existe
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Obtener algunos scouts de la base de datos
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
      return NextResponse.json({ error: 'No hay scouts en la base de datos' }, { status: 400 })
    }

    console.log(`📊 Found ${scouts.length} scouts to create reports from`)

    // Crear reportes de diferentes scouts para este jugador
    const reportsCreated = []
    const reportTypes = ['Scouting', 'Technical', 'Physical', 'Tactical', 'Mental']
    const descriptions = [
      'Exceptional player with great technical ability. Shows excellent vision and passing range. Recommended for immediate signing.',
      'Strong physical presence with good pace and stamina. Needs improvement in tactical awareness but has high potential.',
      'Tactically intelligent player with good positioning. Can play multiple roles. Good leadership qualities.',
      'Technically gifted with excellent ball control. Creative playmaker with good decision making under pressure.',
      'Solid defensive abilities with good reading of the game. Reliable and consistent performer.'
    ]

    for (let i = 0; i < scouts.length; i++) {
      const scout = scouts[i]
      const reportType = reportTypes[i % reportTypes.length]
      const description = descriptions[i % descriptions.length]

      // Generar valores aleatorios para las métricas
      const potential = 65 + Math.random() * 35 // 65-100
      const roi = 8 + Math.random() * 12 // 8-20
      const profit = 2 + Math.random() * 8 // 2-10M

      // Generar ID secuencial
      const reportId = await generateReportId();

      const report = await prisma.reporte.create({
        data: {
          id_report: reportId, // ✅ REP-YYYY-NNNNN formato
          scout_id: scout.id_scout,
          id_player: player.id_player,
          report_date: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000), // Random date in last 120 days
          report_type: reportType,
          report_status: 'completed',
          form_text_report: description,

          // Snapshot histórico (captura estado inicial del jugador)
          initial_age: player.age,
          initial_player_trfm_value: player.player_trfm_value,
          initial_team: player.team_name,

          // Metrics
          potential: potential,
          roi: roi,
          profit: profit,

          // URLs (some reports will have videos)
          form_url_video: i % 2 === 0 ? `https://youtube.com/watch?v=example${i}` : null,
          form_url_report: `https://scoutea.com/reports/${scout.id_scout}/${player.id_player}`,
        }
      })

      reportsCreated.push({
        id_report: report.id_report,
        scout_name: scout.name || scout.scout_name,
        scout_elo: scout.scout_elo,
        report_type: report.report_type,
        report_date: report.report_date,
        potential: report.potential,
        roi: report.roi
      })

      console.log(`✅ Created ${reportType} report from ${scout.name || scout.scout_name}`)
    }

    console.log(`🎉 Successfully created ${reportsCreated.length} reports for player ${player.player_name}`)

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${reportsCreated.length} scout reports`,
      data: {
        playerId: player.id_player,
        playerName: player.player_name,
        reportsCreated: reportsCreated.length,
        reports: reportsCreated
      }
    })
  } catch (error) {
    console.error('❌ Error populating player scout data:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
