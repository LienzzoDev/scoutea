'use client'

import { RefreshCw, Download, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

import AdminColumnSelector from '@/components/admin/AdminColumnSelector'
import AdminScoutTable from '@/components/admin/AdminScoutTable'
import CreateScoutDialog from '@/components/admin/CreateScoutDialog'
import ScoutFilters, { ScoutFiltersState } from '@/components/admin/ScoutFilters'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { EditableCellProvider } from '@/contexts/EditableCellContext'
import { useInfiniteScoutsScroll } from '@/hooks/admin/useInfiniteScoutsScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

export default function ScoutsPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()

  // Columnas ocultas
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-scout-hidden-columns')
      if (saved) {
        try { return JSON.parse(saved) } catch (e) { console.error(e) }
      }
    }
    return []
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-scout-hidden-columns', JSON.stringify(hiddenColumns))
    }
  }, [hiddenColumns])

  const handleColumnToggle = (columnKey: string) => {
    setHiddenColumns(prev => prev.includes(columnKey) ? prev.filter(key => key !== columnKey) : [...prev, columnKey])
  }

  // Filtros
  const [filters, setFilters] = useState<ScoutFiltersState>({
    search: '',
    nationality: 'all',
    country: 'all',
    openToWork: null
  })

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Ref para scroll
  const previousScoutsCount = useRef(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Hook de infinite scroll
  const {
    scouts: filteredScouts,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget: setObserverTarget,
    refresh
  } = useInfiniteScoutsScroll({
    search: filters.search,
    nationality: filters.nationality === 'all' ? '' : filters.nationality,
    country: filters.country === 'all' ? '' : filters.country,
    openToWork: filters.openToWork,
    limit: 50
  })

  // Conectar observer ref
  useEffect(() => {
    if (observerTarget.current) {
      setObserverTarget(observerTarget.current)
    }
  }, [setObserverTarget, loading])

  // Preservar scroll
  useEffect(() => {
    if (filteredScouts.length > previousScoutsCount.current && !loading) {
      previousScoutsCount.current = filteredScouts.length
    } else if (filteredScouts.length < previousScoutsCount.current) {
      previousScoutsCount.current = filteredScouts.length
    }
  }, [filteredScouts.length, loading])

  // Exportar CSV
  const [isExporting, setIsExporting] = useState(false)
  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.nationality !== 'all') params.append('nationality', filters.nationality)
      if (filters.country !== 'all') params.append('country', filters.country)
      if (filters.openToWork !== null) params.append('openToWork', String(filters.openToWork))

      window.open(`/api/admin/scouts/export?${params.toString()}`, '_blank')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Error al exportar el archivo CSV')
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  if (!isLoaded) return <LoadingPage />
  if (!isSignedIn) return null

  return (
    <>
      <DashboardHeader />
      <main className='px-6 py-8 max-w-full mx-auto'>
        
        {/* Header & Actions */}
        <div className='flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-[#D6DDE6]'>Scouts</h1>
            {totalCount !== null && (
              <p className='text-sm text-slate-400 mt-1'>
                {filteredScouts.length} de {totalCount} scouts cargados
              </p>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-3'>
             <Button
              onClick={() => setShowCreateDialog(true)}
              className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              Nuevo Scout
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
            
            <Button
              variant='outline'
              className='border-green-700 bg-green-900/20 text-green-400 hover:bg-green-900/40'
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ScoutFilters 
          onFilterChange={setFilters} 
          initialFilters={filters}
          className="mb-6 p-4 bg-[#1a2332]/50 rounded-lg border border-slate-700/50"
        />

        {error && (
          <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
            <p className='text-red-400'>Error: {error.message || 'Error desconocido'}</p>
          </div>
        )}

        <AdminColumnSelector
          hiddenColumns={hiddenColumns}
          onColumnToggle={handleColumnToggle}
          onSelectAll={() => setHiddenColumns([])}
          onDeselectAll={() => setHiddenColumns([])}
          minColumns={1}
        />

        {/* Table Content */}
        {filteredScouts.length === 0 && loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='flex items-center gap-2 text-slate-400'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
              <span>Cargando scouts...</span>
            </div>
          </div>
        ) : filteredScouts.length === 0 && !loading ? (
          <div className='text-center py-12'>
            <p className='text-lg text-slate-400'>No se encontraron scouts con los filtros actuales</p>
          </div>
        ) : (
          <EditableCellProvider>
            <div className='mb-4'>
              <AdminScoutTable
                scouts={filteredScouts as any}
                hiddenColumns={hiddenColumns}
              />
            </div>

            <div
              ref={observerTarget}
              className='py-8 flex justify-center items-center'
              style={{ minHeight: '100px' }}
            >
              {loading && hasMore && (
                <div className='flex items-center gap-2 text-slate-400'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF5733]'></div>
                  <span>Cargando más scouts...</span>
                </div>
              )}
              {!loading && hasMore && filteredScouts.length > 0 && (
                <p className='text-slate-500 text-sm'>Desplázate hacia abajo para cargar más</p>
              )}
              {!loading && !hasMore && filteredScouts.length > 0 && (
                <p className='text-slate-500 text-sm'>✓ Todos los scouts cargados ({totalCount})</p>
              )}
            </div>
          </EditableCellProvider>
        )}
      </main>

      <CreateScoutDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={refresh}
      />
    </>
  )
}
