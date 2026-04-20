"use client";

import { Badge } from "@/components/ui/badge";
import { usePlayerAvgValues } from "@/hooks/player/usePlayerAvgValues";
import { formatMoneyFull } from "@/lib/utils/format-money";
import type { Player } from "@/types/player";

interface PlayerInfoProps {
  player: Player;
}

// Función helper para mostrar datos con fallback a campos correctos
const getDisplayValue = (primary?: string | number | null, correct?: string | number | null, fallback: string = "Not set"): string => {
  if (primary !== null && primary !== undefined && primary !== "") return String(primary);
  if (correct !== null && correct !== undefined && correct !== "") return String(correct);
  return fallback;
};

export default function PlayerInfo({ player }: PlayerInfoProps) {
  const { avgValues, loading: avgLoading } = usePlayerAvgValues(player);
  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-2 gap-x-12">
        {/* Left Column */}
        <div className="space-y-0">
          {/* Sección: Información Personal */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Name:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.complete_player_name, player.player_name, "Name not set")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Date of Birth:</span>
              <span className="font-medium text-[#2e3138]">
                {(player.correct_date_of_birth || player.date_of_birth)
                  ? new Date(player.correct_date_of_birth || player.date_of_birth!).toLocaleDateString('en-US')
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Age:</span>
              <span className="font-medium text-[#2e3138]">
                {player.age ? `${player.age} years` : "Not set"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Age:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#2e3138]">
                    {avgLoading ? "Calculating..." : avgValues.age_value ? formatMoneyFull(avgValues.age_value) : "To calculate"}
                  </div>
                  {avgValues.age_value_percent !== null && avgValues.age_value_percent !== undefined && Math.abs(avgValues.age_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.age_value_percent > 0 ? 'text-red-500' : avgValues.age_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                    }`}>
                      ({avgValues.age_value_percent > 0 ? '+' : ''}{avgValues.age_value_percent.toFixed(1)}%)
                    </div>
                  )}
                </div>
                {avgValues.age_value_percent !== null && avgValues.age_value_percent !== undefined && Math.abs(avgValues.age_value_percent) < 1000 && (
                  <Badge className={`text-white text-xs px-1 py-0 ${
                    avgValues.age_value_percent > 0
                      ? 'bg-red-500'
                      : avgValues.age_value_percent < 0
                      ? 'bg-[#3cc500]'
                      : 'bg-gray-500'
                  }`}>
                    {avgValues.age_value_percent > 0 ? '▲' : avgValues.age_value_percent < 0 ? '▼' : '●'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="h-2"></div>

          {/* Sección: Características Físicas */}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Position:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_position_player, player.position_player)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Avg Value by Position:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculating..." : avgValues.position_value ? formatMoneyFull(avgValues.position_value) : "To calculate"}
                </div>
                {avgValues.position_value_percent !== null && avgValues.position_value_percent !== undefined && Math.abs(avgValues.position_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.position_value_percent > 0 ? 'text-red-500' : avgValues.position_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.position_value_percent > 0 ? '+' : ''}{avgValues.position_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.position_value_percent !== null && avgValues.position_value_percent !== undefined && Math.abs(avgValues.position_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.position_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.position_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.position_value_percent > 0 ? '▲' : avgValues.position_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Preferred Foot:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_foot, player.foot)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Height:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_height || player.height)
                ? `${player.correct_height || player.height} cm`
                : "Not set"}
            </span>
          </div>

          <div className="h-2"></div>

          {/* Sección: Nacionalidad */}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Nationality:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_1, player.nationality_1)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Avg Value by Nationality:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculating..." : avgValues.nationality_value ? formatMoneyFull(avgValues.nationality_value) : "To calculate"}
                </div>
                {avgValues.nationality_value_percent !== null && avgValues.nationality_value_percent !== undefined && Math.abs(avgValues.nationality_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.nationality_value_percent > 0 ? 'text-red-500' : avgValues.nationality_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.nationality_value_percent > 0 ? '+' : ''}{avgValues.nationality_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.nationality_value_percent !== null && avgValues.nationality_value_percent !== undefined && Math.abs(avgValues.nationality_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.nationality_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.nationality_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.nationality_value_percent > 0 ? '▲' : avgValues.nationality_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Second Nationality:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_2, player.nationality_2, "N/A")}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">National tier:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_national_tier, player.national_tier)}
            </span>
          </div>

          <div className="h-2"></div>

          {/* Sección: Agente */}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Agent:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_agency, player.agency)}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0">
          {/* Sección: Equipo */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Team:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.correct_team_name, player.team_name)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Team Country:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.team_country, null)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Team Level:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.team_level, null)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Team:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#2e3138]">
                    {avgLoading ? "Calculating..." : avgValues.team_competition_value ? formatMoneyFull(avgValues.team_competition_value) : "To calculate"}
                  </div>
                  {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.team_competition_value_percent > 0 ? 'text-red-500' : avgValues.team_competition_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                    }`}>
                      ({avgValues.team_competition_value_percent > 0 ? '+' : ''}{avgValues.team_competition_value_percent.toFixed(1)}%)
                    </div>
                  )}
                </div>
                {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                  <Badge className={`text-white text-xs px-1 py-0 ${
                    avgValues.team_competition_value_percent > 0
                      ? 'bg-[#3cc500]' // Inverted
                      : avgValues.team_competition_value_percent < 0
                      ? 'bg-red-500' // Inverted
                      : 'bg-gray-500'
                  }`}>
                    {avgValues.team_competition_value_percent > 0 ? '▲' : avgValues.team_competition_value_percent < 0 ? '▼' : '●'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="h-2"></div>

          {/* Sección: Préstamo y Club Propietario */}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">On Loan:</span>
            <span className="font-medium text-[#2e3138]">
              {player.on_loan === true ? "Yes" : player.on_loan === false ? "No" : "To confirm"}
            </span>
          </div>
          {player.on_loan && (
            <>
              <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
                <span className="text-[#6d6d6d] text-sm">Owner Club:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club, null)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
                <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium text-[#2e3138]">
                      {avgLoading ? "Calculating..." : avgValues.owner_club_value ? formatMoneyFull(avgValues.owner_club_value) : "To calculate"}
                    </div>
                    {avgValues.owner_club_value_percent !== null && avgValues.owner_club_value_percent !== undefined && Math.abs(avgValues.owner_club_value_percent) < 1000 && (
                      <div className={`text-xs ${
                        avgValues.owner_club_value_percent > 0 ? 'text-red-500' : avgValues.owner_club_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                      }`}>
                        ({avgValues.owner_club_value_percent > 0 ? '+' : ''}{avgValues.owner_club_value_percent.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                  {avgValues.owner_club_value_percent !== null && avgValues.owner_club_value_percent !== undefined && Math.abs(avgValues.owner_club_value_percent) < 1000 && (
                    <Badge className={`text-white text-xs px-1 py-0 ${
                      avgValues.owner_club_value_percent > 0
                        ? 'bg-[#3cc500]' // Inverted
                        : avgValues.owner_club_value_percent < 0
                        ? 'bg-red-500' // Inverted
                        : 'bg-gray-500'
                    }`}>
                      {avgValues.owner_club_value_percent > 0 ? '▲' : avgValues.owner_club_value_percent < 0 ? '▼' : '●'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
                <span className="text-[#6d6d6d] text-sm">Owner Country:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club_country, null)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Contract End:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_contract_end || player.contract_end)
                ? new Date(player.correct_contract_end || player.contract_end!).toLocaleDateString('en-US')
                : "Not set"}
            </span>
          </div>

          <div className="h-2"></div>

          {/* Sección: Competición */}
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Competition:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.team_competition, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Avg Value by competition:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculating..." : avgValues.team_competition_value ? formatMoneyFull(avgValues.team_competition_value) : "To calculate"}
                </div>
                {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.team_competition_value_percent > 0 ? 'text-red-500' : avgValues.team_competition_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.team_competition_value_percent > 0 ? '+' : ''}{avgValues.team_competition_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.team_competition_value_percent > 0
                    ? 'bg-[#3cc500]'
                    : avgValues.team_competition_value_percent < 0
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.team_competition_value_percent > 0 ? '▲' : avgValues.team_competition_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Competition Country:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_country, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Competition Tier:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_tier, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Competition Level:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_level, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-gray-50 rounded-lg px-4 mb-1.5">
            <span className="text-[#6d6d6d] text-sm">Avg Value by competition level:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculating..." : avgValues.competition_level_value ? formatMoneyFull(avgValues.competition_level_value) : "To calculate"}
                </div>
                {avgValues.competition_level_value_percent !== null && avgValues.competition_level_value_percent !== undefined && Math.abs(avgValues.competition_level_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.competition_level_value_percent > 0 ? 'text-red-500' : avgValues.competition_level_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.competition_level_value_percent > 0 ? '+' : ''}{avgValues.competition_level_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.competition_level_value_percent !== null && avgValues.competition_level_value_percent !== undefined && Math.abs(avgValues.competition_level_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.competition_level_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.competition_level_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.competition_level_value_percent > 0 ? '▲' : avgValues.competition_level_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>

          <div className="h-2"></div>


        </div>
      </div>
    </div>
  );
}
