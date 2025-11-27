'use client'

import { Search, RefreshCw, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

import AdminColumnSelector from '@/components/admin/AdminColumnSelector'
import AdminScoutTable from '@/components/admin/AdminScoutTable'
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

  // Columnas ocultas - por defecto ninguna (se muestran todas)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-scout-hidden-columns')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error parsing saved hidden columns:', e)
        }
      }
    }
    return [] // Por defecto, ninguna columna está oculta
  })

  // Guardar en localStorage cuando cambien las columnas ocultas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-scout-hidden-columns', JSON.stringify(hiddenColumns))
    }
  }, [hiddenColumns])

  const handleColumnToggle = (columnKey: string) => {
    setHiddenColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  const handleSelectAll = () => {
    setHiddenColumns([])
  }

  const handleDeselectAll = () => {
    setHiddenColumns([])
  }

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Ref para preservar posición del scroll
  const previousScoutsCount = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Hook de infinite scroll
  const {
    scouts: filteredScouts,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteScoutsScroll({
    search: debouncedSearch,
    limit: 50
  })

  // Preservar posición del scroll cuando se cargan nuevos scouts
  useEffect(() => {
    if (filteredScouts.length > previousScoutsCount.current && !loading) {
      previousScoutsCount.current = filteredScouts.length
    } else if (filteredScouts.length < previousScoutsCount.current) {
      previousScoutsCount.current = filteredScouts.length
    }
  }, [filteredScouts.length, loading])

  // Debounce del search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  // Función para exportar a CSV
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)

      // Construir URL con filtros actuales
      const params = new URLSearchParams()
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      const url = `/api/admin/scouts/export?${params.toString()}`

      // Abrir en nueva ventana para descargar
      window.open(url, '_blank')

    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Error al exportar el archivo CSV')
    } finally {
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <>
      <DashboardHeader />
      <main className='px-6 py-8 max-w-full mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-[#D6DDE6]'>Scouts</h1>
            {totalCount !== null && (
              <p className='text-sm text-slate-400 mt-1'>
                {filteredScouts.length} de {totalCount} scouts cargados
              </p>
            )}
          </div>
        </div>

      <div className='mb-6 flex flex-wrap items-center gap-4'>
        <Button
          variant='outline'
          className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refrescar Lista
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

      <div className='mb-6'>
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Buscar scouts...'
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className='pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400'
          />
        </div>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
          <p className='text-red-400'>
            Error: {error.message || 'Error desconocido'}
          </p>
        </div>
      )}

      <AdminColumnSelector
        hiddenColumns={hiddenColumns}
        onColumnToggle={handleColumnToggle}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        minColumns={1}
      />

      {/* Mostrar loading inicial o tabla */}
      {filteredScouts.length === 0 && loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando scouts...</span>
          </div>
        </div>
      ) : filteredScouts.length === 0 && !loading ? (
        <div className='text-center py-12'>
          <p className='text-lg text-slate-400'>No se encontraron scouts</p>
        </div>
      ) : (
        <EditableCellProvider>
          <div className='mb-4'>
            <AdminScoutTable
              scouts={filteredScouts as any}
              hiddenColumns={hiddenColumns}
            />
          </div>

          {/* Infinite Scroll Observer */}
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
    </>
  )
}
