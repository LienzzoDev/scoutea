import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  try {
    // Test getting all players
    const allPlayers = await PlayerService.getAllPlayers()
    
    // Test getting a specific player
    const testPlayer = await PlayerService.getPlayerById('1')
    
    return NextResponse.json({
      message: 'Players API test successful',
      timestamp: new Date().toISOString(),
      url: url.toString(),
      tests: {
        getAllPlayers: {
          success: true,
          count: allPlayers.length,
          players: allPlayers.map(p => ({ id: p.id_player, name: p.player_name }))
        },
        getPlayerById: {
          success: !!testPlayer,
          player: testPlayer ? {
            id: testPlayer.id_player,
            name: testPlayer.player_name,
            team: testPlayer.team_name
          } : null
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Players API test failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}