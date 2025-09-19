import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RadarCalculationService } from '../../../../../lib/services/RadarCalculationService';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const radarService = new RadarCalculationService(prisma);
  
  try {
    const playerId = params.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2023-24';

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
      return NextResponse.json(
        { 
          error: 'Player not found',
          playerId: playerId,
          message: 'The specified player does not exist in the database'
        },
        { status: 404 }
      );
    }

    // Calculate radar data using the new service
    let radarData;
    try {
      radarData = await radarService.calculatePlayerRadar(playerId, period);
    } catch (calculationError) {
      console.error('Error calculating radar data:', calculationError);
      
      // Check if it's a missing data error
      if (calculationError instanceof Error && calculationError.message.includes('has no atributos data')) {
        return NextResponse.json(
          { 
            error: 'No attribute data found for this player',
            playerId: playerId,
            playerName: player.player_name,
            message: 'Player exists but has no atributos data required for radar calculations'
          },
          { status: 404 }
        );
      }
      
      throw calculationError;
    }

    // Format response with the 9 categories
    const formattedRadarData = radarData.map(data => ({
      category: data.category,
      playerValue: data.playerValue,
      dataCompleteness: data.dataCompleteness,
      sourceAttributes: data.sourceAttributes,
      // Initialize comparison fields (will be populated by comparison endpoint)
      comparisonAverage: null,
      percentile: null,
      rank: null,
      totalPlayers: null,
      maxValue: null,
      minValue: null
    }));

    return NextResponse.json({
      player: player,
      radarData: formattedRadarData,
      metadata: {
        period: period,
        totalCategories: radarData.length,
        calculatedAt: new Date().toISOString(),
        supportedCategories: radarService.getSupportedCategories(),
        categoryLabels: radarService.getCategoryLabels()
      }
    });

  } catch (error) {
    console.error('Error fetching radar data:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        playerId: params.id
      },
      { status: 500 }
    );
  } finally {
    await radarService.disconnect();
  }
}