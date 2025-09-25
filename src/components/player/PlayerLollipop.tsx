"use client";

import { useState } from 'react';
import { usePlayerLollipop, type LollipopData } from '@/hooks/player/usePlayerLollipop';

interface PlayerLollipopProps {
  playerId?: string; // Optional: highlight specific player
}

export default function PlayerLollipop({ playerId }: PlayerLollipopProps) {
  // Filter states
  const [selectedMetric, setSelectedMetric] = useState('player_rating');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });
  const [topN, setTopN] = useState(20); // Show top N players
  const [showMax, setShowMax] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [showNorm, setShowNorm] = useState(false);
  const [showRaw, setShowRaw] = useState(true);

  // Use the custom hook
  const { data, filterOptions, loading, error, getFilteredData } = usePlayerLollipop(selectedMetric);

  // Available metrics
  const metrics = [
    { value: 'player_rating', label: 'Rating General' },
    { value: 'age', label: 'Edad' },
    { value: 'player_trfm_value', label: 'Valor TRFM' },
    { value: 'height', label: 'Altura' },
  ];

  // Get filtered data
  const filteredData = getFilteredData({
    position: selectedPosition,
    nationality: selectedNationality,
    competition: selectedCompetition,
    ageMin: ageRange.min,
    ageMax: ageRange.max,
    limit: topN
  });

  // Calculate statistics
  const values = filteredData.map(d => d.value).filter(v => v > 0);
  const stats = values.length > 0 ? {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length
  } : {
    min: 0,
    max: 100,
    avg: 50,
    count: 0
  };

  return (
    <div className="bg-white p-6">
      {/* Lollipop Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#8c1a10]">PALETA</h3>
          <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8c1a10]"></div>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedPosition('');
            setSelectedNationality('');
            setSelectedCompetition('');
            setAgeRange({ min: '', max: '' });
          }}
          className="text-sm text-[#6d6d6d] hover:text-[#8c1a10] transition-colors"
        >
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
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Estadísticas
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {metrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Mostrar Top
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={30}>Top 30</option>
              <option value={50}>Top 50</option>
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
                  id="raw-values" 
                  name="valueType"
                  className="rounded" 
                  checked={showRaw}
                  onChange={() => {
                    setShowRaw(true);
                    setShowNorm(false);
                  }}
                />
                <label htmlFor="raw-values" className="text-sm text-[#2e3138]">
                  Valores Reales
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="norm-values" 
                  name="valueType"
                  className="rounded" 
                  checked={showNorm}
                  onChange={() => {
                    setShowNorm(true);
                    setShowRaw(false);
                  }}
                />
                <label htmlFor="norm-values" className="text-sm text-[#2e3138]">
                  Valores Normalizados (0-100)
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
                  id="avg-line" 
                  className="rounded" 
                  checked={showAvg}
                  onChange={(e) => setShowAvg(e.target.checked)}
                />
                <label htmlFor="avg-line" className="text-sm text-[#2e3138]">
                  Promedio
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="max-line" 
                  className="rounded" 
                  checked={showMax}
                  onChange={(e) => setShowMax(e.target.checked)}
                />
                <label htmlFor="max-line" className="text-sm text-[#2e3138]">
                  Máximo
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="min-line" 
                  className="rounded" 
                  checked={showMin}
                  onChange={(e) => setShowMin(e.target.checked)}
                />
                <label htmlFor="min-line" className="text-sm text-[#2e3138]">
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
                value={ageRange.min}
                onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
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
                value={ageRange.max}
                onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lollipop Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-[#2e3138] mb-4 text-center">
          Top {topN} - {metrics.find(m => m.value === selectedMetric)?.label}
        </h4>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
              <p className="text-[#6d6d6d]">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-96">
            <LollipopChart 
              data={filteredData}
              stats={stats}
              showMax={showMax}
              showMin={showMin}
              showAvg={showAvg}
              showNorm={showNorm}
              showRaw={showRaw}
              highlightPlayerId={playerId}
              metric={selectedMetric}
              metrics={metrics}
            />
          </div>
        )}
        
        {/* Statistics Summary */}
        {!loading && !error && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-[#6d6d6d]">Mínimo</p>
              <p className="text-lg font-bold text-[#ef4444]">
                {showNorm ? '0' : Math.round(stats.min * 10) / 10}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-[#6d6d6d]">Promedio</p>
              <p className="text-lg font-bold text-[#2563eb]">
                {showNorm ? '50' : Math.round(stats.avg * 10) / 10}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-[#6d6d6d]">Máximo</p>
              <p className="text-lg font-bold text-[#22c55e]">
                {showNorm ? '100' : Math.round(stats.max * 10) / 10}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-[#6d6d6d]">Mostrando</p>
              <p className="text-lg font-bold text-[#8c1a10]">
                {filteredData.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Lollipop Chart Component
interface LollipopChartProps {
  data: LollipopData[];
  stats: { min: number; max: number; avg: number; count: number };
  showMax: boolean;
  showMin: boolean;
  showAvg: boolean;
  showNorm: boolean;
  showRaw: boolean;
  highlightPlayerId?: string;
  metric: string;
  metrics: Array<{ value: string; label: string }>;
}

function LollipopChart({ 
  data, 
  stats, 
  showMax, 
  showMin, 
  showAvg, 
  showNorm, 
  showRaw,
  highlightPlayerId,
  metric,
  metrics 
}: LollipopChartProps) {
  const width = 800;
  const height = Math.max(400, data.length * 25 + 100); // Dynamic height based on data
  const margin = { top: 20, right: 150, bottom: 50, left: 200 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate value range for scaling
  const valueRange = showNorm ? [0, 100] : [stats.min, stats.max];
  const maxDisplayValue = showNorm ? 100 : stats.max;
  
  const valueScale = (value: number) => {
    const normalizedValue = showNorm ? 
      ((value - stats.min) / (stats.max - stats.min)) * 100 : 
      value;
    return (normalizedValue / maxDisplayValue) * chartWidth;
  };

  // Calculate reference lines
  const avgX = valueScale(showNorm ? 50 : stats.avg);
  const minX = valueScale(showNorm ? 0 : stats.min);
  const maxX = valueScale(showNorm ? 100 : stats.max);

  const rowHeight = Math.max(20, chartHeight / Math.max(data.length, 1));

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Background */}
      <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} fill="#f9fafb" stroke="#e5e7eb" />

      {/* Reference lines */}
      {showMin && (
        <g>
          <line
            x1={margin.left + minX}
            y1={margin.top}
            x2={margin.left + minX}
            y2={margin.top + chartHeight}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={margin.left + minX}
            y={margin.top - 5}
            textAnchor="middle"
            className="text-xs fill-red-600 font-medium"
          >
            Min
          </text>
        </g>
      )}
      
      {showAvg && (
        <g>
          <line
            x1={margin.left + avgX}
            y1={margin.top}
            x2={margin.left + avgX}
            y2={margin.top + chartHeight}
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={margin.left + avgX}
            y={margin.top - 5}
            textAnchor="middle"
            className="text-xs fill-blue-600 font-medium"
          >
            Avg
          </text>
        </g>
      )}
      
      {showMax && (
        <g>
          <line
            x1={margin.left + maxX}
            y1={margin.top}
            x2={margin.left + maxX}
            y2={margin.top + chartHeight}
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={margin.left + maxX}
            y={margin.top - 5}
            textAnchor="middle"
            className="text-xs fill-green-600 font-medium"
          >
            Max
          </text>
        </g>
      )}

      {/* Data points */}
      {data.map((player, i) => {
        const y = margin.top + (i * rowHeight) + (rowHeight / 2);
        const lineLength = valueScale(player.value);
        const isHighlighted = player.id === highlightPlayerId;
        
        return (
          <g key={player.id}>
            {/* Player name and rank */}
            <text
              x={margin.left - 10}
              y={y + 4}
              textAnchor="end"
              className={`text-sm font-medium ${isHighlighted ? 'fill-red-600' : 'fill-gray-700'}`}
            >
              #{player.rank} {player.name}
            </text>
            
            {/* Lollipop stick */}
            <line
              x1={margin.left}
              y1={y}
              x2={margin.left + lineLength}
              y2={y}
              stroke={isHighlighted ? "#8c1a10" : "#3b82f6"}
              strokeWidth={isHighlighted ? 4 : 3}
            />
            
            {/* Lollipop circle */}
            <circle 
              cx={margin.left + lineLength} 
              cy={y} 
              r={isHighlighted ? 8 : 6}
              fill={isHighlighted ? "#8c1a10" : "#3b82f6"}
              stroke={isHighlighted ? "#ffffff" : "none"}
              strokeWidth={isHighlighted ? 2 : 0}
            >
              <title>
                {player.name} ({player.position})
                {'\n'}Valor: {Math.round(player.value * 10) / 10}
                {'\n'}Ranking: #{player.rank}
                {'\n'}Edad: {player.age}
                {'\n'}Equipo: {player.team}
              </title>
            </circle>
            
            {/* Value label */}
            <text
              x={margin.left + lineLength + 15}
              y={y + 4}
              className={`text-xs font-medium ${isHighlighted ? 'fill-red-600' : 'fill-gray-600'}`}
            >
              {Math.round(player.value * 10) / 10}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text
        x={margin.left + chartWidth / 2}
        y={height - 10}
        textAnchor="middle"
        className="text-sm fill-gray-700 font-medium"
      >
        {metrics.find(m => m.value === metric)?.label} {showNorm ? '(Normalizado 0-100)' : '(Valores Reales)'}
      </text>
    </svg>
  );
}