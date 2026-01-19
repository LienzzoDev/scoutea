
import { TrendingUp, FileText, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GrowthChartProps {
  title: string
  data: { month: string; count: number }[] // month: YYYY-MM
  type: 'reports' | 'scouts'
  loading?: boolean
}

export function GrowthChart({ title, data, type, loading = false }: GrowthChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  // Color configuration
  const color = type === 'reports' ? '#3b82f6' : '#10b981' // Blue for reports, Emerald for scouts

  return (
    <Card className="bg-[#131921] border-slate-700 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#D6DDE6] flex items-center gap-2">
          {type === 'reports' ? <FileText className="h-5 w-5 text-blue-400" /> : <Users className="h-5 w-5 text-emerald-400" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">
            Cargando...
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500">
            Sin datos disponibles
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2">
            {data.map((item, index) => {
              const heightPercent = (item.count / maxCount) * 100
              const label = item.month.split('-')[1] // Get MM only
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {item.month}: {item.count}
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full rounded-t-sm transition-all duration-500 ease-out hover:opacity-80"
                    style={{ 
                      height: `${Math.max(heightPercent, 2)}%`,
                      backgroundColor: color 
                    }}
                  />
                  
                  {/* Label */}
                  <span className="text-[10px] text-slate-500 mt-2">{label}</span>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Legend/Info */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Últimos 12 meses
          </div>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
            <TrendingUp className="h-3 w-3" />
            Total: {data.reduce((a, b) => a + b.count, 0)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
