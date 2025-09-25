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
  age: number;
  scout_ranking: number;
  open_to_work: boolean;
}

export const useScouts = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchScouts = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call when scouts API is implemented
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockScouts: any[] = [
        {
          id: '1',
          id_scout: '1',
          name: 'Carlos Rodríguez',
          scout_name: 'Carlos Rodríguez',
          email: 'carlos@scoutea.com',
          specialization: 'Delanteros',
          rating: 4.8,
          scout_level: 'Expert',
          scout_elo: 1850,
          total_reports: 45,
          roi: 15.2,
          max_profit_report: 2500000,
          nationality: 'Spain',
          country: 'Spain',
          nationality_expertise: 'La Liga',
          age: 32,
          scout_ranking: 15,
          open_to_work: true
        },
        {
          id: '2',
          id_scout: '2',
          name: 'María González',
          scout_name: 'María González',
          email: 'maria@scoutea.com',
          specialization: 'Defensas',
          rating: 4.6,
          scout_level: 'Advanced',
          scout_elo: 1720,
          total_reports: 32,
          roi: 12.8,
          max_profit_report: 1800000,
          nationality: 'Argentina',
          country: 'Argentina',
          nationality_expertise: 'Primera División',
          age: 28,
          scout_ranking: 23,
          open_to_work: false
        },
        {
          id: '3',
          id_scout: '3',
          name: 'Juan Pérez',
          scout_name: 'Juan Pérez',
          email: 'juan@scoutea.com',
          specialization: 'Mediocampistas',
          rating: 4.7,
          scout_level: 'Expert',
          scout_elo: 1790,
          total_reports: 38,
          roi: 14.1,
          max_profit_report: 2100000,
          nationality: 'Mexico',
          country: 'Mexico',
          nationality_expertise: 'Liga MX',
          age: 35,
          scout_ranking: 18,
          open_to_work: true
        }
      ];
      
      // Filter by query if provided
      const filteredScouts = query 
        ? mockScouts.filter(s => 
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.specialization.toLowerCase().includes(query.toLowerCase())
          )
        : mockScouts;
      
      setScouts(filteredScouts);
    } catch (err) {
      setError(err as Error);
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