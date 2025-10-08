import { useState, useCallback } from 'react';

export interface Team {
  id: string;
  name: string;
  league: string;
  country: string;
  // Add other team properties as needed
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchTeams = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teams${query ? `?search=${query}` : ''}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Teams array:', data.teams);
      console.log('Teams length:', data.teams?.length || 0);
      // La API devuelve { teams: [...], pagination: {...} }
      setTeams(data.teams || []);
    } catch (err) {
      console.error('Error in searchTeams:', err);
      setError(err as Error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeam = useCallback(async (id: string): Promise<Team | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teams/${id}`);
      if (!response.ok) throw new Error('Failed to fetch team');
      return await response.json();
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teams,
    loading,
    error,
    searchTeams,
    getTeam,
  };
};