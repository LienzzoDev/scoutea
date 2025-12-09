import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { RadarCalculationService } from '@/lib/services/RadarCalculationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerIdParam } = await params;
  const playerIdNum = parseInt(playerIdParam, 10);

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2023-24';
    const type = (searchParams.get('type') as 'general' | 'attacking' | 'defending' | 'goalkeeping') || 'general';

    console.log('🔍 Radar API: Loading radar data for player:', playerIdNum);

    // Validate player ID is a valid number
    if (isNaN(playerIdNum)) {
      return NextResponse.json(
        {
          error: 'Invalid player ID',
          playerId: playerIdParam,
          message: 'Player ID must be a valid number'
        },
        { status: 400 }
      );
    }

    // Verify player exists
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerIdNum },
      select: {
        player_name: true,
        position_player: true,
        age: true,
        nationality_1: true,
        team_name: true,
        player_rating: true
      }
    });

    if (!player) {
      console.log('❌ Radar API: Player not found:', playerIdNum);
      return NextResponse.json(
        {
          error: 'Player not found',
          playerId: playerIdNum,
          message: 'The specified player does not exist in the database'
        },
        { status: 404 }
      );
    }

    console.log('✅ Radar API: Player found:', player.player_name);

    // Use the static method from RadarCalculationService
    const radarData = await RadarCalculationService.calculatePlayerRadar(playerIdParam, type);
    console.log('✅ Radar API: Radar data calculated:', radarData);

    // Format response for the frontend
    const formattedRadarData = radarData.metrics.map(metric => ({
      category: metric.category,
      playerValue: metric.value,
      percentile: metric.percentile,
      // Initialize comparison fields (will be populated by comparison endpoint)
      comparisonAverage: null,
      rank: null,
      totalPlayers: null,
      maxValue: 100,
      minValue: 0
    }));

    console.log('✅ Radar API: Returning formatted data:', formattedRadarData);

    return NextResponse.json({
      player: player,
      radarData: formattedRadarData,
      metadata: {
        period: period,
        totalCategories: formattedRadarData.length,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Radar API: Error fetching radar data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        playerId: playerIdParam
      },
      { status: 500 }
    );
  }
}







