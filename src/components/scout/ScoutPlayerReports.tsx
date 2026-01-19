'use client'

import { FileText, Share2, Video, Filter, ExternalLink, Edit, Trash2, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// Tipos de reporte (mismos que portfolio)
const REPORT_TYPES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'written', label: 'Scoutea', icon: FileText },
  { key: 'social', label: 'Redes sociales', icon: Share2 },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'web', label: 'Web', icon: Filter },
]

interface ReportData {
  id_report: string
  report_date: Date | null
  report_type: string | null
  form_text_report: string | null
  form_url_report: string | null
  form_url_video: string | null
  url_secondary: string | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  approval_status?: string | null
  player: {
    id_player: string
    player_name: string
  }
}

interface ScoutPlayerReportsProps {
  playerId: string
  playerName: string
}

// Helper para convertir URLs de YouTube a embed
function convertToEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
}

// Detectar tipo de reporte (misma lógica que portfolio)
function detectReportType(report: ReportData): string {
  if (report.form_url_video) return 'video'
  if (report.form_url_report) {
    const url = report.form_url_report.toLowerCase()
    if (url.includes('instagram') || url.includes('twitter') ||
        url.includes('tiktok') || url.includes('x.com')) {
      return 'social'
    }
    if (!report.form_text_report) return 'web'
  }
  if (report.form_text_report) return 'written'
  return report.report_type || 'written'
}

