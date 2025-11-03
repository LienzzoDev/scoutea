import { NextRequest, NextResponse } from 'next/server'

import { ChartService } from '@/lib/services/chart-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current'
    const category = searchParams.get('category') || undefined

    const { id: playerId } = await params

    if (!playerId) {
      return NextResponse.json(
        { __error: 'ID de jugador requerido' },
        { status: 400 }
      )
    }

    const stats = await ChartService.getPlayerStats(playerId, period, category)

    return NextResponse.json({
      success: true,
      data: stats,
      period,
      category: category || 'all'
    })

  } catch (_error) {
    console.error('Error al obtener estadísticas del jugador:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}








