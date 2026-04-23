"use client";

import { useEffect, useState } from "react";

import { PLAYER_STATS_GROUPS } from "@/constants/player-stats-metrics";
import type { StatsPeriod } from "@/lib/utils/stats-period-utils";
import { getAllPeriods, getPeriodLabel } from "@/lib/utils/stats-period-utils";

import PlayerBeeswarm from "./PlayerBeeswarm";
import PlayerLollipop from "./PlayerLollipop";
import PlayerRadar from "./PlayerRadar";
import ChartFilters, { EMPTY_FILTERS, type ChartFilterOptions, type ChartFilterValues } from "./stats/ChartFilters";
import CohortHeader from "./stats/CohortHeader";
import StatsBlock from "./stats/StatsBlock";

interface PlayerStatsProps {
  playerId: string;
  activeStatsTab: string;
  onStatsTabChange: (tab: string) => void;
  selectedPeriod: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  statsLoading: boolean;
  getStatValue: (
    metricName: string,
    field: "totalValue" | "p90Value" | "averageValue" | "maximumValue" | "percentile"
  ) => string;
  sampleSize?: number | null;
  statsFilters?: ChartFilterValues;
  onStatsFiltersChange?: (filters: ChartFilterValues) => void;
}

export default function PlayerStats({
  playerId,
  activeStatsTab,
  onStatsTabChange,
  selectedPeriod,
  onPeriodChange,
  statsLoading,
  getStatValue,
  sampleSize,
  statsFilters,
  onStatsFiltersChange,
}: PlayerStatsProps) {
  const periods = getAllPeriods();

  // Usamos el mismo endpoint que ya utilizan radar/beeswarm/lollipop para las
  // opciones de dropdown (posiciones, nacionalidades, competiciones).
  const [filterOptions, setFilterOptions] = useState<ChartFilterOptions | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/players/radar/filters")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setFilterOptions(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filters = statsFilters ?? EMPTY_FILTERS;
  const setFilters = onStatsFiltersChange ?? (() => {});

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
          onClick={() => onStatsTabChange("period")}
        >
          By Period
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "radar"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() => onStatsTabChange("radar")}
        >
          Radar
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "beeswarm"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() => onStatsTabChange("beeswarm")}
        >
          Beeswarm
        </button>
        <button
          className={`pb-2 font-medium ${
            activeStatsTab === "lollipop"
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() => onStatsTabChange("lollipop")}
        >
          Lollipop
        </button>
      </div>

      {/* Stats Content */}
      {activeStatsTab === "period" && (
        <div className="bg-white">
          {/* Period Tabs */}
          <div className="flex gap-4 border-b border-[#e7e7e7] mb-4">
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

          {/* Filters toggle + panel */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setIsFiltersOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-[#8c1a10] cursor-pointer"
              >
                <span>Filters</span>
                <span className={`transition-transform ${isFiltersOpen ? "rotate-180" : ""}`}>▼</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm text-[#6d6d6d] hover:text-[#8c1a10] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
            {isFiltersOpen && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <ChartFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  filterOptions={filterOptions}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              </div>
            )}
          </div>

          {/* Loading State */}
          {statsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6d6d6d]">Loading statistics...</p>
              </div>
            </div>
          )}

          {/* Stats Blocks */}
          {!statsLoading && (
            <div className="p-6">
              <CohortHeader sampleSize={sampleSize} />

              {PLAYER_STATS_GROUPS.map((group) => (
                <StatsBlock
                  key={group.key}
                  title={group.title}
                  metrics={group.metrics}
                  getStatValue={getStatValue}
                />
              ))}
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
