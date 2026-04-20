'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { formatMoneyFull } from '@/lib/utils/format-money'

function formatAxisValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  })
}

interface PlayerValueEvolutionProps {
  initialValue: number | null
  initialDate: Date | null
  currentValue: number | null
}

export default function PlayerValueEvolution({
  initialValue,
  initialDate,
  currentValue,
}: PlayerValueEvolutionProps) {
  if (initialValue === null || initialValue === undefined) {
    return (
      <div className="bg-white p-6 rounded-lg border border-[#e7e7e7]">
        <div className="text-center py-8 text-[#6d6d6d]">
          No market value data available.
          <br />
          <span className="text-sm">The value is recorded when the player is added to the platform.</span>
        </div>
      </div>
    )
  }

  const initialVal = initialValue || 0
  const currentVal = currentValue || 0
  const absoluteChange = currentVal - initialVal
  const percentChange = initialVal > 0 ? ((absoluteChange / initialVal) * 100) : 0

  const chartData = [
    {
      date: initialDate ? formatDate(new Date(initialDate)) : 'Inicial',
      value: initialVal,
    },
    {
      date: formatDate(new Date()),
      value: currentVal,
    },
  ]

  const minValue = Math.min(initialVal, currentVal)
  const maxValue = Math.max(initialVal, currentVal)
  const padding = (maxValue - minValue) * 0.2 || maxValue * 0.1
  const yMin = Math.max(0, minValue - padding)
  const yMax = maxValue + padding

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden">
        <div className="bg-[#1e3a5f] p-4">
          <h3 className="font-semibold text-white text-sm">MARKET VALUE OVER TIME</h3>
        </div>

        <div className="text-center py-4 border-b border-[#e7e7e7]">
          <p className="text-sm text-[#6d6d6d]">
            Current Market Value: <span className="font-semibold text-[#2e3138]">{formatMoneyFull(currentVal)}</span>
          </p>
        </div>

        <div className="p-4" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e7" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6d6d6d' }}
                axisLine={{ stroke: '#e7e7e7' }}
              />
              <YAxis
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 12, fill: '#6d6d6d' }}
                axisLine={{ stroke: '#e7e7e7' }}
                domain={[yMin, yMax]}
              />
              <Tooltip
                formatter={(value: number) => [formatMoneyFull(value), 'Market Value']}
                labelStyle={{ color: '#2e3138' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e7e7e7',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ fill: '#8c1a10', strokeWidth: 2, r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-[#e7e7e7] rounded-lg p-4">
        <h4 className="font-semibold text-[#2e3138] mb-4">Value Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-[#6d6d6d] mb-1">Initial Value</p>
            <p className="text-lg font-semibold text-[#2e3138]">{formatMoneyFull(initialVal)}</p>
            {initialDate && (
              <p className="text-xs text-[#6d6d6d] mt-1">
                {new Date(initialDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-[#6d6d6d] mb-1">Current Value</p>
            <p className="text-lg font-semibold text-[#2e3138]">{formatMoneyFull(currentVal)}</p>
            <p className="text-xs text-[#6d6d6d] mt-1">Today</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-[#6d6d6d] mb-1">Change</p>
            <p className={`text-lg font-semibold ${
              absoluteChange > 0 ? 'text-green-600' : absoluteChange < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {absoluteChange > 0 ? '+' : ''}{formatMoneyFull(absoluteChange)}
            </p>
            <p className={`text-xs mt-1 ${
              percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
