import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Count total players
    const totalPlayers = await prisma.jugador.count();
    
    // Get first 5 players to see what data we have
    const samplePlayers = await prisma.jugador.findMany({
      take: 5,
      select: {
        id_player: true,
        player_name: true,
        team_name: true,
        position_player: true,
        nationality_1: true,
        player_rating: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      totalPlayers,
      samplePlayers,
      message: `Found ${totalPlayers} players in the database`
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalPlayers: 0,
      samplePlayers: []
    }, { status: 500 });
  }
}