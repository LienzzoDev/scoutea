import { NextRequest, NextResponse } from 'next/server'

import { PlayerStatsService } from '@/lib/services/player-stats-service'
import { isValidPeriod, type StatsPeriod } from '@/lib/utils/stats-period-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '3m'

    const { id: playerId } = await params

    if (!playerId) {
      return NextResponse.json(
        { __error: 'ID de jugador requerido' },
        { status: 400 }
      )
    }

    // Validate period
    if (!isValidPeriod(periodParam)) {
      return NextResponse.json(
        { __error: 'Periodo inválido. Debe ser: 3m, 6m, 1y, o 2y' },
        { status: 400 }
      )
    }

    const period = periodParam as StatsPeriod

    // Get formatted stats for the period
    const stats = await PlayerStatsService.getPlayerStatsFormatted(playerId, period)

    return NextResponse.json({
      success: true,
      data: stats,
      period,
    })

  } catch (error) {
    console.error('Error al obtener estadísticas del jugador:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
