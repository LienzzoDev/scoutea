import { NextRequest, NextResponse } from 'next/server'

import { ScoutQualitativeService } from '@/lib/services/scout-qualitative-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scoutId = params.id
    
    const options = await ScoutQualitativeService.getFilterOptions(scoutId)
    
    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching scout filter options:', error)
    return NextResponse.json(
      { error: 'Error al obtener opciones de filtros' },
      { status: 500 }
    )
  }
}