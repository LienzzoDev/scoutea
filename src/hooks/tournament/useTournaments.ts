import { useState, useCallback } from 'react';

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

  const searchTournaments = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call when tournaments API is implemented
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay
      
      const mockTournaments: Tournament[] = [
        {
          id: '1',
          name: 'Copa Mundial FIFA 2024',
          startDate: '2024-06-15',
          endDate: '2024-07-15',
          location: 'Qatar'
        },
        {
          id: '2',
          name: 'UEFA Champions League',
          startDate: '2024-09-01',
          endDate: '2024-05-30',
          location: 'Europa'
        },
        {
          id: '3',
          name: 'Copa América 2024',
          startDate: '2024-06-20',
          endDate: '2024-07-14',
          location: 'Estados Unidos'
        }
      ];
      
      // Filter by query if provided
      const filteredTournaments = query 
        ? mockTournaments.filter(t => 
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.location.toLowerCase().includes(query.toLowerCase())
          )
        : mockTournaments;
      
      setTournaments(filteredTournaments);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTournament = useCallback(async (id: string): Promise<Tournament | null> => {
    setLoading(true);
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockTournament: Tournament = {
        id,
        name: `Tournament ${id}`,
        startDate: '2024-06-15',
        endDate: '2024-07-15',
        location: 'Mock Location'
      };
      
      return mockTournament;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tournaments,
    loading,
    error,
    searchTournaments,
    getTournament,
  };
};