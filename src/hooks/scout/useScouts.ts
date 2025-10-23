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
  join_date?: string;
  createdAt?: string; // Kept for backward compatibility, maps to join_date
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
        setError(null); // Clear any previous errors
      } else {
        let errorData: any = {};
        let errorText = '';

        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorText = await response.text();
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }

        console.error('❌ useScouts: Failed to load scouts from API:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          errorData,
          errorText: errorText.substring(0, 200), // Log first 200 chars
        });

        // Return empty array - only show real scouts from database
        setScouts([]);
        setError(new Error(`Failed to load scouts: ${response.status} ${response.statusText}`));
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
      const response = await fetch(`/api/scouts/${id}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ useScouts: Loaded scout from API:', id);
        return data.scout || null;
      } else {
        console.error('❌ useScouts: Failed to load scout from API');
        return null;
      }
    } catch (err) {
      console.error('❌ useScouts: Error loading scout:', err);
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