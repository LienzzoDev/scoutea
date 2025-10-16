import { useState, useCallback } from 'react';

export interface Team {
  id_team: string;
  team_name: string;
  correct_team_name?: string | null;
  team_country?: string | null;
  url_trfm_advisor?: string | null;
  url_trfm?: string | null;
  owner_club?: string | null;
  owner_club_country?: string | null;
  pre_competition?: string | null;
  competition?: string | null;
  correct_competition?: string | null;
  competition_country?: string | null;
  team_trfm_value?: number | null;
  team_trfm_value_norm?: number | null;
  team_rating?: number | null;
  team_rating_norm?: number | null;
  team_elo?: number | null;
  team_level?: string | null;
  // Additional fields
  short_name?: string | null;
  founded_year?: number | null;
  stadium?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
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