'use client'

import { Play, Filter, Video, FileText, Share2, Plus, X, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlayerData {
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    player_rating: number | null
    age: number | null
  }
  latestReport: {
    id_report: string
    report_date: Date | null
    report_type: string | null
    roi: number | null
    profit: number | null
    potential: number | null
  }
  totalReports: number
}

interface Report {
  id: string
  playerName: string
  profileType: string
  content: string
  rating: number
  date: string
  type: 'scouting' | 'analysis' | 'follow-up' | 'recommendation'
  hasVideo?: boolean
  image?: string
  videoUrl?: string
  roi?: number
  profit?: number
}

interface ScoutReportsSectionProps {
  players: PlayerData[]
  isLoading: boolean
  error: string | null
}

const REPORT_TYPES = [
  { key: 'all', label: 'Todos los reportes', icon: Filter },
  { key: 'scouting', label: 'Scouting', icon: Video },
  { key: 'analysis', label: 'Análisis', icon: FileText },
  { key: 'follow-up', label: 'Seguimiento', icon: Share2 },
] as const

export default function ScoutReportsSection({
  players,
  isLoading,
  error
}: ScoutReportsSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [selectedVideoReport, setSelectedVideoReport] = useState<Report | null>(null)

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

  // Reportes de ejemplo con imágenes reales
  const mockReports: Report[] = useMemo(() => {
    // Usar siempre los reportes de ejemplo para mostrar las imágenes
    return [
      {
        id: 'report-1',
        playerName: 'Jude Bellingham',
        profileType: 'CAM • Inglaterra',
        content: 'Reporte de análisis para Jude Bellingham. Actualmente en Real Madrid. Excelente visión de juego y capacidad de llegada al área. Su adaptación al fútbol español ha sido excepcional, mostrando una madurez táctica impresionante para su edad.',
        rating: 5,
        date: '15/1/2024',
        type: 'analysis',
        hasVideo: true,
        image: 'https://picsum.photos/400/200?random=1',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        roi: 35.2,
        profit: 40000000,
      },
      {
        id: 'report-2',
        playerName: 'Gavi',
        profileType: 'CM • España',
        content: 'Reporte de seguimiento para Gavi. Actualmente en FC Barcelona. Jugador con una técnica excepcional y gran inteligencia táctica. Su progresión en el primer equipo ha sido notable, consolidándose como una pieza clave en el mediocampo.',
        rating: 4,
        date: '10/1/2024',
        type: 'follow-up',
        hasVideo: true,
        image: 'https://picsum.photos/400/200?random=2',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        roi: 22.8,
        profit: 20000000,
      },
      {
        id: 'report-3',
        playerName: 'Pedri González',
        profileType: 'CM • España',
        content: 'Reporte de scouting para Pedri González. Actualmente en FC Barcelona. Centrocampista con una visión de juego extraordinaria y excelente control del balón. Su capacidad para dictar el ritmo del partido es excepcional.',
        rating: 4,
        date: '5/1/2024',
        type: 'scouting',
        hasVideo: false,
        image: 'https://picsum.photos/400/200?random=3',
        roi: 25.5,
        profit: 20000000,
      },
      {
        id: 'report-4',
        playerName: 'Erling Haaland',
        profileType: 'ST • Noruega',
        content: 'Reporte de análisis para Erling Haaland. Actualmente en Manchester City. Delantero con una capacidad goleadora excepcional y gran físico. Su adaptación a la Premier League ha sido perfecta, siendo el máximo goleador.',
        rating: 5,
        date: '28/12/2023',
        type: 'analysis',
        hasVideo: true,
        image: 'https://picsum.photos/400/200?random=4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        roi: 45.0,
        profit: 60000000,
      },
      {
        id: 'report-5',
        playerName: 'Kylian Mbappé',
        profileType: 'LW • Francia',
        content: 'Reporte de seguimiento para Kylian Mbappé. Actualmente en PSG. Extremo con una velocidad y definición excepcionales. Su capacidad para desequilibrar partidos es única en el fútbol actual.',
        rating: 5,
        date: '20/12/2023',
        type: 'follow-up',
        hasVideo: true,
        image: 'https://picsum.photos/400/200?random=5',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        roi: 50.0,
        profit: 80000000,
      },
      {
        id: 'report-6',
        playerName: 'Jamal Musiala',
        profileType: 'CAM • Alemania',
        content: 'Reporte de scouting para Jamal Musiala. Actualmente en Bayern Munich. Mediapunta con una técnica refinada y gran capacidad de regate. Su progresión en el Bayern ha sido impresionante.',
        rating: 4,
        date: '15/12/2023',
        type: 'scouting',
        hasVideo: false,
        image: 'https://picsum.photos/400/200?random=6',
        roi: 28.5,
        profit: 25000000,
      }
    ]
  }, [players])

  // Filtrar reportes según el tipo seleccionado y término de búsqueda
  const filteredReports = useMemo(() => {
    let filtered = mockReports

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

    return filtered
  }, [selectedFilter, searchTerm, mockReports])

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
        <h2 className="text-2xl font-bold text-[#000000]">Your Reports</h2>
        <Link href="/scout/players/new">
          <Button className="bg-[#8B0000] hover:bg-[#660000] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
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
        {searchTerm && (
          <p className="text-sm text-[#6d6d6d] mt-2">
            {filteredReports.length} resultado{filteredReports.length !== 1 ? 's' : ''} para "{searchTerm}"
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-xl">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = selectedFilter === type.key
          const count = type.key === 'all' ? mockReports.length : mockReports.filter(r => r.type === type.key).length
          
          return (
            <button
              key={type.key}
              onClick={() => setSelectedFilter(type.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#8B0000] text-white'
                  : 'bg-white text-[#6d6d6d] hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{type.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
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
            <Link href="/scout/players/new">
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
            <div key={report.id} className="bg-white rounded-xl border border-[#e7e7e7] p-4 break-inside-avoid">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-[#2e3138]">{report.playerName}</h3>
                    <p className="text-sm text-[#6d6d6d]">{report.profileType}</p>
                  </div>
                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.type === 'scouting' ? 'bg-red-100 text-red-700' :
                    report.type === 'analysis' ? 'bg-blue-100 text-blue-700' :
                    report.type === 'follow-up' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {report.type === 'scouting' ? '🔍' : 
                     report.type === 'analysis' ? '📊' : 
                     report.type === 'follow-up' ? '👁️' : '⭐'}
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

              {/* Image/Video */}
              {report.image && (
                <div className="relative mb-3">
                  <img 
                    src={report.image} 
                    alt="Report visual" 
                    className="w-full h-32 object-cover rounded-xl" 
                  />
                  {report.hasVideo && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        openVideoModal(report)
                      }}
                      className="absolute bottom-2 right-2 bg-[#8B0000] text-white px-3 py-1 rounded-xl flex items-center gap-1 hover:bg-[#660000] transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span className="text-xs">Play</span>
                    </button>
                  )}
                </div>
              )}

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
              <video
                controls
                autoPlay
                className="w-full h-auto rounded-lg"
                poster={selectedVideoReport.image}
              >
                <source src={selectedVideoReport.videoUrl} type="video/mp4" />
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>

            {/* Report Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedVideoReport.type === 'scouting' ? 'bg-red-100 text-red-700' :
                    selectedVideoReport.type === 'analysis' ? 'bg-blue-100 text-blue-700' :
                    selectedVideoReport.type === 'follow-up' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {selectedVideoReport.type === 'scouting' ? '🔍 Scouting' : 
                     selectedVideoReport.type === 'analysis' ? '📊 Análisis' : 
                     selectedVideoReport.type === 'follow-up' ? '👁️ Seguimiento' : '⭐ Recomendación'}
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