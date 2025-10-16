import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'

export async function GET() {
  try {
    console.log('🔍 Testing players API with authentication...')
    
    // Step 1: Check authentication
    const authResult = await auth()
    console.log('✅ Auth check:', {
      userId: authResult.userId,
      sessionId: authResult.sessionId
    })
    
    if (!authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        step: 'authentication'
      }, { status: 401 })
    }
    
    // Step 2: Test PlayerService directly
    console.log('🔍 Testing PlayerService.searchPlayers...')
    const result = await PlayerService.searchPlayers({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    console.log('✅ PlayerService result:', {
      playersCount: result.players.length,
      pagination: result.pagination
    })
    
    return NextResponse.json({
      success: true,
      message: 'Players retrieved successfully with authentication',
      data: {
        playersCount: result.players.length,
        pagination: result.pagination,
        samplePlayers: result.players.slice(0, 3).map(p => ({
          id: p.id,
          name: p.player_name,
          team: p.team_name
        }))
      },
      auth: {
        userId: authResult.userId,
        authenticated: true
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in players-with-auth test:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error testing players with auth',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}