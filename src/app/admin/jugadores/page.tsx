'use client'

import { Search, Globe, Plus, RefreshCw, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import AdminColumnSelector from '@/components/admin/AdminColumnSelector'
import AdminPlayerTable from '@/components/admin/AdminPlayerTable'
import ImportFMIButton from '@/components/admin/ImportFMIButton'
import ImportPlayerStatsButton from '@/components/admin/ImportPlayerStatsButton'
import ImportStatsButton from '@/components/admin/ImportStatsButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useInfinitePlayersScroll } from '@/hooks/admin/useInfinitePlayersScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

export default function JugadoresPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-player-columns')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error parsing saved columns:', e)
        }
      }
    }
    return [
      'id_player',
      'wyscout_id_1',
      'wyscout_id_2',
      'wyscout_name_1',
      'wyscout_name_2',
      'id_fmi',
      'complete_player_name',
      'date_of_birth',
      'correct_date_of_birth',
      'age',
      'age_value',
      'age_value_percent',
      'age_coeff',
      'height',
      'correct_height',
      'foot',
      'correct_foot',
      'position_player',
      'correct_position_player',
      'position_value',
      'position_value_percent',
      'nationality_1',
      'correct_nationality_1',
      'nationality_value',
      'nationality_value_percent',
      'nationality_2',
      'correct_nationality_2',
      'national_tier',
      'rename_national_tier',
      'correct_national_tier',
      'pre_team',
      'team_name',
      'correct_team_name',
      'team_country',
      'team_elo',
      'team_level',
      'team_level_value',
      'team_level_value_percent',
      'team_competition',
      'competition_country',
      'team_competition_value',
      'team_competition_value_percent',
      'competition_tier',
      'competition_confederation',
      'competition_elo',
      'competition_level',
      'competition_level_value',
      'competition_level_value_percent',
      'owner_club',
      'owner_club_country',
      'owner_club_value',
      'owner_club_value_percent',
      'pre_team_loan_from',
      'team_loan_from',
      'correct_team_loan_from',
      'on_loan',
      'existing_club',
      'agency',
      'correct_agency',
      'contract_end',
      'correct_contract_end',
      'player_rating',
      'player_rating_norm',
      'player_trfm_value',
      'player_trfm_value_norm',
      'player_elo',
      'player_level',
      'player_ranking',
      'stats_evo_3m',
      'total_fmi_pts_norm',
      'community_potential',
      'photo_coverage',
      'video',
      'url_trfm_advisor',
      'url_trfm',
      'url_secondary',
      'url_instagram'
    ]
  })

  // Guardar en localStorage cuando cambien las columnas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-player-columns', JSON.stringify(selectedColumns))
    }
  }, [selectedColumns])

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  const handleSelectAll = () => {
    // Seleccionar todas las columnas disponibles
    setSelectedColumns([
      'id_player',
      'wyscout_id_1',
      'wyscout_id_2',
      'wyscout_name_1',
      'wyscout_name_2',
      'id_fmi',
      'complete_player_name',
      'date_of_birth',
      'correct_date_of_birth',
      'age',
      'age_value',
      'age_value_percent',
      'age_coeff',
      'height',
      'correct_height',
      'foot',
      'correct_foot',
      'position_player',
      'correct_position_player',
      'position_value',
      'position_value_percent',
      'nationality_1',
      'correct_nationality_1',
      'nationality_value',
      'nationality_value_percent',
      'nationality_2',
      'correct_nationality_2',
      'national_tier',
      'rename_national_tier',
      'correct_national_tier',
      'pre_team',
      'team_name',
      'correct_team_name',
      'team_country',
      'team_elo',
      'team_level',
      'team_level_value',
      'team_level_value_percent',
      'team_competition',
      'competition_country',
      'team_competition_value',
      'team_competition_value_percent',
      'competition_tier',
      'competition_confederation',
      'competition_elo',
      'competition_level',
      'competition_level_value',
      'competition_level_value_percent',
      'owner_club',
      'owner_club_country',
      'owner_club_value',
      'owner_club_value_percent',
      'pre_team_loan_from',
      'team_loan_from',
      'correct_team_loan_from',
      'on_loan',
      'existing_club',
      'agency',
      'correct_agency',
      'contract_end',
      'correct_contract_end',
      'player_rating',
      'player_rating_norm',
      'player_trfm_value',
      'player_trfm_value_norm',
      'player_elo',
      'player_level',
      'player_ranking',
      'stats_evo_3m',
      'total_fmi_pts_norm',
      'community_potential',
      'photo_coverage',
      'video',
      'url_trfm_advisor',
      'url_trfm',
      'url_secondary',
      'url_instagram'
    ])
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
  }

  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Hook de infinite scroll
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
    limit: 50
  })

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

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
          <p className='text-red-400'>
            Error: {error || 'Error desconocido'}
          </p>
        </div>
      )}

      <AdminColumnSelector
        selectedColumns={selectedColumns}
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
        <>
          <div className='mb-4'>
            <AdminPlayerTable
              players={filteredPlayers as any}
              selectedColumns={selectedColumns}
              loading={loading}
            />
          </div>

          {/* Infinite Scroll Observer - Separado para evitar re-renders */}
          <div
            ref={observerTarget}
            className='py-8 flex justify-center'
            style={{ minHeight: '80px' }}
          >
            {loading && (
              <div className='flex items-center gap-2 text-slate-400'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF5733]'></div>
                <span>Cargando más jugadores...</span>
              </div>
            )}
            {!loading && hasMore && (
              <p className='text-slate-500 text-sm'>Desplázate hacia abajo para cargar más</p>
            )}
            {!loading && !hasMore && (
              <p className='text-slate-500 text-sm'>✓ Todos los jugadores cargados</p>
            )}
          </div>
        </>
      )}
    </main>
  )
}
