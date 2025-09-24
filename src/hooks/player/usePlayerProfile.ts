import { useState, useEffect } from 'react';

import type { Player } from '@/types/player';

export const usePlayerProfile = (playerId: string) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [activeStatsTab, setActiveStatsTab] = useState('overview');
  const [activeFeaturesTab, setActiveFeaturesTab] = useState('radar');
  const [isSaving, setIsSaving] = useState(false);

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
      console.error('❌ Error fetching player:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
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

  const refreshPlayer = () => {
    fetchPlayer();
  };

  // Mock functions for player list management
  const isPlayerInList = false;
  const listLoading = false;
  
  const handleToggleList = async () => {
    setIsSaving(true);
    // Mock implementation
    setTimeout(() => setIsSaving(false), 1000);
  };

  const getStatValue = (_statName: string) => {
    // Mock implementation
    return Math.floor(Math.random() * 100);
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
    
    // Derived state
    isPlayerInList,
    listLoading,
    
    // Functions
    handleToggleList,
    getStatValue,
    refreshPlayer,
  };
};