"use client";

import { Badge } from "@/components/ui/badge";
import type { Player } from "@/types/player";

interface PlayerInfoProps {
  player: Player;
}

export default function PlayerInfo({ player }: PlayerInfoProps) {
  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-2 gap-x-16">
        {/* Left Column */}
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Name:</span>
            <span className="font-medium text-[#2e3138]">
              {player.player_name || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Date of Birth:</span>
            <span className="font-medium text-[#2e3138]">
              {player.date_of_birth
                ? new Date(player.date_of_birth).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Age:</span>
            <span className="font-medium text-[#2e3138]">
              {player.age || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Position:</span>
            <span className="font-medium text-[#2e3138]">
              {player.position_player || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Foot:</span>
            <span className="font-medium text-[#2e3138]">
              {player.foot || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Height:</span>
            <span className="font-medium text-[#2e3138]">
              {player.height ? `${player.height} cm` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nationality:</span>
            <span className="font-medium text-[#2e3138]">
              {player.nationality_1 || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                900.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nationality 2:</span>
            <span className="font-medium text-[#2e3138]">
              {player.nationality_2 || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">International:</span>
            <span className="font-medium text-[#2e3138]">
              Loren Ipsum Dolor
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#6d6d6d] text-sm">Agent:</span>
            <span className="font-medium text-[#2e3138]">
              {player.agency || "N/A"}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Team:</span>
            <span className="font-medium text-[#2e3138]">
              {player.team_name || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Country:</span>
            <span className="font-medium text-[#2e3138]">
              {player.team_country || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Team Level:</span>
            <span className="font-medium text-[#2e3138]">N/A</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">On Loan:</span>
            <span className="font-medium text-[#2e3138]">
              {player.on_loan ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Owner Club:</span>
            <span className="font-medium text-[#2e3138]">N/A</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Country:</span>
            <span className="font-medium text-[#2e3138]">N/A</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Contract End:</span>
            <span className="font-medium text-[#2e3138]">
              {player.contract_end
                ? new Date(player.contract_end).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Competition:</span>
            <span className="font-medium text-[#2e3138]">
              {player.team_competition || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Country:</span>
            <span className="font-medium text-[#2e3138]">
              {player.competition_country || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Tier:</span>
            <span className="font-medium text-[#2e3138]">N/A</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Competition Level:</span>
            <span className="font-medium text-[#2e3138]">N/A</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                1.200.000 € (+82%)
              </span>
              <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                ↑
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
