import { NextRequest, NextResponse } from 'next/server'

import { ScoutQualitativeService } from '@/lib/services/scout-qualitative-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scoutId } = await params
    
    const summaryData = await ScoutQualitativeService.getScoutSummaryStats(scoutId)
    
    return NextResponse.json(summaryData)
  } catch (error) {
    console.error('Error fetching scout summary:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen del scout' },
      { status: 500 }
    )
  }
}