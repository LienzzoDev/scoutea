"use client"

interface BarData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarData[]
  title?: string
  maxValue?: number
  showRanking?: boolean
}

export function BarChart({ data, title, maxValue, showRanking = true }: BarChartProps) {
  // Filtrar datos válidos y manejar valores null/undefined
  const validData = data.filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
  const calculatedMaxValue = maxValue || (validData.length > 0 ? Math.max(...validData.map(d => d.value)) * 1.2 : 100)
  
  // Dimensiones del SVG y área de gráfico
  const svgWidth = 350
  const svgHeight = 280
  const margin = { top: 20, right: 15, bottom: 50, left: 50 }
  const chartWidth = svgWidth - margin.left - margin.right
  const chartHeight = svgHeight - margin.top - margin.bottom

  // Calculate bar width and spacing
  const barCount = validData.length
  const barWidth = Math.max(chartWidth / (barCount * 1.5), 30) // Espaciado automático
  const gap = (chartWidth - (barWidth * barCount)) / (barCount + 1)

  // Generate Y-axis ticks
  const tickCount = 5
  const ticks = Array.from({ length: tickCount }, (_, i) => 
    Math.round((calculatedMaxValue / (tickCount - 1)) * i)
  )

  // Default colors for bars
  const defaultColors = ["#8B4513", "#06b6d4", "#0891b2", "#0e7490"]

  if (validData.length === 0) {
    return (
      <div className="relative bg-white rounded-lg p-6 border border-gray-200 h-[340px] flex items-center justify-center shadow-sm">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-base font-medium text-gray-500">Sin datos</div>
          <div className="text-sm text-gray-400">disponibles</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white rounded-lg p-6 border border-gray-200 shadow-sm w-full max-w-md mx-auto">
      {/* Ranking Badge */}
      {showRanking && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-medium text-gray-500">RANKING</span>
        </div>
      )}

      {/* Title */}
      {title && (
        <div className="mb-6">
          <h3 className="text-base font-bold tracking-wider text-[#8B4513] text-center">
            {title}
          </h3>
        </div>
      )}

      {/* Chart Container */}
      <div className="mt-4 w-full overflow-hidden">
        <svg 
          width="100%" 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="mx-auto max-w-full"
        >
          {/* Chart area background (for debugging) */}
          <rect
            x={margin.left}
            y={margin.top}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            stroke="transparent"
          />

          {/* Y-axis labels and grid lines */}
          {ticks.map((tick, index) => {
            const y = margin.top + chartHeight - (tick / calculatedMaxValue) * chartHeight
            return (
              <g key={`tick-${tick}-${index}`}>
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs"
                  fontSize="10"
                  fill="#9CA3AF"
                >
                  {tick >= 1000000 
                    ? `${(tick / 1000000).toFixed(0)}M`
                    : tick >= 1000 
                    ? `${(tick / 1000).toFixed(0)}K`
                    : tick
                  }
                </text>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartWidth}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </g>
            )
          })}

          {/* Bars */}
          {validData.map((item, index) => {
            const safeValue = item.value || 0
            const barHeight = (safeValue / calculatedMaxValue) * chartHeight
            const x = margin.left + gap + index * (barWidth + gap)
            const y = margin.top + chartHeight - barHeight
            const color = item.color || defaultColors[index % defaultColors.length]

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  fill={color}
                  opacity={0.9}
                  rx="3"
                  className="hover:opacity-100 transition-opacity cursor-pointer drop-shadow-sm"
                />
                
                {/* Value label on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-xs font-semibold"
                  fontSize="11"
                  fill="#374151"
                >
                  {safeValue >= 1000000 
                    ? `${(safeValue / 1000000).toFixed(1)}M`
                    : safeValue >= 1000 
                    ? `${(safeValue / 1000).toFixed(1)}K`
                    : safeValue.toFixed(1)
                  }
                </text>

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={margin.top + chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fontSize="11"
                  fill="#6B7280"
                >
                  {item.label}
                </text>
              </g>
            )
          })}

          {/* X-axis line */}
          <line
            x1={margin.left}
            y1={margin.top + chartHeight}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight}
            stroke="#374151"
            strokeWidth="1"
          />

          {/* Y-axis line */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + chartHeight}
            stroke="#374151"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  )
}