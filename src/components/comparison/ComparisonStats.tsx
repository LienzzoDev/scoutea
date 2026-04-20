'use client'

import { BarChart3, Table } from 'lucide-react'
import { useState, useEffect } from 'react'

import type { StatsPeriod } from '@/lib/utils/stats-period-utils'
import { getAllPeriods, getPeriodLabel } from '@/lib/utils/stats-period-utils'

interface PlayerStatsByField {
  totalValue: string
  p90Value: string
  averageValue: string
  maximumValue: string
  percentile: string
}

interface ComparisonStatsProps {
  player1Id: string
  player2Id: string
  player1Name: string
  player2Name: string
}

// Definición de métricas por categoría (mismas que PlayerStats.tsx)
const STATS_CATEGORIES = {
  general: {
    label: 'General',
    metrics: [
      { key: 'matches', label: 'Matches' },
      { key: 'minutes', label: 'Minutes' },
      { key: 'Yellow Cards', label: 'Yellow Cards' },
      { key: 'Red Cards', label: 'Red Cards' },
    ],
  },
  goalkeeping: {
    label: 'Goalkeeping',
    metrics: [
      { key: 'concededGoals', label: 'Conceded Goals' },
      { key: 'preventedGoals', label: 'Prevented Goals' },
      { key: 'shotsAgainst', label: 'Shots Against' },
      { key: 'cleanSheetsPercentage', label: 'Clean Sheets (%)' },
      { key: 'saveRate', label: 'Save Rate (%)' },
    ],
  },
  defending: {
    label: 'Defending',
    metrics: [
      { key: 'tackles', label: 'Tackles' },
      { key: 'interceptions', label: 'Interceptions' },
      { key: 'fouls', label: 'Fouls' },
    ],
  },
  passing: {
    label: 'Passing',
    metrics: [
      { key: 'Passes', label: 'Passes' },
      { key: 'Forward Passes', label: 'Forward Passes' },
      { key: 'Crosses', label: 'Crosses' },
      { key: 'Assists', label: 'Assists' },
      { key: 'Pass Accuracy', label: 'Accurate Passes (%)' },
    ],
  },
  finishing: {
    label: 'Finishing',
    metrics: [
      { key: 'Shots', label: 'Shots' },
      { key: 'Goals', label: 'Goals' },
      { key: 'effectiveness', label: 'Effectiveness (%)' },
    ],
  },
  duels: {
    label: '1vs1',
    metrics: [
      { key: 'offDuels', label: 'Off Duels' },
      { key: 'defDuels', label: 'Def Duels' },
      { key: 'aerDuels', label: 'Aer Duels' },
      { key: 'offDuelsWonPercentage', label: 'Off Duels Won (%)' },
      { key: 'defDuelsWonPercentage', label: 'Def Duels Won (%)' },
      { key: 'aerDuelsWonPercentage', label: 'Aer Duels Won (%)' },
    ],
  },
}

// Métricas en las que un valor menor es mejor (tarjetas, faltas, goles encajados)
const NEGATIVE_METRICS = new Set([
  'Yellow Cards',
  'Red Cards',
  'concededGoals',
  'fouls',
])

// Componente de barra comparativa enfrentada
function ComparisonBar({
  value1,
  value2,
}: {
  value1: number
  value2: number
}) {
  const total = value1 + value2
  const percent1 = total > 0 ? (value1 / total) * 100 : 50
  const percent2 = total > 0 ? (value2 / total) * 100 : 50

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Valor Player 1 */}
      <div className="w-12 text-right text-sm font-semibold text-[#8c1a10]">
        {value1.toLocaleString()}
      </div>

      {/* Barras enfrentadas */}
      <div className="flex-1 flex h-6 rounded-full overflow-hidden bg-gray-100">
        <div
          className="h-full bg-[#8c1a10] transition-all duration-500 ease-out"
          style={{ width: `${percent1}%` }}
        />
        <div
          className="h-full bg-[#2563eb] transition-all duration-500 ease-out"
          style={{ width: `${percent2}%` }}
        />
      </div>

      {/* Valor Player 2 */}
      <div className="w-12 text-left text-sm font-semibold text-[#2563eb]">
        {value2.toLocaleString()}
      </div>
    </div>
  )
}

