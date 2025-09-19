
// Funciones de utilidad para RadarChart - Generadas automáticamente
// Usar en el componente PlayerRadar.tsx

export interface RadarComparisonData {
  category: string;
  playerValue: number;
  positionAverage: number;
  percentile: number;
  rank?: number;
  totalPlayers?: number;
}

export interface RadarFilters {
  position?: string;
  age?: { min: number; max: number };
  nationality?: string;
  competition?: string;
  trfmValue?: { min: number; max: number };
}

// Obtener datos de radar para un jugador específico
export async function getPlayerRadarData(_playerId: string): Promise<RadarComparisonData[]> {
  // Implementar llamada a API
  const response = await fetch(`/api/players/${playerId}/radar`);
  return response.json();
}

// Comparar jugador con grupo filtrado
export async function comparePlayerWithFilters(
  _playerId: string, 
  __filters: RadarFilters
): Promise<RadarComparisonData[]> {
  const queryParams = new URLSearchParams();
  if (filters.position) queryParams.append('position', filters.position);
  if (filters.nationality) queryParams.append('nationality', filters.nationality);
  // ... más filtros
  
  const response = await fetch(`/api/players/${playerId}/radar/compare?${queryParams}`);
  return response.json();
}

// Obtener opciones para filtros
export async function getRadarFilterOptions() {
  const response = await fetch('/api/players/radar/filters');
  return response.json();
}
