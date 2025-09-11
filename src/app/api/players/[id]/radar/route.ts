import { NextRequest, NextResponse } from 'next/server'
import { ChartService } from '@/lib/db/chart-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position') || 'CM'
    const period = searchParams.get('period') || 'current'

    const playerId = params.id

    if (!playerId) {
      return NextResponse.json(
        { error: 'ID de jugador requerido' },
        { status: 400 }
      )
    }

    const radarData = await ChartService.getRadarData(playerId, position, period)

    return NextResponse.json({
      success: true,
      data: radarData
    })

  } catch (error) {
    console.error('Error al obtener datos de radar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
