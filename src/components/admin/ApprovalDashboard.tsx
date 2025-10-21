'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PendingPlayer {
  id_player: string
  player_name: string
  position_player: string | null
  team_name: string | null
  nationality_1: string | null
  age: number | null
  created_by_scout_id: string | null
  createdAt: string
}

interface PendingReport {
  id_report: string
  report_date: string | null
  form_text_report: string | null
  createdAt: string
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    team_name: string | null
  } | null
  scout: {
    id_scout: string
    scout_name: string | null
    name: string | null
    surname: string | null
  } | null
}

interface PendingData {
  players: PendingPlayer[]
  reports: PendingReport[]
  counts: {
    players: number
    reports: number
    total: number
  }
}

export function ApprovalDashboard() {
  const [data, setData] = useState<PendingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPendingItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/approvals/pending')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.__error || `Error ${response.status}: ${response.statusText}`
        console.error('Error fetching pending items:', response.status, errorData)
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error fetching pending items:', error)
      setError(error instanceof Error ? error.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingItems()
  }, [])

  const handleApprove = async (id: string, type: 'player' | 'report') => {
    try {
      setActionLoading(id)
      const endpoint =
        type === 'player'
          ? `/api/admin/approvals/players/${id}`
          : `/api/admin/approvals/reports/${id}`

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        // Actualizar el estado local sin recargar toda la lista
        setData(prevData => {
          if (!prevData) return prevData

          if (type === 'player') {
            const updatedPlayers = prevData.players.filter(p => p.id_player !== id)
            return {
              ...prevData,
              players: updatedPlayers,
              counts: {
                ...prevData.counts,
                players: updatedPlayers.length,
                total: prevData.counts.total - 1
              }
            }
          } else {
            const updatedReports = prevData.reports.filter(r => r.id_report !== id)
            return {
              ...prevData,
              reports: updatedReports,
              counts: {
                ...prevData.counts,
                reports: updatedReports.length,
                total: prevData.counts.total - 1
              }
            }
          }
        })
      } else {
        const error = await response.json()
        alert(error.__error || 'Failed to approve')
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string, type: 'player' | 'report') => {
    try {
      setActionLoading(id)
      const endpoint =
        type === 'player'
          ? `/api/admin/approvals/players/${id}`
          : `/api/admin/approvals/reports/${id}`

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        // Actualizar el estado local sin recargar toda la lista
        setData(prevData => {
          if (!prevData) return prevData

          if (type === 'player') {
            const updatedPlayers = prevData.players.filter(p => p.id_player !== id)
            return {
              ...prevData,
              players: updatedPlayers,
              counts: {
                ...prevData.counts,
                players: updatedPlayers.length,
                total: prevData.counts.total - 1
              }
            }
          } else {
            const updatedReports = prevData.reports.filter(r => r.id_report !== id)
            return {
              ...prevData,
              reports: updatedReports,
              counts: {
                ...prevData.counts,
                reports: updatedReports.length,
                total: prevData.counts.total - 1
              }
            }
          }
        })
      } else {
        const error = await response.json()
        alert(error.__error || 'Failed to reject')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-400">Cargando items pendientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <p className="text-red-400">Error: {error}</p>
        <Button
          onClick={fetchPendingItems}
          className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-400">No se pudieron cargar los items pendientes</p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-[#131921] border-slate-700">
          <div className="p-6">
            <div className="text-2xl font-bold text-[#D6DDE6]">{data.counts.total}</div>
            <div className="text-sm text-slate-400">Total Pendientes</div>
          </div>
        </Card>
        <Card className="bg-[#131921] border-slate-700">
          <div className="p-6">
            <div className="text-2xl font-bold text-[#D6DDE6]">{data.counts.players}</div>
            <div className="text-sm text-slate-400">Jugadores Pendientes</div>
          </div>
        </Card>
        <Card className="bg-[#131921] border-slate-700">
          <div className="p-6">
            <div className="text-2xl font-bold text-[#D6DDE6]">{data.counts.reports}</div>
            <div className="text-sm text-slate-400">Reportes Pendientes</div>
          </div>
        </Card>
      </div>

      {/* Tabs for Players and Reports */}
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="bg-[#131921] border-slate-700">
          <TabsTrigger value="players" className="data-[state=active]:bg-[#FF5733] data-[state=active]:text-white">
            Jugadores ({data.counts.players})
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#FF5733] data-[state=active]:text-white">
            Reportes ({data.counts.reports})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-6">
          {data.players.length === 0 ? (
            <Card className="bg-[#131921] border-slate-700">
              <div className="p-8 text-center">
                <p className="text-slate-400">No hay jugadores pendientes</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.players.map((player) => (
                <Card key={player.id_player} className="bg-[#131921] border-slate-700">
                  <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-[#D6DDE6]">
                          {player.player_name}
                        </h3>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-500">Pendiente</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400">
                        <div>
                          <span className="font-medium text-slate-300">Posición:</span>{' '}
                          {player.position_player || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Equipo:</span>{' '}
                          {player.team_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Nacionalidad:</span>{' '}
                          {player.nationality_1 || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Edad:</span>{' '}
                          {player.age || 'N/A'}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Creado: {new Date(player.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(player.id_player, 'player')}
                        disabled={actionLoading === player.id_player}
                      >
                        {actionLoading === player.id_player
                          ? 'Procesando...'
                          : 'Aprobar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(player.id_player, 'player')}
                        disabled={actionLoading === player.id_player}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {data.reports.length === 0 ? (
            <Card className="bg-[#131921] border-slate-700">
              <div className="p-8 text-center">
                <p className="text-slate-400">No hay reportes pendientes</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.reports.map((report) => (
                <Card key={report.id_report} className="bg-[#131921] border-slate-700">
                  <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-[#D6DDE6]">
                          Reporte de {report.player?.player_name || 'Desconocido'}
                        </h3>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-500">Pendiente</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-400 mb-3">
                        <div>
                          <span className="font-medium text-slate-300">Scout:</span>{' '}
                          {report.scout
                            ? `${report.scout.name || ''} ${report.scout.surname || ''}`.trim() ||
                              report.scout.scout_name ||
                              'Desconocido'
                            : 'Desconocido'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Equipo:</span>{' '}
                          {report.player?.team_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Posición:</span>{' '}
                          {report.player?.position_player || 'N/A'}
                        </div>
                      </div>
                      {report.form_text_report && (
                        <div className="bg-slate-800 p-3 rounded text-sm mb-2 border border-slate-700">
                          <p className="line-clamp-3 text-slate-300">
                            {report.form_text_report}
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        Creado: {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(report.id_report, 'report')}
                        disabled={actionLoading === report.id_report}
                      >
                        {actionLoading === report.id_report
                          ? 'Procesando...'
                          : 'Aprobar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(report.id_report, 'report')}
                        disabled={actionLoading === report.id_report}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
