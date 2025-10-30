'use client'

import { Video, FileText, Share2, ExternalLink } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Función para convertir URLs de YouTube a formato embebido
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }

    return url
  } catch (error) {
    console.error('Error parsing video URL:', error)
    return url
  }
}

interface PendingReport {
  id_report: string
  report_date: string | null
  report_type: string | null
  form_text_report: string | null
  form_url_report: string | null
  form_url_video: string | null
  url_secondary: string | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  potential: number | null
  createdAt: string
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  } | null
  scout: {
    id_scout: string
    scout_name: string | null
    name: string | null
    surname: string | null
  } | null
}

interface Report {
  id: string
  playerId: string
  playerName: string
  profileType: string
  content: string
  rating: number
  date: string
  type: 'video' | 'written' | 'social'
  hasVideo?: boolean | undefined
  image?: string | undefined
  videoUrl?: string | undefined
  urlReport?: string | undefined
  roi?: number | undefined
  profit?: number | undefined
  scoutName?: string
}

interface PendingData {
  reports: PendingReport[]
  counts: {
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

  // Convertir los datos de reportes a formato de visualización
  const formattedReports: Report[] = useMemo(() => {
    return data?.reports.map((reportData) => {
      const { player, report_type, report_date, form_text_report, form_url_video, form_url_report, url_secondary, form_potential, roi, profit, potential } = reportData

      // Determinar el tipo de reporte
      let reportType: 'video' | 'written' | 'social' = 'written'

      if (form_url_video) {
        reportType = 'video'
      } else if (form_url_report && !form_text_report && !url_secondary) {
        reportType = 'social'
      } else if (form_text_report || (!form_url_video && !url_secondary)) {
        reportType = 'written'
      } else if (report_type) {
        const typeStr = report_type.toLowerCase()
        if (typeStr.includes('video')) {
          reportType = 'video'
        } else if (typeStr.includes('social') || typeStr.includes('redes')) {
          reportType = 'social'
        }
      }

      // Formatear fecha
      const formattedDate = report_date
        ? new Date(report_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          })
        : 'Sin fecha'

      // Calcular rating
      const potentialValue = potential || (form_potential ? parseFloat(form_potential) : null)
      const rating = potentialValue
        ? Math.min(5, Math.max(1, Math.round(potentialValue)))
        : 3

      // Contenido
      const content = form_text_report || `Reporte para ${player?.player_name || 'Desconocido'}. ${player?.team_name ? `Actualmente en ${player.team_name}.` : ''}`

      // Nombre del scout
      const scoutName = reportData.scout
        ? `${reportData.scout.name || ''} ${reportData.scout.surname || ''}`.trim() ||
          reportData.scout.scout_name ||
          'Desconocido'
        : 'Desconocido'

      return {
        id: reportData.id_report,
        playerId: player?.id_player || '',
        playerName: player?.player_name || 'Desconocido',
        profileType: `${player?.position_player || 'N/A'} • ${player?.nationality_1 || 'N/A'}`,
        content,
        rating,
        date: formattedDate,
        type: reportType,
        hasVideo: form_url_video ? true : undefined,
        videoUrl: form_url_video || undefined,
        urlReport: form_url_report || undefined,
        image: url_secondary || undefined,
        roi: roi || undefined,
        profit: profit || undefined,
        scoutName,
      }
    }) || []
  }, [data])

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      const response = await fetch(`/api/admin/approvals/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        setData(prevData => {
          if (!prevData) return prevData
          const updatedReports = prevData.reports.filter(r => r.id_report !== id)
          return {
            ...prevData,
            reports: updatedReports,
            counts: {
              reports: updatedReports.length,
              total: updatedReports.length
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

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      const response = await fetch(`/api/admin/approvals/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        setData(prevData => {
          if (!prevData) return prevData
          const updatedReports = prevData.reports.filter(r => r.id_report !== id)
          return {
            ...prevData,
            reports: updatedReports,
            counts: {
              reports: updatedReports.length,
              total: updatedReports.length
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
    <div className="bg-[#080F17] min-h-screen p-6">
      {/* Summary Card */}
      <div className="mb-8">
        <Card className="bg-[#131921] border-slate-700">
          <div className="p-6 text-center">
            <div className="text-4xl font-bold text-[#D6DDE6] mb-2">{data.counts.reports}</div>
            <div className="text-lg text-slate-400">Reportes Pendientes de Aprobación</div>
          </div>
        </Card>
      </div>

      {/* Reports Grid - Scout Style */}
      {formattedReports.length === 0 ? (
        <Card className="bg-white border-[#e7e7e7]">
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-[#6d6d6d] text-lg mb-2">No hay reportes pendientes</p>
            <p className="text-sm text-gray-500">Todos los reportes han sido revisados</p>
          </div>
        </Card>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {formattedReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-[#e7e7e7] p-4 break-inside-avoid relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-[#2e3138]">{report.playerName}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.type === 'video' ? 'bg-red-100 text-red-700' :
                      report.type === 'written' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {report.type === 'video' ? '🎥' :
                       report.type === 'written' ? '📝' : '🔗'}
                    </div>
                  </div>
                  <p className="text-sm text-[#6d6d6d]">{report.profileType}</p>
                  {report.scoutName && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Scout:</span> {report.scoutName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-sm font-medium text-[#2e3138]">{report.rating}.0</span>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        i < report.rating ? 'bg-[#8B0000]' : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-white text-xs">⚽</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video o Image */}
              {report.hasVideo && report.videoUrl ? (
                <div className="relative mb-3">
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(report.videoUrl)
                    const isYouTube = embedUrl?.includes('youtube.com/embed')

                    if (isYouTube) {
                      return (
                        <iframe
                          src={embedUrl || ''}
                          className="w-full h-48 rounded-xl"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video del reporte"
                        />
                      )
                    } else {
                      return (
                        <video
                          controls
                          className="w-full h-48 object-cover rounded-xl bg-black"
                          poster={report.image}
                        >
                          <source src={report.videoUrl} type="video/mp4" />
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      )
                    }
                  })()}
                </div>
              ) : report.image ? (
                <div className="relative mb-3">
                  <img
                    src={report.image}
                    alt="Report visual"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              ) : null}

              {/* Content */}
              <p className="text-sm text-[#6d6d6d] mb-3 leading-relaxed">
                {report.content}
              </p>

              {/* ROI and Profit Info */}
              {(report.roi || report.profit) && (
                <div className="flex items-center gap-4 mb-3 p-2 bg-gray-50 rounded-xl">
                  {report.roi && (
                    <div className="text-xs">
                      <span className="text-[#6d6d6d]">ROI: </span>
                      <span className="font-medium text-[#8B0000]">{report.roi}%</span>
                    </div>
                  )}
                  {report.profit && (
                    <div className="text-xs">
                      <span className="text-[#6d6d6d]">Beneficio: </span>
                      <span className="font-medium text-green-600">€{report.profit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Original Report Link */}
              {report.urlReport && (
                <a
                  href={report.urlReport}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 mb-3 text-xs font-medium text-[#8B0000] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver reporte original
                </a>
              )}

              {/* Date */}
              <p className="text-xs text-[#6d6d6d] font-medium mb-3">{report.date}</p>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(report.id)}
                  disabled={actionLoading === report.id}
                >
                  {actionLoading === report.id ? 'Aprobando...' : 'Aprobar'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(report.id)}
                  disabled={actionLoading === report.id}
                >
                  {actionLoading === report.id ? 'Rechazando...' : 'Rechazar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
