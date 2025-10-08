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
  position?: string;
  nationality?: string;
  competition?: string;
  ageMin?: string;
  ageMax?: string;
}

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
          position: player.position_player || 'Unknown',
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

  // Filter data function
  const getFilteredData = useCallback((filters: BeeswarmFilters) => {
    console.log('🔍 Applying filters:', filters);

    const filtered = data.filter(player => {
      // Position filter - case insensitive and partial match
      if (filters.position) {
        const positionMatch = player.position?.toLowerCase().includes(filters.position.toLowerCase());
        if (!positionMatch) {
          console.log('❌ Position filter rejected:', player.name, player.position, 'vs', filters.position);
          return false;
        }
      }

      // Nationality filter - case insensitive and partial match
      if (filters.nationality) {
        const nationalityMatch = player.nationality?.toLowerCase().includes(filters.nationality.toLowerCase());
        if (!nationalityMatch) {
          console.log('❌ Nationality filter rejected:', player.name, player.nationality, 'vs', filters.nationality);
          return false;
        }
      }

      // Competition filter - check team name (since we don't have competition in BeeswarmData)
      if (filters.competition) {
        const competitionMatch = player.team?.toLowerCase().includes(filters.competition.toLowerCase());
        if (!competitionMatch) {
          console.log('❌ Competition filter rejected:', player.name, player.team, 'vs', filters.competition);
          return false;
        }
      }

      // Age range filters
      if (filters.ageMin) {
        const minAge = parseInt(filters.ageMin);
        if (!isNaN(minAge) && player.age < minAge) {
          console.log('❌ Age min filter rejected:', player.name, player.age, '<', minAge);
          return false;
        }
      }

      if (filters.ageMax) {
        const maxAge = parseInt(filters.ageMax);
        if (!isNaN(maxAge) && player.age > maxAge) {
          console.log('❌ Age max filter rejected:', player.name, player.age, '>', maxAge);
          return false;
        }
      }

      return true;
    });

    console.log('✅ Filtered data:', filtered.length, 'of', data.length, 'players');
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