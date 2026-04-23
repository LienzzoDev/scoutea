import { useState, useEffect, useCallback } from 'react';

export interface BeeswarmData {
  id: string;
  name: string;
  value: number;
  position: string;
  age: number;
  nationality: string;
  team: string;
  rating: number;
}

export interface FilterOptions {
  positions: Array<{ value: string; label: string; count: number }>;
  nationalities: Array<{ value: string; label: string; count: number }>;
  competitions: Array<{ value: string; label: string; count: number }>;
  ranges: {
    age: { min: number; max: number };
    rating: { min: number; max: number };
  };
}

export interface BeeswarmFilters {
  positions?: string[];
  nationalities?: string[];
  competitions?: string[];
  ageMin?: string;
  ageMax?: string;
}

// Helper to normalize format (Title Case) - matching API logic
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizePosition = (pos: string) => {
  const normalized = toTitleCase(pos);
  return normalized
    .replace('Centre-back', 'Centre-Back')
    .replace('Right-back', 'Right-Back')
    .replace('Left-back', 'Left-Back')
    .replace('Centre-forward', 'Centre-Forward');
};

export const usePlayerBeeswarm = (metric: string) => {
  const [data, setData] = useState<BeeswarmData[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when metric changes
  const loadData = useCallback(async (currentMetric: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 usePlayerBeeswarm: Loading data for metric:', currentMetric);

      // Load players data and filter options in parallel
      const [playersResponse, filtersResponse] = await Promise.all([
        fetch('/api/players-simple?limit=1000'),
        fetch('/api/players/radar/filters')
      ]);

      if (playersResponse.ok) {
        const playersResult = await playersResponse.json();
        console.log('✅ usePlayerBeeswarm: Players data loaded:', playersResult.players?.length || 0, 'players');

        // Transform data for beeswarm using the current metric
        const beeswarmData: BeeswarmData[] = (playersResult.players || []).map((player: any) => ({
          id: player.id_player,
          name: player.player_name,
          value: player[currentMetric] || 0,
          position: normalizePosition(player.position_player || 'Unknown'),
          age: player.age || 0,
          nationality: player.nationality_1 || 'Unknown',
          team: player.team_name || 'Unknown',
          rating: player.player_rating || 0
        }));

        console.log('📊 usePlayerBeeswarm: Sample data point:', beeswarmData[0]);
        setData(beeswarmData);
      } else {
        throw new Error(`Failed to load players data: ${playersResponse.status}`);
      }

      if (filtersResponse.ok) {
        const filtersResult = await filtersResponse.json();
        console.log('✅ usePlayerBeeswarm: Filter options loaded');
        setFilterOptions(filtersResult);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ usePlayerBeeswarm: Error loading data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when metric changes
  useEffect(() => {
    loadData(metric);
  }, [metric, loadData]);

  // Filter data function.
  // Array vacío o undefined = sin filtro para ese campo.
  const getFilteredData = useCallback((filters: BeeswarmFilters) => {
    const positions = filters.positions ?? [];
    const nationalities = filters.nationalities ?? [];
    const competitions = filters.competitions ?? [];

    const filtered = data.filter(player => {
      if (positions.length > 0 && !positions.includes(player.position)) return false;

      if (nationalities.length > 0) {
        const lower = player.nationality?.toLowerCase() ?? '';
        const match = nationalities.some(n => lower.includes(n.toLowerCase()));
        if (!match) return false;
      }

      if (competitions.length > 0) {
        const lower = player.team?.toLowerCase() ?? '';
        const match = competitions.some(c => lower.includes(c.toLowerCase()));
        if (!match) return false;
      }

      if (filters.ageMin) {
        const minAge = parseInt(filters.ageMin);
        if (!isNaN(minAge) && player.age < minAge) return false;
      }
      if (filters.ageMax) {
        const maxAge = parseInt(filters.ageMax);
        if (!isNaN(maxAge) && player.age > maxAge) return false;
      }

      return true;
    });

    return filtered;
  }, [data]);

  return {
    data,
    filterOptions,
    loading,
    error,
    getFilteredData,
    hasData: data.length > 0
  };
};