/**
 * Simple database connection test
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test simple query
    const playerCount = await prisma.jugador.count();
    console.log('📊 Total players in database:', playerCount);
    
    // Test finding a specific player (get first one)
    const firstPlayer = await prisma.jugador.findFirst({
      select: {
        id___player: true,
        player_name: true
      }
    });
    console.log('👤 First player found:', firstPlayer);
    
    // Test the specific problematic ID
    const problematicId = 'cmfnrkrmq0000zwoo8yafzumb';
    const specificPlayer = await prisma.jugador.findUnique({
      where: { id___player: problematicId },
      select: {
        id_player: true,
        player_name: true,
        position_player: true
      }
    });
    console.log('🎯 Specific player search result:', specificPlayer);
    
    return NextResponse.json({
      success: true,
      results: {
        connected: true,
        totalPlayers: playerCount,
        firstPlayer,
        specificPlayerFound: !!specificPlayer,
        specificPlayer,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (_error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      __error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}