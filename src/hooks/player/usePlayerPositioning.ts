"use client";

import { useState, useEffect } from 'react';
import type { Player } from '@/types/player';

interface PositionData {
  position: string;
  x: number;
  y: number;
  color: string;
  isMainPosition: boolean;
}

interface PhysicalAttribute {
  name: string;
  value: string;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
  color: string;
}

interface FootData {
  dominance: number;
  tendency: number;
  grade: string;
  color: string;
}

interface PlayerPositioningData {
  positions: PositionData[];
  physicalAttributes: PhysicalAttribute[];
  leftFoot: FootData;
  rightFoot: FootData;
  isLoading: boolean;
  error: string | null;
}

// Mapeo de posiciones a coordenadas en el campo
const POSITION_COORDINATES: Record<string, { x: number; y: number; color: string }> = {
  // Porteros
  'GK': { x: 90, y: 200, color: '#dc2626' },
  'Portero': { x: 90, y: 200, color: '#dc2626' },
  
  // Defensas
  'CB': { x: 170, y: 200, color: '#dc2626' },
  'RB': { x: 170, y: 130, color: '#dc2626' },
  'LB': { x: 170, y: 270, color: '#dc2626' },
  'RWB': { x: 200, y: 120, color: '#dc2626' },
  'LWB': { x: 200, y: 280, color: '#dc2626' },
  'Defensa': { x: 170, y: 200, color: '#dc2626' },
  'Lateral': { x: 170, y: 150, color: '#dc2626' },
  
  // Centrocampistas
  'CM': { x: 280, y: 200, color: '#a16207' },
  'CDM': { x: 220, y: 200, color: '#a16207' },
  'CAM': { x: 320, y: 200, color: '#eab308' },
  'RM': { x: 280, y: 130, color: '#a16207' },
  'LM': { x: 280, y: 270, color: '#a16207' },
  'Centrocampista': { x: 280, y: 200, color: '#a16207' },
  'Mediocentro': { x: 250, y: 200, color: '#a16207' },
  
  // Extremos y Delanteros
  'RW': { x: 370, y: 130, color: '#22c55e' },
  'LW': { x: 370, y: 270, color: '#22c55e' },
  'ST': { x: 420, y: 200, color: '#3b82f6' },
  'CF': { x: 400, y: 200, color: '#3b82f6' },
  'Delantero': { x: 420, y: 200, color: '#3b82f6' },
  'Extremo': { x: 370, y: 200, color: '#22c55e' },
  'Atacante': { x: 420, y: 200, color: '#3b82f6' },
};

