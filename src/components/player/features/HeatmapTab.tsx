"use client";

import { useState, useEffect } from 'react';

import PositionMap from '@/components/player/PositionMap';
import { usePositionLevels } from '@/hooks/player/usePositionLevels';
import type { Player } from '@/types/player';

interface HeatmapTabProps {
  player: Player;
}

interface PlayerRole {
  role_name: string;
  percentage: number;
}

export default function HeatmapTab({ player }: HeatmapTabProps) {
  const {
    positionLevels,
    isLoading: positionLevelsLoading,
  } = usePositionLevels(player.id_player);

  const [playerRoles, setPlayerRoles] = useState<PlayerRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch player roles
  useEffect(() => {
    const fetchPlayerRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await fetch(`/api/player/${player.id_player}/roles`);
        if (response.ok) {
          const data = await response.json();
          setPlayerRoles(data.roles || []);
        }
      } catch (error) {
        console.error('Error fetching player roles:', error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchPlayerRoles();
  }, [player.id_player]);

  return (
    <div className="space-y-8">
      {/* ON THE PITCH Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#8c1a10]">ON THE PITCH</h3>
        </div>

        {/* Football Pitch with Position Levels */}
        <div className="relative rounded-lg overflow-hidden">
          <PositionMap
            positionLevels={positionLevels}
            isLoading={positionLevelsLoading}
            playerName={player.player_name}
          />
        </div>
      </div>

      {/* PLAYER ROLE Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-xl font-bold text-[#8c1a10]">PLAYER ROLE</h3>
        </div>

        {/* Player Roles with horizontal bars */}
        {rolesLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[#6d6d6d]">Loading player roles...</span>
          </div>
        ) : playerRoles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[#6d6d6d]">No role data available for this player</span>
          </div>
        ) : (
          <div className="space-y-3">
            {playerRoles.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                {/* Role name */}
                <div className="w-48 text-sm text-[#2e3138] font-medium">
                  {item.role_name}
                </div>

                {/* Bar container */}
                <div className="flex-1 relative h-5 bg-gray-100 rounded">
                  {/* Filled bar */}
                  <div
                    className="absolute left-0 top-0 h-full rounded transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.percentage > 0 ? '#a85a52' : '#d1d5db'
                    }}
                  />
                </div>

                {/* Percentage label */}
                <div className="w-12 text-sm text-[#2e3138] font-medium text-right">
                  {Math.round(item.percentage)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
