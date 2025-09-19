import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { RadarCalculationService } from '../../../../../../lib/services/RadarCalculationService';

const prisma = new PrismaClient();

export async function GET(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  const radarService = new RadarCalculationService(prisma);
  
  try {
    const playerId = params.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '2023-24';
    
    // Get filter parameters
    const filters = {
      position: searchParams.get('position') || undefined,
      nationality: searchParams.get('nationality') || undefined,
      competition: searchParams.get('competition') || undefined,
      ageMin: searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined,
      ageMax: searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined,
      ratingMin: searchParams.get('ratingMin') ? parseFloat(searchParams.get('ratingMin')!) : undefined,
      ratingMax: searchParams.get('ratingMax') ? parseFloat(searchParams.get('ratingMax')!) : undefined,
    };

    // Verify player exists
    const player = await prisma.jugador.findUnique({
      where: { id___player: playerId },
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
          __error: 'Player not found',
          _playerId: playerId,
          message: 'The specified player does not exist in the database'
        },
        { status: 404 }
      );
    }

    // Calculate radar data with comparison
    let radarData;
    try {
      radarData = await radarService.calculatePlayerRadarWithComparison(playerId, filters, period);
    } catch (calculationError) {
      console.error('Error calculating radar data with comparison:', calculationError);
      
      if (calculationError instanceof Error && calculationError.message.includes('has no atributos data')) {
        return NextResponse.json(
          { 
            __error: 'No attribute data found for this player',
            _playerId: playerId,
            playerName: player.player_name,
            message: 'Player exists but has no atributos data required for radar calculations'
          },
          { status: 404 }
        );
      }
      
      throw calculationError;
    }

    return NextResponse.json({
      ___player: player,
      _radarData: radarData,
      __filters: filters,
      metadata: {
        _period: period,
        totalCategories: radarData.length,
        calculatedAt: new Date().toISOString(),
        supportedCategories: radarService.getSupportedCategories(),
        categoryLabels: radarService.getCategoryLabels()
      }
    });

  } catch (_error) {
    console.error('Error fetching radar comparison data:', error);
    return NextResponse.json(
      { 
        __error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        _playerId: params.id
      },
      { status: 500 }
    );
  } finally {
    await radarService.disconnect();
  }
}