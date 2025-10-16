import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Obtener todas las opciones disponibles para filtros
    const players = await prisma.jugador.findMany({
      where: {
        atributos: {
          isNot: null
        }
      },
      select: {
        position_player: true,
        nationality_1: true,
        team_country: true,
        age: true,
        player_rating: true,
        team_name: true
      }
    });

    // Extraer opciones únicas
    const positions = [...new Set(players.map(p => p.position_player).filter(Boolean))].sort();
    const nationalities = [...new Set(players.map(p => p.nationality_1).filter(Boolean))].sort();
    const competitions = [...new Set(players.map(p => p.team_country).filter(Boolean))].sort();
    const teams = [...new Set(players.map(p => p.team_name).filter(Boolean))].sort();

    // Calcular rangos
    const ages = players.map(p => p.age).filter(Boolean) as number[];
    const ratings = players.map(p => p.player_rating).filter(Boolean) as number[];

    const ageRange = ages.length > 0 ? {
      min: Math.min(...ages),
      max: Math.max(...ages)
    } : { min: 16, max: 40 };

    const ratingRange = ratings.length > 0 ? {
      min: Math.round(Math.min(...ratings) * 10) / 10,
      max: Math.round(Math.max(...ratings) * 10) / 10
    } : { min: 50, max: 100 };

    // Estadísticas por posición
    const positionStats = positions.map(position => {
      const positionPlayers = players.filter(p => p.position_player === position);
      const avgAge = positionPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / positionPlayers.length;
      const avgRating = positionPlayers.reduce((sum, p) => sum + (p.player_rating || 0), 0) / positionPlayers.length;

      return {
        position,
        count: positionPlayers.length,
        averageAge: Math.round(avgAge),
        averageRating: Math.round(avgRating * 10) / 10
      };
    });

    return NextResponse.json({
      positions: positions.map(pos => ({
        value: pos,
        label: pos,
        count: players.filter(p => p.position_player === pos).length
      })),
      nationalities: nationalities.map(nat => ({
        value: nat,
        label: nat,
        count: players.filter(p => p.nationality_1 === nat).length
      })),
      competitions: competitions.map(comp => ({
        value: comp,
        label: comp,
        count: players.filter(p => p.team_country === comp).length
      })),
      teams: teams.map(team => ({
        value: team,
        label: team,
        count: players.filter(p => p.team_name === team).length
      })),
      ranges: {
        age: ageRange,
        rating: ratingRange
      },
      positionStats,
      totalPlayers: players.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'atributos_table'
      }
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}