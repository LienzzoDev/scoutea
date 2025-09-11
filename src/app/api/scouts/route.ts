import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ScoutService } from '@/lib/db/scout-service'

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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    
    // Filtros
    const filters: any = {}
    
    // Búsqueda general (para la navbar)
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      filters.search = searchQuery
    }
    
    if (searchParams.get('scout_name')) {
      filters.scout_name = searchParams.get('scout_name')
    }
    if (searchParams.get('name')) {
      filters.name = searchParams.get('name')
    }
    if (searchParams.get('surname')) {
      filters.surname = searchParams.get('surname')
    }
    if (searchParams.get('nationality')) {
      filters.nationality = searchParams.get('nationality')
    }
    if (searchParams.get('email')) {
      filters.email = searchParams.get('email')
    }
    if (searchParams.get('country')) {
      filters.country = searchParams.get('country')
    }
    if (searchParams.get('favourite_club')) {
      filters.favourite_club = searchParams.get('favourite_club')
    }
    if (searchParams.get('open_to_work') !== null) {
      filters.open_to_work = searchParams.get('open_to_work') === 'true'
    }
    if (searchParams.get('nationality_expertise')) {
      filters.nationality_expertise = searchParams.get('nationality_expertise')
    }
    if (searchParams.get('competition_expertise')) {
      filters.competition_expertise = searchParams.get('competition_expertise')
    }
    if (searchParams.get('scout_level')) {
      filters.scout_level = searchParams.get('scout_level')
    }
    if (searchParams.get('min_age')) {
      filters.min_age = parseInt(searchParams.get('min_age')!)
    }
    if (searchParams.get('max_age')) {
      filters.max_age = parseInt(searchParams.get('max_age')!)
    }
    if (searchParams.get('min_total_reports')) {
      filters.min_total_reports = parseInt(searchParams.get('min_total_reports')!)
    }
    if (searchParams.get('max_total_reports')) {
      filters.max_total_reports = parseInt(searchParams.get('max_total_reports')!)
    }
    if (searchParams.get('min_original_reports')) {
      filters.min_original_reports = parseInt(searchParams.get('min_original_reports')!)
    }
    if (searchParams.get('max_original_reports')) {
      filters.max_original_reports = parseInt(searchParams.get('max_original_reports')!)
    }
    if (searchParams.get('min_roi')) {
      filters.min_roi = parseFloat(searchParams.get('min_roi')!)
    }
    if (searchParams.get('max_roi')) {
      filters.max_roi = parseFloat(searchParams.get('max_roi')!)
    }
    if (searchParams.get('min_net_profits')) {
      filters.min_net_profits = parseFloat(searchParams.get('min_net_profits')!)
    }
    if (searchParams.get('max_net_profits')) {
      filters.max_net_profits = parseFloat(searchParams.get('max_net_profits')!)
    }
    if (searchParams.get('min_scout_elo')) {
      filters.min_scout_elo = parseFloat(searchParams.get('min_scout_elo')!)
    }
    if (searchParams.get('max_scout_elo')) {
      filters.max_scout_elo = parseFloat(searchParams.get('max_scout_elo')!)
    }
    if (searchParams.get('min_ranking')) {
      filters.min_ranking = parseInt(searchParams.get('min_ranking')!)
    }
    if (searchParams.get('max_ranking')) {
      filters.max_ranking = parseInt(searchParams.get('max_ranking')!)
    }
    if (searchParams.get('join_date_from')) {
      filters.join_date_from = new Date(searchParams.get('join_date_from')!)
    }
    if (searchParams.get('join_date_to')) {
      filters.join_date_to = new Date(searchParams.get('join_date_to')!)
    }

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    }

    const result = await ScoutService.searchScouts(options)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting scouts:', error)
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
    const scout = await ScoutService.createScout(body)
    
    return NextResponse.json(scout, { status: 201 })
  } catch (error) {
    console.error('Error creating scout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
