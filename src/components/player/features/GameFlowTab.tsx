"use client";

import { useGameFlow } from '@/hooks/player/useGameFlow';

import { TendencyVisualizer } from './components';

interface GameFlowTabProps {
  playerId: string | number;
}

export default function GameFlowTab({ playerId }: GameFlowTabProps) {
  const { gameFlowData, isLoading, error } = useGameFlow(playerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[#6d6d6d]">Loading game flow data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-red-500">Error loading game flow data</span>
      </div>
    );
  }

  if (!gameFlowData) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[#6d6d6d]">No game flow data available</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="space-y-8">
        {/* FOOT */}
        <TendencyVisualizer
          title="FOOT"
          leftLabel="LEFT"
          rightLabel="RIGHT"
          leftDominanceLevel={gameFlowData.foot.leftDominanceLevel}
          rightDominanceLevel={gameFlowData.foot.rightDominanceLevel}
          tendency={gameFlowData.foot.rightTendency}
        />

        {/* ATTACKING MODE */}
        <TendencyVisualizer
          title="ATTACKING MODE"
          leftLabel="POSITIONAL"
          rightLabel="DIRECT"
          leftDominanceLevel={gameFlowData.attackingMode.positionalDominanceLevel}
          rightDominanceLevel={gameFlowData.attackingMode.directDominanceLevel}
          tendency={gameFlowData.attackingMode.directTendency}
        />

        {/* DEFENDING MODE */}
        <TendencyVisualizer
          title="DEFENDING MODE"
          leftLabel="LOW BLOCK"
          rightLabel="HIGH BLOCK"
          leftDominanceLevel={gameFlowData.defendingMode.lowBlockDominanceLevel}
          rightDominanceLevel={gameFlowData.defendingMode.highBlockDominanceLevel}
          tendency={gameFlowData.defendingMode.highBlockTendency}
        />

        {/* INFLUENCE */}
        <TendencyVisualizer
          title="INFLUENCE"
          leftLabel="DEFENSIVE"
          rightLabel="OFFENSIVE"
          leftDominanceLevel={gameFlowData.influence.defensiveDominanceLevel}
          rightDominanceLevel={gameFlowData.influence.offensiveDominanceLevel}
          tendency={gameFlowData.influence.offensiveTendency}
        />

        {/* SPACES */}
        <TendencyVisualizer
          title="SPACES"
          leftLabel="TIGHT"
          rightLabel="OPEN"
          leftDominanceLevel={gameFlowData.spaces.tightDominanceLevel}
          rightDominanceLevel={gameFlowData.spaces.openDominanceLevel}
          tendency={gameFlowData.spaces.openTendency}
        />
      </div>
    </div>
  );
}
