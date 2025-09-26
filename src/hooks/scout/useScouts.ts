import { useState, useCallback } from 'react';

export interface Scout {
  id: string;
  id_scout: string;
  name: string;
  scout_name: string;
  email: string;
  specialization: string;
  rating: number;
  scout_level: string;
  scout_elo: number;
  total_reports: number;
  roi: number;
  max_profit_report: number;
  nationality: string;
  country: string;
  nationality_expertise: string;
  competition_expertise: string;
  age: number;
  scout_ranking: number;
  open_to_work: boolean;
  createdAt?: string;
}

export const useScouts = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchScouts = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      console.log('🔍 useScouts: Searching scouts with query:', query);
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'scout_elo',
        sortOrder: 'desc'
      });

      if (query) {
        params.append('search', query);
      }

      const response = await fetch(`/api/scouts?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ useScouts: Loaded scouts from API:', data.scouts?.length || 0);
        setScouts(data.scouts || []);
      } else {
        console.error('❌ useScouts: Failed to load scouts from API');
        // Fallback a datos mock si la API falla
        const mockScouts: any[] = [
          {
            id: 'scout-mock-1',
            id_scout: 'scout-mock-1',
            name: 'Carlos Rodríguez',
            scout_name: 'Carlos Rodríguez',
            email: 'carlos@scoutea.com',
            scout_level: 'Expert',
            scout_elo: 1850,
            total_reports: 45,
            roi: 15.2,
            max_profit_report: 2500000,
            nationality: 'Spain',
            country: 'Spain',
            nationality_expertise: 'Spain',
            competition_expertise: 'La Liga',
            age: 32,
            scout_ranking: 15,
            open_to_work: true,
            createdAt: new Date().toISOString()
          }
        ];
        setScouts(mockScouts);
      }
    } catch (err) {
      console.error('❌ useScouts: Error loading scouts:', err);
      setError(err as Error);
      // Fallback a datos mock en caso de error
      setScouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getScout = useCallback(async (id: string): Promise<Scout | null> => {
    setLoading(true);
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockScout: Scout = {
        id,
        id_scout: id,
        name: `Scout ${id}`,
        scout_name: `Scout ${id}`,
        email: `scout${id}@scoutea.com`,
        specialization: 'General',
        rating: 4.5,
        scout_level: 'Intermediate',
        scout_elo: 1500,
        total_reports: 20,
        roi: 10.0,
        max_profit_report: 1000000,
        nationality: 'Unknown',
        country: 'Unknown',
        nationality_expertise: 'General',
        age: 30,
        scout_ranking: 50,
        open_to_work: true
      };
      
      return mockScout;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scouts,
    loading,
    error,
    searchScouts,
    getScout,
  };
};