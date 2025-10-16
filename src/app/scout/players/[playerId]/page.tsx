'use client'

import { ArrowLeft, Calendar, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PlayerReport {
  id_report: string
  report_date: Date | null
  report_type: string | null
  roi: number | null
  profit: number | null
  potential: number | null
  scout: {
    id_scout: string
    scout_name: string | null
    name: string | null
  }
}

interface PlayerDetails {
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    player_rating: number | null
    age: number | null
  }
  reports: PlayerReport[]
}

export default function PlayerDetailPage() {
  const params = useParams()
  const playerId = params.playerId as string
  
  const [playerData, setPlayerData] = useState<PlayerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlayerDetails = async () => {
      try {
        const response = await fetch(`/api/scout/players/${playerId}`)
        const result = await response.json()
        
        if (result.success) {
          setPlayerData(result.data)
        } else {
          throw new Error(result.error || 'Error al cargar detalles del jugador')
        }
      } catch (err) {
        console.error('Error loading player details:', err)
        setError('Error al cargar los detalles del jugador')
      } finally {
        setIsLoading(false)
      }
    }

    if (playerId) {
      loadPlayerDetails()
    }
  }, [playerId])

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
            <p className="text-[#6d6d6d]">Cargando detalles del jugador...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Jugador no encontrado'}</p>
            <Link href="/scout/dashboard">
              <Button>Volver al Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { player, reports } = playerData
  const latestReport = reports[0]
  const avgROI = reports.reduce((sum, r) => sum + (r.roi || 0), 0) / reports.length
  const avgProfit = reports.reduce((sum, r) => sum + (r.profit || 0), 0) / reports.length

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      
      {/* Header */}
      <div className="bg-white border-b border-[#e7e7e7] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/scout/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={`/api/placeholder/64/64`} />
                  <AvatarFallback className="bg-[#8B0000] text-white text-lg">
                    {getPlayerInitials(player.player_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold text-[#000000]">{player.player_name}</h1>
                  <div className="flex items-center space-x-2 text-[#6d6d6d]">
                    <span>{player.age || 'XX'} años</span>
                    <span>•</span>
                    <span>{player.nationality_1 || 'Nationality'}</span>
                    {player.position_player && (
                      <>
                        <span>•</span>
                        <Badge variant="outline">{player.position_player}</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-[#e7e7e7]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[#6d6d6d]">Total Reportes</p>
                <p className="text-2xl font-bold text-[#000000]">{reports.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-[#e7e7e7]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#6d6d6d]">ROI Promedio</p>
                <p className="text-2xl font-bold text-[#000000]">
                  {avgROI ? `${avgROI.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-[#e7e7e7]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[#6d6d6d]">Beneficio Promedio</p>
                <p className="text-2xl font-bold text-[#000000]">
                  {formatCurrency(avgProfit)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-[#e7e7e7]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[#6d6d6d]">Último Reporte</p>
                <p className="text-sm font-medium text-[#000000]">
                  {latestReport?.report_date 
                    ? new Date(latestReport.report_date).toLocaleDateString('es-ES')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Reports History */}
        <Card className="bg-white border-[#e7e7e7]">
          <div className="p-6 border-b border-[#e7e7e7]">
            <h2 className="text-xl font-bold text-[#000000]">Historial de Reportes</h2>
          </div>
          
          <div className="p-6">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#6d6d6d]">No hay reportes disponibles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id_report} className="border border-[#e7e7e7] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="bg-[#f0f0f0] text-[#6d6d6d]">
                          {report.report_type || 'N/A'}
                        </Badge>
                        <span className="text-sm text-[#6d6d6d]">
                          {report.report_date 
                            ? new Date(report.report_date).toLocaleDateString('es-ES')
                            : 'Fecha no disponible'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-[#6d6d6d] mb-1">ROI</p>
                        <p className="font-medium text-[#000000]">
                          {report.roi ? `${report.roi}%` : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#6d6d6d] mb-1">Beneficio</p>
                        <p className="font-medium text-[#000000]">
                          {formatCurrency(report.profit)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#6d6d6d] mb-1">Potencial</p>
                        <p className="font-medium text-[#000000]">
                          {report.potential ? `${report.potential}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}