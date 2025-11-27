'use client'

import { Plus, RefreshCw, Search, X, Trash2, AlertTriangle } from 'lucide-react'
import { useEffect, useState, useCallback, useRef } from 'react'

import { AdminReportForm } from '@/components/admin/AdminReportForm'
import AdminReportTable from '@/components/admin/AdminReportTable'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: string | null
  report_type: string | null
  id_player: number | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  createdAt: string
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  }
  scout?: {
    scout_name: string
    name: string | null
    surname: string | null
  }
}

export default function AdminReportesPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orphanCount, setOrphanCount] = useState<number | null>(null)
  const [deletingOrphans, setDeletingOrphans] = useState(false)
  const hasFetched = useRef(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Check for orphan reports
  const checkOrphanReports = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/orphans')
      if (response.ok) {
        const data = await response.json()
        setOrphanCount(data.total || 0)
      }
    } catch (error) {
      console.error('Error checking orphan reports:', error)
    }
  }, [])

  // Delete orphan reports
  const handleDeleteOrphans = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${orphanCount} reportes huérfanos? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeletingOrphans(true)
    try {
      const response = await fetch('/api/admin/reports/orphans', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error deleting orphan reports')
      }

      const data = await response.json()
      toast({
        title: 'Éxito',
        description: data.message || `${data.deleted} reportes huérfanos eliminados`
      })

      setOrphanCount(0)
      loadReports()
    } catch (error) {
      console.error('Error deleting orphan reports:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los reportes huérfanos',
        variant: 'destructive'
      })
    } finally {
      setDeletingOrphans(false)
    }
  }

  // Load reports
  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', '100')
      if (debouncedSearch) {
        params.append('player_name', debouncedSearch)
      }

      const response = await fetch(`/api/reports?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error loading reports')
      }

      const data = await response.json()
      setReports(data.reports || data.data || [])
      setTotalCount(data.total || data.totalCount || (data.reports || data.data || []).length)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Initial load
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      loadReports()
      checkOrphanReports()
    }
  }, [loadReports, checkOrphanReports])

  // Reload when search changes
  useEffect(() => {
    if (hasFetched.current && debouncedSearch !== '') {
      loadReports()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const handleDelete = async (reportId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${reportId}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error deleting report')
      }

      toast({
        title: 'Éxito',
        description: 'Reporte eliminado correctamente'
      })

      // Reload reports
      loadReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#080F17]">
      <DashboardHeader />

      <main className="max-w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D6DDE6]">Reportes</h1>
            {totalCount !== null && (
              <p className="text-sm text-slate-400 mt-1">
                {reports.length} de {totalCount} reportes cargados
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reporte
            </Button>
          </div>
        </div>

        {/* Orphan Reports Alert */}
        {orphanCount !== null && orphanCount > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-600/50 bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-300 font-medium">
                    {orphanCount} reporte{orphanCount !== 1 ? 's' : ''} huérfano{orphanCount !== 1 ? 's' : ''} detectado{orphanCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-yellow-500/80 text-sm">
                    Estos reportes tienen referencias a jugadores que ya no existen en la base de datos
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-yellow-600 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50"
                onClick={handleDeleteOrphans}
                disabled={deletingOrphans}
              >
                {deletingOrphans ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar reportes huérfanos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700"
            onClick={() => {
              loadReports()
              checkOrphanReports()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refrescar Lista
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre de jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        {loading && reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]"></div>
              <span>Cargando reportes...</span>
            </div>
          </div>
        ) : (
          <AdminReportTable reports={reports} onDelete={handleDelete} />
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-[#080F17] rounded-lg border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#080F17] border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#D6DDE6]">
                  Crear Reporte para Scout
                </h2>
                <p className="text-sm text-[#6d6d6d] mt-1">
                  Crea un reporte en nombre de un scout. El reporte aparecerá en el feed del scout seleccionado.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <AdminReportForm />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
