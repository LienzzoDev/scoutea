import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PlayerService } from '@/lib/services/player-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple players API called...')
    
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    console.log('📋 Simple API params:', { page, limit, sortBy, sortOrder })
    
    // Call PlayerService
    const result = await PlayerService.searchPlayers({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {} // No filters for now
    })
    
    console.log('✅ Simple API result:', {
      playersCount: result.players.length,
      pagination: result.pagination
    })
    
    return NextResponse.json({
      players: result.players,
      pagination: result.pagination
    })
    
  } catch (error) {
    console.error('❌ Simple players API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}