// Función para calcular grado basado en valor numérico
function calculateGrade(value: number): { grade: PhysicalAttribute['grade']; color: string } {
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

export function usePlayerPositioning(player: Player): PlayerPositioningData {
  const [data, setData] = useState<PlayerPositioningData>({
    positions: [],
    physicalAttributes: [],
    leftFoot: { dominance: 0, tendency: 0, grade: 'C', color: '#eab308' },
    rightFoot: { dominance: 0, tendency: 0, grade: 'C', color: '#eab308' },
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function fetchPositioningData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        // Obtener datos de posicionamiento del jugador
        const response = await fetch(`/api/players/${player.id}/positioning`);
        
        if (!response.ok) {
          // Si no hay endpoint específico, usar datos del jugador base
          const positions = generatePositionsFromPlayer(player);
          const physicalAttributes = generatePhysicalAttributes(player);
          const footData = generateFootData(player);

          setData({
            positions,
            physicalAttributes,
            leftFoot: footData.left,
            rightFoot: footData.right,
            isLoading: false,
            error: null
          });
          return;
        }

        const positioningData = await response.json();
        
        setData({
          positions: positioningData.positions || generatePositionsFromPlayer(player),
          physicalAttributes: positioningData.physicalAttributes || generatePhysicalAttributes(player),
          leftFoot: positioningData.leftFoot || generateFootData(player).left,
          rightFoot: positioningData.rightFoot || generateFootData(player).right,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching positioning data:', error);
        
        // Fallback con datos generados
        const positions = generatePositionsFromPlayer(player);
        const physicalAttributes = generatePhysicalAttributes(player);
        const footData = generateFootData(player);

        setData({
          positions,
          physicalAttributes,
          leftFoot: footData.left,
          rightFoot: footData.right,
          isLoading: false,
          error: 'Error loading positioning data'
        });
      }
    }

    if (player?.id) {
      fetchPositioningData();
    }
  }, [player?.id]);

  return data;
}

// Generar posiciones basadas en los datos del jugador
function generatePositionsFromPlayer(player: Player): PositionData[] {
  const positions: PositionData[] = [];
  
  // Posición principal
  const mainPosition = player.position_player || player.correct_position_player;
  if (mainPosition) {
    const coords = POSITION_COORDINATES[mainPosition] || POSITION_COORDINATES['CM'];
    positions.push({
      position: mainPosition,
      x: coords.x,
      y: coords.y,
      color: coords.color,
      isMainPosition: true
    });
  }

  // Posiciones secundarias basadas en la principal
  if (mainPosition) {
    const secondaryPositions = getSecondaryPositions(mainPosition);
    secondaryPositions.forEach(pos => {
      const coords = POSITION_COORDINATES[pos];
      if (coords) {
        positions.push({
          position: pos,
          x: coords.x + (Math.random() - 0.5) * 20, // Pequeña variación
          y: coords.y + (Math.random() - 0.5) * 20,
          color: coords.color,
          isMainPosition: false
        });
      }
    });
  }

  return positions;
}

// Obtener posiciones secundarias basadas en la principal
function getSecondaryPositions(mainPosition: string): string[] {
  const positionMap: Record<string, string[]> = {
    'Delantero': ['ST', 'CF', 'RW', 'LW'],
    'Centrocampista': ['CM', 'CAM', 'CDM'],
    'Defensa': ['CB', 'RB', 'LB'],
    'Extremo': ['RW', 'LW', 'RM', 'LM'],
    'Portero': ['GK'],
    'ST': ['CF', 'RW', 'LW'],
    'CM': ['CAM', 'CDM', 'RM', 'LM'],
    'CB': ['RB', 'LB', 'CDM'],
  };

  return positionMap[mainPosition] || [];
}

// Generar atributos físicos basados en datos del jugador
function generatePhysicalAttributes(player: Player): PhysicalAttribute[] {
  const rating = player.player_rating || 70;
  const age = player.age || 25;
  const height = player.height || 175;

  // Calcular atributos basados en rating, edad y altura
  const speed = Math.min(95, rating + (30 - age) * 0.5 + Math.random() * 10);
  const endurance = Math.min(95, rating - (age - 25) * 0.3 + Math.random() * 10);
  const strength = Math.min(95, rating + (height - 175) * 0.1 + Math.random() * 10);
  const agility = Math.min(95, rating - (height - 175) * 0.05 + Math.random() * 10);
  const physicality = Math.min(95, rating + (height - 175) * 0.08 + Math.random() * 10);
  const aerial = Math.min(95, rating + (height - 175) * 0.15 + Math.random() * 10);

  return [
    {
      name: 'Sprinter',
      value: speed.toFixed(0),
      ...calculateGrade(speed)
    },
    {
      name: 'Marathonian',
      value: endurance.toFixed(0),
      ...calculateGrade(endurance)
    },
    {
      name: 'Bomberman',
      value: strength.toFixed(0),
      ...calculateGrade(strength)
    },
    {
      name: '360°',
      value: agility.toFixed(0),
      ...calculateGrade(agility)
    },
    {
      name: 'The Rock',
      value: physicality.toFixed(0),
      ...calculateGrade(physicality)
    },
    {
      name: 'Air Flyer',
      value: aerial.toFixed(0),
      ...calculateGrade(aerial)
    }
  ];
}

// Generar datos de pie basados en información del jugador
function generateFootData(player: Player): { left: FootData; right: FootData } {
  const foot = player.foot || player.correct_foot || 'Right';
  
  let leftDominance = 30;
  let rightDominance = 70;
  
  // Ajustar dominancia basada en el pie preferido
  if (foot.toLowerCase().includes('left') || foot.toLowerCase().includes('izquierdo')) {
    leftDominance = 75;
    rightDominance = 25;
  } else if (foot.toLowerCase().includes('both') || foot.toLowerCase().includes('ambos')) {
    leftDominance = 50;
    rightDominance = 50;
  }

  // Añadir algo de variación
  const variation = (Math.random() - 0.5) * 20;
  leftDominance = Math.max(10, Math.min(90, leftDominance + variation));
  rightDominance = 100 - leftDominance;

  // Redondear a números enteros
  const leftDominanceRounded = Math.round(leftDominance);
  const rightDominanceRounded = Math.round(rightDominance);

  const leftGrade = calculateGrade(leftDominanceRounded);
  const rightGrade = calculateGrade(rightDominanceRounded);

  return {
    left: {
      dominance: leftDominanceRounded,
      tendency: leftDominanceRounded,
      grade: leftGrade.grade,
      color: leftGrade.color
    },
    right: {
      dominance: rightDominanceRounded,
      tendency: rightDominanceRounded,
      grade: rightGrade.grade,
      color: rightGrade.color
    }
  };
}