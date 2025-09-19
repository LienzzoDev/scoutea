/**
 * Debug endpoint to test PlayerService directly
 */

import { NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'

export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔍 Testing PlayerService.searchPlayers directly...');
    
    // Test the exact same call that the frontend makes
    const searchOptions = {
      page: 1,
      limit: 20,
      sortBy: 'player_rating' as const,
      sortOrder: 'desc' as const,
      _filters: {}
    };
    
    console.log('📋 Search options:', searchOptions);
    
    const result = await PlayerService.searchPlayers(searchOptions);
    
    console.log('✅ PlayerService.searchPlayers completed:', {
      playersCount: result.players?.length || 0,
      _pagination: result.pagination
    });
    
    return NextResponse.json({
      success: true,
      result: {
        playersCount: result.players?.length || 0,
        _pagination: result.pagination,
        firstPlayer: result.players?.[0] ? {
          id: result.players[0].id_player,
          name: result.players[0].player_name,
          rating: result.players[0].player_rating
        } : null,
        samplePlayers: result.players?.slice(0, 3).map(p => ({
          id: p.id_player,
          name: p.player_name,
          rating: p.player_rating
        })) || []
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (_error) {
    console.error('❌ PlayerService test failed:', error);
    
    return NextResponse.json({
      success: false,
      __error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        errorObject: error
      }
    }, { status: 500 });
  }
}