import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerIdStr } = await params;
    const playerId = parseInt(playerIdStr, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Obtener datos del jugador con información de posicionamiento
    const player = await prisma.jugador.findUnique({
      where: {
        id_player: playerId
      },
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        correct_position_player: true,
        foot: true,
        correct_foot: true,
        height: true,
        correct_height: true,
        age: true,
        player_rating: true,
        // Incluir datos de atributos si están disponibles
        atributos: {
          select: {
            left_foot_fmi: true,
            right_foot_fmi: true,
            right_foot_tendency: true,
            right_foot_tendency_percent: true,
            left_foot_tendency: true,
            left_foot_tendency_percent: true,
            right_foot_dominance: true,
            right_foot_dominance_level: true,
            left_foot_dominance: true,
            left_foot_dominance_level: true,
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Procesar datos de posicionamiento
    const positioningData = {
      positions: generatePositions(player),
      physicalAttributes: generatePhysicalAttributes(player),
      leftFoot: generateFootData(player, 'left'),
      rightFoot: generateFootData(player, 'right'),
      heatMap: generateHeatMapData(player)
    };

    return NextResponse.json(positioningData);

  } catch (error) {
    console.error('Error fetching player positioning data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mapeo de posiciones a coordenadas
const POSITION_COORDINATES: Record<string, { x: number; y: number; color: string }> = {
  'GK': { x: 90, y: 200, color: '#dc2626' },
  'Portero': { x: 90, y: 200, color: '#dc2626' },
  'CB': { x: 170, y: 200, color: '#dc2626' },
  'RB': { x: 170, y: 130, color: '#dc2626' },
  'LB': { x: 170, y: 270, color: '#dc2626' },
  'RWB': { x: 200, y: 120, color: '#dc2626' },
  'LWB': { x: 200, y: 280, color: '#dc2626' },
  'Defensa': { x: 170, y: 200, color: '#dc2626' },
  'Lateral': { x: 170, y: 150, color: '#dc2626' },
  'CM': { x: 280, y: 200, color: '#a16207' },
  'CDM': { x: 220, y: 200, color: '#a16207' },
  'CAM': { x: 320, y: 200, color: '#eab308' },
  'RM': { x: 280, y: 130, color: '#a16207' },
  'LM': { x: 280, y: 270, color: '#a16207' },
  'Centrocampista': { x: 280, y: 200, color: '#a16207' },
  'Mediocentro': { x: 250, y: 200, color: '#a16207' },
  'RW': { x: 370, y: 130, color: '#22c55e' },
  'LW': { x: 370, y: 270, color: '#22c55e' },
  'ST': { x: 420, y: 200, color: '#3b82f6' },
  'CF': { x: 400, y: 200, color: '#3b82f6' },
  'Delantero': { x: 420, y: 200, color: '#3b82f6' },
  'Extremo': { x: 370, y: 200, color: '#22c55e' },
  'Atacante': { x: 420, y: 200, color: '#3b82f6' },
};

function generatePositions(player: any) {
  const positions = [];
  
  // Posición principal
  const mainPosition = player.position_player || player.correct_position_player;
  if (mainPosition) {
    const coords = POSITION_COORDINATES[mainPosition] || POSITION_COORDINATES['CM'];
    positions.push({
      position: mainPosition,
      x: coords.x,
      y: coords.y,
      color: coords.color,
      isMainPosition: true,
      intensity: 1.0
    });

    // Posiciones secundarias
    const secondaryPositions = getSecondaryPositions(mainPosition);
    secondaryPositions.forEach((pos, index) => {
      const coords = POSITION_COORDINATES[pos];
      if (coords) {
        positions.push({
          position: pos,
          x: coords.x + (Math.random() - 0.5) * 15,
          y: coords.y + (Math.random() - 0.5) * 15,
          color: coords.color,
          isMainPosition: false,
          intensity: 0.7 - (index * 0.1)
        });
      }
    });
  }

  return positions;
}

function getSecondaryPositions(mainPosition: string): string[] {
  const positionMap: Record<string, string[]> = {
    'Delantero': ['ST', 'CF', 'RW'],
    'Centrocampista': ['CM', 'CAM', 'CDM'],
    'Defensa': ['CB', 'RB', 'LB'],
    'Extremo': ['RW', 'LW', 'RM'],
    'Portero': [],
    'ST': ['CF', 'CAM'],
    'CM': ['CAM', 'CDM'],
    'CB': ['CDM'],
  };

  return positionMap[mainPosition]?.slice(0, 2) || [];
}

function generatePhysicalAttributes(player: any) {
  const rating = player.player_rating || 70;
  const age = player.age || 25;
  const height = player.height || player.correct_height || 175;

  // Calcular atributos basados en datos reales
  const ageFactor = Math.max(0.5, 1 - (age - 25) * 0.01);
  const heightFactor = (height - 160) / 40; // Normalizar altura

  const attributes = [
    {
      name: 'Sprinter',
      value: Math.min(95, Math.max(40, rating * ageFactor + Math.random() * 15)),
      category: 'speed'
    },
    {
      name: 'Marathonian',
      value: Math.min(95, Math.max(40, rating * ageFactor * 0.9 + Math.random() * 15)),
      category: 'endurance'
    },
    {
      name: 'Bomberman',
      value: Math.min(95, Math.max(40, rating + heightFactor * 10 + Math.random() * 15)),
      category: 'strength'
    },
    {
      name: '360°',
      value: Math.min(95, Math.max(40, rating * ageFactor - heightFactor * 5 + Math.random() * 15)),
      category: 'agility'
    },
    {
      name: 'The Rock',
      value: Math.min(95, Math.max(40, rating + heightFactor * 8 + Math.random() * 15)),
      category: 'physicality'
    },
    {
      name: 'Air Flyer',
      value: Math.min(95, Math.max(40, rating + heightFactor * 12 + Math.random() * 15)),
      category: 'aerial'
    }
  ];

  return attributes.map(attr => ({
    name: attr.name,
    value: attr.value.toFixed(0),
    ...calculateGrade(attr.value),
    category: attr.category
  }));
}

function generateFootData(player: any, footType: 'left' | 'right') {
  // Usar datos reales si están disponibles
  let dominance = 50;
  let tendency = 50;

  const atributos = player.atributos;

  if (footType === 'left') {
    dominance = atributos?.left_foot_dominance || atributos?.left_foot_fmi || 30;
    tendency = atributos?.left_foot_tendency || atributos?.left_foot_tendency_percent || 30;
  } else {
    dominance = atributos?.right_foot_dominance || atributos?.right_foot_fmi || 70;
    tendency = atributos?.right_foot_tendency || atributos?.right_foot_tendency_percent || 70;
  }

  // Ajustar basado en el pie preferido del jugador
  const preferredFoot = player.foot || player.correct_foot || 'Right';
  
  if (preferredFoot.toLowerCase().includes('left') || preferredFoot.toLowerCase().includes('izquierdo')) {
    if (footType === 'left') {
      dominance = Math.max(dominance, 65);
      tendency = Math.max(tendency, 65);
    } else {
      dominance = Math.min(dominance, 35);
      tendency = Math.min(tendency, 35);
    }
  } else if (preferredFoot.toLowerCase().includes('both') || preferredFoot.toLowerCase().includes('ambos')) {
    dominance = 45 + Math.random() * 10;
    tendency = 45 + Math.random() * 10;
  }

  const grade = calculateGrade(dominance);

  return {
    dominance: Math.round(dominance),
    tendency: Math.round(tendency),
    grade: grade.grade,
    color: grade.color
  };
}

function generateHeatMapData(player: any) {
  const position = player.position_player || player.correct_position_player || 'CM';
  const coords = POSITION_COORDINATES[position] || POSITION_COORDINATES['CM'];
  
  // Generar puntos de calor alrededor de la posición principal
  const heatPoints = [];
  const centerX = coords.x;
  const centerY = coords.y;
  
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * 2 * Math.PI;
    const radius = 30 + Math.random() * 40;
    const intensity = Math.max(0.1, 1 - (radius / 70));
    
    heatPoints.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      intensity: intensity
    });
  }
  
  return heatPoints;
}

function calculateGrade(value: number): { grade: string; color: string } {
  if (value >= 90) return { grade: 'A+', color: '#22c55e' };
  if (value >= 85) return { grade: 'A', color: '#22c55e' };
  if (value >= 80) return { grade: 'B+', color: '#3b82f6' };
  if (value >= 75) return { grade: 'B', color: '#3b82f6' };
  if (value >= 70) return { grade: 'C+', color: '#eab308' };
  if (value >= 65) return { grade: 'C', color: '#eab308' };
  if (value >= 60) return { grade: 'D+', color: '#ea580c' };
  if (value >= 50) return { grade: 'D', color: '#ea580c' };
  return { grade: 'F', color: '#dc2626' };
}