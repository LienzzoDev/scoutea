'use client'

import { Filter, Video, FileText, Share2, Plus, X, Search, Trash2, ExternalLink, Edit } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

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
  potential: number | null
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    age: number | null
  }
}

interface Report {
  id: string
  playerName: string
  profileType: string
  content: string
  rating: number
  date: string
  type: 'video' | 'written' | 'social' | 'scouting'
  hasVideo?: boolean
  image?: string
  videoUrl?: string
  urlReport?: string
  roi?: number
  profit?: number
}

interface ScoutReportsSectionProps {
  reports: ReportData[]
  isLoading: boolean
  error: string | null
  onReportDeleted?: (reportId: string) => void
  readOnly?: boolean
}

const REPORT_TYPES = [
  { key: 'all', label: 'Todos los reportes', icon: Filter },
  { key: 'video', label: 'Video Reporte', icon: Video },
  { key: 'written', label: 'Scouteo (escrito)', icon: FileText },
  { key: 'social', label: 'Redes sociales', icon: Share2 },
] as const

export default function ScoutReportsSection({
  reports,
  isLoading,
  error,
  onReportDeleted,
  readOnly = false
}: ScoutReportsSectionProps) {
  const { toast } = useToast()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [selectedVideoReport, setSelectedVideoReport] = useState<Report | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    nationality: '',
    position: '',
    rating: ''
  })

  // Función para abrir el modal de video
  const openVideoModal = (report: Report) => {
    setSelectedVideoReport(report)
    setIsVideoModalOpen(true)
  }

  // Función para cerrar el modal de video
  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setSelectedVideoReport(null)
  }

  // Función para eliminar reporte
  const handleDeleteReport = async (reportId: string, playerName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el reporte de ${playerName}?`)) {
      return
    }

    setDeletingReportId(reportId)

    try {
      // Llamar al callback inmediatamente para actualización optimista
      if (onReportDeleted) {
        onReportDeleted(reportId)
      }

      const response = await fetch(`/api/reports/${reportId}/delete`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: "Reporte eliminado correctamente"
        })
      } else {
        throw new Error(result.error || 'Error al eliminar el reporte')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el reporte",
        variant: "destructive"
      })
      // En caso de error, podríamos recargar para restaurar el estado
      // pero por ahora solo mostramos el error
    } finally {
      setDeletingReportId(null)
    }
  }

  // Convertir los datos reales de reportes a formato de visualización
  const realReports: Report[] = useMemo(() => {
    return reports.map((reportData, index) => {
      const { player, report_type, report_date, form_text_report, form_url_video, form_url_report, url_secondary, form_potential, roi, profit, potential } = reportData
      
      // Determinar el tipo de reporte basado en el contenido
      let reportType: 'video' | 'written' | 'social' | 'scouting' = 'written'

      // Si tiene video, es Video Reporte
      if (form_url_video) {
        reportType = 'video'
      }
      // Si tiene URL de reporte externo sin texto (redes sociales, etc.)
      else if (form_url_report && !form_text_report && !url_secondary) {
        reportType = 'social'
      }
      // Si tiene texto escrito o no tiene imagen/video, es Scouteo (escrito)
      else if (form_text_report || (!form_url_video && !url_secondary)) {
        reportType = 'written'
      }
      // Fallback basado en report_type de la BD
      else if (report_type) {
        const typeStr = report_type.toLowerCase()
        if (typeStr.includes('video')) {
          reportType = 'video'
        } else if (typeStr.includes('social') || typeStr.includes('redes')) {
          reportType = 'social'
        }
      }

      // Formatear la fecha
      const formattedDate = report_date 
        ? new Date(report_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          })
        : 'Sin fecha'

      // Calcular rating basado en el potencial (escala de 1-5)
      const potentialValue = potential || (form_potential ? parseFloat(form_potential) : null)
      const rating = potentialValue 
        ? Math.min(5, Math.max(1, Math.round(potentialValue)))
        : 3

      // Contenido del reporte
      const content = form_text_report || `Reporte de ${reportType === 'scouting' ? 'scouting' : reportType === 'analysis' ? 'análisis' : reportType === 'follow-up' ? 'seguimiento' : 'recomendación'} para ${player.player_name}. ${player.team_name ? `Actualmente en ${player.team_name}.` : ''}`

      return {
        id: reportData.id_report,
        playerName: player.player_name,
        profileType: `${player.position_player || 'N/A'} • ${player.nationality_1 || 'N/A'}`,
        content,
        rating,
        date: formattedDate,
        type: reportType,
        hasVideo: !!form_url_video,
        videoUrl: form_url_video || undefined,
        urlReport: form_url_report || undefined,
        image: url_secondary || undefined, // No mostrar imagen placeholder si no hay url_secondary
        roi: roi || undefined,
        profit: profit || undefined,
      }
    })
  }, [reports])

  // Obtener opciones únicas para los filtros
  const filterOptions = useMemo(() => {
    const nationalities = new Set<string>()
    const positions = new Set<string>()
    
    reports.forEach(report => {
      if (report.player.nationality_1) {
        nationalities.add(report.player.nationality_1)
      }
      if (report.player.position_player) {
        positions.add(report.player.position_player)
      }
    })
    
    return {
      nationalities: Array.from(nationalities).sort(),
      positions: Array.from(positions).sort()
    }
  }, [reports])

  // Filtrar reportes según el tipo seleccionado y término de búsqueda
  const filteredReports = useMemo(() => {
    let filtered = realReports

    // Filtrar por tipo
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(report => report.type === selectedFilter)
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(report => 
        report.playerName.toLowerCase().includes(searchLower) ||
        report.profileType.toLowerCase().includes(searchLower) ||
        report.content.toLowerCase().includes(searchLower) ||
        report.type.toLowerCase().includes(searchLower) ||
        report.date.toLowerCase().includes(searchLower)
      )
    }

    // Filtros avanzados
    if (advancedFilters.nationality) {
      filtered = filtered.filter(report => 
        report.profileType.includes(advancedFilters.nationality)
      )
    }

    if (advancedFilters.position) {
      filtered = filtered.filter(report => 
        report.profileType.includes(advancedFilters.position)
      )
    }

    if (advancedFilters.rating) {
      const minRating = parseFloat(advancedFilters.rating)
      filtered = filtered.filter(report => report.rating >= minRating)
    }

    return filtered
  }, [selectedFilter, searchTerm, advancedFilters, realReports])

  // Calcular rating promedio
  const averageRating = useMemo(() => {
    if (filteredReports.length === 0) return 0
    const sum = filteredReports.reduce((acc, report) => acc + report.rating, 0)
    return (sum / filteredReports.length).toFixed(1)
  }, [filteredReports])

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
          <span className="ml-3 text-[#6d6d6d] mt-2">Cargando reportes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error al cargar los reportes: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl">
      {/* Header with New Report Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#000000]">{readOnly ? 'Reports' : 'Your Reports'}</h2>
        {!readOnly && (
          <Link href="/scout/reports/new">
            <Button className="bg-[#8B0000] hover:bg-[#660000] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
            <Input
              placeholder="Buscar reportes por jugador, tipo, contenido..."
              className="pl-10 bg-[#ffffff] border-[#e7e7e7] focus:border-[#8B0000] focus:ring-[#8B0000]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] hover:text-[#8B0000] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-[#e7e7e7] text-[#6d6d6d] bg-transparent"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 text-[#8B0000]" />
            Filtros
            {(advancedFilters.nationality || advancedFilters.position || advancedFilters.rating) && (
              <span className="ml-1 bg-[#8B0000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(advancedFilters).filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
        {searchTerm && (
          <p className="text-sm text-[#6d6d6d] mt-2">
            {filteredReports.length} resultado{filteredReports.length !== 1 ? 's' : ''} para "{searchTerm}"
          </p>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[#000000]">Filtros Avanzados</h3>
              {(advancedFilters.nationality || advancedFilters.position || advancedFilters.rating) && (
                <button
                  onClick={() => setAdvancedFilters({ nationality: '', position: '', rating: '' })}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                >
                  <span className="text-red-600 text-sm">Limpiar Filtros</span>
                  <X className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nacionalidad</label>
              <Select
                value={advancedFilters.nationality || undefined}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, nationality: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las nacionalidades" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.nationalities.map(nat => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posición</label>
              <Select
                value={advancedFilters.position || undefined}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, position: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las posiciones" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.positions.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating Mínimo</label>
              <Select
                value={advancedFilters.rating || undefined}
                onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, rating: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 estrellas</SelectItem>
                  <SelectItem value="4">4+ estrellas</SelectItem>
                  <SelectItem value="3">3+ estrellas</SelectItem>
                  <SelectItem value="2">2+ estrellas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = selectedFilter === type.key
          const count = type.key === 'all' ? realReports.length : realReports.filter(r => r.type === type.key).length
          
          return (
            <button
              key={type.key}
              onClick={() => setSelectedFilter(type.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${
                isActive
                  ? 'bg-[#8B0000] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{type.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Overall Rating */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="text-2xl font-bold text-[#2e3138]">{averageRating}</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                i < Math.floor(parseFloat(averageRating)) ? 'bg-[#8B0000]' : 'bg-gray-300'
              }`}
            >
              <span className="text-white text-xs">⚽</span>
            </div>
          ))}
        </div>
        <span className="text-sm text-[#6d6d6d] ml-2">
          ({filteredReports.length} reporte{filteredReports.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">
            {searchTerm ? '🔍' : '📋'}
          </div>
          <p className="text-[#6d6d6d] text-lg mb-2">
            {searchTerm 
              ? `No se encontraron reportes para "${searchTerm}"`
              : 'No hay reportes disponibles'
            }
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda o revisa los filtros'
              : selectedFilter === 'all' 
                ? 'No has creado ningún reporte aún'
                : `No hay reportes de tipo "${REPORT_TYPES.find(t => t.key === selectedFilter)?.label}"`
            }
          </p>
          {searchTerm ? (
            <div className="space-x-2">
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              >
                Limpiar búsqueda
              </Button>
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedFilter('all')
                }}
                variant="outline"
                className="border-[#6d6d6d] text-[#6d6d6d] hover:bg-[#6d6d6d] hover:text-white"
              >
                Ver todos los reportes
              </Button>
            </div>
          ) : (
            <Link href="/scout/reports/new">
              <Button className="bg-[#8B0000] hover:bg-[#660000] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer reporte
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-[#e7e7e7] p-4 break-inside-avoid relative">
              {/* Action Buttons */}
              {!readOnly && (
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {/* Edit Button */}
                  <Link href={`/scout/reports/${report.id}/edit`}>
                    <button
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar reporte"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteReport(report.id, report.playerName)}
                    disabled={deletingReportId === report.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar reporte"
                  >
                    {deletingReportId === report.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Header */}
              <div className={`flex items-center justify-between mb-3 ${!readOnly ? 'pr-16' : ''}`}>
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-[#2e3138]">{report.playerName}</h3>
                    <p className="text-sm text-[#6d6d6d]">{report.profileType}</p>
                  </div>
                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.type === 'video' ? 'bg-red-100 text-red-700' :
                    report.type === 'written' ? 'bg-blue-100 text-blue-700' :
                    report.type === 'social' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {report.type === 'video' ? '🎥' : 
                     report.type === 'written' ? '📝' : 
                     report.type === 'social' ? '🔗' : '📋'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 mb-2 text-xs font-medium text-[#8B0000] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver reporte original
                </a>
              )}

              {/* Date */}
              <p className="text-xs text-[#6d6d6d] font-medium">{report.date}</p>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideoReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#000000]">{selectedVideoReport.playerName}</h3>
                <p className="text-sm text-[#6d6d6d]">{selectedVideoReport.profileType}</p>
              </div>
              <button
                onClick={closeVideoModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6d6d6d]" />
              </button>
            </div>

            {/* Video Player */}
            <div className="mb-4">
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(selectedVideoReport.videoUrl || '')
                const isYouTube = embedUrl?.includes('youtube.com/embed')
                
                if (isYouTube) {
                  return (
                    <iframe
                      src={`${embedUrl}?autoplay=1`}
                      className="w-full aspect-video rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video del reporte"
                    />
                  )
                } else {
                  return (
                    <video
                      controls
                      autoPlay
                      className="w-full h-auto rounded-lg"
                      poster={selectedVideoReport.image}
                    >
                      <source src={selectedVideoReport.videoUrl} type="video/mp4" />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  )
                }
              })()}
            </div>

            {/* Report Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedVideoReport.type === 'video' ? 'bg-red-100 text-red-700' :
                    selectedVideoReport.type === 'written' ? 'bg-blue-100 text-blue-700' :
                    selectedVideoReport.type === 'social' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedVideoReport.type === 'video' ? '🎥 Video Reporte' : 
                     selectedVideoReport.type === 'written' ? '📝 Scouteo (escrito)' : 
                     selectedVideoReport.type === 'social' ? '🔗 Redes sociales' : '📋 Reporte'}
                  </div>
                  <span className="text-sm text-[#6d6d6d]">{selectedVideoReport.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-[#2e3138]">{selectedVideoReport.rating}.0</span>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        i < selectedVideoReport.rating ? 'bg-[#8B0000]' : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-white text-xs">⚽</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[#6d6d6d] leading-relaxed">
                {selectedVideoReport.content}
              </p>

              {(selectedVideoReport.roi || selectedVideoReport.profit) && (
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                  {selectedVideoReport.roi && (
                    <div>
                      <span className="text-[#6d6d6d] text-sm">ROI: </span>
                      <span className="font-bold text-[#8B0000] text-lg">{selectedVideoReport.roi}%</span>
                    </div>
                  )}
                  {selectedVideoReport.profit && (
                    <div>
                      <span className="text-[#6d6d6d] text-sm">Beneficio Estimado: </span>
                      <span className="font-bold text-green-600 text-lg">€{selectedVideoReport.profit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}