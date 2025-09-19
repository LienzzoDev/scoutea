/**
 * Direct player query bypassing all services and cache
 */

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const playerId = params.id;
    console.log('🔍 Direct query for player ID:', playerId);
    
    // Direct database query without any services or cache
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId }
    });
    
    console.log('📊 Direct query result:', {
      found: !!player,
      playerId: playerId,
      playerName: player?.player_name || 'Not found'
    });
    
    if (!player) {
      return NextResponse.json({
        error: 'Player not found',
        searchedId: playerId
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      player: {
        id_player: player.id_player,
        player_name: player.player_name,
        position_player: player.position_player,
        nationality_1: player.nationality_1,
        team_name: player.team_name,
        age: player.age,
        player_rating: player.player_rating
      }
    });
    
  } catch (error) {
    console.error('❌ Direct query failed:', error);
    
    return NextResponse.json({
      error: 'Direct query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}