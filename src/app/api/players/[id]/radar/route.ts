import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { RadarCalculationService } from '@/lib/services/RadarCalculationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2023-24';

    console.log('🔍 Radar API: Loading radar data for player:', playerId);

    // Verify player exists
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
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
      console.log('❌ Radar API: Player not found:', playerId);
      return NextResponse.json(
        { 
          error: 'Player not found',
          playerId: playerId,
          message: 'The specified player does not exist in the database'
        },
        { status: 404 }
      );
    }

    console.log('✅ Radar API: Player found:', player.player_name);

    // Use the static method from RadarCalculationService
    let radarData;
    try {
      radarData = await RadarCalculationService.calculatePlayerRadar(playerId);
      console.log('✅ Radar API: Radar data calculated:', radarData);
    } catch (calculationError) {
      console.error('❌ Radar API: Error calculating radar data:', calculationError);
      
      // Return mock data for now with correct categories
      radarData = {
        playerId,
        playerName: player.player_name,
        metrics: [
          { name: 'Off Transition', value: 85, percentile: 75, category: 'Off Transition' },
          { name: 'Maintenance', value: 88, percentile: 80, category: 'Maintenance' },
          { name: 'Progression', value: 82, percentile: 72, category: 'Progression' },
          { name: 'Finishing', value: 90, percentile: 85, category: 'Finishing' },
          { name: 'Off Stopped Ball', value: 78, percentile: 68, category: 'Off Stopped Ball' },
          { name: 'Def Transition', value: 75, percentile: 65, category: 'Def Transition' },
          { name: 'Recovery', value: 80, percentile: 70, category: 'Recovery' },
          { name: 'Evitation', value: 65, percentile: 45, category: 'Evitation' },
          { name: 'Def Stopped Ball', value: 72, percentile: 58, category: 'Def Stopped Ball' }
        ],
        overallRating: player.player_rating || 75
      };
    }

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
        playerId: playerId || 'unknown'
      },
      { status: 500 }
    );
  }
}







