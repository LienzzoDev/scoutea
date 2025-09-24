import { useState } from 'react';

export interface Scout {
  id: string;
  name: string;
  email: string;
  specialization: string;
  // Add other scout properties as needed
}

export const useScoutList = () => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scouts');
      if (!response.ok) throw new Error('Failed to fetch scouts');
      const data = await response.json();
      setScouts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    scouts,
    loading,
    error,
    fetchScouts,
  };
};