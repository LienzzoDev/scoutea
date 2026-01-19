
import { Users, AlertTriangle, Link as LinkIcon, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsBlockProps {
  title: string
  total: number
  lastScraping: string | null
  erroneousUrls: number
  missingTrfmUrls: number
  loading?: boolean
}

export function StatsBlock({ 
  title, 
  total, 
  lastScraping, 
  erroneousUrls, 
  missingTrfmUrls,
  loading = false
}: StatsBlockProps) {
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Card className="bg-[#131921] border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#D6DDE6] flex items-center gap-2">
          {title === 'Jugadores' ? <Users className="h-5 w-5 text-blue-400" /> : <Users className="h-5 w-5 text-green-400" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Count */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-slate-400 text-sm">Total existentes</span>
          <span className="text-2xl font-bold text-[#D6DDE6]">
            {loading ? '...' : total.toLocaleString()}
          </span>
        </div>

        {/* Last Scraping */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>Último Scraping</span>
          </div>
          <span className="text-sm text-[#D6DDE6]">
            {loading ? '...' : formatDate(lastScraping)}
          </span>
        </div>

        {/* Erroneous URLs */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span>URLs Erróneas</span>
          </div>
          <span className={`text-sm font-medium ${erroneousUrls > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {loading ? '...' : erroneousUrls.toLocaleString()}
          </span>
        </div>

        {/* Missing URLs */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LinkIcon className="h-4 w-4 text-orange-400" />
            <span>Sin URL Transfermarkt</span>
          </div>
          <span className={`text-sm font-medium ${missingTrfmUrls > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
            {loading ? '...' : missingTrfmUrls.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
