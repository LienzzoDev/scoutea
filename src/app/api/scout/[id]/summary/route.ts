import { NextRequest, NextResponse } from 'next/server'
import { ScoutQualitativeService } from '@/lib/services/scout-qualitative-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scoutId = params.id
    
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