// Componente de tarjeta de reporte individual
function ReportCard({ report, type, renderRating, onRequestEdit, onRequestDelete }: {
  report: ReportData,
  type: string,
  renderRating: (p: string | null) => React.ReactNode,
  onRequestEdit: (report: ReportData) => void,
  onRequestDelete: (report: ReportData) => void
}) {
  const typeConfig = REPORT_TYPES.find(t => t.key === type) || REPORT_TYPES[1]
  const TypeIcon = typeConfig.icon

  return (
    <div className="break-inside-avoid mb-4 border border-[#e7e7e7] rounded-lg overflow-hidden relative">
      {/* Action Buttons - Edit/Delete */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {/* Solo reportes aprobados se pueden editar directamente, los pendientes requieren solicitud */}
        {report.approval_status === 'approved' ? (
          <Link
            href={`/scout/reports/${report.id_report}/edit`}
            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors bg-white/80"
            title="Editar reporte (aprobado)"
          >
            <Edit className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={() => onRequestEdit(report)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white/80"
            title="Solicitar edición"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onRequestDelete(report)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white/80"
          title="Solicitar eliminación"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-[#e7e7e7] bg-gray-50 pr-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {TypeIcon && <TypeIcon className="w-4 h-4 text-[#8c1a10]" />}
            <span className="text-sm font-medium text-[#8c1a10]">{typeConfig.label}</span>
            {report.approval_status === 'pending' && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
            )}
            {report.approval_status === 'approved' && (
              <Badge className="bg-green-100 text-green-800 text-xs">Aprobado</Badge>
            )}
          </div>
          {renderRating(report.form_potential)}
        </div>
      </div>

      {/* Video embed si existe */}
      {report.form_url_video && (
        <div className="aspect-video bg-black">
          <iframe
            src={convertToEmbedUrl(report.form_url_video)}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}

      {/* Contenido del reporte */}
      {report.form_text_report && (
        <div className="p-4">
          <p className="text-sm text-[#2e3138] line-clamp-4">
            {report.form_text_report}
          </p>
        </div>
      )}

      {/* ROI y Profit */}
      {(report.roi !== null || report.profit !== null) && (
        <div className="px-4 pb-4 flex gap-4">
          {report.roi !== null && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#6d6d6d]">ROI:</span>
              <span className={`text-sm font-medium ${report.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.roi > 0 ? '+' : ''}{report.roi}%
              </span>
            </div>
          )}
          {report.profit !== null && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#6d6d6d]">Profit:</span>
              <span className={`text-sm font-medium ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.profit > 0 ? '+' : ''}{report.profit.toLocaleString()}€
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Fecha y link externo */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-xs text-[#6d6d6d]">
          {report.report_date
            ? new Date(report.report_date).toLocaleDateString('es-ES')
            : 'Sin fecha'
          }
        </span>
        {report.form_url_report && (
          <a
            href={report.form_url_report}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8c1a10] hover:underline text-xs flex items-center gap-1"
          >
            Ver original <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function ScoutPlayerReports({ playerId, playerName }: ScoutPlayerReportsProps) {
  const { toast } = useToast()
  const [reports, setReports] = useState<ReportData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')

  // Estado para modal de solicitud de edición/eliminación
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestType, setRequestType] = useState<'edit' | 'delete'>('edit')
  const [requestReason, setRequestReason] = useState('')
  const [selectedReportForRequest, setSelectedReportForRequest] = useState<ReportData | null>(null)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // Función para abrir el modal de solicitud
  const openRequestModal = (report: ReportData, type: 'edit' | 'delete') => {
    setSelectedReportForRequest(report)
    setRequestType(type)
    setRequestReason('')
    setIsRequestModalOpen(true)
  }

  // Función para cerrar el modal de solicitud
  const closeRequestModal = () => {
    setIsRequestModalOpen(false)
    setSelectedReportForRequest(null)
    setRequestReason('')
  }

  // Función para enviar solicitud de edición/eliminación
  const handleSubmitRequest = async () => {
    if (!selectedReportForRequest || !requestReason.trim()) {
      toast({
        title: "Error",
        description: "Por favor, proporciona una razón para la solicitud",
        variant: "destructive"
      })
      return
    }

    if (requestReason.trim().length < 10) {
      toast({
        title: "Error",
        description: "La razón debe tener al menos 10 caracteres",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingRequest(true)

    try {
      const response = await fetch('/api/scout/report-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: selectedReportForRequest.id_report,
          requestType: requestType,
          reason: requestReason.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la solicitud')
      }

      toast({
        title: "Solicitud enviada",
        description: `Tu solicitud de ${requestType === 'edit' ? 'edición' : 'eliminación'} ha sido enviada al administrador`
      })

      closeRequestModal()
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar la solicitud",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // Cargar reportes del scout para este jugador
  useEffect(() => {
    const loadReports = async () => {
      try {
        // 1. Obtener perfil del scout
        const profileRes = await fetch('/api/scout/profile')
        const profileData = await profileRes.json()

        if (!profileData.success) {
          setReports([])
          setIsLoading(false)
          return
        }

        // 2. Obtener todos los reportes del scout
        const reportsRes = await fetch(`/api/scout/reports?scoutId=${profileData.scout.id_scout}`)
        const reportsData = await reportsRes.json()

        if (!reportsData.success) {
          setReports([])
          setIsLoading(false)
          return
        }

        // 3. Filtrar solo los reportes de este jugador
        // Convertir a string para comparar correctamente (playerId es string del URL, id_player es número del API)
        const playerReports = reportsData.data.filter(
          (r: ReportData) => String(r.player.id_player) === playerId
        )

        setReports(playerReports)
      } catch (error) {
        console.error('Error loading reports:', error)
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [playerId])

  // Filtrar reportes por tipo seleccionado
  const filteredReports = selectedType === 'all'
    ? reports
    : reports.filter(r => detectReportType(r) === selectedType)

  // Contar reportes por tipo
  const countByType = (type: string) => {
    if (type === 'all') return reports.length
    return reports.filter(r => detectReportType(r) === type).length
  }

  // Rating visual (estrellas/balones)
  const renderRating = (potential: string | null) => {
    const rating = potential ? Math.min(5, Math.max(1, parseInt(potential))) : 0
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= rating ? 'text-[#8c1a10]' : 'text-gray-300'}>
            ⚽
          </span>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg">
      {/* Pills de filtro por tipo */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {REPORT_TYPES.map(type => {
          const count = countByType(type.key)
          const isActive = selectedType === type.key
          const TypeIcon = type.icon
          return (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-[#8c1a10] text-white'
                  : 'bg-gray-100 text-[#6d6d6d] hover:bg-gray-200'
              }`}
            >
              {TypeIcon && <TypeIcon className="w-4 h-4" />}
              {type.label}
              <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de reportes */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 text-[#6d6d6d]">
          {reports.length === 0
            ? `No tienes reportes para ${playerName}`
            : `No hay reportes de tipo "${REPORT_TYPES.find(t => t.key === selectedType)?.label}"`
          }
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-4">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id_report}
              report={report}
              type={detectReportType(report)}
              renderRating={renderRating}
              onRequestEdit={(r) => openRequestModal(r, 'edit')}
              onRequestDelete={(r) => openRequestModal(r, 'delete')}
            />
          ))}
        </div>
      )}

      {/* Modal de Solicitud de Edición/Eliminación */}
      {isRequestModalOpen && selectedReportForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#000000]">
                  {requestType === 'edit' ? 'Solicitar Edición' : 'Solicitar Eliminación'}
                </h3>
                <p className="text-sm text-[#6d6d6d] mt-1">
                  Reporte de {playerName}
                </p>
              </div>
              <button
                onClick={closeRequestModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6d6d6d]" />
              </button>
            </div>

            {/* Request Type Info */}
            <div className={`p-4 rounded-lg mb-4 ${
              requestType === 'edit'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {requestType === 'edit' ? (
                  <>
                    <Edit className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Solicitud de Edición</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">Solicitud de Eliminación</span>
                  </>
                )}
              </div>
              <p className="text-sm mt-2 text-gray-600">
                {requestType === 'edit'
                  ? 'Tu solicitud será revisada por un administrador. Si es aprobada, podrás editar el reporte.'
                  : 'Tu solicitud será revisada por un administrador. Si es aprobada, el reporte será eliminado permanentemente.'}
              </p>
            </div>

            {/* Reason Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón de la solicitud <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={requestType === 'edit'
                  ? 'Explica qué cambios deseas realizar y por qué...'
                  : 'Explica por qué deseas eliminar este reporte...'}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isSubmittingRequest}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 10 caracteres ({requestReason.length}/10)
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeRequestModal}
                disabled={isSubmittingRequest}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={isSubmittingRequest || requestReason.trim().length < 10}
                className={requestType === 'edit'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'}
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  `Enviar solicitud de ${requestType === 'edit' ? 'edición' : 'eliminación'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
