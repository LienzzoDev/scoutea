import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { scoutId } = await request.json()

    if (!scoutId) {
      return NextResponse.json({ error: 'Scout ID requerido' }, { status: 400 })
    }

    console.log('🔄 Populating data for scout:', scoutId)

    // Verificar que el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Obtener algunos jugadores de la base de datos para crear reportes
    const players = await prisma.jugador.findMany({
      take: 10,
      orderBy: {
        player_rating: 'desc'
      }
    })

    if (players.length === 0) {
      return NextResponse.json({ error: 'No hay jugadores en la base de datos' }, { status: 400 })
    }

    console.log(`📊 Found ${players.length} players to create reports for`)

    // Crear reportes para cada jugador
    const reportsCreated = []
    const reportTypes = ['Scouting', 'Technical', 'Physical', 'Tactical', 'Mental']

    for (let i = 0; i < Math.min(players.length, 8); i++) {
      const player = players[i]
      const reportType = reportTypes[i % reportTypes.length]

      // Generar valores aleatorios para las métricas
      const potential = 60 + Math.random() * 40 // 60-100
      const roi = 5 + Math.random() * 15 // 5-20
      const profit = 1 + Math.random() * 9 // 1-10M

      const report = await prisma.reporte.create({
        data: {
          scout_id: scoutId,
          id_player: player.id_player,
          player_name: player.player_name,
          report_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
          report_type: reportType,
          report_status: 'completed',
          form_text_report: `${reportType} report for ${player.player_name}. Excellent player with great potential. Shows strong technical abilities and good decision making. Recommended for further evaluation.`,

          // Player info
          position_player: player.position_player,
          nationality_1: player.nationality_1,
          team_name: player.team_name,
          date_of_birth: player.date_of_birth,

          // Metrics
          potential: potential,
          roi: roi,
          profit: profit,

          // URLs (some reports will have videos)
          form_url_video: i % 3 === 0 ? `https://youtube.com/watch?v=example${i}` : null,
          form_url_report: `https://scoutea.com/reports/${scoutId}/${player.id_player}`,
        }
      })

      reportsCreated.push(report)
      console.log(`✅ Created report for ${player.player_name}`)
    }

    console.log(`🎉 Successfully created ${reportsCreated.length} reports for scout ${scoutId}`)

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${reportsCreated.length} reports`,
      data: {
        scoutId: scoutId,
        scoutName: scout.name || scout.scout_name,
        reportsCreated: reportsCreated.length,
        reports: reportsCreated.map(r => ({
          id_report: r.id_report,
          player_name: r.player_name,
          report_type: r.report_type,
          report_date: r.report_date
        }))
      }
    })
  } catch (error) {
    console.error('❌ Error populating scout data:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
