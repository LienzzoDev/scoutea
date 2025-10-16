import { NextRequest, NextResponse } from 'next/server'

import { ScoutQualitativeService } from '@/lib/services/scout-qualitative-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scoutId = params.id
    const { searchParams } = new URL(request.url)
    
    // Extraer filtros de los query parameters
    const filters = {
      reportType: searchParams.get('reportType') || undefined,
      position: searchParams.get('position') || undefined,
      nationality1: searchParams.get('nationality1') || undefined,
      potential: searchParams.get('potential') || undefined,
      initialAge: searchParams.get('initialAge') || undefined,
      initialTeam: searchParams.get('initialTeam') || undefined,
      initialTeamLevel: searchParams.get('initialTeamLevel') || undefined,
      initialCompetition: searchParams.get('initialCompetition') || undefined,
      initialCompetitionLevel: searchParams.get('initialCompetitionLevel') || undefined,
      initialCountry: searchParams.get('initialCountry') || undefined,
      transferTeamPts: searchParams.get('transferTeamPts') || undefined,
      transferCompetitionPts: searchParams.get('transferCompetitionPts') || undefined,
      initialTRFMValue: searchParams.get('initialTRFMValue') || undefined,
    }

    // Filtrar valores undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )

    const data = await ScoutQualitativeService.getScoutQualitativeData(scoutId, cleanFilters)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching scout qualitative data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos cualitativos del scout' },
      { status: 500 }
    )
  }
}