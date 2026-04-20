"use client";

import { useState, useEffect } from 'react';

export interface GameFlowData {
  foot: {
    leftTendency: number;
    rightTendency: number;
    leftDominance: number;
    leftDominanceLevel: number;
    rightDominance: number;
    rightDominanceLevel: number;
  };
  attackingMode: {
    positionalTendency: number;
    directTendency: number;
    positionalDominance: number;
    positionalDominanceLevel: number;
    directDominance: number;
    directDominanceLevel: number;
  };
  defendingMode: {
    lowBlockTendency: number;
    highBlockTendency: number;
    lowBlockDominance: number;
    lowBlockDominanceLevel: number;
    highBlockDominance: number;
    highBlockDominanceLevel: number;
  };
  influence: {
    defensiveTendency: number;
    offensiveTendency: number;
    defensiveDominance: number;
    defensiveDominanceLevel: number;
    offensiveDominance: number;
    offensiveDominanceLevel: number;
  };
  spaces: {
    tightTendency: number;
    openTendency: number;
    tightDominance: number;
    tightDominanceLevel: number;
    openDominance: number;
    openDominanceLevel: number;
  };
}

interface UseGameFlowReturn {
  gameFlowData: GameFlowData | null;
  isLoading: boolean;
  error: string | null;
}

export function useGameFlow(playerId: string | number | undefined): UseGameFlowReturn {
  const [gameFlowData, setGameFlowData] = useState<GameFlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameFlow() {
      if (!playerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/player/${playerId}/game-flow`);

        if (!response.ok) {
          throw new Error('Failed to fetch game flow data');
        }

        const data = await response.json();
        setGameFlowData(data.gameFlow);
      } catch (err) {
        console.error('Error fetching game flow data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setGameFlowData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGameFlow();
  }, [playerId]);

  return { gameFlowData, isLoading, error };
}
