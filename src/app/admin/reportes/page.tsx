'use client'

import { useUser } from '@clerk/nextjs'
import { Plus, RefreshCw, Trash2, AlertTriangle, X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

import { AdminReportForm } from '@/components/admin/AdminReportForm'
import AdminReportTable from '@/components/admin/AdminReportTable'
import ReportFilters, { ReportFiltersState } from '@/components/admin/ReportFilters'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useInfiniteReportsScroll } from '@/hooks/admin/useInfiniteReportsScroll'
import { useToast } from '@/hooks/use-toast'

export default function AdminReportesPage() {
  const { toast } = useToast()
  const { isSignedIn, isLoaded } = useUser()
  const { dialogState, openDialog, closeDialog } = useConfirmDialog()

  // State for filters
  const [filters, setFilters] = useState<ReportFiltersState>({
    search: '',
    status: 'all',
    type: 'all'
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orphanCount, setOrphanCount] = useState<number | null>(null)
  const [deletingOrphans, setDeletingOrphans] = useState(false)

  // Infinite Scroll Hook
  const {
    reports,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteReportsScroll({
    player_name: filters.search,
    report_status: filters.status === 'all' ? '' : filters.status,
    report_type: filters.type === 'all' ? '' : filters.type,
    limit: 20
  })

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

  // Initial check for orphans
  useEffect(() => {
    checkOrphanReports()
  }, [checkOrphanReports])

  // Delete orphan reports (actual deletion logic)
  const executeDeleteOrphans = async () => {
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
      refresh()
      closeDialog()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los reportes huérfanos',
        variant: 'destructive'
      })
    } finally {
      setDeletingOrphans(false)
    }
  }

  // Open confirmation dialog for orphan deletion
  const handleDeleteOrphans = () => {
    openDialog({
      title: 'Eliminar reportes huérfanos',
      description: `¿Estás seguro de que deseas eliminar ${orphanCount} reportes huérfanos? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'warning',
      onConfirm: executeDeleteOrphans
    })
  }

  // Delete single report (actual deletion logic)
  const executeDeleteReport = async (reportId: string) => {
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

      refresh()
      closeDialog()
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
        variant: 'destructive'
      })
    }
  }

  // Open confirmation dialog for report deletion
  const handleDelete = (reportId: string) => {
    openDialog({
      title: 'Eliminar reporte',
      description: '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: () => executeDeleteReport(reportId)
    })
  }

  if (!isLoaded) return null // Or loading spinner
  if (!isSignedIn) return null

  return (
    <div className="min-h-screen bg-[#080F17]">
      <DashboardHeader />

      <main className="max-w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
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
            
            <Button
              variant='outline'
              className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
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

        {/* Filters */}
        <ReportFilters 
          onFilterChange={setFilters} 
          initialFilters={filters}
          className="mb-6 p-4 bg-[#1a2332]/50 rounded-lg border border-slate-700/50"
        />

        {error && (
          <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
            <p className='text-red-400'>Error: {error.message || 'Error desconocido'}</p>
          </div>
        )}

        {/* Table */}
        {reports.length === 0 && loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]"></div>
              <span>Cargando reportes...</span>
            </div>
          </div>
        ) : reports.length === 0 && !loading ? (
          <div className='text-center py-12'>
            <p className='text-lg text-slate-400'>No se encontraron reportes con los filtros actuales</p>
          </div>
        ) : (
          <>
            <AdminReportTable reports={reports} onDelete={handleDelete} />
            
            {/* Infinite Scroll Observer */}
            <div
              ref={observerTarget}
              className='py-8 flex justify-center items-center'
              style={{ minHeight: '100px' }}
            >
              {loading && hasMore && (
                <div className='flex items-center gap-2 text-slate-400'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF5733]'></div>
                  <span>Cargando más reportes...</span>
                </div>
              )}
              {!loading && hasMore && reports.length > 0 && (
                <p className='text-slate-500 text-sm'>Desplázate hacia abajo para cargar más</p>
              )}
              {!loading && !hasMore && reports.length > 0 && (
                <p className='text-slate-500 text-sm'>✓ Todos los reportes cargados ({totalCount})</p>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-[#080F17] rounded-lg border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4">
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
            <div className="px-6 py-4">
              <AdminReportForm />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText || 'Confirmar'}
        cancelText={dialogState.cancelText || 'Cancelar'}
        variant={dialogState.variant || 'default'}
        isLoading={deletingOrphans}
      />
    </div>
  )
}
