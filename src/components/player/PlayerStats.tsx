"use client";

import type { StatsPeriod } from "@/lib/utils/stats-period-utils";
import { getAllPeriods, getPeriodLabel } from "@/lib/utils/stats-period-utils";

import PlayerBeeswarm from "./PlayerBeeswarm";
import PlayerLollipop from "./PlayerLollipop";
import PlayerRadar from "./PlayerRadar";

interface PlayerStatsProps {
  playerId: string;
  activeStatsTab: string;
  onStatsTabChange: (tab: string) =>void;
  selectedPeriod: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  statsLoading: boolean;
  getStatValue: (
    metricName: string,
    field: "totalValue" | "p90Value" | "averageValue" | "maximumValue" | "percentile"
  ) => string;
}

export default function PlayerStats({
  playerId,
  activeStatsTab,
  onStatsTabChange,
  selectedPeriod,
  onPeriodChange,
  statsLoading,
  getStatValue,
}: PlayerStatsProps) {
  const periods = getAllPeriods();

  return (
    <div className="bg-white p-6">
      {/* Stats Tabs */}
      <div className="flex gap-4 border-b border-[#e7e7e7] mb-6">
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "period"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onStatsTabChange("period")}
        >
          By Period
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "radar"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onStatsTabChange("radar")}
        >
          Radar
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "beeswarm"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onStatsTabChange("beeswarm")}
        >
          Beeswarm
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "lollipop"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onStatsTabChange("lollipop")}
        >
          Lollipop
        </button>
      </div>


      {/* Stats Content */}
      {activeStatsTab === "period" && (
        <div className="bg-white">
          {/* Period Tabs */}
          <div className="flex gap-4 border-b border-[#e7e7e7] mb-6">
            {periods.map((period) => (
              <button
                key={period}
                className={`pb-2 px-3 font-medium transition-colors ${
                  selectedPeriod === period
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d] hover:text-[#8c1a10]"
                }`}
                onClick={() => onPeriodChange(period)}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {statsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6d6d6d]">Cargando estadísticas...</p>
              </div>
            </div>
          )}

          {/* Stats Table */}
          {!statsLoading && (
            <div className="p-6">
          {/* Column Headers */}
          <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-200 mb-6">
            <span className="font-medium text-[#2e3138]">Metric</span>
            <span className="font-medium text-[#2e3138]">Total</span>
            <span className="font-medium text-[#2e3138]">P90</span>
            <span className="font-medium text-[#2e3138]">Avg</span>
            <span className="font-medium text-[#2e3138]">Max</span>
            <span className="font-medium text-[#2e3138]">Percentiles</span>
          </div>

          {/* General */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">General</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Matches</span>
                <span className="text-[#6d6d6d]">{getStatValue("matches", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("matches", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("matches", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("matches", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("matches", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("matches", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Minutes</span>
                <span className="text-[#6d6d6d]">{getStatValue("minutes", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("minutes", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("minutes", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("minutes", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("minutes", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("minutes", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Yellow Cards</span>
                <span className="text-[#6d6d6d]">{getStatValue("Yellow Cards", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Yellow Cards", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Yellow Cards", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Yellow Cards", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Yellow Cards", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Yellow Cards", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">Red Cards</span>
                <span className="text-[#6d6d6d]">{getStatValue("Red Cards", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Red Cards", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Red Cards", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Red Cards", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Red Cards", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Red Cards", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goalkeeping */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">Goalkeeping</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Conceded Goals
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("concededGoals", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("concededGoals", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("concededGoals", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("concededGoals", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("concededGoals", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("concededGoals", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Prevented Goals
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("preventedGoals", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("preventedGoals", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("preventedGoals", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("preventedGoals", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("preventedGoals", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("preventedGoals", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Shots Against
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("shotsAgainst", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("shotsAgainst", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("shotsAgainst", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("shotsAgainst", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("shotsAgainst", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("shotsAgainst", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Clean Sheets (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("cleanSheetsPercentage", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("cleanSheetsPercentage", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("cleanSheetsPercentage", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("cleanSheetsPercentage", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("cleanSheetsPercentage", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("cleanSheetsPercentage", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">
                  Save Rate (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("saveRate", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("saveRate", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("saveRate", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("saveRate", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("saveRate", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("saveRate", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Defending */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">Defending</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Tackles</span>
                <span className="text-[#6d6d6d]">{getStatValue("tackles", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("tackles", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("tackles", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("tackles", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("tackles", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("tackles", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Interceptions
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("interceptions", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("interceptions", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("interceptions", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("interceptions", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("interceptions", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("interceptions", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">Fouls</span>
                <span className="text-[#6d6d6d]">{getStatValue("fouls", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("fouls", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("fouls", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("fouls", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("fouls", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("fouls", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passing */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">Passing</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Passes</span>
                <span className="text-[#6d6d6d]">{getStatValue("Passes", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Passes", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Passes", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Passes", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Passes", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Passes", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Forward Passes
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Forward Passes", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Forward Passes", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Forward Passes", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Forward Passes", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Forward Passes", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Forward Passes", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Crosses</span>
                <span className="text-[#6d6d6d]">{getStatValue("Crosses", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Crosses", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Crosses", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Crosses", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Crosses", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Crosses", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Assists</span>
                <span className="text-[#6d6d6d]">{getStatValue("Assists", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Assists", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Assists", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Assists", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Assists", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Assists", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">
                  Accurate Passes (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Pass Accuracy", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Pass Accuracy", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Pass Accuracy", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Pass Accuracy", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Pass Accuracy", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Pass Accuracy", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Finishing */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">Finishing</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Shots</span>
                <span className="text-[#6d6d6d]">{getStatValue("Shots", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Shots", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Shots", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Shots", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Shots", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Shots", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Goals</span>
                <span className="text-[#6d6d6d]">{getStatValue("Goals", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Goals", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Goals", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("Goals", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("Goals", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("Goals", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">
                  Effectiveness (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("effectiveness", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("effectiveness", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("effectiveness", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("effectiveness", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("effectiveness", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("effectiveness", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1vs1 */}
          <div className="mb-8">
            <h3 className="font-bold text-[#8c1a10] mb-4">1vs1</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Off Duels</span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuels", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuels", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuels", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuels", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("offDuels", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("offDuels", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Def Duels</span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuels", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuels", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuels", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuels", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("defDuels", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("defDuels", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">Aer Duels</span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuels", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuels", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuels", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuels", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("aerDuels", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("aerDuels", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Off Duels Won (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuelsWonPercentage", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuelsWonPercentage", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuelsWonPercentage", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("offDuelsWonPercentage", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("offDuelsWonPercentage", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("offDuelsWonPercentage", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <span className="font-medium text-[#2e3138]">
                  Def Duels Won (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuelsWonPercentage", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuelsWonPercentage", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuelsWonPercentage", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("defDuelsWonPercentage", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("defDuelsWonPercentage", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("defDuelsWonPercentage", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 py-3">
                <span className="font-medium text-[#2e3138]">
                  Aer Duels Won (%)
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuelsWonPercentage", "totalValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuelsWonPercentage", "p90Value")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuelsWonPercentage", "averageValue")}
                </span>
                <span className="text-[#6d6d6d]">{getStatValue("aerDuelsWonPercentage", "maximumValue")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#6d6d6d] w-8 text-right text-sm">{getStatValue("aerDuelsWonPercentage", "percentile")}</span>
                  <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c1a10] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, Number(getStatValue("aerDuelsWonPercentage", "percentile")) || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
      )}

      {/* Radar Content */}
      {activeStatsTab === "radar" && <PlayerRadar playerId={playerId} />}

      {/* Beeswarm Content */}
      {activeStatsTab === "beeswarm" && <PlayerBeeswarm playerId={playerId} />}

      {/* Lollipop Content */}
      {activeStatsTab === "lollipop" && <PlayerLollipop playerId={playerId} />}
    </div>
  );
}
