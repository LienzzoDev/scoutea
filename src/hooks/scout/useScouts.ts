import { useState } from 'react';

export interface Scout {
  id: string;
  name: string;
  email: string;
  specialization: string;
  rating: number;
  // Add other scout properties as needed
}

export const useScouts = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchScouts = async (query?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scouts${query ? `?search=${query}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch scouts');
      const data = await response.json();
      setScouts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getScout = async (id: string): Promise<Scout | null> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scouts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch scout');
      return await response.json();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    scouts,
    loading,
    error,
    searchScouts,
    getScout,
  };
};