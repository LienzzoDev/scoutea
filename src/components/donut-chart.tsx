"use client"

import { useState } from 'react'

interface DonutChartData {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data?: DonutChartData[]
  title?: string
  subtitle?: string
  showLegend?: boolean
  showPercentages?: boolean
}

const defaultColors = [
  "#8B4513", "#A0522D", "#CD853F", "#DEB887", 
  "#F4A460", "#D2691E", "#B8860B", "#DAA520",
  "#BC8F8F", "#F5DEB3", "#D2B48C", "#DDBF94"
]

const defaultData = [
  { name: "Segment 1", value: 5.3 },
  { name: "Segment 2", value: 10.5 },
  { name: "Segment 3", value: 15.8 },
  { name: "Segment 4", value: 21.1 },
  { name: "Segment 5", value: 21.1 },
  { name: "Segment 6", value: 10.5 },
  { name: "Segment 7", value: 15.8 },
]

export function DonutChart({ 
  data = defaultData, 
  title = "SCOUT", 
  subtitle = "ANALYSIS",
  showLegend = true,
  showPercentages = true
}: DonutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  // Asignar colores si no están definidos
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  // Si no hay datos, mostrar un mensaje
  if (total === 0) {
    return (
      <div className="relative w-full max-w-[200px] mx-auto">
        <div className="aspect-square w-full mx-auto flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center text-gray-400 p-6">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="text-xs font-medium text-gray-500 leading-tight">
              Sin datos
            </div>
            <div className="text-xs text-gray-400 leading-tight mt-1">
              disponibles
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY })
  }

  return (
    <div className="relative w-full max-w-[200px] mx-auto" onMouseMove={handleMouseMove}>
      {/* Donut Chart - Responsive size */}
      <div className="aspect-square w-full mx-auto relative">
        <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
          />
          
          {/* Data segments */}
          {chartData.map((segment, index) => {
            const percentage = (segment.value / total) * 100
            const circumference = 2 * Math.PI * 35
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -cumulativePercentage * (circumference / 100)
            cumulativePercentage += percentage

            return (
              <circle
                key={index}
                cx="60"
                cy="60"
                r="35"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 60 60)"
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredSegment === index ? 'opacity-100 drop-shadow-lg' : 'opacity-90'
                }`}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            )
          })}
          
          {/* Center content - más pequeño para no tapar el donut */}
          <text 
            x="60" 
            y="56" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-[9px] font-bold fill-[#8B4513] pointer-events-none"
          >
            {title}
          </text>
          <text 
            x="60" 
            y="66" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-[7px] fill-gray-500 font-medium pointer-events-none"
          >
            {subtitle}
          </text>
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredSegment !== null && (
        <div 
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none text-sm font-medium"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="font-semibold">{chartData[hoveredSegment].name}</div>
          <div className="text-gray-300">
            {chartData[hoveredSegment].value} ({((chartData[hoveredSegment].value / total) * 100).toFixed(1)}%)
          </div>
        </div>
      )}

      {/* Legend below chart */}
      {showLegend && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mt-6">
          <div className="space-y-3">
            {chartData.map((segment, index) => {
              const percentage = ((segment.value / total) * 100).toFixed(1)
              return (
                <div key={index} className="flex items-center justify-between gap-3 hover:bg-gray-50 p-2 rounded transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-gray-700 font-medium truncate text-sm" title={segment.name}>
                      {segment.name}
                    </span>
                  </div>
                  {showPercentages && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-900 font-semibold text-sm">
                        {segment.value}
                      </span>
                      <span className="text-gray-500 text-xs">
                        ({percentage}%)
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}