"use client";

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import RadarDebugPanel from '../debug/RadarDebugPanel';
import { usePlayerRadar } from '@/hooks/player/usePlayerRadar';

interface RadarData {
  category: string;
  playerValue: number;
  comparisonAverage?: number;
  positionAverage?: number; // Keep for backward compatibility
  percentile: number;
  basePercentile?: number; // Original percentile without filters
  rank: number;
  totalPlayers: number;
  maxValue?: number;
  minValue?: number;
  dataCompleteness?: number;
  sourceAttributes?: string[];
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

// Custom tooltip component for enhanced information display
const CustomTooltip = ({ active, payload, label }: unknown) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-[#2e3138] mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-[#8c1a10] font-medium">Jugador:</span> {Math.round(data.playerValue)}
          </p>
          <p className="text-sm">
            <span className="text-[#6d6d6d] font-medium">Percentil:</span> {Math.round(data.percentile)}%
          </p>
          <p className="text-sm">
            <span className="text-[#6d6d6d] font-medium">Ranking:</span> #{data.rank} de {data.totalPlayers}
          </p>
          {data.dataCompleteness && data.dataCompleteness < 100 && (
            <p className="text-xs text-orange-600">
              Completitud de datos: {Math.round(data.dataCompleteness)}%
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function PlayerRadar({ playerId }: PlayerRadarProps) {
  // Use the custom hook instead of direct API calls
  const { radarData, filterOptions, loading, error, applyFilters } = usePlayerRadar(playerId);
  
  // Filter states
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [ratingMin, setRatingMin] = useState<string>('');
  const [ratingMax, setRatingMax] = useState<string>('');
  const [showMax, setShowMax] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [_showPercentiles, _setShowPercentiles] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  // Apply filters when they change
  useEffect(() => {
    const filters = {
      position: selectedPosition,
      nationality: selectedNationality,
      competition: selectedCompetition,
      ageMin,
      ageMax,
      ratingMin,
      ratingMax
    };
    
    applyFilters(filters);
  }, [selectedPosition, selectedNationality, selectedCompetition, ageMin, ageMax, ratingMin, ratingMax, applyFilters]);

  // Define the 9 tactical categories in proper order
  const categoryOrder = [
    'Balón Parado Def.',
    'Evitación',
    'Recuperación',
    'Transición Def.',
    'Balón Parado Of.',
    'Mantenimiento',
    'Progresión',
    'Finalización',
    'Transición Of.'
  ];

  // Sort radar data according to the defined category order
  const sortedRadarData = [...radarData].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.category);
    const indexB = categoryOrder.indexOf(b.category);
    return indexA - indexB;
  });

  // Prepare chart data
  const chartData = sortedRadarData.map(item => {
    // Convert comparison average to percentile (assuming 50 is the baseline)
    const comparisonPercentile = item.comparisonAverage ? 
      Math.min(100, Math.max(0, (item.comparisonAverage / 100) * 100)) : 50;
    
    const chartItem = {
      category: item.category,
      // Player layer - ALWAYS uses base data (NEVER changes with filters)
      Player: showRaw ? item.playerValue : (item.basePercentile || item.percentile || 50),
      // Average layer - shows comparison group average (changes with filters)
      Average: showAvg ? (showRaw ? (item.comparisonAverage || 50) : comparisonPercentile) : undefined,
      // Max/Min layers
      Max: showMax ? (showRaw ? (item.maxValue || 100) : 100) : undefined,
      Min: showMin ? (showRaw ? (item.minValue || 0) : 0) : undefined,
      // Display data for tooltips
      playerValue: item.playerValue,
      percentile: item.percentile || 50,
      basePercentile: item.basePercentile || item.percentile || 50,
      rank: item.rank || 1,
      totalPlayers: item.totalPlayers || 1,
      dataCompleteness: item.dataCompleteness,
      comparisonAverage: item.comparisonAverage
    };
    
    // Debug logging for radar data
    if (item.category === 'Finalización' || item.category === 'Finishing') {
      console.log(`🔍 PlayerRadar: ${item.category}`, {
        playerValue: item.playerValue,
        basePercentile: item.basePercentile,
        percentile: item.percentile,
        comparisonAverage: item.comparisonAverage,
        showRaw,
        showAvg,
        Player: chartItem.Player,
        Average: chartItem.Average,
        comparisonPercentile
      });
    }
    
    return chartItem;
  });

  if (loading) {
    return (
      <div className="bg-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c1a10] mx-auto mb-4" role="status" aria-label="Loading"></div>
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
            <p className="text-red-600 mb-4">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
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
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8c1a10]"></div>
          )}
        </div>
        <button
          onClick={() =>{
            setSelectedPosition('');
            setSelectedNationality('');
            setSelectedCompetition('');
            setAgeMin('');
            setAgeMax('');
            setRatingMin('');
            setRatingMax('');
          }}
          className="text-sm text-[#6d6d6d] hover:text-[#8c1a10] transition-colors">
          Limpiar Filtros
        </button>
      </div>

