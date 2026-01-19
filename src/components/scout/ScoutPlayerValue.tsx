'use client'

import { useState, useEffect } from 'react'
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

interface ValueData {
  initialValue: number | null
  initialDate: Date | null
  currentValue: number | null
  currentDate: Date
}

interface ScoutPlayerValueProps {
  playerId: string
  playerCurrentValue: number | null
}

// Formatear valor para eje Y (1M, 2M, etc.)
function formatAxisValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

// Formatear fecha para eje X
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  })
}

export default function ScoutPlayerValue({
  playerId,
  playerCurrentValue,
}: ScoutPlayerValueProps) {
  const [data, setData] = useState<ValueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Obtener perfil del scout
        const profileRes = await fetch('/api/scout/profile')
        const profileData = await profileRes.json()

        if (!profileData.success) {
          setData(null)
          setIsLoading(false)
          return
        }

        // 2. Obtener reportes del scout
        const reportsRes = await fetch(`/api/scout/reports?scoutId=${profileData.scout.id_scout}`)
        const reportsData = await reportsRes.json()

        if (!reportsData.success || !reportsData.data) {
          setData(null)
          setIsLoading(false)
          return
        }

        // 3. Filtrar reportes del jugador y obtener el primero (más antiguo)
        // Convertir a string para comparar correctamente (playerId es string del URL, id_player es número del API)
        const playerReports = reportsData.data
          .filter((r: { player: { id_player: string | number } }) => String(r.player.id_player) === playerId)
          .sort((a: { report_date: string | null }, b: { report_date: string | null }) => {
            const dateA = a.report_date ? new Date(a.report_date).getTime() : 0
            const dateB = b.report_date ? new Date(b.report_date).getTime() : 0
            return dateA - dateB
          })

        if (playerReports.length === 0) {
          setData(null)
          setIsLoading(false)
          return
        }

        const firstReport = playerReports[0] as {
          initial_player_trfm_value?: number | null
          report_date?: string | null
        }

        setData({
          initialValue: firstReport.initial_player_trfm_value || null,
          initialDate: firstReport.report_date ? new Date(firstReport.report_date) : null,
          currentValue: playerCurrentValue,
          currentDate: new Date(),
        })
      } catch (error) {
        console.error('Error loading value data:', error)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [playerId, playerCurrentValue])

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!data || data.initialValue === null) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="text-center py-12 text-[#6d6d6d]">
          No hay datos de valor disponibles para este jugador.
          <br />
          <span className="text-sm">El valor se registra cuando existen reportes con datos históricos.</span>
        </div>
      </div>
    )
  }

  // Preparar datos para la gráfica
  const chartData = [
    {
      date: data.initialDate ? formatDate(data.initialDate) : 'Inicial',
      value: data.initialValue,
      label: 'Initial',
    },
    {
      date: formatDate(data.currentDate),
      value: data.currentValue || 0,
      label: 'Current',
    },
  ]

  // Calcular cambio
  const initialVal = data.initialValue || 0
  const currentVal = data.currentValue || 0
  const absoluteChange = currentVal - initialVal
  const percentChange = initialVal > 0 ? ((absoluteChange / initialVal) * 100) : 0

  // Calcular dominio del eje Y con padding
  const minValue = Math.min(initialVal, currentVal)
  const maxValue = Math.max(initialVal, currentVal)
  const padding = (maxValue - minValue) * 0.2 || maxValue * 0.1
  const yMin = Math.max(0, minValue - padding)
  const yMax = maxValue + padding

  return (
    <div className="space-y-6">
      {/* Gráfica principal */}
      <div className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] p-4">
          <h3 className="font-semibold text-white text-sm">MARKET VALUE OVER TIME</h3>
        </div>

        {/* Subtítulo con valor actual */}
        <div className="text-center py-4 border-b border-[#e7e7e7]">
          <p className="text-sm text-[#6d6d6d]">
            Current Market Value: <span className="font-semibold text-[#2e3138]">{formatMoneyFull(currentVal)}</span>
          </p>
        </div>

        {/* Gráfica */}
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
                dot={{
                  fill: '#3b82f6',
                  strokeWidth: 2,
                  r: 6,
                }}
                activeDot={{
                  fill: '#8c1a10',
                  strokeWidth: 2,
                  r: 8,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen de cambios */}
      <div className="bg-white border border-[#e7e7e7] rounded-lg p-4">
        <h4 className="font-semibold text-[#2e3138] mb-4">Value Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor inicial */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-[#6d6d6d] mb-1">Initial Value</p>
            <p className="text-lg font-semibold text-[#2e3138]">{formatMoneyFull(initialVal)}</p>
            {data.initialDate && (
              <p className="text-xs text-[#6d6d6d] mt-1">
                {new Date(data.initialDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Valor actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-[#6d6d6d] mb-1">Current Value</p>
            <p className="text-lg font-semibold text-[#2e3138]">{formatMoneyFull(currentVal)}</p>
            <p className="text-xs text-[#6d6d6d] mt-1">Today</p>
          </div>

          {/* Cambio */}
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
