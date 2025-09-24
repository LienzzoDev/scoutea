import { NextResponse } from 'next/server'
import { PlayerService } from '@/lib/services/player-service'

export async function GET() {
  try {
    console.log('🔍 Testing dashboard data flow...')
    
    // Test 1: Direct PlayerService call
    console.log('📊 Test 1: Direct PlayerService.getAllPlayers()')
    const allPlayers = await PlayerService.getAllPlayers()
    console.log('✅ getAllPlayers result:', {
      count: allPlayers.length,
      players: allPlayers.map(p => ({ id: p.id, name: p.player_name }))
    })
    
    // Test 2: PlayerService.searchPlayers (what the dashboard uses)
    console.log('📊 Test 2: PlayerService.searchPlayers() - dashboard method')
    const searchResult = await PlayerService.searchPlayers({
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    console.log('✅ searchPlayers result:', {
      playersCount: searchResult.players.length,
      pagination: searchResult.pagination,
      players: searchResult.players.map(p => ({ id: p.id, name: p.player_name }))
    })
    
    // Test 3: PlayerService.getPlayerStats()
    console.log('📊 Test 3: PlayerService.getPlayerStats()')
    const stats = await PlayerService.getPlayerStats()
    console.log('✅ getPlayerStats result:', stats)
    
    return NextResponse.json({
      success: true,
      tests: {
        getAllPlayers: {
          count: allPlayers.length,
          players: allPlayers.map(p => ({ 
            id: p.id, 
            name: p.player_name,
            team: p.team_name,
            rating: p.player_rating 
          }))
        },
        searchPlayers: {
          count: searchResult.players.length,
          pagination: searchResult.pagination,
          players: searchResult.players.map(p => ({ 
            id: p.id, 
            name: p.player_name,
            team: p.team_name,
            rating: p.player_rating 
          }))
        },
        getPlayerStats: stats
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error testing dashboard data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error testing dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}