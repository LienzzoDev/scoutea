import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { CompetitionService } from '@/lib/services/competition-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parámetros de búsqueda
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'competition_name'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    
    // Filtros
    const filters: any = {}
    if (searchParams.get('competition_name')) {
      filters.competition_name = searchParams.get('competition_name')
    }
    if (searchParams.get('competition_country')) {
      filters.competition_country = searchParams.get('competition_country')
    }
    if (searchParams.get('competition_confederation')) {
      filters.competition_confederation = searchParams.get('competition_confederation')
    }
    if (searchParams.get('competition_tier')) {
      filters.competition_tier = searchParams.get('competition_tier')
    }
    if (searchParams.get('competition_level')) {
      filters.competition_level = searchParams.get('competition_level')
    }
    if (searchParams.get('min_rating')) {
      filters.min_rating = parseFloat(searchParams.get('min_rating')!)
    }
    if (searchParams.get('max_rating')) {
      filters.max_rating = parseFloat(searchParams.get('max_rating')!)
    }
    if (searchParams.get('min_value')) {
      filters.min_value = parseFloat(searchParams.get('min_value')!)
    }
    if (searchParams.get('max_value')) {
      filters.max_value = parseFloat(searchParams.get('max_value')!)
    }

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    }

    const result = await CompetitionService.searchCompetitions(options)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting competitions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const competition = await CompetitionService.createCompetition(body)
    
    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
