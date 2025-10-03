import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { ScoutPlayerService } from '@/lib/services/scout-player-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { playerId } = params

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID requerido' }, { status: 400 })
    }

    const reports = await ScoutPlayerService.getPlayerReports(playerId)

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Obtener información del jugador del primer reporte
    const playerInfo = reports[0].player

    return NextResponse.json({
      success: true,
      data: {
        player: playerInfo,
        reports: reports.map(r => ({
          id_report: r.id_report,
          report_date: r.report_date,
          report_type: r.report_type,
          roi: r.roi,
          profit: r.profit,
          potential: r.potential,
          scout: r.scout,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching player details:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}