"use client";

import type { Player } from "@/types/player";

import { HeatmapTab, RadarsTab, GameFlowTab } from './features';

interface PlayerFeaturesProps {
  player: Player;
  activeFeaturesTab: string;
  onFeaturesTabChange: (tab: string) => void;
}

// Tab configuration
const FEATURES_TABS = [
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'radars', label: 'Radars' },
  { id: 'game-flow', label: 'Game Flow' },
] as const;

export default function PlayerFeatures({
  player,
  activeFeaturesTab,
  onFeaturesTabChange,
}: PlayerFeaturesProps) {
  return (
    <div className="bg-white p-6">
      {/* Features Sub-tabs */}
      <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
        {FEATURES_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`pb-3 font-medium transition-colors ${
              activeFeaturesTab === tab.id
                ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
                : "text-[#6d6d6d] hover:text-[#2e3138]"
            }`}
            onClick={() => onFeaturesTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Features Content */}
      {activeFeaturesTab === "heatmap" && (
        <HeatmapTab player={player} />
      )}

      {activeFeaturesTab === "radars" && (
        <RadarsTab player={player} />
      )}

      {activeFeaturesTab === "game-flow" && (
        <GameFlowTab playerId={player.id_player} />
      )}
    </div>
  );
}
