import { useState, useEffect } from 'react';

import { EMPTY_FILTERS, type ChartFilterValues } from '@/components/player/stats/ChartFilters';
import type { PlayerStatsByField } from '@/lib/services/player-stats-service';
import type { StatsPeriod } from '@/lib/utils/stats-period-utils';
import type { Player } from '@/types/player';

import { usePlayerList } from './usePlayerList';

export const usePlayerProfile = (playerId: string) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [activeStatsTab, setActiveStatsTab] = useState('period');
  const [activeFeaturesTab, setActiveFeaturesTab] = useState('heatmap');
  const [isSaving, setIsSaving] = useState(false);

  // Period stats state
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('3m');
  const [periodStats, setPeriodStats] = useState<Record<string, PlayerStatsByField>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSampleSize, setStatsSampleSize] = useState<number | null>(null);
  // Filtros multi-select aplicados al cohort del "By Period".
  const [statsFilters, setStatsFilters] = useState<ChartFilterValues>(EMPTY_FILTERS);

  // Hook para manejar la lista de jugadores
  const { 
    addToList, 
    removeFromList, 
    isInList,
    loading: listLoading,
    error: listError 
  } = usePlayerList();

  const fetchPlayer = async () => {
    if (!playerId) {
      console.log('⚠️ No playerId provided');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/api/players/${playerId}`;
      
      console.log('🔍 Fetching player from:', url);
      console.log('📋 Player ID:', playerId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('📡 Error response data:', errorData);
          errorMessage = errorData.error || errorData.__error || errorData.message || errorMessage;
        } catch (_parseError) {
          console.log('📡 Could not parse error response as JSON');
          // Try to get response as text
          try {
            const errorText = await response.text();
            console.log('📡 Error response text:', errorText);
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (_textError) {
            console.log('📡 Could not get error response as text either');
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Player data received:', {
        hasData: !!data,
        playerId: data?.id_player,
        playerName: data?.player_name,
        dataKeys: data ? Object.keys(data) : []
      });
      
      setPlayer(data);
    } catch (err) {
      console.error('❌ Error fetching player:', err);
      console.error('📋 Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        playerId,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching player data';
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayer();
  }, [playerId]);

  // Fetch period stats when period or filters change.
  // Los filtros multi-select se serializan como CSV.
  const fetchPeriodStats = async () => {
    if (!playerId) return;

    setStatsLoading(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (statsFilters.positions.length > 0) params.append('positions', statsFilters.positions.join(','));
      if (statsFilters.nationalities.length > 0) params.append('nationalities', statsFilters.nationalities.join(','));
      if (statsFilters.competitions.length > 0) params.append('competitions', statsFilters.competitions.join(','));
      if (statsFilters.ageMin) params.append('ageMin', statsFilters.ageMin);
      if (statsFilters.ageMax) params.append('ageMax', statsFilters.ageMax);
      if (statsFilters.trfmMin) params.append('trfmMin', statsFilters.trfmMin);
      if (statsFilters.trfmMax) params.append('trfmMax', statsFilters.trfmMax);

      const url = `${baseUrl}/api/players/${playerId}/stats-by-period?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch period stats:', response.statusText);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPeriodStats(data.data);
        setStatsSampleSize(typeof data.sampleSize === 'number' ? data.sampleSize : null);
      }
    } catch (err) {
      console.error('Error fetching period stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats' && activeStatsTab === 'period') {
      fetchPeriodStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, selectedPeriod, activeTab, activeStatsTab, statsFilters]);

  const refreshPlayer = () => {
    fetchPlayer();
  };

  // Función para manejar toggle de lista (añadir/remover jugador)
  const handleToggleList = async () => {
    if (!player?.id_player) return;

    // playerList IDs se normalizan a string en usePlayerList.
    const idStr = String(player.id_player);
    setIsSaving(true);
    try {
      const isCurrentlyInList = isInList(idStr);

      if (isCurrentlyInList) {
        console.log('🚀 Removing player from list:', idStr);
        await removeFromList(idStr);
      } else {
        console.log('🚀 Adding player to list:', idStr);
        await addToList(idStr);
      }
    } catch (error) {
      console.error('❌ Error toggling player list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar si el jugador está en la lista
  const isPlayerInList = player?.id_player ? isInList(String(player.id_player)) : false;

  const getStatValue = (
    metricName: string,
    field: 'totalValue' | 'p90Value' | 'averageValue' | 'maximumValue' | 'percentile'
  ): string => {
    const stat = periodStats[metricName];
    if (!stat) return '-';
    return stat[field] || '-';
  };

  return {
    // State
    activeTab,
    setActiveTab,
    activeStatsTab,
    setActiveStatsTab,
    activeFeaturesTab,
    setActiveFeaturesTab,
    isSaving,
    player,
    loading,
    error,

    // Period stats state
    selectedPeriod,
    setSelectedPeriod,
    periodStats,
    statsLoading,
    statsSampleSize,
    statsFilters,
    setStatsFilters,

    // Derived state
    isPlayerInList,
    listLoading,

    // Functions
    handleToggleList,
    getStatValue,
    refreshPlayer,
  };
};