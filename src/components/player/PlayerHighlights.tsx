"use client";

import { Play } from "lucide-react";

import type { Player } from "@/types/player";

interface PlayerHighlightsProps {
  _player: Player;
}

export default function PlayerHighlights({ player }: PlayerHighlightsProps) {
  return (
    <div className="bg-white p-6">
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-[#8c1a10] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#2e3138] mb-2">
          Player Highlights
        </h3>
        <p className="text-[#6d6d6d] mb-8">
          Video highlights and key moments for {player.player_name} will be displayed here.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-8 h-8 text-[#6d6d6d] mx-auto mb-2" />
              <p className="text-sm text-[#6d6d6d]">Season Highlights</p>
            </div>
          </div>
          <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-8 h-8 text-[#6d6d6d] mx-auto mb-2" />
              <p className="text-sm text-[#6d6d6d]">Best Goals</p>
            </div>
          </div>
          <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-8 h-8 text-[#6d6d6d] mx-auto mb-2" />
              <p className="text-sm text-[#6d6d6d]">Key Passes</p>
            </div>
          </div>
          <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-8 h-8 text-[#6d6d6d] mx-auto mb-2" />
              <p className="text-sm text-[#6d6d6d]">Defensive Actions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}