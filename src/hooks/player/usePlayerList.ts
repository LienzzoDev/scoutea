import { useState, useEffect, useCallback, useMemo } from 'react';
import { handleApiResponse } from '@/lib/utils/api-response';

interface PlayerListItem {
  id: string;
  userId: string;
  playerId: string;
  createdAt: string;
  updatedAt: string;
  player: {
    id_player: string;
    player_name: string;
    team_name: string | null;
    position_player: string | null;
    nationality_1: string | null;
    player_rating: number | null;
    photo_coverage: string | null;
  };
}

export const usePlayerList = () => {
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar la lista de jugadores del usuario
  const loadPlayerList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 usePlayerList: Loading user player list...');
      
      const response = await fetch('/api/player-list');
      const result = await handleApiResponse(response);
      
      if (result.success) {
        const playerIds = result.data?.playerList?.map((item: PlayerListItem) => item.playerId) || [];
        console.log('✅ usePlayerList: Loaded player list:', playerIds.length);
        setPlayerList(playerIds);
      } else {
        console.error('❌ usePlayerList: Failed to load player list:', result.error);
        setError(result.error || 'Error al cargar la lista');
        setPlayerList([]);
      }
    } catch (err) {
      console.error('❌ usePlayerList: Error loading player list:', err);
      setError('Error de conexión');
      setPlayerList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Añadir jugador a la lista
  const addToList = useCallback(async (playerId: string): Promise<boolean> => {
    try {
      console.log('🚀 usePlayerList: Adding player to list:', playerId);
      setError(null);
      
      const response = await fetch('/api/player-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });

      const result = await handleApiResponse(response);
      
      if (result.success) {
        setPlayerList(prev => [...prev, playerId]);
        console.log('✅ usePlayerList: Player added to list successfully');
        return true;
      } else {
        console.error('❌ usePlayerList: Failed to add player to list:', result.error);
        setError(result.error || 'Error al añadir jugador');
        return false;
      }
    } catch (err) {
      console.error('❌ usePlayerList: Error adding player to list:', err);
      setError('Error de conexión');
      return false;
    }
  }, []);

  // Remover jugador de la lista
  const removeFromList = useCallback(async (playerId: string): Promise<boolean> => {
    try {
      console.log('🚀 usePlayerList: Removing player from list:', playerId);
      setError(null);
      
      const response = await fetch(`/api/player-list/${playerId}`, {
        method: 'DELETE',
      });

      const result = await handleApiResponse(response);
      
      if (result.success) {
        setPlayerList(prev => prev.filter(id => id !== playerId));
        console.log('✅ usePlayerList: Player removed from list successfully');
        return true;
      } else {
        console.error('❌ usePlayerList: Failed to remove player from list:', result.error);
        setError(result.error || 'Error al remover jugador');
        return false;
      }
    } catch (err) {
      console.error('❌ usePlayerList: Error removing player from list:', err);
      setError('Error de conexión');
      return false;
    }
  }, []);

  // Verificar si un jugador está en la lista (memoizado para mejor performance)
  const isInList = useCallback((playerId: string): boolean => {
    return playerList.includes(playerId);
  }, [playerList]);

  // Crear un Set para búsquedas más eficientes
  const playerListSet = useMemo(() => new Set(playerList), [playerList]);

  // Versión optimizada de isInList usando Set
  const isInListOptimized = useCallback((playerId: string): boolean => {
    return playerListSet.has(playerId);
  }, [playerListSet]);

  // Cargar la lista al montar el hook
  useEffect(() => {
    loadPlayerList();
  }, [loadPlayerList]);

  return {
    playerList,
    loading,
    error,
    addToList,
    removeFromList,
    isInList: isInListOptimized, // Usar la versión optimizada
    loadPlayerList,
  };
};