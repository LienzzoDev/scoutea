import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;

    // Obtener datos de radar del jugador
    const radarData = await prisma.radarMetrics.findMany({
      where: {
        playerId: playerId,
        period: '2023-24'
      },
      orderBy: {
        category: 'asc'
      }
    });

    if (radarData.length === 0) {
      // Verificar si el jugador existe
      const playerExists = await prisma.jugador.findUnique({
        where: { id_player: playerId },
        select: { player_name: true, position_player: true }
      });

      if (!playerExists) {
        return NextResponse.json(
          { 
            error: 'Player not found',
            playerId: playerId,
            message: 'The specified player does not exist in the database'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'No radar data found for this player',
          playerId: playerId,
          playerName: playerExists.player_name,
          message: 'Player exists but has no radar metrics data'
        },
        { status: 404 }
      );
    }

    // Obtener información del jugador para contexto
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

    // Calcular ranking dentro de su posición
    console.log('Radar API: player position:', player?.position_player);
    console.log('Radar API: About to query players in position...');
    
    // Simplified approach: get all players with radar metrics first, then filter
    console.log('Radar API: Using simplified approach...');
    let playersInPosition = [];
    
    try {
      // First get all players with the same position
      const allPlayersInPosition = await prisma.jugador.findMany({
        where: {
          position_player: player?.position_player
        },
        include: {
          atributos: true,
          radarMetrics: {
            where: {
              period: '2023-24'
            }
          }
        }
      });
      
      // Then filter those that have atributos
      playersInPosition = allPlayersInPosition.filter(p => p.atributos !== null);
      console.log('Radar API: Found players in position with atributos:', playersInPosition.length);
      
    } catch (queryError) {
      console.error('Radar API: Error in simplified query:', queryError);
      playersInPosition = [];
    }

    // Enriquecer datos con rankings
    const enrichedRadarData = radarData.map(radar => {
      // Calcular ranking para esta categoría
      const categoryValues = playersInPosition
        .map(p => p.radarMetrics.find(r => r.category === radar.category))
        .filter(r => r !== undefined)
        .map(r => r!.playerValue)
        .sort((a, b) => b - a);

      const rank = categoryValues.findIndex(value => value <= radar.playerValue) + 1;

      return {
        category: radar.category,
        playerValue: radar.playerValue,
        positionAverage: radar.positionAverage,
        percentile: radar.percentile,
        rank: rank,
        totalPlayers: categoryValues.length,
        // Datos adicionales para el gráfico
        maxValue: Math.max(...categoryValues),
        minValue: Math.min(...categoryValues)
      };
    });

    return NextResponse.json({
      player: player,
      radarData: enrichedRadarData,
      metadata: {
        period: '2023-24',
        totalCategories: radarData.length,
        positionComparison: playersInPosition.length
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
  }
}