"use client"

import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Trash2, X, Check, XCircle, Loader2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Función para convertir URLs de YouTube a formato embebido
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    // Patrones de URL de YouTube
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

    // Si no es YouTube, devolver la URL original
    return url
  } catch (error) {
    console.error('Error parsing video URL:', error)
    return url
  }
}

// Lista de dominios de redes sociales conocidas
const SOCIAL_MEDIA_DOMAINS = [
  'twitter.com',
  'x.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'threads.net',
  'snapchat.com',
  'pinterest.com',
  'reddit.com',
  'tumblr.com',
  'whatsapp.com',
  'telegram.org',
  't.me',
  'discord.com',
  'discord.gg',
  'twitch.tv',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com'
]

// Función para detectar si una URL es de red social
function isSocialMediaUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '')
    return SOCIAL_MEDIA_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

// Tipos de reporte calculados
type ReportContentType = 'scoutea' | 'video' | 'redes_sociales' | 'web'

// Función para determinar el tipo de reporte basado en su contenido
function getReportContentType(report: {
  form_url_video?: string | null
  form_url_report?: string | null
  form_text_report?: string | null
}): ReportContentType {
  // 1. Si tiene video → tipo "video"
  if (report.form_url_video && report.form_url_video.trim() !== '') {
    return 'video'
  }

  // 2. Si tiene link a red social → tipo "redes_sociales"
  if (report.form_url_report && report.form_url_report.trim() !== '') {
    if (isSocialMediaUrl(report.form_url_report)) {
      return 'redes_sociales'
    }
    // 3. Si tiene cualquier otro link → tipo "web"
    return 'web'
  }

  // 4. Si no tiene video ni link (solo texto o imagen) → tipo "scoutea"
  return 'scoutea'
}

// Función para obtener el badge de tipo de contenido
function getContentTypeBadge(type: ReportContentType) {
  const badges: Record<ReportContentType, { label: string; color: string; icon: string }> = {
    'scoutea': { label: 'Scoutea', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700', icon: '📋' },
    'video': { label: 'Video', color: 'bg-red-900/50 text-red-300 border-red-700', icon: '🎥' },
    'redes_sociales': { label: 'Redes Sociales', color: 'bg-blue-900/50 text-blue-300 border-blue-700', icon: '📱' },
    'web': { label: 'Web', color: 'bg-purple-900/50 text-purple-300 border-purple-700', icon: '🌐' }
  }

  const badge = badges[type]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  )
}

interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: string | null
  report_type: string | null
  id_player: number | null
  report_format: string | null
  form_url_report: string | null
  form_url_video: string | null
  form_text_report: string | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  rating: number | null
  // Snapshot histórico
  initial_age: number | null
  initial_player_trfm_value: number | null
  initial_team: string | null
  correct_initial_team: string | null
  initial_team_elo: number | null
  initial_team_level: string | null
  initial_competition: string | null
  initial_competition_country: string | null
  initial_competition_elo: number | null
  initial_competition_level: string | null
  transfer_team_pts: number | null
  transfer_competition_pts: number | null
  // Campos de aprobación
  approval_status: string | null
  approved_by_admin_id: string | null
  approval_date: string | null
  rejection_reason: string | null
  createdAt: string
  updatedAt: string | null
  // Player data (from join)
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  }
  // Scout data (from join)
  scout?: {
    scout_name: string
    name: string | null
    surname: string | null
  }
}

interface AdminReportTableProps {
  reports: Report[]
  onDelete?: (reportId: string) => void
}

type SortField = keyof Report | 'player_name' | 'scout_name' | null
type SortOrder = 'asc' | 'desc'

