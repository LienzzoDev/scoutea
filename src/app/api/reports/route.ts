import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ReportService } from '@/lib/services/report-service'

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
    if (searchParams.get('report_status')) {
      filters.report_status = searchParams.get('report_status')
    }
    if (searchParams.get('report_validation')) {
      filters.report_validation = searchParams.get('report_validation')
    }
    if (searchParams.get('report_author')) {
      filters.report_author = searchParams.get('report_author')
    }
    if (searchParams.get('report_type')) {
      filters.report_type = searchParams.get('report_type')
    }
    if (searchParams.get('id_player')) {
      filters.id_player = searchParams.get('id_player')
    }
    if (searchParams.get('player_name')) {
      filters.player_name = searchParams.get('player_name')
    }
    if (searchParams.get('team_name')) {
      filters.team_name = searchParams.get('team_name')
    }
    if (searchParams.get('team_country')) {
      filters.team_country = searchParams.get('team_country')
    }
    if (searchParams.get('competition_country')) {
      filters.competition_country = searchParams.get('competition_country')
    }
    if (searchParams.get('position_player')) {
      filters.position_player = searchParams.get('position_player')
    }
    if (searchParams.get('nationality_1')) {
      filters.nationality_1 = searchParams.get('nationality_1')
    }
    if (searchParams.get('agency')) {
      filters.agency = searchParams.get('agency')
    }
    if (searchParams.get('min_age')) {
      filters.min_age = parseInt(searchParams.get('min_age')!)
    }
    if (searchParams.get('max_age')) {
      filters.max_age = parseInt(searchParams.get('max_age')!)
    }
    if (searchParams.get('min_value')) {
      filters.min_value = parseFloat(searchParams.get('min_value')!)
    }
    if (searchParams.get('max_value')) {
      filters.max_value = parseFloat(searchParams.get('max_value')!)
    }
    if (searchParams.get('min_roi')) {
      filters.min_roi = parseFloat(searchParams.get('min_roi')!)
    }
    if (searchParams.get('max_roi')) {
      filters.max_roi = parseFloat(searchParams.get('max_roi')!)
    }
    if (searchParams.get('min_profit')) {
      filters.min_profit = parseFloat(searchParams.get('min_profit')!)
    }
    if (searchParams.get('max_profit')) {
      filters.max_profit = parseFloat(searchParams.get('max_profit')!)
    }
    if (searchParams.get('on_loan') !== null) {
      filters.on_loan = searchParams.get('on_loan') === 'true'
    }
    if (searchParams.get('date_from')) {
      filters.date_from = new Date(searchParams.get('date_from')!)
    }
    if (searchParams.get('date_to')) {
      filters.date_to = new Date(searchParams.get('date_to')!)
    }

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    }

    const result = await ReportService.searchReports(options)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting reports:', error)
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
    const report = await ReportService.createReport(body)
    
    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
