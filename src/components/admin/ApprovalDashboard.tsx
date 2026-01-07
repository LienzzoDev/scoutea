'use client'

import { Check, X, Edit, Trash2, Clock, User, ChevronDown, ChevronUp, Loader2, Eye, Video, FileText, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

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
  } catch {
    return url
  }
}

interface ReportRequest {
  id: string
  scout_id: string
  report_id: string
  request_type: 'edit' | 'delete'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response: string | null
  createdAt: string
  resolved_at: string | null
  scout: {
    id_scout: string
    nombre: string | null
    scout_name?: string | null
    name?: string | null
    surname?: string | null
    email: string | null
  }
  report: {
    id_report: string
    form_text_report: string | null
    form_url_report: string | null
    form_url_video: string | null
    form_potential: string | null
    report_date: string | null
    approval_status: string | null
    player: {
      id_player: string
      player_name: string
      position_player: string | null
      team_name: string | null
      nationality_1: string | null
    } | null
  }
}

export function ApprovalDashboard() {
  // Requests state
  const [requests, setRequests] = useState<ReportRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminResponse, setAdminResponse] = useState<string>('')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)

  // Report preview modal state
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<ReportRequest | null>(null)

  const fetchRequests = async () => {
    setRequestsLoading(true)
    setRequestsError(null)

    try {
      const response = await fetch('/api/admin/report-requests?status=pending')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar las solicitudes')
      }

      setRequests(result.requests || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
      setRequestsError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Request handlers
  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setSelectedRequest({ id, action })
    setShowResponseModal(true)
  }

  const submitRequestAction = async () => {
    if (!selectedRequest) return

    setProcessingId(selectedRequest.id)
    setShowResponseModal(false)

    try {
      const response = await fetch(`/api/admin/report-requests/${selectedRequest.id}/${selectedRequest.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminResponse: adminResponse.trim() || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error al ${selectedRequest.action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud`)
      }

      // Refresh the list
      fetchRequests()
    } catch (err) {
      console.error('Error processing request:', err)
      alert(err instanceof Error ? err.message : 'Error al procesar la solicitud')
    } finally {
      setProcessingId(null)
      setSelectedRequest(null)
      setAdminResponse('')
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'edit' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Edit className="w-3 h-3" />
        Edición
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <Trash2 className="w-3 h-3" />
        Eliminación
      </span>
    )
  }

  const pendingRequestsCount = requests.length

  if (requestsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-400">Cargando solicitudes...</p>
      </div>
    )
  }

  if (requestsError) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <p className="text-red-400">Error: {requestsError}</p>
        <Button
          onClick={fetchRequests}
          className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-[#080F17] min-h-screen p-6">
      {/* Summary Card */}
      <div className="mb-6">
        <Card className="bg-[#131921] border-slate-700">
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-[#D6DDE6] mb-1">{pendingRequestsCount}</div>
            <div className="text-sm text-slate-400">Solicitudes Pendientes</div>
          </div>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="bg-white border-[#e7e7e7]">
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-[#6d6d6d] text-lg mb-2">No hay solicitudes pendientes</p>
            <p className="text-sm text-gray-500">No hay solicitudes de edición o eliminación por revisar</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden"
            >
              {/* Request Header */}
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getTypeBadge(request.request_type)}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <Clock className="w-3 h-3" />
                      Pendiente
                    </span>
                    <span className="text-sm font-medium text-[#2e3138]">
                      {request.report.player?.player_name || 'Jugador desconocido'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#6d6d6d]">
                      {new Date(request.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    {expandedId === request.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === request.id && (
                <div className="p-4 border-t border-[#e7e7e7]">
                  {/* Scout Info */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-[#6d6d6d]">
                    <User className="w-4 h-4" />
                    <span>Solicitado por: <strong>{request.scout.nombre || request.scout.email || 'Scout desconocido'}</strong></span>
                  </div>

                  {/* Player Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-[#2e3138] mb-2">Información del Jugador</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#6d6d6d]">Nombre:</span>{' '}
                        <span className="font-medium">{request.report.player?.player_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[#6d6d6d]">Posición:</span>{' '}
                        <span className="font-medium">{request.report.player?.position_player || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[#6d6d6d]">Equipo:</span>{' '}
                        <span className="font-medium">{request.report.player?.team_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <h4 className="font-medium text-[#2e3138] mb-2">Razón de la solicitud</h4>
                    <p className="text-sm text-[#6d6d6d] bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {request.reason}
                    </p>
                  </div>

                  {/* Report Content Preview */}
                  {request.report.form_text_report && (
                    <div className="mb-4">
                      <h4 className="font-medium text-[#2e3138] mb-2">Contenido del reporte</h4>
                      <p className="text-sm text-[#6d6d6d] line-clamp-3">
                        {request.report.form_text_report}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#e7e7e7]">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedReportForPreview(request)
                        setShowReportPreview(true)
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Reporte
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRequestAction(request.id, 'reject')}
                      disabled={processingId === request.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Rechazar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleRequestAction(request.id, 'approve')}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Aprobar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-[#131921] rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-[#D6DDE6] mb-4">
              {selectedRequest.action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
            </h3>

            <div className={`p-3 rounded-lg mb-4 ${
              selectedRequest.action === 'approve'
                ? 'bg-green-900/20 border border-green-800'
                : 'bg-red-900/20 border border-red-800'
            }`}>
              <p className="text-sm text-slate-300">
                {selectedRequest.action === 'approve'
                  ? 'Al aprobar esta solicitud, el scout recibirá una notificación y podrá proceder con los cambios.'
                  : 'Al rechazar esta solicitud, el scout recibirá una notificación con tu respuesta.'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Respuesta {selectedRequest.action === 'reject' ? <span className="text-red-400">*</span> : '(opcional)'}
              </label>
              <Textarea
                placeholder={selectedRequest.action === 'approve'
                  ? 'Añade un comentario opcional...'
                  : 'Explica el motivo del rechazo...'}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="min-h-[100px] bg-[#080F17] border-slate-600 text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponseModal(false)
                  setSelectedRequest(null)
                  setAdminResponse('')
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={submitRequestAction}
                disabled={selectedRequest.action === 'reject' && !adminResponse.trim()}
                className={selectedRequest.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'}
              >
                {selectedRequest.action === 'approve' ? 'Aprobar' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal - Same visual as scouts see */}
      {showReportPreview && selectedReportForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowReportPreview(false)
                setSelectedReportForPreview(null)
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#6d6d6d]" />
            </button>

            {/* Report Card - Same style as scout view */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-[#2e3138] text-xl">
                      {selectedReportForPreview.report.player?.player_name || 'Jugador desconocido'}
                    </h3>
                    <p className="text-sm text-[#6d6d6d]">
                      {selectedReportForPreview.report.player?.position_player || 'N/A'} • {selectedReportForPreview.report.player?.nationality_1 || 'N/A'}
                    </p>
                  </div>
                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedReportForPreview.report.form_url_video ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedReportForPreview.report.form_url_video ? (
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>
                    ) : (
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Escrito</span>
                    )}
                  </div>
                </div>
                {/* Rating */}
                {selectedReportForPreview.report.form_potential && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-[#2e3138]">{selectedReportForPreview.report.form_potential}.0</span>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          i < parseInt(selectedReportForPreview.report.form_potential || '0') ? 'bg-[#8B0000]' : 'bg-gray-300'
                        }`}
                      >
                        <span className="text-white text-xs">⚽</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Team Info */}
              {selectedReportForPreview.report.player?.team_name && (
                <div className="mb-3 text-sm text-[#6d6d6d]">
                  <span className="font-medium">Equipo:</span> {selectedReportForPreview.report.player.team_name}
                </div>
              )}

              {/* Video */}
              {selectedReportForPreview.report.form_url_video && (
                <div className="relative mb-3">
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(selectedReportForPreview.report.form_url_video)
                    const isYouTube = embedUrl?.includes('youtube.com/embed')

                    if (isYouTube) {
                      return (
                        <iframe
                          src={embedUrl || ''}
                          className="w-full h-64 rounded-xl"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video del reporte"
                        />
                      )
                    } else {
                      return (
                        <video
                          controls
                          className="w-full h-64 object-cover rounded-xl bg-black"
                        >
                          <source src={selectedReportForPreview.report.form_url_video} type="video/mp4" />
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      )
                    }
                  })()}
                </div>
              )}

              {/* Content */}
              {selectedReportForPreview.report.form_text_report && (
                <div className="mb-3">
                  <h4 className="font-medium text-[#2e3138] mb-2">Contenido del Reporte</h4>
                  <p className="text-sm text-[#6d6d6d] leading-relaxed whitespace-pre-wrap">
                    {selectedReportForPreview.report.form_text_report}
                  </p>
                </div>
              )}

              {/* Original Report Link */}
              {selectedReportForPreview.report.form_url_report && (
                <a
                  href={selectedReportForPreview.report.form_url_report}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 mb-3 text-xs font-medium text-[#8B0000] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver reporte original
                </a>
              )}

              {/* Date */}
              {selectedReportForPreview.report.report_date && (
                <p className="text-xs text-[#6d6d6d] font-medium">
                  {new Date(selectedReportForPreview.report.report_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Scout Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-[#6d6d6d]">
                <User className="w-4 h-4" />
                <span>
                  Scout: <strong>
                    {selectedReportForPreview.scout.scout_name ||
                     selectedReportForPreview.scout.nombre ||
                     (selectedReportForPreview.scout.name && selectedReportForPreview.scout.surname
                       ? `${selectedReportForPreview.scout.name} ${selectedReportForPreview.scout.surname}`
                       : selectedReportForPreview.scout.email || 'Desconocido')}
                  </strong>
                </span>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowReportPreview(false)
                  setSelectedReportForPreview(null)
                }}
                className="bg-[#8B0000] hover:bg-[#660000] text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
