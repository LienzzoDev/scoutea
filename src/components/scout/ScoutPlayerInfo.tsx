"use client";

import { Badge } from "@/components/ui/badge";
import { usePlayerAvgValues } from "@/hooks/player/usePlayerAvgValues";
import { formatMoneyFull } from "@/lib/utils/format-money";
import type { Player } from "@/types/player";

interface ScoutPlayerInfoProps {
  player: Player;
}

// Helper para mostrar valores con fallback
const getDisplayValue = (
  primary?: string | number | null,
  fallback: string = 'N/A'
): string => {
  if (primary !== null && primary !== undefined && primary !== '') {
    return String(primary)
  }
  return fallback
}

// Componente para mostrar un campo con valor promedio y flecha
function AvgValueField({
  label,
  value,
  percent,
  loading,
  invertColors = false,
}: {
  label: string
  value: number | null | undefined
  percent: number | null | undefined
  loading: boolean
  invertColors?: boolean
}) {
  const showPercent =
    percent !== null && percent !== undefined && Math.abs(percent) < 1000

  // Colores normales: verde es bueno (valor bajo), rojo es malo (valor alto)
  // Colores invertidos: verde es bueno (valor alto), rojo es malo (valor bajo)
  const getColor = (pct: number) => {
    if (invertColors) {
      return pct > 0 ? 'text-[#3cc500]' : pct < 0 ? 'text-red-500' : 'text-gray-500'
    }
    return pct > 0 ? 'text-red-500' : pct < 0 ? 'text-[#3cc500]' : 'text-gray-500'
  }

  const getBadgeColor = (pct: number) => {
    if (invertColors) {
      return pct > 0 ? 'bg-[#3cc500]' : pct < 0 ? 'bg-red-500' : 'bg-gray-500'
    }
    return pct > 0 ? 'bg-red-500' : pct < 0 ? 'bg-[#3cc500]' : 'bg-gray-500'
  }

  return (
    <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
      <span className="text-[#6d6d6d] text-sm">{label}:</span>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="font-medium text-[#8B0000]">
            {loading
              ? 'Calculating...'
              : value
              ? formatMoneyFull(value)
              : 'N/A'}
          </div>
          {showPercent && (
            <div className={`text-xs ${getColor(percent)}`}>
              ({percent > 0 ? '+' : ''}
              {percent.toFixed(0)}%)
            </div>
          )}
        </div>
        {showPercent && (
          <Badge className={`text-white text-xs px-1 py-0 ${getBadgeColor(percent)}`}>
            {percent > 0 ? '▲' : percent < 0 ? '▼' : '●'}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Componente para un campo simple de información
function InfoField({
  label,
  value,
  valueColor = 'text-[#8B0000]',
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
      <span className="text-[#6d6d6d] text-sm">{label}:</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}

export default function ScoutPlayerInfo({ player }: ScoutPlayerInfoProps) {
  const { avgValues, loading: avgLoading } = usePlayerAvgValues(player);

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="grid grid-cols-2 gap-x-12">
        {/* Left Column */}
        <div className="space-y-0">
          {/* Section: Personal Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Name:</span>
              <span className="font-medium text-[#8B0000]">
                {getDisplayValue(player.complete_player_name || player.player_name).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Date of Birth:</span>
              <span className="font-medium text-[#8B0000]">
                {player.date_of_birth
                  ? new Date(player.date_of_birth).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).toUpperCase()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Age:</span>
              <span className="font-medium text-[#8B0000]">
                {player.age ? String(player.age) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Age:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#8B0000]">
                    {avgLoading ? "Calculating..." : avgValues.age_value ? formatMoneyFull(avgValues.age_value) : "N/A"}
                  </div>
                  {avgValues.age_value_percent !== null && avgValues.age_value_percent !== undefined && Math.abs(avgValues.age_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.age_value_percent > 0 ? 'text-red-500' : avgValues.age_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                    }`}>
                      ({avgValues.age_value_percent > 0 ? '+' : ''}{avgValues.age_value_percent.toFixed(0)}%)
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

          {/* Section: Position/Physical */}
          <InfoField
            label="Position"
            value={getDisplayValue(player.position_player).toUpperCase()}
          />
          <AvgValueField
            label="Avg Value by Position"
            value={avgValues.position_value}
            percent={avgValues.position_value_percent}
            loading={avgLoading}
          />
          <InfoField
            label="Foot"
            value={getDisplayValue(player.foot, 'N/A').toUpperCase()}
          />
          <InfoField
            label="Height"
            value={player.height ? `${player.height} cm` : 'N/A'}
          />

          <div className="h-4"></div>

          {/* Section: Nationality */}
          <InfoField
            label="Nationality 1"
            value={getDisplayValue(player.nationality_1).toUpperCase()}
          />
          <AvgValueField
            label="Avg Value by Nationality"
            value={avgValues.nationality_value}
            percent={avgValues.nationality_value_percent}
            loading={avgLoading}
          />
          <InfoField
            label="Nationality 2"
            value={getDisplayValue(player.nationality_2, 'N/A').toUpperCase()}
          />
          <InfoField
            label="International"
            value={getDisplayValue(player.national_tier, 'N/A').toUpperCase()}
          />

          <div className="h-4"></div>

          {/* Section: Agent */}
          <InfoField
            label="Agent"
            value={getDisplayValue(player.agency, 'N/A').toUpperCase()}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-0">
          {/* Section: Team */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Team:</span>
              <span className="font-medium text-[#8B0000]">
                {getDisplayValue(player.team_name).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Country:</span>
              <span className="font-medium text-[#8B0000]">
                {getDisplayValue(player.team_country, 'N/A').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Team Level:</span>
              <span className="font-medium text-[#8B0000]">
                {getDisplayValue(player.team_level, 'N/A').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Team:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#8B0000]">
                    {avgLoading ? "Calculating..." : avgValues.team_competition_value ? formatMoneyFull(avgValues.team_competition_value) : "N/A"}
                  </div>
                  {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.team_competition_value_percent > 0 ? 'text-[#3cc500]' : avgValues.team_competition_value_percent < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      ({avgValues.team_competition_value_percent > 0 ? '+' : ''}{avgValues.team_competition_value_percent.toFixed(0)}%)
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
          </div>

          {/* Section: Loan */}
          <InfoField
            label="On Loan"
            value={player.on_loan ? 'YES' : 'NO'}
          />
          {player.on_loan && (
            <>
              <InfoField
                label="Owner Club"
                value={getDisplayValue(player.owner_club, 'N/A').toUpperCase()}
              />
              <AvgValueField
                label="Avg Value Owner Club"
                value={avgValues.owner_club_value}
                percent={avgValues.owner_club_value_percent}
                loading={avgLoading}
                invertColors
              />
              <InfoField
                label="Country Owner Club"
                value={getDisplayValue(player.owner_club_country, 'N/A').toUpperCase()}
              />
            </>
          )}
          <InfoField
            label="Contract End"
            value={
              player.contract_end
                ? new Date(player.contract_end).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).toUpperCase()
                : 'N/A'
            }
          />

          <div className="h-4"></div>

          {/* Section: Competition */}
          <InfoField
            label="Competition"
            value={getDisplayValue(player.team_competition, 'N/A').toUpperCase()}
          />
          <AvgValueField
            label="Avg Value by Competition"
            value={avgValues.team_competition_value}
            percent={avgValues.team_competition_value_percent}
            loading={avgLoading}
            invertColors
          />
          <InfoField
            label="Country"
            value={getDisplayValue(player.competition_country, 'N/A').toUpperCase()}
          />
          <InfoField
            label="Tier"
            value={getDisplayValue(player.competition_tier, 'N/A')}
          />
          <InfoField
            label="Competition Level"
            value={getDisplayValue(player.competition_level, 'N/A').toUpperCase()}
          />
          <AvgValueField
            label="Avg Value by Level"
            value={avgValues.competition_level_value}
            percent={avgValues.competition_level_value_percent}
            loading={avgLoading}
          />
        </div>
      </div>
    </div>
  );
}