      {/* Filters and Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
        {/* Left Column - Display Options */}
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
            <label className="block text-sm font-medium text-[#2e3138] mb-3">
              Tipo de Valores
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="percentiles" 
                  name="valueType"
                  className="rounded" 
                  checked={!showRaw}
                  onChange={() => setShowRaw(false)}
                />
                <label htmlFor="percentiles" className="text-sm text-[#2e3138]">
                  Percentiles (0-100)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="raw" 
                  name="valueType"
                  className="rounded" 
                  checked={showRaw}
                  onChange={() => setShowRaw(true)}
                />
                <label htmlFor="raw" className="text-sm text-[#2e3138]">
                  Valores Brutos
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-3">
              Mostrar Líneas
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="avg" 
                  className="rounded" 
                  checked={showAvg}
                  onChange={(e) => setShowAvg(e.target.checked)}
                />
                <label htmlFor="avg" className="text-sm text-[#2e3138]">
                  Promedio
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="max" 
                  className="rounded" 
                  checked={showMax}
                  onChange={(e) => setShowMax(e.target.checked)}
                />
                <label htmlFor="max" className="text-sm text-[#2e3138]">
                  Máximo
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
                  Mínimo
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Comparison Filters */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Posición
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">Todas las Posiciones</option>
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
              <option value="">Todas las Nacionalidades</option>
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
              <option value="">Todas las Competiciones</option>
              {filterOptions?.competitions.map(comp => (
                <option key={comp.value} value={comp.value}>
                  {comp.label} ({comp.count})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Edad Mín
              </label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                placeholder="16"
                min="16"
                max="45"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Edad Máx
              </label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                placeholder="45"
                min="16"
                max="45"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Rating Mín
              </label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                placeholder="50"
                min="50"
                max="100"
                step="0.1"
                value={ratingMin}
                onChange={(e) => setRatingMin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Rating Máx
              </label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                placeholder="100"
                min="50"
                max="100"
                step="0.1"
                value={ratingMax}
                onChange={(e) => setRatingMax(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-[#2e3138] mb-4 text-center">
          Radar de Comparación del Jugador
        </h4>
        
        {radarData.length > 0 ? (
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid 
                  stroke="#e5e7eb" 
                  strokeWidth={1}
                />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#2e3138', fontWeight: 500 }}
                  className="text-sm"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={showRaw ? [0, 100] : [0, 100]}
                  tick={{ fontSize: 10, fill: '#6d6d6d' }}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                  name="Jugador"
                  dataKey="Player"
                  stroke="#8c1a10"
                  fill="#8c1a10"
                  fillOpacity={0.3}
                  strokeWidth={3}
                  dot={{ fill: '#8c1a10', strokeWidth: 2, r: 4 }}
                />
                {showAvg && (
                  <Radar
                    name="Promedio"
                    dataKey="Average"
                    stroke="#2563eb"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                  />
                )}
                {showMax && (
                  <Radar
                    name="Máximo"
                    dataKey="Max"
                    stroke="#22c55e"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}
                {showMin && (
                  <Radar
                    name="Mínimo"
                    dataKey="Min"
                    stroke="#ef4444"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
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

        {/* Stats Summary - Display in responsive grid for the 9 categories */}
        {sortedRadarData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-center">
            {sortedRadarData.map((item, index) => (
              <div key={`${item.category}-${index}`} className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-semibold text-sm text-[#2e3138] mb-1">
                  {item.category}
                </h5>
                <div className="flex justify-center items-center gap-3 mb-1">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#8c1a10]">
                      {Math.round(item.playerValue)}
                    </p>
                    <p className="text-xs text-[#8c1a10]">Jugador</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#2563eb]">
                      {Math.round(item.comparisonAverage || 50)}
                    </p>
                    <p className="text-xs text-[#2563eb]">Promedio</p>
                  </div>
                </div>
                <p className="text-xs text-[#6d6d6d]">
                  {Math.round(item.percentile || 50)}% | #{item.rank || 1}/{item.totalPlayers || 1}
                </p>
                {item.dataCompleteness && item.dataCompleteness < 100 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {Math.round(item.dataCompleteness)}% datos
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <RadarDebugPanel
          playerId={playerId}
          basePlayerData={radarData}
          radarData={radarData}
          selectedPosition={selectedPosition}
        />
      )}
    </div>
  );
}