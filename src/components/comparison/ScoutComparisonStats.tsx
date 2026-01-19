'use client'

import { BarChart3, Table } from 'lucide-react'
import { useState, useEffect } from 'react'

// Tipo para los datos de scout
interface ScoutStats {
  id_scout: string
  scout_name: string | null
  // Reports
  total_reports: number | null
  original_reports: number | null
  // Portfolio metrics
  avg_potential: number | null
  avg_initial_age: number | null
  // Financial metrics
  total_investment: number | null
  net_profits: number | null
  roi: number | null
  // Profit metrics
  avg_initial_trfm_value: number | null
  max_profit_report: number | null
  min_profit_report: number | null
  avg_profit_report: number | null
  // Transfer points
  transfer_team_pts: number | null
  transfer_competition_pts: number | null
  // Rankings
  scout_ranking: number | null
  scout_level: string | null
}

interface ScoutComparisonStatsProps {
  scout1Id: string
  scout2Id: string
  scout1Name: string
  scout2Name: string
}

// Definición de métricas por categoría
const STATS_CATEGORIES = {
  reports: {
    label: 'Reports',
    metrics: [
      { key: 'total_reports', label: 'Total Reports', format: 'number' },
      { key: 'original_reports', label: 'Original Reports', format: 'number' },
    ],
  },
  portfolio: {
    label: 'Portfolio',
    metrics: [
      { key: 'avg_potential', label: 'Avg Potential', format: 'decimal' },
      { key: 'avg_initial_age', label: 'Avg Initial Age', format: 'decimal' },
      { key: 'avg_initial_trfm_value', label: 'Avg Initial Value', format: 'currency' },
    ],
  },
  financial: {
    label: 'Financial',
    metrics: [
      { key: 'total_investment', label: 'Total Investment', format: 'currency' },
      { key: 'net_profits', label: 'Net Profits', format: 'currency' },
      { key: 'roi', label: 'ROI', format: 'percent' },
    ],
  },
  profitability: {
    label: 'Profitability',
    metrics: [
      { key: 'max_profit_report', label: 'Max Profit Report', format: 'currency' },
      { key: 'min_profit_report', label: 'Min Profit Report', format: 'currency' },
      { key: 'avg_profit_report', label: 'Avg Profit Report', format: 'currency' },
    ],
  },
  transferPoints: {
    label: 'Transfer Points',
    metrics: [
      { key: 'transfer_team_pts', label: 'Team Transfer Pts', format: 'decimal' },
      { key: 'transfer_competition_pts', label: 'Competition Transfer Pts', format: 'decimal' },
    ],
  },
}

// Helper para formatear valores
function formatValue(value: number | null, format: string): string {
  if (value === null || value === undefined) return '-'

  switch (format) {
    case 'number':
      return Math.round(value).toLocaleString()
    case 'decimal':
      return value.toFixed(2)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'currency':
      if (Math.abs(value) >= 1000000) {
        return `€${(value / 1000000).toFixed(2)}M`
      } else if (Math.abs(value) >= 1000) {
        return `€${(value / 1000).toFixed(1)}K`
      }
      return `€${value.toFixed(0)}`
    default:
      return String(value)
  }
}

