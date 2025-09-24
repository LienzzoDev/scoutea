import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PlayerService } from '@/lib/services/player-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple players API test...')
    
    // Check authentication
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }
    
    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('📊 Parameters:', { page, limit, userId })
    
    // Call service
    const result = await PlayerService.searchPlayers({
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    console.log('✅ Service result:', {
      playersCount: result.players.length,
      pagination: result.pagination
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Simple players API error:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}