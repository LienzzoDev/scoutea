import { useState, useCallback } from 'react';

import type { Competition } from '@/lib/services/competition-service';

export { type Competition };

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchCompetitions = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/competitions${query ? `?search=${query}` : ''}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch competitions: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Competitions array:', data.competitions);
      console.log('Competitions length:', data.competitions?.length || 0);
      setCompetitions(data.competitions || []);
    } catch (err) {
      console.error('Error in searchCompetitions:', err);
      setError(err as Error);
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompetition = useCallback(async (id: string): Promise<Competition | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/competitions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch competition');
      return await response.json();
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    competitions,
    loading,
    error,
    searchCompetitions,
    getCompetition,
  };
};
