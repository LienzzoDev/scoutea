"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

import RatingBadge, { getPercentileGrade, type RatingGrade } from './RatingBadge';
import VerticalFilters, { type RadarFilters } from './VerticalFilters';

export interface RadarDataItem {
  category: string;
  playerValue: number;
  percentile?: number | undefined;
  basePercentile?: number | undefined;
  comparisonAverage?: number | undefined;
  rank?: number | undefined;
  totalPlayers?: number | undefined;
}

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterOptions {
  positions: FilterOption[];
  nationalities: FilterOption[];
  competitions: FilterOption[];
}

interface StackedRadarProps {
  title: string;
  radarData: RadarDataItem[];
  filterOptions: FilterOptions | null;
  filters: RadarFilters;
  onFilterChange: (key: keyof RadarFilters, value: string) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  showFilters?: boolean;
}

// Custom tooltip for radar chart
interface TooltipPayloadItem {
  payload: {
    percentile?: number;
    rank?: number;
    totalPlayers?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-[#2e3138] mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-[#8c1a10] font-medium">Percentile:</span> {Math.round(Number(data.percentile) || 0)}%
          </p>
          {data.rank && (
            <p className="text-sm">
              <span className="text-[#6d6d6d] font-medium">Ranking:</span> #{Number(data.rank)} of {Number(data.totalPlayers)}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function StackedRadar({
  title,
  radarData,
  filterOptions,
  filters,
  onFilterChange,
  onClearFilters,
  isLoading = false,
  showFilters = true,
}: StackedRadarProps) {
  // Prepare chart data with percentiles
  const chartData = radarData.map(item => ({
    category: item.category,
    Player: item.basePercentile || item.percentile || 50,
    Average: item.comparisonAverage || 50,
    playerValue: item.playerValue,
    percentile: item.percentile || 50,
    rank: item.rank || 1,
    totalPlayers: item.totalPlayers || 1,
  }));

  // Get ratings for left side (only letters, no numbers)
  const ratingsData = radarData.map(item => ({
    category: item.category,
    grade: getPercentileGrade(item.basePercentile || item.percentile || 50) as RatingGrade,
  }));

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      {/* Title */}
      <div className="flex items-center justify-center mb-4">
        <h3 className="text-xl font-bold text-[#8c1a10]">{title}</h3>
      </div>

      {/* 3-Column Layout: Ratings | Radar | Filters */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Ratings (only colored letters) */}
        <div className="col-span-2 flex flex-col justify-center space-y-2">
          {ratingsData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <RatingBadge rating={item.grade} size="md" />
              <span className="text-xs text-[#6d6d6d] truncate">
                {item.category}
              </span>
            </div>
          ))}
        </div>

        {/* Center: Radar Chart */}
        <div className="col-span-6 flex items-center justify-center">
          {isLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <span className="text-[#6d6d6d]">Loading...</span>
            </div>
          ) : radarData.length === 0 ? (
            <div className="w-full h-64 flex items-center justify-center">
              <span className="text-[#6d6d6d]">No data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#6d6d6d', fontSize: 10 }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 8 }}
                  axisLine={false}
                />

                {/* Average line (comparison group) */}
                <Radar
                  name="Average"
                  dataKey="Average"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.1}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />

                {/* Player line (main) */}
                <Radar
                  name="Player"
                  dataKey="Player"
                  stroke="#8c1a10"
                  fill="#8c1a10"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />

                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right: Vertical Filters */}
        {showFilters && (
          <div className="col-span-4">
            <VerticalFilters
              filterOptions={filterOptions}
              filters={filters}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
