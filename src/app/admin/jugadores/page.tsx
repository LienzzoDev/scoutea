'use client'

import { Search, Globe, Plus, RefreshCw, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'

import AdminColumnSelector, { ADMIN_COLUMN_GROUPS } from '@/components/admin/AdminColumnSelector'
import AdminPlayerFilters, {
  type PlayerFilters,
  DEFAULT_FILTERS
} from '@/components/admin/AdminPlayerFilters'
import AdminPlayerTable from '@/components/admin/AdminPlayerTable'
import ImportFMIButton from '@/components/admin/ImportFMIButton'
import ImportPlayerStatsButton from '@/components/admin/ImportPlayerStatsButton'
import ImportStatsButton from '@/components/admin/ImportStatsButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { EditableCellProvider } from '@/contexts/EditableCellContext'
import { useInfinitePlayersScroll } from '@/hooks/admin/useInfinitePlayersScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

export default function JugadoresPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()

  // Columnas ocultas - por defecto ninguna (se muestran todas)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-player-hidden-columns')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error parsing saved hidden columns:', e)
        }
      }
    }
    return [] // Por defecto, ninguna columna está oculta (se muestran todas)
  })

  // Cargar preferencias del servidor al iniciar
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isSignedIn) return

      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.hiddenColumns) {
            setHiddenColumns(data.preferences.hiddenColumns)
            // Actualizar localStorage también para mantener sincronía
            if (typeof window !== 'undefined') {
              localStorage.setItem('admin-player-hidden-columns', JSON.stringify(data.preferences.hiddenColumns))
            }
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }

    loadPreferences()
  }, [isSignedIn])

  // Guardar en localStorage y en DB cuando cambien las columnas ocultas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-player-hidden-columns', JSON.stringify(hiddenColumns))
    }

    // Debounce para guardar en DB
    const timer = setTimeout(async () => {
      if (!isSignedIn) return

      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hiddenColumns })
        })
      } catch (error) {
        console.error('Error saving preferences:', error)
      }
    }, 1000) // Esperar 1 segundo de inactividad antes de guardar

    return () => clearTimeout(timer)
  }, [hiddenColumns, isSignedIn])

  const handleColumnToggle = (columnKey: string) => {
    setHiddenColumns(prev => {
      if (prev.includes(columnKey)) {
        // Si está oculta, la mostramos (la quitamos de hiddenColumns)
        return prev.filter(key => key !== columnKey)
      } else {
        // Si está visible, la ocultamos (la agregamos a hiddenColumns)
        return [...prev, columnKey]
      }
    })
  }

  const handleSelectAll = () => {
    // Mostrar todas (ninguna oculta)
    setHiddenColumns([])
  }

  const handleDeselectAll = () => {
    // Ocultar todas las columnas
    const allColumnKeys = ADMIN_COLUMN_GROUPS.flatMap(group => group.columns.map(col => col.key))
    setHiddenColumns(allColumnKeys)
  }

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Estado para filtros avanzados
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<PlayerFilters>(DEFAULT_FILTERS)

  // Ref para preservar posición del scroll
  const previousPlayersCount = useRef(0)
  const _scrollContainerRef = useRef<HTMLDivElement>(null)

  // Hook de infinite scroll con todos los filtros
  const {
    players: filteredPlayers,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfinitePlayersScroll({
    search: debouncedSearch,
    nationality: debouncedFilters.nationality,
    position: debouncedFilters.position,
    team: debouncedFilters.team,
    competition: debouncedFilters.competition,
    foot: debouncedFilters.foot,
    onLoan: debouncedFilters.onLoan,
    isVisible: debouncedFilters.isVisible,
    ageMin: debouncedFilters.ageMin,
    ageMax: debouncedFilters.ageMax,
    valueMin: debouncedFilters.valueMin,
    valueMax: debouncedFilters.valueMax,
    ratingMin: debouncedFilters.ratingMin,
    ratingMax: debouncedFilters.ratingMax,
    heightMin: debouncedFilters.heightMin,
    heightMax: debouncedFilters.heightMax,
    limit: 50
  })

  // Preservar posición del scroll cuando se cargan nuevos jugadores
  useEffect(() => {
    // Si se agregaron jugadores (no es un reset) y no estamos cargando
    if (filteredPlayers.length > previousPlayersCount.current && !loading) {
      // La posición del scroll se mantiene automáticamente
      // Solo actualizamos el contador
      previousPlayersCount.current = filteredPlayers.length
    } else if (filteredPlayers.length < previousPlayersCount.current) {
      // Se hizo un reset (búsqueda nueva), actualizar contador
      previousPlayersCount.current = filteredPlayers.length
    }
  }, [filteredPlayers.length, loading])

  // Debounce del search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Debounce de los filtros avanzados
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleFiltersChange = useCallback((newFilters: PlayerFilters) => {
    setFilters(newFilters)
  }, [])

  const handleFiltersReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

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

      const url = `/api/admin/players/export?${params.toString()}`

      // Abrir en nueva ventana para descargar
      window.open(url, '_blank')

    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Error al exportar el archivo CSV')
    } finally {
      // Esperar un segundo antes de resetear el estado de carga
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
    <main className='px-6 py-8 max-w-full mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#D6DDE6]'>Jugadores</h1>
          {totalCount !== null && (
            <p className='text-sm text-slate-400 mt-1'>
              {filteredPlayers.length} de {totalCount} jugadores cargados
            </p>
          )}
        </div>
        <div className='flex items-center space-x-3'>
          <Button
            className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'
            onClick={() => _router.push('/admin/jugadores/nuevo-jugador')}
          >
            <Plus className='h-4 w-4 mr-2' />
            Nuevo Jugador
          </Button>
          <Button
            variant='outline'
            className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
            onClick={() => window.open('/admin/scraping', '_blank')}
          >
            <Globe className='h-4 w-4 mr-2' />
            Scraping URL
          </Button>
        </div>
      </div>

      <div className='mb-6 flex flex-wrap items-center gap-4'>
        <ImportFMIButton />
        <ImportStatsButton />
        <ImportPlayerStatsButton />
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
            placeholder='Buscar jugadores...'
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className='pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400'
          />
        </div>
      </div>

      {/* Filtros avanzados */}
      <AdminPlayerFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

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
      {filteredPlayers.length === 0 && loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando jugadores...</span>
          </div>
        </div>
      ) : filteredPlayers.length === 0 && !loading ? (
        <div className='text-center py-12'>
          <p className='text-lg text-slate-400'>No se encontraron jugadores</p>
        </div>
      ) : (
        <EditableCellProvider>
          <div className='mb-4'>
            <AdminPlayerTable
              players={filteredPlayers as any}
              hiddenColumns={hiddenColumns}
            />
          </div>

          {/* Infinite Scroll Observer - Separado para evitar re-renders */}
          <div
            ref={observerTarget}
            className='py-8 flex justify-center items-center'
            style={{ minHeight: '100px' }}
          >
            {loading && hasMore && (
              <div className='flex items-center gap-2 text-slate-400'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF5733]'></div>
                <span>Cargando más jugadores...</span>
              </div>
            )}
            {!loading && hasMore && filteredPlayers.length > 0 && (
              <p className='text-slate-500 text-sm'>Desplázate hacia abajo para cargar más</p>
            )}
            {!loading && !hasMore && filteredPlayers.length > 0 && (
              <p className='text-slate-500 text-sm'>✓ Todos los jugadores cargados ({totalCount})</p>
            )}
          </div>
        </EditableCellProvider>
      )}
    </main>
  )
}
