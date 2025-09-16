import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;
    const { searchParams } = new URL(request.url);

    // Obtener filtros de la query
    const filters = {
      position: searchParams.get('position'),
      nationality: searchParams.get('nationality'),
      competition: searchParams.get('competition'),
      ageMin: searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!) : undefined,
      ageMax: searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!) : undefined,
      trfmMin: searchParams.get('trfmMin') ? parseFloat(searchParams.get('trfmMin')!) : undefined,
      trfmMax: searchParams.get('trfmMax') ? parseFloat(searchParams.get('trfmMax')!) : undefined,
    };

    // Construir where clause dinámicamente
    const whereClause: any = {
      atributos: {
        isNot: null
      }
    };

    if (filters.position) {
      whereClause.position_player = filters.position;
    }

    if (filters.nationality) {
      whereClause.nationality_1 = filters.nationality;
    }

    if (filters.ageMin || filters.ageMax) {
      whereClause.age = {};
      if (filters.ageMin) whereClause.age.gte = filters.ageMin;
      if (filters.ageMax) whereClause.age.lte = filters.ageMax;
    }

    if (filters.trfmMin || filters.trfmMax) {
      whereClause.player_rating = {};
      if (filters.trfmMin) whereClause.player_rating.gte = filters.trfmMin;
      if (filters.trfmMax) whereClause.player_rating.lte = filters.trfmMax;
    }

    // Obtener jugadores que coinciden con los filtros
    const comparisonPlayers = await prisma.jugador.findMany({
      where: whereClause,
      include: {
        atributos: true,
        radarMetrics: {
          where: {
            period: '2023-24'
          }
        }
      }
    });

    // Obtener datos del jugador actual
    const currentPlayer = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      include: {
        atributos: true,
        radarMetrics: {
          where: {
            period: '2023-24'
          }
        }
      }
    });

    if (!currentPlayer || !currentPlayer.radarMetrics.length) {
      return NextResponse.json(
        { error: 'Player not found or no radar data available' },
        { status: 404 }
      );
    }

    // Calcular estadísticas comparativas
    const categories = ['Attacking', 'Defending', 'Passing', 'Physical', 'Mental'];
    const comparisonData = categories.map(category => {
      const playerRadar = currentPlayer.radarMetrics.find(r => r.category === category);
      
      if (!playerRadar) {
        return {
          category,
          playerValue: 0,
          groupAverage: 0,
          percentile: 0,
          rank: 0,
          totalPlayers: 0
        };
      }

      // Obtener valores de todos los jugadores en esta categoría
      const categoryValues = comparisonPlayers
        .map(p => p.radarMetrics.find(r => r.category === category))
        .filter(r => r !== undefined)
        .map(r => r!.playerValue);

      // Calcular estadísticas
      const groupAverage = categoryValues.length > 0 
        ? categoryValues.reduce((sum, val) => sum + val, 0) / categoryValues.length
        : 0;

      const sortedValues = categoryValues.sort((a, b) => a - b);
      const rank = sortedValues.filter(val => val < playerRadar.playerValue).length + 1;
      const percentile = categoryValues.length > 0 
        ? ((categoryValues.length - rank + 1) / categoryValues.length) * 100
        : 0;

      return {
        category,
        playerValue: playerRadar.playerValue,
        groupAverage: Math.round(groupAverage * 10) / 10,
        percentile: Math.round(percentile * 10) / 10,
        rank,
        totalPlayers: categoryValues.length,
        maxValue: Math.max(...categoryValues, playerRadar.playerValue),
        minValue: Math.min(...categoryValues, playerRadar.playerValue)
      };
    });

    // Calcular estadísticas del grupo
    const groupStats = {
      totalPlayers: comparisonPlayers.length,
      averageAge: comparisonPlayers.length > 0 
        ? Math.round(comparisonPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / comparisonPlayers.length)
        : 0,
      averageRating: comparisonPlayers.length > 0
        ? Math.round((comparisonPlayers.reduce((sum, p) => sum + (p.player_rating || 0), 0) / comparisonPlayers.length) * 10) / 10
        : 0,
      positions: [...new Set(comparisonPlayers.map(p => p.position_player).filter(Boolean))],
      nationalities: [...new Set(comparisonPlayers.map(p => p.nationality_1).filter(Boolean))]
    };

    return NextResponse.json({
      player: {
        id: currentPlayer.id_player,
        name: currentPlayer.player_name,
        position: currentPlayer.position_player,
        age: currentPlayer.age,
        nationality: currentPlayer.nationality_1,
        rating: currentPlayer.player_rating
      },
      comparisonData,
      groupStats,
      filters: filters,
      metadata: {
        period: '2023-24',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in radar comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}