/**
 * Debug endpoint for player search functionality
 */

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Debug: Testing player search functionality');
    
    // Test basic database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 });
    }

    // Test basic player count
    let totalPlayers;
    try {
      totalPlayers = await prisma.jugador.count();
      console.log('📊 Total players in database:', totalPlayers);
    } catch (countError) {
      console.error('❌ Count query failed:', countError);
      return NextResponse.json({
        error: 'Count query failed',
        details: countError instanceof Error ? countError.message : 'Unknown count error'
      }, { status: 500 });
    }

    // Test basic search query (first 5 players)
    let players;
    try {
      players = await prisma.jugador.findMany({
        take: 5,
        orderBy: { player_rating: 'desc' },
        select: {
          id_player: true,
          player_name: true,
          position_player: true,
          nationality_1: true,
          team_name: true,
          age: true,
          player_rating: true
        }
      });
      console.log('👥 Sample players found:', players.length);
    } catch (queryError) {
      console.error('❌ Search query failed:', queryError);
      return NextResponse.json({
        error: 'Search query failed',
        details: queryError instanceof Error ? queryError.message : 'Unknown query error'
      }, { status: 500 });
    }

    // Test pagination query
    let paginatedPlayers;
    try {
      paginatedPlayers = await prisma.jugador.findMany({
        skip: 0,
        take: 20,
        orderBy: { player_rating: 'desc' },
        select: {
          id_player: true,
          player_name: true,
          player_rating: true
        }
      });
      console.log('📄 Paginated players found:', paginatedPlayers.length);
    } catch (paginationError) {
      console.error('❌ Pagination query failed:', paginationError);
      return NextResponse.json({
        error: 'Pagination query failed',
        details: paginationError instanceof Error ? paginationError.message : 'Unknown pagination error'
      }, { status: 500 });
    }

    // Test PlayerService method directly
    let serviceResult;
    try {
      const { PlayerService } = await import('@/lib/services/player-service');
      
      serviceResult = await PlayerService.searchPlayers({
        page: 1,
        limit: 5,
        sortBy: 'player_rating',
        sortOrder: 'desc',
        filters: {}
      });
      
      console.log('🔧 PlayerService result:', {
        playersCount: serviceResult.players?.length || 0,
        hasData: !!serviceResult.players,
        hasPagination: !!serviceResult.pagination
      });
    } catch (serviceError) {
      console.error('❌ PlayerService failed:', serviceError);
      serviceResult = {
        error: serviceError instanceof Error ? serviceError.message : 'Unknown service error',
        stack: serviceError instanceof Error ? serviceError.stack : undefined
      };
    }

    return NextResponse.json({
      debug: {
        databaseConnected: true,
        totalPlayers,
        samplePlayers: players,
        paginatedPlayersCount: paginatedPlayers.length,
        playerServiceResult: serviceResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Debug search endpoint error:', error);
    return NextResponse.json({
      error: 'Debug search endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}