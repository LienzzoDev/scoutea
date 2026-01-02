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

    console.log('🔍 Radar Compare API: Loading comparison data for player:', playerIdNum);

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
    console.log('🔍 Radar Compare API: Filters:', Object.fromEntries(searchParams.entries()));

    // Parse filters from query parameters
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
      console.log('❌ Radar Compare API: Player not found:', playerIdNum);
      return NextResponse.json(
        {
          error: 'Player not found',
          playerId: playerIdNum,
          message: 'The specified player does not exist in the database'
        },
        { status: 404 }
      );
    }

    console.log('✅ Radar Compare API: Player found:', player.player_name);

    // Get base radar data for the player
    const baseRadarData = await RadarCalculationService.calculatePlayerRadar(playerIdParam);
    console.log('✅ Radar Compare API: Base radar data:', baseRadarData);

    // Build comparison group query
    const whereConditions: any = {};
    
    if (filters.position) {
      whereConditions.position_player = filters.position;
    }
    
    if (filters.nationality) {
      whereConditions.nationality_1 = filters.nationality;
    }
    
    if (filters.competition) {
      whereConditions.team_country = filters.competition;
    }
    
    if (filters.ageMin || filters.ageMax) {
      whereConditions.age = {};
      if (filters.ageMin) whereConditions.age.gte = filters.ageMin;
      if (filters.ageMax) whereConditions.age.lte = filters.ageMax;
    }
    
    if (filters.ratingMin || filters.ratingMax) {
      whereConditions.player_rating = {};
      if (filters.ratingMin) whereConditions.player_rating.gte = filters.ratingMin;
      if (filters.ratingMax) whereConditions.player_rating.lte = filters.ratingMax;
    }

    // Get comparison group
    const comparisonPlayers = await prisma.jugador.findMany({
      where: whereConditions,
      select: {
        id_player: true,
        player_name: true,
        age: true,
        player_rating: true,
        position_player: true,
        nationality_1: true,
        team_name: true
      }
    });

    console.log('✅ Radar Compare API: Found comparison group:', comparisonPlayers.length, 'players');

    // Calculate averages for each category based on comparison group
    const comparisonPlayerIds = comparisonPlayers.map(p => p.id_player);
    const type = (searchParams.get('type') as any) || 'attacking';
    
    // Get real averages from service
    const averageMetrics = await RadarCalculationService.calculateAverageMetrics(comparisonPlayerIds, type);

    const comparisonData = baseRadarData.metrics.map(metric => {
      // Player value should NEVER change
      const playerValue = metric.value;
      
      // Get real average for this category
      const avgMetric = averageMetrics.find(m => m.category === metric.category);
      // Fallback to 50 only if no data found (shouldn't happen if array not empty)
      const comparisonAverage = avgMetric ? Math.round(avgMetric.value * 10) / 10 : 50;
      
      // Calculate percentile based on relative difference from group average
      // Using standard distribution approximation:
      // If player = average -> 50th percentile
      // If player = average * 1.3 (+30%) -> 80th percentile approx
      // If player = average * 0.7 (-30%) -> 20th percentile approx
      const percentile = playerValue > comparisonAverage 
        ? Math.min(95, 50 + ((playerValue - comparisonAverage) / (comparisonAverage || 1)) * 30)
        : Math.max(5, 50 - ((comparisonAverage - playerValue) / (comparisonAverage || 1)) * 30);

      return {
        category: metric.category,
        playerValue: playerValue,
        comparisonAverage: comparisonAverage,
        percentile: Math.round(percentile),
        rank: Math.ceil((100 - percentile) / 100 * comparisonPlayers.length),
        totalPlayers: comparisonPlayers.length,
        maxValue: Math.min(100, comparisonAverage + 25),
        minValue: Math.max(0, comparisonAverage - 25)
      };
    });

    // Group statistics
    const groupStats = {
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

    console.log('✅ Radar Compare API: Returning comparison data with', comparisonData.length, 'categories');

    return NextResponse.json({
      player: {
        id: playerIdNum,
        name: player.player_name,
        position: player.position_player,
        age: player.age,
        nationality: player.nationality_1,
        team: player.team_name,
        rating: player.player_rating
      },
      comparisonData,
      groupStats,
      filters,
      metadata: {
        generatedAt: new Date().toISOString(),
        filtersApplied: Object.values(filters).some(v => v !== undefined),
        comparisonType: Object.values(filters).some(v => v !== undefined) ? 'filtered_group' : 'all_players'
      }
    });

  } catch (error) {
    console.error('❌ Radar Compare API: Error:', error);
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