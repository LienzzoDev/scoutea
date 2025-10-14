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
    const search = searchParams.get('search') || undefined
    const country_id = searchParams.get('country_id') || undefined
    const tier = searchParams.get('tier') ? parseInt(searchParams.get('tier')!) : undefined
    const confederation = searchParams.get('confederation') || undefined

    const options = {
      page,
      limit,
      search,
      country_id,
      tier,
      confederation
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
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
