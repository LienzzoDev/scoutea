import { useState, useEffect, useCallback } from 'react';

export interface LollipopData {
  id: string;
  name: string;
  value: number;
  position: string;
  age: number;
  nationality: string;
  team: string;
  rating: number;
  rank: number;
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

export interface LollipopFilters {
  position?: string;
  nationality?: string;
  competition?: string;
  ageMin?: string;
  ageMax?: string;
  limit?: number;
}

export const usePlayerLollipop = (metric: string) => {
  const [data, setData] = useState<LollipopData[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when metric changes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 usePlayerLollipop: Loading data for metric:', metric);
      
      // Load players data and filter options in parallel
      const [playersResponse, filtersResponse] = await Promise.all([
        fetch('/api/players-simple?limit=1000'),
        fetch('/api/players/radar/filters')
      ]);
      
      if (playersResponse.ok) {
        const playersResult = await playersResponse.json();
        console.log('✅ usePlayerLollipop: Players data loaded:', playersResult.players?.length || 0, 'players');
        
        // Transform and sort data for lollipop (top performers first)
        const lollipopData: LollipopData[] = (playersResult.players || [])
          .map((player: any) => ({
            id: player.id_player,
            name: player.player_name,
            value: player[metric] || 0,
            position: player.position_player || 'Unknown',
            age: player.age || 0,
            nationality: player.nationality_1 || 'Unknown',
            team: player.team_name || 'Unknown',
            rating: player.player_rating || 0,
            rank: 0 // Will be set after sorting
          }))
          .filter(player => player.value > 0) // Only include players with valid values
          .sort((a, b) => b.value - a.value) // Sort descending by value
          .map((player, index) => ({ ...player, rank: index + 1 })); // Add rank
        
        setData(lollipopData);
      } else {
        throw new Error(`Failed to load players data: ${playersResponse.status}`);
      }
      
      if (filtersResponse.ok) {
        const filtersResult = await filtersResponse.json();
        console.log('✅ usePlayerLollipop: Filter options loaded');
        setFilterOptions(filtersResult);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ usePlayerLollipop: Error loading data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Remove metric dependency to avoid recreation

  // Load data when metric changes
  useEffect(() => {
    loadData();
  }, [metric]); // Depend on metric directly

  // Filter data function
  const getFilteredData = useCallback((filters: LollipopFilters) => {
    let filtered = data.filter(player => {
      if (filters.position && player.position !== filters.position) return false;
      if (filters.nationality && player.nationality !== filters.nationality) return false;
      if (filters.ageMin && player.age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && player.age > parseInt(filters.ageMax)) return false;
      return true;
    });

    // Re-rank after filtering
    filtered = filtered
      .sort((a, b) => b.value - a.value)
      .map((player, index) => ({ ...player, rank: index + 1 }));

    // Limit results if specified
    if (filters.limit && filters.limit > 0) {
      filtered = filtered.slice(0, filters.limit);
    }

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