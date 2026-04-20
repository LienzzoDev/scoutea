'use client'

import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

import type { Player } from '@/types/player'
import { formatMoneyFull } from '@/lib/utils/format-money'

import PlayerTransferPtsMatrix from './scouting/PlayerTransferPtsMatrix'
import PlayerValueEvolution from './scouting/PlayerValueEvolution'

interface PlayerScoutingProps {
  player: Player
}

function MetricCard({
  label,
  value,
  subtext,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  subtext?: string
  color: 'green' | 'red' | 'blue' | 'gray'
  icon: React.ComponentType<{ className?: string }>
}) {
  const colorMap = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    gray: 'text-gray-600 bg-gray-50',
  }

  return (
    <div className="bg-white border border-[#e7e7e7] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-[#6d6d6d]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#2e3138]">{value}</p>
      {subtext && (
        <p className={`text-xs mt-1 ${
          subtext.startsWith('+') ? 'text-green-600' : subtext.startsWith('-') ? 'text-red-600' : 'text-[#6d6d6d]'
        }`}>
          {subtext}
        </p>
      )}
    </div>
  )
}

export default function PlayerScouting({ player }: PlayerScoutingProps) {
  const initialVal = player.initial_player_trfm_value ?? null
  const currentVal = player.player_trfm_value ?? null
  const hasInitialData = initialVal !== null || player.initial_team_level || player.initial_competition_level

  // Calculate value change
  const absoluteChange = (currentVal ?? 0) - (initialVal ?? 0)
  const percentChange = initialVal && initialVal > 0
    ? ((absoluteChange / initialVal) * 100)
    : 0

  // Format change text
  const changeText = initialVal !== null && currentVal !== null
    ? `${absoluteChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`
    : undefined

  const valueChangeColor = absoluteChange > 0 ? 'green' : absoluteChange < 0 ? 'red' : 'gray'

  // ROI and profit
  const roi = player.roi
  const profit = player.profit
  const teamPts = player.transfer_team_pts
  const competitionPts = player.transfer_competition_pts
  const totalPts = (teamPts ?? 0) + (competitionPts ?? 0)

  if (!hasInitialData) {
    return (
      <div className="bg-white rounded-lg border border-[#e7e7e7] p-12 text-center">
        <div className="text-[#6d6d6d]">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium mb-2">No scouting data available</p>
          <p className="text-sm">
            Scouting data is generated automatically when the player is added to the platform
            and their initial values are compared with current ones.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Market Value Change"
          value={currentVal !== null ? formatMoneyFull(currentVal) : 'N/A'}
          subtext={changeText}
          color={valueChangeColor as 'green' | 'red' | 'gray'}
          icon={absoluteChange >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard
          label="ROI"
          value={roi !== null && roi !== undefined ? `${roi.toFixed(1)}%` : 'N/A'}
          color={roi && roi > 0 ? 'green' : roi && roi < 0 ? 'red' : 'gray'}
          icon={TrendingUp}
        />
        <MetricCard
          label="Profit"
          value={profit !== null && profit !== undefined ? formatMoneyFull(profit) : 'N/A'}
          color={profit && profit > 0 ? 'green' : profit && profit < 0 ? 'red' : 'gray'}
          icon={DollarSign}
        />
        <MetricCard
          label="Transfer Pts"
          value={teamPts !== null || competitionPts !== null ? String(totalPts) : 'N/A'}
          subtext={teamPts !== null || competitionPts !== null
            ? `Team: ${teamPts ?? 0} | Comp: ${competitionPts ?? 0}`
            : undefined}
          color={totalPts > 0 ? 'blue' : totalPts < 0 ? 'red' : 'gray'}
          icon={BarChart3}
        />
      </div>

      {/* Value Evolution Chart */}
      <PlayerValueEvolution
        initialValue={initialVal}
        initialDate={player.initial_trfm_value_date ?? null}
        currentValue={currentVal}
      />

      {/* Transfer Pts Matrices */}
      <PlayerTransferPtsMatrix
        initialTeamLevel={player.initial_team_level ?? null}
        currentTeamLevel={player.team_level ?? null}
        teamPts={teamPts ?? null}
        initialCompetitionLevel={player.initial_competition_level ?? null}
        currentCompetitionLevel={player.competition_level ?? null}
        competitionPts={competitionPts ?? null}
      />
    </div>
  )
}
