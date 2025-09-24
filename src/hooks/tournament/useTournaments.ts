import { useState } from 'react';

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  // Add other tournament properties as needed
}

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchTournaments = async (query?: string) => {
    setLoading(true);
    try {
      // Mock implementation - replace with actual API call
      const response = await fetch(`/api/tournaments${query ? `?search=${query}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getTournament = async (id: string): Promise<Tournament | null> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch tournament');
      return await response.json();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    tournaments,
    loading,
    error,
    searchTournaments,
    getTournament,
  };
};