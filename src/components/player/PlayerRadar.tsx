"use client";

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface RadarData {
  category: string;
  playerValue: number;
  positionAverage: number;
  percentile: number;
  rank: number;
  totalPlayers: number;
  maxValue?: number;
  minValue?: number;
}

interface FilterOptions {
  positions: Array<{ value: string; label: string; count: number }>;
  nationalities: Array<{ value: string; label: string; count: number }>;
  competitions: Array<{ value: string; label: string; count: number }>;
  ranges: {
    age: { min: number; max: number };
    rating: { min: number; max: number };
  };
}

interface PlayerRadarProps {
  playerId: string;
}

export default function PlayerRadar({ playerId }: PlayerRadarProps) {
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [showMax, setShowMax] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [showNorm, setShowNorm] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/players/radar/filters');
        if (response.ok) {
          const options = await response.json();
          setFilterOptions(options);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Load radar data
  useEffect(() => {
    const loadRadarData = async () => {
      if (!playerId) {
        console.log('PlayerRadar: No playerId provided');
        return;
      }
      
      console.log('PlayerRadar: Loading data for playerId:', playerId);
      setLoading(true);
      setError(null);

      try {
        // Build query parameters for comparison
        const params = new URLSearchParams();
        if (selectedPosition) params.append('position', selectedPosition);
        if (selectedNationality) params.append('nationality', selectedNationality);
        if (selectedCompetition) params.append('competition', selectedCompetition);

        const endpoint = params.toString() 
          ? `/api/players/${playerId}/radar/compare?${params}`
          : `/api/players/${playerId}/radar`;

        console.log('PlayerRadar: Fetching from endpoint:', endpoint);
        const response = await fetch(endpoint);
        
        console.log('PlayerRadar: Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('PlayerRadar: API Error:', errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('PlayerRadar: Received data:', data);
        
        if (data.comparisonData) {
          console.log('PlayerRadar: Using comparison data');
          setRadarData(data.comparisonData);
        } else if (data.radarData) {
          console.log('PlayerRadar: Using radar data');
          setRadarData(data.radarData);
        } else {
          console.warn('PlayerRadar: No radar data in response');
          setError('No radar data available in response');
        }

      } catch (error) {
        console.error('PlayerRadar: Error loading radar data:', error);
        setError(`Failed to load radar data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadRadarData();
  }, [playerId, selectedPosition, selectedNationality, selectedCompetition]);

  // Prepare chart data
  const chartData = radarData.map(item => ({
    category: item.category,
    Player: showRaw ? item.playerValue : item.percentile,
    Average: showAvg ? (showRaw ? item.positionAverage || item.groupAverage : 50) : undefined,
    Max: showMax ? (showRaw ? item.maxValue : 100) : undefined,
    Min: showMin ? (showRaw ? item.minValue : 0) : undefined,
    // Display data for tooltips
    playerValue: item.playerValue,
    percentile: item.percentile,
    rank: item.rank,
    totalPlayers: item.totalPlayers
  }));

  if (loading) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
            <p className="text-[#6d6d6d]">Loading radar data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="text-sm text-gray-600">
              <p>Player ID: {playerId}</p>
              <p>This player may not exist or have no radar data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      {/* Radar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#8c1a10]">RADAR</h3>
          <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
        </div>
      </div>

      {/* Filters and Options */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Período
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
              <option value="2023-24">2023-24</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Estadísticas
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
              <option>FMI Attributes</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="max" 
                className="rounded" 
                checked={showMax}
                onChange={(e) => setShowMax(e.target.checked)}
              />
              <label htmlFor="max" className="text-sm text-[#2e3138]">
                Max
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="min" 
                className="rounded" 
                checked={showMin}
                onChange={(e) => setShowMin(e.target.checked)}
              />
              <label htmlFor="min" className="text-sm text-[#2e3138]">
                Min
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="avg" 
                className="rounded" 
                checked={showAvg}
                onChange={(e) => setShowAvg(e.target.checked)}
              />
              <label htmlFor="avg" className="text-sm text-[#2e3138]">
                AVG
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="norm" 
                className="rounded" 
                checked={showNorm}
                onChange={(e) => setShowNorm(e.target.checked)}
              />
              <label htmlFor="norm" className="text-sm text-[#2e3138]">
                Percentile
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="raw" 
                className="rounded" 
                checked={showRaw}
                onChange={(e) => setShowRaw(e.target.checked)}
              />
              <label htmlFor="raw" className="text-sm text-[#2e3138]">
                Raw Values
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Posición
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">All Positions</option>
              {filterOptions?.positions.map(pos => (
                <option key={pos.value} value={pos.value}>
                  {pos.label} ({pos.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Nacionalidad
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={selectedNationality}
              onChange={(e) => setSelectedNationality(e.target.value)}
            >
              <option value="">All Nationalities</option>
              {filterOptions?.nationalities.map(nat => (
                <option key={nat.value} value={nat.value}>
                  {nat.label} ({nat.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Competición
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
            >
              <option value="">All Competitions</option>
              {filterOptions?.competitions.map(comp => (
                <option key={comp.value} value={comp.value}>
                  {comp.label} ({comp.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-[#2e3138] mb-4 text-center">
          Player Comparison Radar
        </h4>
        
        {radarData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={showRaw ? [0, 100] : [0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Player"
                  dataKey="Player"
                  stroke="#8c1a10"
                  fill="#8c1a10"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {showAvg && (
                  <Radar
                    name="Average"
                    dataKey="Average"
                    stroke="#6d6d6d"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                )}
                {showMax && (
                  <Radar
                    name="Max"
                    dataKey="Max"
                    stroke="#22c55e"
                    fill="transparent"
                    strokeWidth={1}
                  />
                )}
                {showMin && (
                  <Radar
                    name="Min"
                    dataKey="Min"
                    stroke="#ef4444"
                    fill="transparent"
                    strokeWidth={1}
                  />
                )}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-[#6d6d6d]">No radar data available</p>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {radarData.length > 0 && (
          <div className="mt-6 grid grid-cols-5 gap-4 text-center">
            {radarData.map(item => (
              <div key={item.category} className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-semibold text-sm text-[#2e3138] mb-1">
                  {item.category}
                </h5>
                <p className="text-lg font-bold text-[#8c1a10]">
                  {Math.round(item.playerValue)}
                </p>
                <p className="text-xs text-[#6d6d6d]">
                  {Math.round(item.percentile)}% | #{item.rank}/{item.totalPlayers}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}