export default function AdminReportTable({ reports, onDelete }: AdminReportTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Estados para aprobar/rechazar
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setShowDetailModal(true)
    setActionError(null)
  }

  const handleApprove = async () => {
    if (!selectedReport) return

    setIsApproving(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id_report}/approve`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al aprobar el reporte')
      }

      // Actualizar el estado local del reporte
      setSelectedReport({
        ...selectedReport,
        approval_status: 'approved'
      })

      // Refrescar la página para ver los cambios
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedReport) return

    setIsRejecting(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id_report}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al rechazar el reporte')
      }

      // Actualizar el estado local del reporte
      setSelectedReport({
        ...selectedReport,
        approval_status: 'rejected'
      })

      // Cerrar modal de rechazo y limpiar
      setShowRejectModal(false)
      setRejectReason('')

      // Refrescar la página para ver los cambios
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsRejecting(false)
    }
  }

  const openRejectModal = () => {
    setShowRejectModal(true)
    setRejectReason('')
    setActionError(null)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedReports = useMemo(() => {
    if (!sortField) return reports

    return [...reports].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'player_name') {
        aValue = a.player?.player_name
        bValue = b.player?.player_name
      } else if (sortField === 'scout_name') {
        aValue = a.scout?.scout_name
        bValue = b.scout?.scout_name
      } else {
        aValue = a[sortField as keyof Report]
        bValue = b[sortField as keyof Report]
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [reports, sortField, sortOrder])

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 text-[#FF5733]" />
      : <ArrowDown className="w-3 h-3 text-[#FF5733]" />
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string | null, _type: 'status' | 'validation' | 'approval' = 'status') => {
    if (!status) return <span className="text-slate-500 text-xs">N/A</span>

    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700', label: 'Pendiente' },
      'approved': { color: 'bg-green-900/50 text-green-300 border-green-700', label: 'Aprobado' },
      'rejected': { color: 'bg-red-900/50 text-red-300 border-red-700', label: 'Rechazado' },
    }

    const config = statusConfig[status.toLowerCase()] || { color: 'bg-slate-700/50 text-slate-300 border-slate-600', label: status }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return 'N/A'
    return value.toFixed(decimals)
  }

  const getPotentialDisplay = (potential: string | null) => {
    if (!potential) return 'N/A'
    const numPotential = parseInt(potential, 10)
    if (isNaN(numPotential)) return potential
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i <= numPotential ? 'bg-[#8B0000]' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-400">No se encontraron reportes</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-[#131921] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1a2332] border-b border-slate-700">
            <tr>
              {/* Fecha Creación */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'createdAt' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Creado
                  </span>
                  {renderSortIcon('createdAt')}
                </div>
              </th>
              {/* Fecha Reporte */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_date')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'report_date' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    F. Reporte
                  </span>
                  {renderSortIcon('report_date')}
                </div>
              </th>
              {/* Jugador */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('player_name')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'player_name' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Jugador
                  </span>
                  {renderSortIcon('player_name')}
                </div>
              </th>
              {/* Scout */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('scout_name')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'scout_name' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Scout
                  </span>
                  {renderSortIcon('scout_name')}
                </div>
              </th>
              {/* Estado */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('approval_status')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'approval_status' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Estado
                  </span>
                  {renderSortIcon('approval_status')}
                </div>
              </th>
              {/* Tipo */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_type')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'report_type' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Tipo
                  </span>
                  {renderSortIcon('report_type')}
                </div>
              </th>
              {/* Formato */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_format')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'report_format' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Formato
                  </span>
                  {renderSortIcon('report_format')}
                </div>
              </th>
              {/* Potencial */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('form_potential')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'form_potential' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Potencial
                  </span>
                  {renderSortIcon('form_potential')}
                </div>
              </th>
              {/* Rating */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'rating' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Rating
                  </span>
                  {renderSortIcon('rating')}
                </div>
              </th>
              {/* ROI */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'roi' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    ROI
                  </span>
                  {renderSortIcon('roi')}
                </div>
              </th>
              {/* Profit */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'profit' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Profit
                  </span>
                  {renderSortIcon('profit')}
                </div>
              </th>
              {/* Valor Inicial */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_player_trfm_value')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_player_trfm_value' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Valor Ini.
                  </span>
                  {renderSortIcon('initial_player_trfm_value')}
                </div>
              </th>
              {/* Equipo Inicial */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_team')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_team' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Equipo Ini.
                  </span>
                  {renderSortIcon('initial_team')}
                </div>
              </th>
              {/* Competición Inicial */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_competition')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_competition' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Comp. Ini.
                  </span>
                  {renderSortIcon('initial_competition')}
                </div>
              </th>
              {/* Edad Inicial */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_age')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_age' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Edad Ini.
                  </span>
                  {renderSortIcon('initial_age')}
                </div>
              </th>
              {/* ELO Equipo */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_team_elo')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_team_elo' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    ELO Equipo
                  </span>
                  {renderSortIcon('initial_team_elo')}
                </div>
              </th>
              {/* ELO Competición */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_competition_elo')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_competition_elo' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    ELO Comp.
                  </span>
                  {renderSortIcon('initial_competition_elo')}
                </div>
              </th>
              {/* Nivel Competición */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('initial_competition_level')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'initial_competition_level' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Nivel Comp.
                  </span>
                  {renderSortIcon('initial_competition_level')}
                </div>
              </th>
              {/* Transfer Team Pts */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('transfer_team_pts')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'transfer_team_pts' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Transf. Team
                  </span>
                  {renderSortIcon('transfer_team_pts')}
                </div>
              </th>
              {/* Transfer Comp Pts */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('transfer_competition_pts')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'transfer_competition_pts' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Transf. Comp.
                  </span>
                  {renderSortIcon('transfer_competition_pts')}
                </div>
              </th>
              {/* Report Status */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_status')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'report_status' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Status Rep.
                  </span>
                  {renderSortIcon('report_status')}
                </div>
              </th>
              {/* Report Validation */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_validation')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'report_validation' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Validación
                  </span>
                  {renderSortIcon('report_validation')}
                </div>
              </th>
              {/* ID Player */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('id_player')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'id_player' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    ID Player
                  </span>
                  {renderSortIcon('id_player')}
                </div>
              </th>
              {/* Fecha Aprobación */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('approval_date')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'approval_date' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    F. Aprobación
                  </span>
                  {renderSortIcon('approval_date')}
                </div>
              </th>
              {/* Updated At */}
              <th
                className="p-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-semibold text-xs ${sortField === 'updatedAt' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Actualizado
                  </span>
                  {renderSortIcon('updatedAt')}
                </div>
              </th>
              {/* URL Reporte */}
              <th className="p-3 text-left">
                <span className="font-semibold text-xs text-slate-300 whitespace-nowrap">
                  URL Rep.
                </span>
              </th>
              {/* URL Video */}
              <th className="p-3 text-left">
                <span className="font-semibold text-xs text-slate-300 whitespace-nowrap">
                  URL Video
                </span>
              </th>
              {/* Acciones */}
              <th className="p-3 text-center sticky right-0 bg-[#1a2332]">
                <span className="font-semibold text-xs text-slate-300">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedReports.map((report) => (
              <tr
                key={report.id_report}
                className="hover:bg-slate-700/30 transition-colors"
              >
                {/* Fecha Creación */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {formatDate(report.createdAt)}
                  </span>
                </td>
                {/* Fecha Reporte */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {formatDate(report.report_date)}
                  </span>
                </td>
                {/* Jugador */}
                <td className="p-3">
                  <div className="min-w-[150px]">
                    <p className="text-xs font-medium text-white">
                      {report.player?.player_name || 'N/A'}
                    </p>
                    {report.player && (
                      <p className="text-xs text-slate-400">
                        {report.player.position_player || ''} {report.player.team_name ? `• ${report.player.team_name}` : ''}
                      </p>
                    )}
                  </div>
                </td>
                {/* Scout */}
                <td className="p-3">
                  <div className="min-w-[120px]">
                    <p className="text-xs font-medium text-white">
                      {report.scout?.scout_name || report.report_author || 'N/A'}
                    </p>
                    {report.scout && (report.scout.name || report.scout.surname) && (
                      <p className="text-xs text-slate-400">
                        {report.scout.name} {report.scout.surname}
                      </p>
                    )}
                  </div>
                </td>
                {/* Estado */}
                <td className="p-3">
                  {getStatusBadge(report.approval_status, 'approval')}
                </td>
                {/* Tipo */}
                <td className="p-3">
                  {getContentTypeBadge(getReportContentType(report))}
                </td>
                {/* Formato */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {report.report_format || 'N/A'}
                  </span>
                </td>
                {/* Potencial */}
                <td className="p-3">
                  {getPotentialDisplay(report.form_potential)}
                </td>
                {/* Rating */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.rating !== null ? formatNumber(report.rating, 1) : 'N/A'}
                  </span>
                </td>
                {/* ROI */}
                <td className="p-3">
                  <span className={`text-xs ${report.roi && report.roi > 0 ? 'text-green-400' : report.roi && report.roi < 0 ? 'text-red-400' : 'text-white'}`}>
                    {report.roi !== null ? `${formatNumber(report.roi, 1)}%` : 'N/A'}
                  </span>
                </td>
                {/* Profit */}
                <td className="p-3">
                  <span className={`text-xs ${report.profit && report.profit > 0 ? 'text-green-400' : report.profit && report.profit < 0 ? 'text-red-400' : 'text-white'}`}>
                    {report.profit !== null ? formatCurrency(report.profit) : 'N/A'}
                  </span>
                </td>
                {/* Valor Inicial */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {report.initial_player_trfm_value !== null ? formatCurrency(report.initial_player_trfm_value) : 'N/A'}
                  </span>
                </td>
                {/* Equipo Inicial */}
                <td className="p-3">
                  <div className="min-w-[100px]">
                    <p className="text-xs text-white truncate max-w-[120px]" title={report.correct_initial_team || report.initial_team || undefined}>
                      {report.correct_initial_team || report.initial_team || 'N/A'}
                    </p>
                    {report.initial_team_level && (
                      <p className="text-xs text-slate-400">{report.initial_team_level}</p>
                    )}
                  </div>
                </td>
                {/* Competición Inicial */}
                <td className="p-3">
                  <div className="min-w-[100px]">
                    <p className="text-xs text-white truncate max-w-[120px]" title={report.initial_competition || undefined}>
                      {report.initial_competition || 'N/A'}
                    </p>
                    {report.initial_competition_country && (
                      <p className="text-xs text-slate-400">{report.initial_competition_country}</p>
                    )}
                  </div>
                </td>
                {/* Edad Inicial */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.initial_age !== null ? report.initial_age : 'N/A'}
                  </span>
                </td>
                {/* ELO Equipo */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.initial_team_elo !== null ? formatNumber(report.initial_team_elo, 0) : 'N/A'}
                  </span>
                </td>
                {/* ELO Competición */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.initial_competition_elo !== null ? formatNumber(report.initial_competition_elo, 0) : 'N/A'}
                  </span>
                </td>
                {/* Nivel Competición */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.initial_competition_level || 'N/A'}
                  </span>
                </td>
                {/* Transfer Team Pts */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.transfer_team_pts !== null ? formatNumber(report.transfer_team_pts, 1) : 'N/A'}
                  </span>
                </td>
                {/* Transfer Comp Pts */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.transfer_competition_pts !== null ? formatNumber(report.transfer_competition_pts, 1) : 'N/A'}
                  </span>
                </td>
                {/* Report Status */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.report_status || 'N/A'}
                  </span>
                </td>
                {/* Report Validation */}
                <td className="p-3">
                  <span className="text-xs text-white">
                    {report.report_validation || 'N/A'}
                  </span>
                </td>
                {/* ID Player */}
                <td className="p-3">
                  <span className="text-xs text-white font-mono">
                    {report.id_player !== null ? report.id_player : 'N/A'}
                  </span>
                </td>
                {/* Fecha Aprobación */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {formatDate(report.approval_date)}
                  </span>
                </td>
                {/* Updated At */}
                <td className="p-3">
                  <span className="text-xs text-white whitespace-nowrap">
                    {formatDate(report.updatedAt)}
                  </span>
                </td>
                {/* URL Reporte */}
                <td className="p-3">
                  {report.form_url_report ? (
                    <a
                      href={report.form_url_report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline truncate max-w-[100px] block"
                      title={report.form_url_report}
                    >
                      Ver
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">N/A</span>
                  )}
                </td>
                {/* URL Video */}
                <td className="p-3">
                  {report.form_url_video ? (
                    <a
                      href={report.form_url_video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 underline truncate max-w-[100px] block"
                      title={report.form_url_video}
                    >
                      Ver
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">N/A</span>
                  )}
                </td>
                {/* Acciones */}
                <td className="p-3 sticky right-0 bg-[#131921]">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white h-7 px-2"
                      onClick={() => handleViewReport(report)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 h-7 px-2"
                        onClick={() => onDelete(report.id_report)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles del Reporte - Estilo Scout */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#000000]">{selectedReport.player?.player_name || 'Jugador'}</h3>
                <p className="text-sm text-[#6d6d6d]">
                  {selectedReport.player?.position_player || 'N/A'} • {selectedReport.player?.nationality_1 || 'N/A'}
                  {selectedReport.player?.age ? ` • ${selectedReport.player.age} años` : ''}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6d6d6d]" />
              </button>
            </div>

            {/* Header con badges */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Badge */}
                {(() => {
                  const contentType = getReportContentType(selectedReport)
                  const badgeConfig: Record<ReportContentType, { label: string; bgColor: string; textColor: string; icon: string }> = {
                    'scoutea': { label: 'Scoutea', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: '📋' },
                    'video': { label: 'Video', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: '🎥' },
                    'redes_sociales': { label: 'Redes Sociales', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: '📱' },
                    'web': { label: 'Web', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: '🌐' }
                  }
                  const config = badgeConfig[contentType]
                  return (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                      {config.icon} {config.label}
                    </div>
                  )
                })()}
                {/* Approval Status Badge */}
                {selectedReport.approval_status === 'pending' && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
                    ⏳ Pendiente
                  </div>
                )}
                {selectedReport.approval_status === 'approved' && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                    ✓ Aprobado
                  </div>
                )}
                {selectedReport.approval_status === 'rejected' && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                    ✗ Rechazado
                  </div>
                )}
                <span className="text-sm text-[#6d6d6d]">{formatDate(selectedReport.report_date)}</span>
              </div>
              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-[#2e3138]">
                  {selectedReport.form_potential || '0'}.0
                </span>
                {[...Array(5)].map((_, i) => {
                  const potential = parseInt(selectedReport.form_potential || '0', 10)
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        i < potential ? 'bg-[#8B0000]' : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-white text-xs">⚽</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Video o contenido multimedia */}
            {selectedReport.form_url_video && (
              <div className="mb-4">
                {(() => {
                  const embedUrl = getYouTubeEmbedUrl(selectedReport.form_url_video)
                  const isYouTube = embedUrl?.includes('youtube.com/embed')

                  if (isYouTube) {
                    return (
                      <iframe
                        src={embedUrl || ''}
                        className="w-full aspect-video rounded-xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video del reporte"
                      />
                    )
                  } else {
                    return (
                      <video
                        controls
                        className="w-full h-auto rounded-xl bg-black"
                      >
                        <source src={selectedReport.form_url_video} type="video/mp4" />
                        Tu navegador no soporta la reproducción de video.
                      </video>
                    )
                  }
                })()}
              </div>
            )}

            {/* Texto del reporte */}
            {selectedReport.form_text_report && (
              <div className="mb-4">
                <p className="text-[#6d6d6d] leading-relaxed whitespace-pre-wrap">
                  {selectedReport.form_text_report}
                </p>
              </div>
            )}

            {/* ROI and Profit Info */}
            {(selectedReport.roi !== null || selectedReport.profit !== null) && (
              <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl mb-4">
                {selectedReport.roi !== null && (
                  <div>
                    <span className="text-[#6d6d6d] text-sm">ROI: </span>
                    <span className={`font-bold text-lg ${selectedReport.roi > 0 ? 'text-[#8B0000]' : selectedReport.roi < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatNumber(selectedReport.roi, 1)}%
                    </span>
                  </div>
                )}
                {selectedReport.profit !== null && (
                  <div>
                    <span className="text-[#6d6d6d] text-sm">Beneficio: </span>
                    <span className={`font-bold text-lg ${selectedReport.profit > 0 ? 'text-green-600' : selectedReport.profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {formatCurrency(selectedReport.profit)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Original Report Link */}
            {selectedReport.form_url_report && (
              <a
                href={selectedReport.form_url_report}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-xs font-medium text-[#8B0000] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Ver reporte original
              </a>
            )}

            {/* Información del Scout */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-[#2e3138] mb-2">Scout</h4>
              <p className="text-sm text-[#6d6d6d]">
                {selectedReport.scout?.scout_name || selectedReport.report_author || 'N/A'}
                {selectedReport.scout && (selectedReport.scout.name || selectedReport.scout.surname) && (
                  <span className="text-gray-400"> ({selectedReport.scout.name} {selectedReport.scout.surname})</span>
                )}
              </p>
            </div>

            {/* Información del Equipo */}
            {selectedReport.player?.team_name && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
                <p className="text-xs text-blue-600 mb-1">Equipo Actual</p>
                <p className="font-bold text-[#2e3138] text-lg">{selectedReport.player.team_name}</p>
              </div>
            )}

            {/* Snapshot Histórico - Colapsable */}
            <details className="bg-gray-50 rounded-xl p-4 mb-4">
              <summary className="text-sm font-semibold text-[#2e3138] cursor-pointer">
                Snapshot Histórico (al momento del reporte)
              </summary>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedReport.initial_age && (
                  <div>
                    <p className="text-xs text-gray-500">Edad Inicial</p>
                    <p className="font-semibold text-[#2e3138]">{selectedReport.initial_age} años</p>
                  </div>
                )}
                {selectedReport.initial_player_trfm_value !== null && (
                  <div>
                    <p className="text-xs text-gray-500">Valor Inicial</p>
                    <p className="font-semibold text-[#2e3138]">{formatCurrency(selectedReport.initial_player_trfm_value)}</p>
                  </div>
                )}
                {(selectedReport.correct_initial_team || selectedReport.initial_team) && (
                  <div>
                    <p className="text-xs text-gray-500">Equipo Inicial</p>
                    <p className="font-semibold text-[#2e3138]">{selectedReport.correct_initial_team || selectedReport.initial_team}</p>
                  </div>
                )}
                {selectedReport.initial_competition && (
                  <div>
                    <p className="text-xs text-gray-500">Competición Inicial</p>
                    <p className="font-semibold text-[#2e3138]">{selectedReport.initial_competition}</p>
                  </div>
                )}
                {selectedReport.initial_competition_country && (
                  <div>
                    <p className="text-xs text-gray-500">País Competición</p>
                    <p className="font-semibold text-[#2e3138]">{selectedReport.initial_competition_country}</p>
                  </div>
                )}
                {selectedReport.initial_team_level && (
                  <div>
                    <p className="text-xs text-gray-500">Nivel Equipo</p>
                    <p className="font-semibold text-[#2e3138]">{selectedReport.initial_team_level}</p>
                  </div>
                )}
              </div>
            </details>

            {/* Rejection reason si aplica */}
            {selectedReport.rejection_reason && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                <p className="text-xs text-red-600 mb-1">Motivo de Rechazo</p>
                <p className="text-sm text-red-700">{selectedReport.rejection_reason}</p>
              </div>
            )}

            {/* Error message */}
            {actionError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
              {/* Botones de aprobar/rechazar si el reporte está pendiente */}
              {selectedReport.approval_status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Aprobar
                  </Button>
                  <Button
                    onClick={openRejectModal}
                    disabled={isApproving || isRejecting}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}

              {/* Estado ya procesado */}
              {selectedReport.approval_status !== 'pending' && (
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    selectedReport.approval_status === 'approved' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedReport.approval_status === 'approved' ? '✓ Reporte Aprobado' : '✗ Reporte Rechazado'}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rechazo */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2e3138]">Rechazar Reporte</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Opcionalmente, puedes incluir un mensaje para el scout explicando el motivo del rechazo.
              Este mensaje será visible en sus notificaciones.
            </p>

            <Textarea
              placeholder="Escribe el motivo del rechazo (opcional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-4 min-h-[100px]"
              maxLength={1000}
            />

            {actionError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isRejecting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
