import { NextRequest, NextResponse } from 'next/server'

import { ChartService } from '@/lib/services/chart-service'
import { ChartFilters } from '@/types/charts'

export async function GET(__request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const metric = searchParams.get('metric')
    const selectedPlayerId = searchParams.get('selectedPlayerId') || undefined

    if (!metric) {
      return NextResponse.json(
        { __error: 'Métrica requerida' },
        { status: 400 }
      )
    }

    // Construir filtros desde query parameters
    const _filters: ChartFilters = {
      period: searchParams.get('period') || undefined,
      position: searchParams.get('position') || undefined,
      age: searchParams.get('age') || undefined,
      nationality: searchParams.get('nationality') || undefined,
      competition: searchParams.get('competition') || undefined,
      trfmValue: searchParams.get('trfmValue') || undefined
    }

    const beeswarmData = await ChartService.getBeeswarmData(
      metric, 
      filters, 
      selectedPlayerId
    )

    return NextResponse.json({
      success: true,
      data: beeswarmData
    })

  } catch (_error) {
    console.error('Error al obtener datos de enjambre:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
