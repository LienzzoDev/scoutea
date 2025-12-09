"use client";

import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerBeeswarm, BeeswarmData } from '@/hooks/player/usePlayerBeeswarm';

interface PlayerBeeswarmProps {
  playerId?: string; // Optional: highlight specific player
}

export default function PlayerBeeswarm({ playerId }: PlayerBeeswarmProps) {
  // Filter states
  const [selectedMetric, setSelectedMetric] = useState('player_rating');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });
  const [showMax, setShowMax] = useState(false);
  const [showMin, setShowMin] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [showNorm, setShowNorm] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Use the custom hook
  const { data, filterOptions, loading, error, getFilteredData } = usePlayerBeeswarm(selectedMetric);

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
    ageMax: ageRange.max
  });

  // Calculate statistics
  const values = filteredData.map(d => d.value).filter(v => isFinite(v) && !isNaN(v));
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

  // Ensure min and max are different to avoid division by zero
  if (stats.min === stats.max) {
    stats.max = stats.min + 1;
  }

  // Normalize values for display
  const normalizedData = filteredData.map(player => ({
    ...player,
    normalizedValue: showNorm && stats.max > stats.min ? 
      ((player.value - stats.min) / (stats.max - stats.min)) * 100 : 
      player.value
  }));



  return (
    <div className="bg-white p-6">
      {/* Beeswarm Header */}
      <div className="flex items-center justify-between mb-6">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <h3 className="text-xl font-bold text-[#8c1a10]">ENJAMBRE</h3>
          <div className={`w-5 h-5 text-[#8c1a10] text-xl transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}>▼</div>
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
      {isFiltersOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Período
            </label>
            <Select defaultValue="1y">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
                <SelectItem value="2y">2 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Estadísticas
            </label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estadística..." />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-3">
              Tipo de Valores
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="norm-beeswarm" 
                  name="valueTypeBeeswarm"
                  className="rounded" 
                  checked={showNorm}
                  onChange={() => {
                    setShowNorm(true);
                    setShowRaw(false);
                  }}
                />
                <label htmlFor="norm-beeswarm" className="text-sm text-[#2e3138]">
                  Valores Normalizados (0-100)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="raw-beeswarm" 
                  name="valueTypeBeeswarm"
                  className="rounded" 
                  checked={showRaw}
                  onChange={() => {
                    setShowRaw(true);
                    setShowNorm(false);
                  }}
                />
                <label htmlFor="raw-beeswarm" className="text-sm text-[#2e3138]">
                  Valores Reales
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
                  id="avg-beeswarm"
                  className="rounded"
                  checked={showAvg}
                  onChange={(e) => setShowAvg(e.target.checked)}
                />
                <label htmlFor="avg-beeswarm" className="text-sm text-[#2e3138]">
                  Promedio
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="max-beeswarm"
                  className="rounded"
                  checked={showMax}
                  onChange={(e) => setShowMax(e.target.checked)}
                />
                <label htmlFor="max-beeswarm" className="text-sm text-[#2e3138]">
                  Máximo
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="min-beeswarm"
                  className="rounded"
                  checked={showMin}
                  onChange={(e) => setShowMin(e.target.checked)}
                />
                <label htmlFor="min-beeswarm" className="text-sm text-[#2e3138]">
                  Mínimo
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Posición
            </label>
            <Select value={selectedPosition || undefined} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las Posiciones" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.positions.map(pos => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label} ({pos.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Edad Mín
              </label>
              <input
                type="number"
                className="w-full p-2 border border-[#8c1a10] rounded-md bg-white"
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
                className="w-full p-2 border border-[#8c1a10] rounded-md bg-white"
                placeholder="45"
                min="16"
                max="45"
                value={ageRange.max}
                onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Nacionalidad
            </label>
            <Select value={selectedNationality || undefined} onValueChange={setSelectedNationality}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las Nacionalidades" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.nationalities.map(nat => (
                  <SelectItem key={nat.value} value={nat.value}>
                    {nat.label} ({nat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Competición
            </label>
            <Select value={selectedCompetition || undefined} onValueChange={setSelectedCompetition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las Competiciones" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.competitions.map(comp => (
                  <SelectItem key={comp.value} value={comp.value}>
                    {comp.label} ({comp.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
      )}

      {/* Beeswarm Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-[#2e3138] mb-4 text-center">
          Distribución de {metrics.find(m => m.value === selectedMetric)?.label} ({filteredData.length} jugadores)
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
            <BeeswarmChart 
              data={normalizedData}
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
              <p className="text-sm text-[#6d6d6d]">Total</p>
              <p className="text-lg font-bold text-[#8c1a10]">
                {stats.count}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Beeswarm Chart Component
interface BeeswarmChartProps {
  data: BeeswarmData[];
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

function BeeswarmChart({ 
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
}: BeeswarmChartProps) {
  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 50, bottom: 50, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate value range for scaling
  const valueRange = showNorm ? [0, 100] : [stats.min, stats.max];
  const valueScale = (value: number) => {
    // Handle invalid values
    if (!isFinite(value) || isNaN(value)) {
      return margin.left + chartWidth / 2; // Center position for invalid values
    }
    
    const normalizedValue = showNorm ? 
      ((value - stats.min) / (stats.max - stats.min)) * 100 : 
      value;
    
    // Handle division by zero or invalid range
    const rangeDiff = valueRange[1] - valueRange[0];
    if (rangeDiff === 0 || !isFinite(rangeDiff)) {
      return margin.left + chartWidth / 2; // Center position
    }
    
    const scaledValue = margin.left + ((normalizedValue - valueRange[0]) / rangeDiff) * chartWidth;
    
    // Ensure the result is finite
    return isFinite(scaledValue) ? scaledValue : margin.left + chartWidth / 2;
  };

  // Simple beeswarm positioning (avoiding overlaps)
  const positionedData = data.map((d, i) => {
    const x = valueScale(d.value);
    // Simple vertical jittering to avoid overlaps
    const y = margin.top + (chartHeight / 2) + (Math.random() - 0.5) * (chartHeight * 0.8);
    
    return {
      ...d,
      x: isFinite(x) ? x : margin.left + chartWidth / 2,
      y: isFinite(y) ? y : margin.top + chartHeight / 2,
      isHighlighted: d.id === highlightPlayerId
    };
  });

  // Calculate reference lines
  const avgX = valueScale(showNorm ? 50 : (stats.avg || 0));
  const minX = valueScale(showNorm ? 0 : (stats.min || 0));
  const maxX = valueScale(showNorm ? 100 : (stats.max || 100));

  // Generate tick marks
  const ticks = showNorm ? 
    [0, 20, 40, 60, 80, 100] : 
    Array.from({ length: 6 }, (_, i) => 
      stats.min + (stats.max - stats.min) * (i / 5)
    );

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Grid lines and labels */}
      {ticks.map((tick, i) => {
        const x = valueScale(tick);
        return (
          <g key={i}>
            <line
              x1={x}
              y1={margin.top}
              x2={x}
              y2={height - margin.bottom}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={x}
              y={height - margin.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {Math.round(tick * 10) / 10}
            </text>
          </g>
        );
      })}

      {/* Reference lines */}
      {showMin && (
        <line
          x1={minX}
          y1={margin.top}
          x2={minX}
          y2={height - margin.bottom}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}
      
      {showAvg && (
        <line
          x1={avgX}
          y1={margin.top}
          x2={avgX}
          y2={height - margin.bottom}
          stroke="#2563eb"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}
      
      {showMax && (
        <line
          x1={maxX}
          y1={margin.top}
          x2={maxX}
          y2={height - margin.bottom}
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}

      {/* Data points */}
      {positionedData.map((d, i) => (
        <g key={d.id}>
          <circle
            cx={d.x}
            cy={d.y}
            r={d.isHighlighted ? 7 : 4}
            fill={d.isHighlighted ? "#ef4444" : "#60a5fa"}
            opacity={d.isHighlighted ? 1 : 0.7}
            stroke={d.isHighlighted ? "#ffffff" : "none"}
            strokeWidth={d.isHighlighted ? 3 : 0}
            className="cursor-pointer hover:opacity-100"
          >
            <title>
              {d.name} ({d.position})
              {'\n'}Valor: {Math.round(d.value * 10) / 10}
              {'\n'}Edad: {d.age}
              {'\n'}Equipo: {d.team}
            </title>
          </circle>
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${width - 150}, 30)`}>
        {showMin && (
          <g>
            <line x1="0" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
            <text x="25" y="4" className="text-xs fill-gray-700">Mínimo</text>
          </g>
        )}
        {showAvg && (
          <g transform="translate(0, 20)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" />
            <text x="25" y="4" className="text-xs fill-gray-700">Promedio</text>
          </g>
        )}
        {showMax && (
          <g transform="translate(0, 40)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
            <text x="25" y="4" className="text-xs fill-gray-700">Máximo</text>
          </g>
        )}
      </g>

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 10}
        textAnchor="middle"
        className="text-sm fill-gray-700 font-medium"
      >
        {metrics.find(m => m.value === metric)?.label} {showNorm ? '(Normalizado 0-100)' : '(Valores Reales)'}
      </text>
    </svg>
  );
}