export default function ComparisonStats({
  player1Id,
  player2Id,
  player1Name,
  player2Name,
}: ComparisonStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('3m')
  const [viewMode, setViewMode] = useState<'data' | 'visual'>('visual')
  const [valueType, setValueType] = useState<'total' | 'p90'>('total')
  const [stats1, setStats1] = useState<Record<string, PlayerStatsByField> | null>(null)
  const [stats2, setStats2] = useState<Record<string, PlayerStatsByField> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const periods = getAllPeriods()

  // Cargar stats de ambos jugadores cuando cambia el período
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/players/${player1Id}/stats-by-period?period=${selectedPeriod}`),
          fetch(`/api/players/${player2Id}/stats-by-period?period=${selectedPeriod}`),
        ])

        const data1 = await res1.json()
        const data2 = await res2.json()

        setStats1(data1.success ? data1.data : null)
        setStats2(data2.success ? data2.data : null)
      } catch (error) {
        console.error('Error loading comparison stats:', error)
        setStats1(null)
        setStats2(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [player1Id, player2Id, selectedPeriod])

  // Helper para obtener valor de stat como string
  const getStatValue = (
    stats: Record<string, PlayerStatsByField> | null,
    metricKey: string,
    field: 'totalValue' | 'p90Value'
  ): string => {
    if (!stats || !stats[metricKey]) return '-'
    return stats[metricKey][field] || '-'
  }

  // Helper para obtener valor de stat como número
  const getStatNumericValue = (
    stats: Record<string, PlayerStatsByField> | null,
    metricKey: string,
    field: 'totalValue' | 'p90Value'
  ): number => {
    if (!stats || !stats[metricKey]) return 0
    const val = stats[metricKey][field]
    if (!val || val === '-') return 0
    return parseFloat(val.replace(/,/g, '')) || 0
  }

  // Devuelve clase de color para cada valor: superior verde, inferior rojo,
  // guion/empate negro. Para métricas negativas se invierte (menor = mejor).
  const getComparisonColors = (
    val1: string,
    val2: string,
    metricKey: string,
  ): { color1: string; color2: string } => {
    const BLACK = 'text-[#000000]'
    const GREEN = 'text-green-600'
    const RED = 'text-red-600'
    if (!val1 || val1 === '-' || !val2 || val2 === '-') {
      return { color1: BLACK, color2: BLACK }
    }
    const num1 = parseFloat(val1.replace(/,/g, ''))
    const num2 = parseFloat(val2.replace(/,/g, ''))
    if (!Number.isFinite(num1) || !Number.isFinite(num2) || num1 === num2) {
      return { color1: BLACK, color2: BLACK }
    }
    const higherIsBetter = !NEGATIVE_METRICS.has(metricKey)
    const p1Better = higherIsBetter ? num1 > num2 : num1 < num2
    return p1Better ? { color1: GREEN, color2: RED } : { color1: RED, color2: GREEN }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Period Selector */}
        <div className="flex gap-2 border-b border-[#e7e7e7]">
          {periods.map((period) => (
            <button
              key={period}
              className={`pb-2 px-3 font-medium transition-colors ${
                selectedPeriod === period
                  ? 'border-b-2 border-[#8c1a10] text-[#8c1a10]'
                  : 'text-[#6d6d6d] hover:text-[#8c1a10]'
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>

        {/* View Mode Toggle + Value Type Toggle */}
        <div className="flex items-center gap-4">
          {/* Value Type Toggle (solo en vista visual) */}
          {viewMode === 'visual' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  valueType === 'total'
                    ? 'bg-white text-[#8c1a10] shadow-sm'
                    : 'text-[#6d6d6d] hover:text-[#8c1a10]'
                }`}
                onClick={() => setValueType('total')}
              >
                Total
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  valueType === 'p90'
                    ? 'bg-white text-[#8c1a10] shadow-sm'
                    : 'text-[#6d6d6d] hover:text-[#8c1a10]'
                }`}
                onClick={() => setValueType('p90')}
              >
                Per 90
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'visual'
                  ? 'bg-white text-[#8c1a10] shadow-sm'
                  : 'text-[#6d6d6d] hover:text-[#8c1a10]'
              }`}
              onClick={() => setViewMode('visual')}
              title="Visual view"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Visual</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'data'
                  ? 'bg-white text-[#8c1a10] shadow-sm'
                  : 'text-[#6d6d6d] hover:text-[#8c1a10]'
              }`}
              onClick={() => setViewMode('data')}
              title="Data view"
            >
              <Table className="w-4 h-4" />
              <span className="text-sm font-medium">Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Player Legend (solo en vista visual) */}
      {viewMode === 'visual' && (
        <div className="flex justify-center gap-8 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#8c1a10]"></div>
            <span className="font-medium text-[#2e3138]">{player1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#2563eb]"></div>
            <span className="font-medium text-[#2e3138]">{player2Name}</span>
          </div>
        </div>
      )}

      {/* Visual View */}
      {viewMode === 'visual' && (
        <div className="space-y-8">
          {Object.entries(STATS_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey}>
              <h3 className="font-bold text-[#8c1a10] mb-4">{category.label}</h3>
              <div className="space-y-3">
                {category.metrics.map((metric) => {
                  const field = valueType === 'total' ? 'totalValue' : 'p90Value'
                  const val1 = getStatNumericValue(stats1, metric.key, field)
                  const val2 = getStatNumericValue(stats2, metric.key, field)

                  return (
                    <div key={metric.key} className="py-2">
                      <div className="text-sm font-medium text-[#2e3138] mb-2 text-center">
                        {metric.label}
                      </div>
                      <ComparisonBar value1={val1} value2={val2} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data View (tabla original) */}
      {viewMode === 'data' && (
        <div>
          {Object.entries(STATS_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="mb-8">
              {/* Header con nombre del bloque y nombres de jugadores */}
              <div className="grid grid-cols-5 gap-4 py-3 border-b-2 border-gray-200 mb-2">
                <div className="font-bold text-[#8c1a10]">{category.label}</div>
                <div className="font-medium text-[#8c1a10] text-center col-span-2">
                  {player1Name}
                </div>
                <div className="font-medium text-[#2563eb] text-center col-span-2">
                  {player2Name}
                </div>
              </div>

              {/* Sub-header con Total y P90 */}
              <div className="grid grid-cols-5 gap-4 py-1 border-b border-gray-100 text-xs text-[#6d6d6d]">
                <div></div>
                <div className="text-center">Total</div>
                <div className="text-center">P90</div>
                <div className="text-center">Total</div>
                <div className="text-center">P90</div>
              </div>

              {/* Metric Rows */}
              {category.metrics.map((metric, idx) => {
                const total1 = getStatValue(stats1, metric.key, 'totalValue')
                const p901 = getStatValue(stats1, metric.key, 'p90Value')
                const total2 = getStatValue(stats2, metric.key, 'totalValue')
                const p902 = getStatValue(stats2, metric.key, 'p90Value')

                const totalColors = getComparisonColors(total1, total2, metric.key)
                const p90Colors = getComparisonColors(p901, p902, metric.key)
                const weight = (color: string) =>
                  color === 'text-[#000000]' ? '' : 'font-semibold'

                return (
                  <div
                    key={metric.key}
                    className={`grid grid-cols-5 gap-4 py-3 ${
                      idx < category.metrics.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="font-medium text-[#2e3138]">{metric.label}</div>
                    <div className={`text-center ${totalColors.color1} ${weight(totalColors.color1)}`}>
                      {total1}
                    </div>
                    <div className={`text-center ${p90Colors.color1} ${weight(p90Colors.color1)}`}>
                      {p901}
                    </div>
                    <div className={`text-center ${totalColors.color2} ${weight(totalColors.color2)}`}>
                      {total2}
                    </div>
                    <div className={`text-center ${p90Colors.color2} ${weight(p90Colors.color2)}`}>
                      {p902}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
