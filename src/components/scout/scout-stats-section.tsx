'use client'

import { TrendingUp, Users, FileText, Target, Award } from 'lucide-react'

import { Card } from '@/components/ui/card'

interface ScoutStatsSectionProps {
  scoutProfile: any
  players: any[]
}

export default function ScoutStatsSection({
  scoutProfile,
  players
}: ScoutStatsSectionProps) {
  // Calcular estadísticas
  const totalReports = players.length
  const totalROI = players.reduce((sum, p) => sum + (p.latestReport.roi || 0), 0)
  const avgROI = totalReports > 0 ? totalROI / totalReports : 0
  const totalProfit = players.reduce((sum, p) => sum + (p.latestReport.profit || 0), 0)
  const avgProfit = totalReports > 0 ? totalProfit / totalReports : 0

  // Estadísticas por tipo de reporte
  const reportTypes = players.reduce((acc, p) => {
    const type = p.latestReport.report_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Estadísticas por nacionalidad
  const nationalities = players.reduce((acc, p) => {
    const nationality = p.player.nationality_1 || 'unknown'
    acc[nationality] = (acc[nationality] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-[#e7e7e7]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d]">Total Reports</p>
              <p className="text-2xl font-bold text-[#000000]">{totalReports}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-[#e7e7e7]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d]">Unique Players</p>
              <p className="text-2xl font-bold text-[#000000]">{totalReports}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-[#e7e7e7]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d]">Average ROI</p>
              <p className="text-2xl font-bold text-[#000000]">
                {avgROI ? `${avgROI.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-[#e7e7e7]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d]">Total Profit</p>
              <p className="text-2xl font-bold text-[#000000]">
                {formatCurrency(totalProfit)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información del Scout */}
      {scoutProfile && (
        <Card className="p-6 bg-white border-[#e7e7e7]">
          <h3 className="text-lg font-semibold text-[#000000] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8B0000]" />
            Scout Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Name</p>
              <p className="font-medium text-[#000000]">{scoutProfile.scout_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Level</p>
              <p className="font-medium text-[#000000]">{scoutProfile.scout_level || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Ranking</p>
              <p className="font-medium text-[#000000]">
                {scoutProfile.scout_ranking ? `#${scoutProfile.scout_ranking}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Nationality</p>
              <p className="font-medium text-[#000000]">{scoutProfile.nationality || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Country</p>
              <p className="font-medium text-[#000000]">{scoutProfile.country || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-[#6d6d6d] mb-1">Favourite Club</p>
              <p className="font-medium text-[#000000]">{scoutProfile.favourite_club || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Estadísticas por Tipo de Reporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-[#e7e7e7]">
          <h3 className="text-lg font-semibold text-[#000000] mb-4">Reports by Type</h3>
          {Object.keys(reportTypes).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(reportTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-[#6d6d6d] capitalize">{type}</span>
                  <span className="font-medium text-[#000000]">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6d6d6d]">No data available</p>
          )}
        </Card>

        <Card className="p-6 bg-white border-[#e7e7e7]">
          <h3 className="text-lg font-semibold text-[#000000] mb-4">Players by Nationality</h3>
          {Object.keys(nationalities).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(nationalities)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([nationality, count]) => (
                <div key={nationality} className="flex items-center justify-between">
                  <span className="text-[#6d6d6d]">{nationality}</span>
                  <span className="font-medium text-[#000000]">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6d6d6d]">No data available</p>
          )}
        </Card>
      </div>
    </div>
  )
}