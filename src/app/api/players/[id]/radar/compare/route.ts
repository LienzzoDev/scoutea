import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RadarCalculationService, RadarFilters } from '../../../../../../lib/services/RadarCalculationService';

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

    // Parse filters from query parameters
    const filters: RadarFilters = {};
    
    if (searchParams.get('position')) {
      filters.position = searchParams.get('position')!;
    }
    
    if (searchParams.get('nationality')) {
      filters.nationality = searchParams.get('nationality')!;
    }
    
    if (searchParams.get('competition')) {
      filters.competition = searchParams.get('competition')!;
    }
    
    if (searchParams.get('ageMin')) {
      filters.ageMin = parseInt(searchParams.get('ageMin')!);
    }
    
    if (searchParams.get('ageMax')) {
      filters.ageMax = parseInt(searchParams.get('ageMax')!);
    }
    
    if (searchParams.get('ratingMin')) {
      filters.ratingMin = parseFloat(searchParams.get('ratingMin')!);
    }
    
    if (searchParams.get('ratingMax')) {
      filters.ratingMax = parseFloat(searchParams.get('ratingMax')!);
    }

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

    // Calculate radar data with comparison using the new service
    let comparisonData;
    try {
      comparisonData = await radarService.calculatePlayerRadarWithComparison(
        playerId,
        filters,
        period
      );
    } catch (calculationError) {
      console.error('Error calculating radar comparison:', calculationError);
      
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

    // Get comparison group statistics
    let groupStats = {
      totalPlayers: 0,
      averageAge: 0,
      averageRating: 0,
      positions: [] as string[],
      nationalities: [] as string[]
    };

    try {
      const comparisonGroup = await radarService.getComparisonGroup(filters);
      
      if (comparisonGroup.length > 0) {
        // Get detailed stats for the comparison group
        const comparisonPlayers = await prisma.jugador.findMany({
          where: {
            id_player: { in: comparisonGroup }
          },
          select: {
            age: true,
            player_rating: true,
            position_player: true,
            nationality_1: true
          }
        });

        groupStats = {
          totalPlayers: comparisonPlayers.length,
          averageAge: comparisonPlayers.length > 0 
            ? Math.round(comparisonPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / comparisonPlayers.length)
            : 0,
          averageRating: comparisonPlayers.length > 0
            ? Math.round((comparisonPlayers.reduce((sum, p) => sum + (p.player_rating || 0), 0) / comparisonPlayers.length) * 10) / 10
            : 0,
          positions: Array.from(new Set(comparisonPlayers.map(p => p.position_player).filter(Boolean))),
          nationalities: Array.from(new Set(comparisonPlayers.map(p => p.nationality_1).filter(Boolean)))
        };
      }
    } catch (groupError) {
      console.warn('Error calculating group statistics:', groupError);
      // Continue with default group stats
    }

    // Format the response data
    const formattedComparisonData = comparisonData.map(data => ({
      category: data.category,
      playerValue: data.playerValue,
      comparisonAverage: data.comparisonAverage || 0,
      percentile: data.percentile || 0,
      rank: data.rank || 0,
      totalPlayers: data.totalPlayers || 0,
      maxValue: data.maxValue || data.playerValue,
      minValue: data.minValue || data.playerValue,
      dataCompleteness: data.dataCompleteness,
      sourceAttributes: data.sourceAttributes
    }));

    return NextResponse.json({
      player: {
        id: playerId,
        name: player.player_name,
        position: player.position_player,
        age: player.age,
        nationality: player.nationality_1,
        team: player.team_name,
        rating: player.player_rating
      },
      comparisonData: formattedComparisonData,
      groupStats,
      filters,
      metadata: {
        period,
        generatedAt: new Date().toISOString(),
        supportedCategories: radarService.getSupportedCategories(),
        categoryLabels: radarService.getCategoryLabels(),
        filtersApplied: Object.keys(filters).length > 0,
        comparisonType: Object.keys(filters).length === 0 ? 'all_players' : 'filtered_group'
      }
    });

  } catch (error) {
    console.error('Error in radar comparison:', error);
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