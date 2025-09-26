import { NextResponse } from 'next/server'
import { PlayerService } from '@/lib/services/player-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerName = searchParams.get('filters[player_name]') || searchParams.get('search') || ''
    
    console.log('🧪 Simple players search for:', playerName)
    
    if (!playerName.trim()) {
      return NextResponse.json({
        players: [],
        pagination: {
          page: 1,
          limit: 5,
          total: 0,
          totalPages: 0
        }
      })
    }
    
    // Usar directamente el PlayerService sin validaciones complejas
    const result = await PlayerService.searchPlayers({
      page: 1,
      limit: 5,
      filters: {
        player_name: playerName
      }
    })
    
    console.log('✅ Simple players search completed:', {
      searchTerm: playerName,
      playersFound: result.players.length
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in simple players search:', error)
    return NextResponse.json(
      { 
        error: 'Error searching players',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}