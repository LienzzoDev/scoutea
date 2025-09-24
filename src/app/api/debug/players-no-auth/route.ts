import { NextResponse } from 'next/server'
import { PlayerService } from '@/lib/services/player-service'

export async function GET() {
  try {
    console.log('🔍 Testing players API without authentication...')
    
    const result = await PlayerService.searchPlayers({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    console.log('✅ Players retrieved without auth:', {
      count: result.players.length,
      pagination: result.pagination
    })
    
    return NextResponse.json({
      success: true,
      message: 'Players retrieved successfully without authentication',
      data: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error getting players without auth:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error getting players',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}