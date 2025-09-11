import { NextRequest, NextResponse } from 'next/server'
import { ChartService } from '@/lib/db/chart-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current'
    const position = searchParams.get('position') || undefined

    const playerId = params.id

    if (!playerId) {
      return NextResponse.json(
        { error: 'ID de jugador requerido' },
        { status: 400 }
      )
    }

    const lollipopData = await ChartService.getLollipopData(playerId, period, position)

    return NextResponse.json({
      success: true,
      data: lollipopData
    })

  } catch (error) {
    console.error('Error al obtener datos de paleta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
