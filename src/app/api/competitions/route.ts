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

    // Support both old (page-based) and new (cursor-based) pagination
    // const page = searchParams.get('page') // Unused
    const cursor = searchParams.get('cursor') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const country = searchParams.get('country') || undefined
    const country_id = searchParams.get('country_id') || undefined
    const tierParam = searchParams.get('tier')
    const tier = tierParam ? parseInt(tierParam) : undefined
    const confederation = searchParams.get('confederation') || undefined

    // If page is provided, we're using old pagination - convert to cursor
    // For now, just use cursor-based and ignore page
    const options = {
      ...(cursor && { cursor }), // Use conditional spread to avoid exactOptionalPropertyTypes issue with undefined
      limit,
      ...(search && { search }),
      ...(country || country_id ? { country: country || country_id } : {}),
      ...(confederation && { confederation }),
      ...(tier !== undefined && { tier })
    }

    console.log('🔍 API: Calling searchCompetitions with options:', options)
    const result = await CompetitionService.searchCompetitions(options)
    console.log('✅ API: Got result with', result.competitions?.length || 0, 'competitions')

    // Add totalPages for backward compatibility
    const response = {
      competitions: result.competitions || [],
      total: result.total || 0,
      hasMore: result.hasMore || false,
      nextCursor: result.nextCursor || null,
      totalPages: result.total ? Math.ceil(result.total / limit) : 1,
      page: 1,
      pagination: result.pagination
    };

    console.log('📤 API: Sending response')
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting competitions:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
