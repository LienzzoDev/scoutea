import { useState, useCallback } from 'react';

import type { Player, PlayerSearchResult, CrearJugadorData } from '@/types/player';

export interface SearchPlayersOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    player_name?: string;
    position_player?: string;
    team_name?: string;
    nationality_1?: string;
    min_age?: number;
    max_age?: number;
    min_rating?: number;
    max_rating?: number;
    on_loan?: boolean;
  };
}

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const searchPlayers = useCallback(async (options: SearchPlayersOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 usePlayers: Starting search with options:', options);
      
      // Construir parámetros de URL
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      
      // Agregar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(`filters[${key}]`, value.toString());
          }
        });
      }

      const url = `/api/players-simple?${params.toString()}`;
      console.log('🔍 usePlayers: Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.__error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data: PlayerSearchResult = await response.json();
      console.log('✅ usePlayers: Received data:', {
        playersCount: data.players?.length || 0,
        pagination: data.pagination
      });
      
      setPlayers(data.players || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al buscar jugadores';
      setError(errorMessage);
      console.error('❌ usePlayers: Error searching players:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlayer = async (id: string): Promise<Player | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/players/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch player');
      }
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener jugador';
      setError(errorMessage);
      console.error('Error fetching player:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const crearJugador = async (data: CrearJugadorData): Promise<Player | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create player');
      }
      
      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear jugador';
      setError(errorMessage);
      console.error('Error creating player:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    players,
    loading,
    error,
    pagination,
    searchPlayers,
    getPlayer,
    crearJugador,
  };
};