// Componente de barra comparativa enfrentada
function ComparisonBar({
  value1,
  value2,
}: {
  value1: number
  value2: number
  scout1Name: string
  scout2Name: string
}) {
  // Para valores negativos (ej: pérdidas), usamos valor absoluto para la barra
  const absValue1 = Math.abs(value1)
  const absValue2 = Math.abs(value2)
  const total = absValue1 + absValue2
  const percent1 = total > 0 ? (absValue1 / total) * 100 : 50
  const percent2 = total > 0 ? (absValue2 / total) * 100 : 50

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Valor Scout 1 */}
      <div className="w-16 text-right text-sm font-semibold text-[#8c1a10]">
        {value1.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </div>

      {/* Barras enfrentadas */}
      <div className="flex-1 flex h-6 rounded-full overflow-hidden bg-gray-100">
        {/* Barra Scout 1 (derecha hacia centro) */}
        <div
          className="h-full bg-[#8c1a10] transition-all duration-500 ease-out flex items-center justify-end"
          style={{ width: `${percent1}%` }}
        >
          {percent1 > 15 && (
            <span className="text-white text-xs font-medium pr-2">
              {percent1.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Barra Scout 2 (izquierda hacia centro) */}
        <div
          className="h-full bg-[#2563eb] transition-all duration-500 ease-out flex items-center justify-start"
          style={{ width: `${percent2}%` }}
        >
          {percent2 > 15 && (
            <span className="text-white text-xs font-medium pl-2">
              {percent2.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Valor Scout 2 */}
      <div className="w-16 text-left text-sm font-semibold text-[#2563eb]">
        {value2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </div>
    </div>
  )
}

export default function ScoutComparisonStats({
  scout1Id,
  scout2Id,
  scout1Name,
  scout2Name,
}: ScoutComparisonStatsProps) {
  const [viewMode, setViewMode] = useState<'data' | 'visual'>('visual')
  const [stats1, setStats1] = useState<ScoutStats | null>(null)
  const [stats2, setStats2] = useState<ScoutStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar stats de ambos scouts
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/scouts/${scout1Id}/stats`),
          fetch(`/api/scouts/${scout2Id}/stats`),
        ])

        const data1 = await res1.json()
        const data2 = await res2.json()

        setStats1(data1.success ? data1.data : null)
        setStats2(data2.success ? data2.data : null)
      } catch (error) {
        console.error('Error loading scout comparison stats:', error)
        setStats1(null)
        setStats2(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [scout1Id, scout2Id])

  // Helper para obtener valor de stat
  const getStatValue = (stats: ScoutStats | null, metricKey: string): number => {
    if (!stats) return 0
    const value = stats[metricKey as keyof ScoutStats]
    if (typeof value === 'number') return value
    return 0
  }

  // Helper para comparar valores y determinar el mejor
  const compareValues = (val1: number, val2: number): 'scout1' | 'scout2' | 'equal' => {
    if (val1 > val2) return 'scout1'
    if (val2 > val1) return 'scout2'
    return 'equal'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Loading stats...</p>
        </div>
      </div>
    )
  }

  if (!stats1 && !stats2) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#6d6d6d]">No stats available for comparison</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-[#000000]">Scout Statistics Comparison</h3>

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

      {/* Scout Legend (solo en vista visual) */}
      {viewMode === 'visual' && (
        <div className="flex justify-center gap-8 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#8c1a10]"></div>
            <span className="font-medium text-[#2e3138]">{scout1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#2563eb]"></div>
            <span className="font-medium text-[#2e3138]">{scout2Name}</span>
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
                  const val1 = getStatValue(stats1, metric.key)
                  const val2 = getStatValue(stats2, metric.key)

                  return (
                    <div key={metric.key} className="py-2">
                      <div className="text-sm font-medium text-[#2e3138] mb-2 text-center">
                        {metric.label}
                      </div>
                      <ComparisonBar
                        value1={val1}
                        value2={val2}
                        scout1Name={scout1Name}
                        scout2Name={scout2Name}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data View (tabla) */}
      {viewMode === 'data' && (
        <div>
          {Object.entries(STATS_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="mb-8">
              <h3 className="font-bold text-[#8c1a10] mb-4">{category.label}</h3>

              {/* Header con nombres de scouts */}
              <div className="grid grid-cols-3 gap-4 py-3 border-b-2 border-gray-200 mb-2">
                <div className="font-medium text-[#2e3138]">Metric</div>
                <div className="font-medium text-[#8c1a10] text-center">
                  {scout1Name}
                </div>
                <div className="font-medium text-[#2563eb] text-center">
                  {scout2Name}
                </div>
              </div>

              {/* Metric Rows */}
              {category.metrics.map((metric, idx) => {
                const val1 = getStatValue(stats1, metric.key)
                const val2 = getStatValue(stats2, metric.key)
                const formattedVal1 = formatValue(val1, metric.format)
                const formattedVal2 = formatValue(val2, metric.format)
                const comparison = compareValues(val1, val2)

                return (
                  <div
                    key={metric.key}
                    className={`grid grid-cols-3 gap-4 py-3 ${
                      idx < category.metrics.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="font-medium text-[#2e3138]">{metric.label}</div>
                    <div
                      className={`text-center ${
                        comparison === 'scout1'
                          ? 'text-green-600 font-semibold'
                          : 'text-[#6d6d6d]'
                      }`}
                    >
                      {formattedVal1}
                    </div>
                    <div
                      className={`text-center ${
                        comparison === 'scout2'
                          ? 'text-green-600 font-semibold'
                          : 'text-[#6d6d6d]'
                      }`}
                    >
                      {formattedVal2}
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
