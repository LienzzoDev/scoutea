import { useState, useEffect, useCallback } from 'react';

export interface RadarData {
  category: string;
  playerValue: number;
  comparisonAverage?: number;
  percentile?: number;
  basePercentile?: number; // Original percentile without filters
  rank?: number;
  totalPlayers?: number;
  maxValue?: number;
  minValue?: number;
}

export interface RadarFilters {
  position?: string;
  nationality?: string;
  competition?: string;
  ageMin?: string;
  ageMax?: string;
  ratingMin?: string;
  ratingMax?: string;
}

export const usePlayerRadar = (playerId: string) => {
  const [baseData, setBaseData] = useState<RadarData[]>([]);
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load base data and initial comparison data
  const loadInitialData = useCallback(async () => {
    if (!playerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 usePlayerRadar: Loading initial data for player:', playerId);
      
      // Load base radar data, comparison data (no filters), and filter options in parallel
      const [radarResponse, comparisonResponse, filtersResponse] = await Promise.all([
        fetch(`/api/players/${playerId}/radar`),
        fetch(`/api/players/${playerId}/radar/compare`), // No filters = all players
        fetch('/api/players/radar/filters')
      ]);
      
      if (radarResponse.ok) {
        const radarResult = await radarResponse.json();
        console.log('✅ usePlayerRadar: Base radar data loaded:', radarResult.radarData?.length || 0, 'categories');
        const baseRadarData = radarResult.radarData || [];
        setBaseData(baseRadarData);
        
        // Process comparison data if available
        if (comparisonResponse.ok) {
          const comparisonResult = await comparisonResponse.json();
          console.log('✅ usePlayerRadar: Initial comparison data loaded');
          
          if (comparisonResult.comparisonData) {
            const mergedData = baseRadarData.map(baseCategory => {
              const comparisonCategory = comparisonResult.comparisonData.find(
                (comp: RadarData) => comp.category === baseCategory.category
              );
              
              return {
                category: baseCategory.category,
                playerValue: baseCategory.playerValue,
                basePercentile: baseCategory.percentile,
                comparisonAverage: comparisonCategory?.comparisonAverage || 50,
                percentile: comparisonCategory?.percentile || baseCategory.percentile,
                rank: comparisonCategory?.rank || 1,
                totalPlayers: comparisonCategory?.totalPlayers || 1,
                maxValue: comparisonCategory?.maxValue || 100,
                minValue: comparisonCategory?.minValue || 0
              };
            });
            setRadarData(mergedData);
          } else {
            // Fallback to base data with defaults
            const dataWithDefaults = baseRadarData.map(item => ({
              ...item,
              comparisonAverage: 50,
              basePercentile: item.percentile
            }));
            setRadarData(dataWithDefaults);
          }
        } else {
          // Fallback to base data with defaults
          const dataWithDefaults = baseRadarData.map(item => ({
            ...item,
            comparisonAverage: 50,
            basePercentile: item.percentile
          }));
          setRadarData(dataWithDefaults);
        }
      } else {
        throw new Error(`Failed to load radar data: ${radarResponse.status}`);
      }
      
      if (filtersResponse.ok) {
        const filtersResult = await filtersResponse.json();
        console.log('✅ usePlayerRadar: Filter options loaded');
        setFilterOptions(filtersResult);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ usePlayerRadar: Error loading initial data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Apply filters and get comparison data
  const applyFilters = useCallback(async (filters: RadarFilters) => {
    // Get current base data from state
    const currentBaseData = baseData;
    if (!currentBaseData.length) return;
    
    try {
      console.log('🔍 usePlayerRadar: Applying filters:', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      const endpoint = `/api/players/${playerId}/radar/compare?${params}`;
      console.log('🔍 usePlayerRadar: Fetching comparison from:', endpoint);
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const comparisonResult = await response.json();
        console.log('✅ usePlayerRadar: Comparison data received:', comparisonResult);
        
        if (comparisonResult.comparisonData) {
          // Create merged data that preserves player values
          const mergedData = currentBaseData.map(baseCategory => {
            const comparisonCategory = comparisonResult.comparisonData.find(
              (comp: RadarData) => comp.category === baseCategory.category
            );
            
            return {
              category: baseCategory.category,
              // PLAYER VALUES NEVER CHANGE - always from base data
              playerValue: baseCategory.playerValue,
              basePercentile: baseCategory.percentile, // Original percentile without filters
              // COMPARISON DATA - changes with filters
              comparisonAverage: comparisonCategory?.comparisonAverage || 50,
              percentile: comparisonCategory?.percentile || baseCategory.percentile,
              rank: comparisonCategory?.rank || 1,
              totalPlayers: comparisonCategory?.totalPlayers || 1,
              maxValue: comparisonCategory?.maxValue || 100,
              minValue: comparisonCategory?.minValue || 0
            };
          });
          
          console.log('✅ usePlayerRadar: Merged base data with comparison data');
          setRadarData(mergedData);
        } else {
          console.warn('⚠️ usePlayerRadar: No comparisonData in response, using base data with defaults');
          const dataWithDefaults = currentBaseData.map(item => ({
            ...item,
            comparisonAverage: 50,
            basePercentile: item.percentile
          }));
          setRadarData(dataWithDefaults);
        }
      } else {
        console.error('❌ usePlayerRadar: Comparison API failed:', response.status);
        const dataWithDefaults = currentBaseData.map(item => ({
          ...item,
          comparisonAverage: 50,
          basePercentile: item.percentile
        }));
        setRadarData(dataWithDefaults);
      }
      
    } catch (err) {
      console.error('❌ usePlayerRadar: Error applying filters:', err);
      const dataWithDefaults = currentBaseData.map(item => ({
        ...item,
        comparisonAverage: 50,
        basePercentile: item.percentile
      }));
      setRadarData(dataWithDefaults);
    }
  }, [playerId]);

  // Load initial data when playerId changes
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    radarData,
    filterOptions,
    loading,
    error,
    applyFilters,
    hasData: baseData.length > 0
  };
};