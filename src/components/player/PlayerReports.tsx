"use client";

import { Play } from "lucide-react";

import type { Player } from "@/types/player";

interface PlayerReportsProps {
  player: Player;
}

export default function PlayerReports({ player }: PlayerReportsProps) {
  return (
    <div className="bg-white p-6">
      {/* Overall Rating */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="text-2xl font-bold text-[#2e3138]">5.0</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 bg-[#8c1a10] rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs">⚽</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reports Masonry Grid */}
      <div className="columns-2 gap-6 space-y-6">
        {/* Report Card 1 */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[#2e3138]">Gines Mesas</h3>
              <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">⚽</span>
                </div>
              ))}
            </div>
          </div>
          <img
            src="/player-detail-placeholder.svg"
            alt="Player"
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <p className="text-sm text-[#6d6d6d] mb-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <p className="text-xs text-[#6d6d6d]">XX/XX/XXXX</p>
        </div>

        {/* Report Card 2 */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[#2e3138]">Gines Mesas</h3>
              <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-[#2e3138]">5.0</span>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">⚽</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-[#6d6d6d] mb-3">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <p className="text-xs text-[#6d6d6d]">XX/XX/XXXX</p>
        </div>

        {/* Report Card 3 */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[#2e3138]">Gines Mesas</h3>
              <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">⚽</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mb-3">
            <img
              src="/player-detail-placeholder.svg"
              alt="Player"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button className="absolute bottom-2 right-2 bg-[#8c1a10] text-white px-3 py-1 rounded-lg flex items-center gap-1">
              <Play className="w-3 h-3" />
              <span className="text-xs">Play</span>
            </button>
          </div>
          <p className="text-sm text-[#6d6d6d]">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>

        {/* Report Card 4 */}
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-[#2e3138]">Gines Mesas</h3>
              <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">⚽</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mb-3">
            <img
              src="/player-detail-placeholder.svg"
              alt="Player"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
          <p className="text-sm text-[#6d6d6d]">Lorem ipsum dolor sit amet...</p>
        </div>
      </div>
    </div>
  );
}