import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Obtener todas las opciones disponibles para filtros
    const players = await prisma.jugador.findMany({
      select: {
        position_player: true,
        nationality_1: true,
        team_country: true,
        age: true,
        player_rating: true,
        team_name: true
      }
    });

    const POSITION_ORDER = [
      "Goalkeeper",
      "Defender",
      "Sweeper",
      "Right-Back",
      "Centre-Back",
      "Left-Back",
      "Midfield",
      "Defensive Midfield",
      "Right Midfield",
      "Central Midfield",
      "Left Midfield",
      "Attacking Midfield",
      "Attack",
      "Second Striker",
      "Right Winger",
      "Centre-Forward",
      "Left Winger"
    ];

    // Helper para normalizar formato (Title Case)
    const toTitleCase = (str: string) => {
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // Extraer opciones únicas y normalizar
    const rawPositions = players
      .map(p => p.position_player)
      .filter(Boolean)
      .map(p => {
        // Normalizar casos específicos como "Centre-back" -> "Centre-Back"
        const normalized = toTitleCase(p as string);
        // Casos especiales con guiones
        return normalized
          .replace('Centre-back', 'Centre-Back')
          .replace('Right-back', 'Right-Back')
          .replace('Left-back', 'Left-Back')
          .replace('Centre-forward', 'Centre-Forward');
      });

    const uniquePositions = [...new Set(rawPositions)];
    
    // Ordenar según la lista predefinida
    const positions = uniquePositions.sort((a, b) => {
      const indexA = POSITION_ORDER.indexOf(a);
      const indexB = POSITION_ORDER.indexOf(b);
      
      // Si ambos están en la lista, ordenar por índice
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // Si solo A está en la lista, va antes
      if (indexA !== -1) return -1;
      // Si solo B está en la lista, va antes
      if (indexB !== -1) return 1;
      // Si ninguno está, alfabético
      return a.localeCompare(b);
    });

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
      // Necesitamos normalizar también al filtrar para contar
      const positionPlayers = players.filter(p => {
        const rawPos = p.position_player;
        if (!rawPos) return false;
        
        let normalized = toTitleCase(rawPos);
        normalized = normalized
          .replace('Centre-back', 'Centre-Back')
          .replace('Right-back', 'Right-Back')
          .replace('Left-back', 'Left-Back')
          .replace('Centre-forward', 'Centre-Forward');
          
        return normalized === position;
      });

      const avgAge = positionPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / (positionPlayers.length || 1);
      const avgRating = positionPlayers.reduce((sum, p) => sum + (p.player_rating || 0), 0) / (positionPlayers.length || 1);

      return {
        position,
        count: positionPlayers.length,
        averageAge: Math.round(avgAge),
        averageRating: Math.round(avgRating * 10) / 10
      };
    });

    return NextResponse.json({
      positions: positions.map(pos => {
        const stats = positionStats.find(s => s.position === pos);
        return {
          value: pos,
          label: pos,
          count: stats?.count || 0
        };
      }),
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