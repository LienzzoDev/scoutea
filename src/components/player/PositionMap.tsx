"use client";

import type { PositionLevels } from '@/hooks/player/usePositionLevels';

interface PositionMapProps {
  positionLevels: PositionLevels | null;
  isLoading: boolean;
  playerName?: string;
}

// Position coordinates on the pitch (matching the reference image layout)
// Pitch viewBox: 600x400, with padding for positions
const POSITION_CONFIG: {
  key: keyof PositionLevels;
  label: string;
  x: number;
  y: number;
}[] = [
  // Goalkeeper
  { key: 'gk_level', label: 'GK', x: 80, y: 200 },

  // Defenders (back line)
  { key: 'rb_level', label: 'RB', x: 150, y: 90 },
  { key: 'cb_level', label: 'CB', x: 150, y: 200 },
  { key: 'lb_level', label: 'LB', x: 150, y: 310 },

  // Wing backs
  { key: 'rwb_level', label: 'RWB', x: 220, y: 70 },
  { key: 'lwb_level', label: 'LWB', x: 220, y: 330 },

  // Defensive midfield
  { key: 'dm_level', label: 'DM', x: 260, y: 200 },

  // Midfielders
  { key: 'rm_level', label: 'RM', x: 330, y: 90 },
  { key: 'cm_level', label: 'CM', x: 330, y: 200 },
  { key: 'lm_level', label: 'LM', x: 330, y: 310 },

  // Attacking midfield
  { key: 'am_level', label: 'AM', x: 400, y: 200 },

  // Wingers
  { key: 'rw_level', label: 'RW', x: 450, y: 90 },
  { key: 'lw_level', label: 'LW', x: 450, y: 310 },

  // Striker
  { key: 'st_level', label: 'ST', x: 500, y: 200 },
];

// Color scheme based on level values
function getLevelColor(level: number | null): string {
  if (level === null || level === undefined) {
    return '#9ca3af'; // Gray for no data
  }
  if (level > 8) {
    return '#064e3b'; // Dark green (emerald-900, darker than pitch background)
  }
  if (level > 6) {
    return '#22c55e'; // Light green
  }
  if (level > 4) {
    return '#eab308'; // Yellow
  }
  if (level > 2) {
    return '#f97316'; // Orange
  }
  return '#dc2626'; // Red
}

// Get text color based on background color for readability
function getTextColor(bgColor: string): string {
  // Yellow needs dark text for better contrast
  if (bgColor === '#eab308') {
    return '#000000';
  }
  return '#ffffff';
}

export default function PositionMap({ positionLevels, isLoading, playerName }: PositionMapProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-[#6d6d6d]">Cargando posiciones...</div>
      </div>
    );
  }

  return (
    <svg className="w-full h-80" viewBox="0 0 600 400">
      {/* Pitch background */}
      <rect
        x="0"
        y="0"
        width="600"
        height="400"
        fill="#166534"
        rx="8"
      />

      {/* Pitch outline */}
      <rect
        x="50"
        y="50"
        width="500"
        height="300"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Center line */}
      <line
        x1="300"
        y1="50"
        x2="300"
        y2="350"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Center circle */}
      <circle
        cx="300"
        cy="200"
        r="50"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Center spot */}
      <circle
        cx="300"
        cy="200"
        r="3"
        fill="#22c55e"
      />

      {/* Left goal area (small box) */}
      <rect
        x="50"
        y="150"
        width="30"
        height="100"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Left penalty area (big box) */}
      <rect
        x="50"
        y="100"
        width="80"
        height="200"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Left penalty spot */}
      <circle
        cx="100"
        cy="200"
        r="3"
        fill="#22c55e"
      />

      {/* Right goal area (small box) */}
      <rect
        x="520"
        y="150"
        width="30"
        height="100"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Right penalty area (big box) */}
      <rect
        x="470"
        y="100"
        width="80"
        height="200"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Right penalty spot */}
      <circle
        cx="500"
        cy="200"
        r="3"
        fill="#22c55e"
      />

      {/* Position blocks */}
      {POSITION_CONFIG.map((pos) => {
        const level = positionLevels?.[pos.key] ?? null;
        const bgColor = getLevelColor(level);
        const textColor = getTextColor(bgColor);

        return (
          <g key={pos.key}>
            {/* Position rectangle */}
            <rect
              x={pos.x - 22}
              y={pos.y - 12}
              width="44"
              height="24"
              fill={bgColor}
              rx="4"
              stroke="#ffffff"
              strokeWidth="2"
              strokeOpacity="0.7"
            />
            {/* Position label */}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="11"
              fontWeight="bold"
            >
              {pos.label}
            </text>
          </g>
        );
      })}


      {/* Player name (if provided) */}
      {playerName && (
        <text
          x="300"
          y="25"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="bold"
        >
          {playerName} - Mapa de Posiciones
        </text>
      )}
    </svg>
  );
}
