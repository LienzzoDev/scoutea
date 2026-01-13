"use client";

import { useState, useEffect } from 'react';

export interface PositionLevels {
  gk_level: number | null;
  rb_level: number | null;
  cb_level: number | null;
  lb_level: number | null;
  rwb_level: number | null;
  dm_level: number | null;
  lwb_level: number | null;
  rm_level: number | null;
  cm_level: number | null;
  lm_level: number | null;
  rw_level: number | null;
  am_level: number | null;
  lw_level: number | null;
  st_level: number | null;
}

interface UsePositionLevelsReturn {
  positionLevels: PositionLevels | null;
  isLoading: boolean;
  error: string | null;
}

export function usePositionLevels(playerId: string | number | undefined): UsePositionLevelsReturn {
  const [positionLevels, setPositionLevels] = useState<PositionLevels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPositionLevels() {
      if (!playerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/player/${playerId}/position-levels`);

        if (!response.ok) {
          throw new Error('Failed to fetch position levels');
        }

        const data = await response.json();
        setPositionLevels(data.positionLevels);
      } catch (err) {
        console.error('Error fetching position levels:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPositionLevels(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPositionLevels();
  }, [playerId]);

  return { positionLevels, isLoading, error };
}
