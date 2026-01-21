'use client'

import { ChevronDown, ChevronUp, Filter, Globe, Plus, RefreshCw, Search, X } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ImportTeamsButton from "@/components/admin/ImportTeamsButton"
import TeamTable from "@/components/team/TeamTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { VirtualizedSelect } from "@/components/ui/virtualized-select"
import { EditableCellProvider } from "@/contexts/EditableCellContext"
import { useInfiniteTeamsScroll } from '@/hooks/admin/useInfiniteTeamsScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import type { Team } from "@/hooks/team/useTeams"

// Tipo para los filtros de equipos
interface TeamFilters {
  teamName: string // 'all' | 'has' | 'empty'
  urlTrfmBroken: string // 'all' | 'broken' | 'ok'
  urlTrfm: string // 'all' | 'has' | 'empty'
  ownerClub: string // 'all' | 'has' | 'empty' | valor específico
  teamCountry: string // 'all' | 'has' | 'empty' | valor específico
  competitionFilter: string // 'all' | 'has' | 'empty' | valor específico
  competitionCountry: string // 'all' | 'has' | 'empty' | valor específico
  teamLevel: string // 'all' | 'has' | 'empty' | valor específico
  // Filtros de rango
  valueMin: string
  valueMax: string
  ratingMin: string
  ratingMax: string
  eloMin: string
  eloMax: string
}

const DEFAULT_TEAM_FILTERS: TeamFilters = {
  teamName: 'all',
  urlTrfmBroken: 'all',
  urlTrfm: 'all',
  ownerClub: 'all',
  teamCountry: 'all',
  competitionFilter: 'all',
  competitionCountry: 'all',
  teamLevel: 'all',
  // Filtros de rango
  valueMin: '',
  valueMax: '',
  ratingMin: '',
  ratingMax: '',
  eloMin: '',
  eloMax: ''
}

// Tipo para las opciones de filtro cargadas de la BD
interface FilterOptions {
  ownerClubs: string[]
  teamCountries: string[]
  competitions: string[]
  competitionCountries: string[]
  teamLevels: string[]
}

// Constante fuera del componente para evitar re-creaciones
const SELECT_FILTER_KEYS = ['teamName', 'urlTrfmBroken', 'urlTrfm', 'ownerClub', 'teamCountry', 'competitionFilter', 'competitionCountry', 'teamLevel'] as const

export default function EquiposPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('team_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Estado para filtros avanzados
  const [filters, setFilters] = useState<TeamFilters>(DEFAULT_TEAM_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState<TeamFilters>(DEFAULT_TEAM_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  // Estado para opciones de filtro (valores únicos de la BD)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    ownerClubs: [],
    teamCountries: [],
    competitions: [],
    competitionCountries: [],
    teamLevels: []
  })
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false)

  // Cargar opciones de filtro al montar
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingFilterOptions(true)
      try {
        const response = await fetch('/api/teams/filters')
        if (response.ok) {
          const data = await response.json()
          setFilterOptions(data)
        }
      } catch (error) {
        console.error('Error loading filter options:', error)
      } finally {
        setLoadingFilterOptions(false)
      }
    }
    loadFilterOptions()
  }, [])

  // Debounce del search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Debounce de los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters])

  // Handler para cambios de filtros
  const handleFilterChange = useCallback((key: keyof TeamFilters, value: string) => {
    setFilters((prev: TeamFilters) => ({ ...prev, [key]: value }))
  }, [])

  // Reset de filtros
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_TEAM_FILTERS)
  }, [])

  // Contar filtros activos (memoizado para evitar recálculos)
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, v]) => {
      // Para filtros select, contar si no es 'all'
      if ((SELECT_FILTER_KEYS as readonly string[]).includes(key)) {
        return v !== 'all'
      }
      // Para filtros de rango, contar si tiene valor
      return v !== ''
    }).length
  }, [filters])
  const hasActiveFilters = activeFilterCount > 0

  // Hook de infinite scroll
  const {
    teams,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteTeamsScroll({
    search: debouncedSearch,
    limit: 50,
    teamName: debouncedFilters.teamName,
    urlTrfmBroken: debouncedFilters.urlTrfmBroken,
    urlTrfm: debouncedFilters.urlTrfm,
    ownerClub: debouncedFilters.ownerClub,
    teamCountry: debouncedFilters.teamCountry,
    competitionFilter: debouncedFilters.competitionFilter,
    competitionCountry: debouncedFilters.competitionCountry,
    teamLevel: debouncedFilters.teamLevel,
    // Filtros de rango
    valueMin: debouncedFilters.valueMin,
    valueMax: debouncedFilters.valueMax,
    ratingMin: debouncedFilters.ratingMin,
    ratingMax: debouncedFilters.ratingMax,
    eloMin: debouncedFilters.eloMin,
    eloMax: debouncedFilters.eloMax
  })

  // Forzar refresh al montar la página para obtener datos frescos
  // Se omite `refresh` de las dependencias intencionalmente para ejecutar solo al montar
  useEffect(() => {
    refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo ejecutar al montar el componente
  }, [])

  // Categorías para mostrar en la tabla (ID es ahora columna fija en TeamTable)
  const categories = useMemo(() => [
    {
      key: 'team_country',
      label: 'País del Equipo',
      getValue: (team: Team) => team.team_country,
    },
    {
      key: 'url_trfm_broken',
      label: 'URL Broken',
      getValue: (team: Team) => team.url_trfm_broken,
    },
    {
      key: 'url_trfm',
      label: 'URL Transfermarkt',
      getValue: (team: Team) => team.url_trfm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? value.substring(0, 30) + '...' : value;
      },
    },
    {
      key: 'owner_club',
      label: 'Club Propietario',
      getValue: (team: Team) => team.owner_club,
    },
    {
      key: 'owner_club_country',
      label: 'País Club Propietario',
      getValue: (team: Team) => team.owner_club_country,
    },
    {
      key: 'competition',
      label: 'Competición',
      getValue: (team: Team) => team.competition,
    },
    {
      key: 'competition_country',
      label: 'País Competición',
      getValue: (team: Team) => team.competition_country,
    },
    {
      key: 'team_trfm_value',
      label: 'Valor TM',
      getValue: (team: Team) => team.team_trfm_value,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return `€${(value / 1000000).toFixed(1)}M`;
      },
    },
    {
      key: 'team_trfm_value_norm',
      label: 'Valor TM Norm',
      getValue: (team: Team) => team.team_trfm_value_norm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(2);
      },
    },
    {
      key: 'fm_guide',
      label: 'FM Guide',
      getValue: (team: Team) => team.fm_guide,
      format: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? value.substring(0, 30) + '...' : value;
      },
    },
    {
      key: 'team_rating',
      label: 'Rating',
      getValue: (team: Team) => team.team_rating,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(1);
      },
    },
    {
      key: 'team_rating_norm',
      label: 'Rating Norm',
      getValue: (team: Team) => team.team_rating_norm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(2);
      },
    },
    {
      key: 'team_elo',
      label: 'ELO',
      getValue: (team: Team) => team.team_elo,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return Math.round(value).toString();
      },
    },
    {
      key: 'team_level',
      label: 'Nivel',
      getValue: (team: Team) => team.team_level,
    },
  ], [])

  // Función de ordenamiento
  const handleSort = (categoryKey: string) => {
    if (sortBy === categoryKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(categoryKey)
      setSortOrder('asc')
    }
  }

  // Función para eliminar equipo
  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteConfirm(null)
        // Recargar la lista de equipos
        refresh()
      } else {
        console.error('Error al eliminar equipo')
      }
    } catch (err) {
      console.error('Error al eliminar equipo:', err)
    }
  }

  // Client-side sorting (los equipos ya están filtrados por el backend)
  const sortedTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    // Ordenar en cliente
    if (sortBy && sortBy !== 'team_name') { // team_name ya viene ordenado del backend
      return [...teams].sort((a, b) => {
        let aValue: string | number | null | undefined = a[sortBy as keyof Team];
        let bValue: string | number | null | undefined = b[sortBy as keyof Team];

        // Manejar valores null/undefined
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Convertir a string para comparación si es necesario
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        // Comparar
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return teams;
  }, [teams, sortBy, sortOrder])

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <main className="px-6 py-8 max-w-full mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#D6DDE6]">Equipos</h1>
          {totalCount !== null && (
            <p className='text-sm text-slate-400 mt-1'>
              {teams.length} de {totalCount} equipos cargados
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            onClick={() => router.push('/admin/equipos/nuevo-equipo')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Equipo
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700"
            onClick={() => window.open('/admin/scraping', '_blank')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Scraping URL
          </Button>
        </div>
      </div>

      {/* Import Teams Section */}
      <div className='mb-6 flex flex-wrap items-center gap-4'>
        <ImportTeamsButton />
        <Button
          variant='outline'
          className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refrescar Lista
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400"
            aria-label="Buscar equipos"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-700 bg-[#131921] text-white hover:bg-slate-700 ${hasActiveFilters ? 'border-[#FF5733]' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-[#FF5733] text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          <div className="text-sm text-slate-400">
            {teams.length} equipos {hasMore ? '(cargando más al hacer scroll)' : 'cargados'}
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="mb-6 p-4 bg-[#131921] border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-300">Filtros de Datos</h3>
              {loadingFilterOptions && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Cargando opciones...
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Team Name Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Team Name</span>
              <Select
                value={filters.teamName}
                onValueChange={(value) => handleFilterChange('teamName', value)}
              >
                <SelectTrigger className="bg-[#0D1117] border-slate-700 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#131921] border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                  <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                  <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL TRFM Broken Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">URL Broken</span>
              <Select
                value={filters.urlTrfmBroken}
                onValueChange={(value) => handleFilterChange('urlTrfmBroken', value)}
              >
                <SelectTrigger className="bg-[#0D1117] border-slate-700 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#131921] border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                  <SelectItem value="broken" className="text-white hover:bg-slate-700">URL Roto</SelectItem>
                  <SelectItem value="ok" className="text-white hover:bg-slate-700">URL OK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL TRFM Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">URL Transfermarkt</span>
              <Select
                value={filters.urlTrfm}
                onValueChange={(value) => handleFilterChange('urlTrfm', value)}
              >
                <SelectTrigger className="bg-[#0D1117] border-slate-700 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#131921] border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                  <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                  <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner Club Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Owner Club</span>
              <VirtualizedSelect
                value={filters.ownerClub}
                onValueChange={(value) => handleFilterChange('ownerClub', value)}
                options={filterOptions.ownerClubs}
                placeholder="Todos"
                className="bg-[#0D1117] border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Segunda fila de filtros con valores de BD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {/* País del Equipo Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">País del Equipo</span>
              <VirtualizedSelect
                value={filters.teamCountry}
                onValueChange={(value) => handleFilterChange('teamCountry', value)}
                options={filterOptions.teamCountries}
                placeholder="Todos"
                className="bg-[#0D1117] border-slate-700 text-white"
              />
            </div>

            {/* Competición Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Competición</span>
              <VirtualizedSelect
                value={filters.competitionFilter}
                onValueChange={(value) => handleFilterChange('competitionFilter', value)}
                options={filterOptions.competitions}
                placeholder="Todos"
                className="bg-[#0D1117] border-slate-700 text-white"
              />
            </div>

            {/* País de Competición Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">País Competición</span>
              <VirtualizedSelect
                value={filters.competitionCountry}
                onValueChange={(value) => handleFilterChange('competitionCountry', value)}
                options={filterOptions.competitionCountries}
                placeholder="Todos"
                className="bg-[#0D1117] border-slate-700 text-white"
              />
            </div>

            {/* Nivel del Equipo Filter */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Nivel del Equipo</span>
              <VirtualizedSelect
                value={filters.teamLevel}
                onValueChange={(value) => handleFilterChange('teamLevel', value)}
                options={filterOptions.teamLevels}
                placeholder="Todos"
                className="bg-[#0D1117] border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Filtros de Rango */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 mb-3">Filtros de Rango</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Valor Transfermarkt */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Valor TM (€)</span>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.valueMin}
                    onChange={(e) => handleFilterChange('valueMin', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.valueMax}
                    onChange={(e) => handleFilterChange('valueMax', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Rating</span>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Mín"
                    value={filters.ratingMin}
                    onChange={(e) => handleFilterChange('ratingMin', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Máx"
                    value={filters.ratingMax}
                    onChange={(e) => handleFilterChange('ratingMax', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* ELO */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400">ELO</span>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.eloMin}
                    onChange={(e) => handleFilterChange('eloMin', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.eloMax}
                    onChange={(e) => handleFilterChange('eloMax', e.target.value)}
                    className="bg-[#0D1117] border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">Error: {error?.message || 'Error desconocido'}</p>
          <Button
            onClick={() => refresh()}
            variant="outline" className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20">
            Reintentar
          </Button>
        </div>
      )}

      {/* Mostrar loading inicial o tabla */}
      {teams.length === 0 && loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando equipos...</span>
          </div>
        </div>
      ) : teams.length === 0 && !loading ? (
        <div className='text-center py-12'>
          <p className='text-lg text-slate-400'>No se encontraron equipos</p>
        </div>
      ) : (
        <EditableCellProvider>
          {/* Team Table */}
          <TeamTable
            teams={sortedTeams}
            selectedCategories={categories}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            loading={teams.length === 0 && loading}
            darkMode={true}
            onEdit={(teamId) => router.push(`/admin/equipos/${teamId}/editar`)}
            onDelete={(teamId) => setShowDeleteConfirm(teamId)}
          />

          {/* Infinite Scroll Observer */}
          <div
            ref={observerTarget}
            className='py-8 flex justify-center'
            style={{ minHeight: '80px' }}
          >
            {loading && (
              <div className='flex items-center gap-2 text-slate-400'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF5733]'></div>
                <span>Cargando más equipos...</span>
              </div>
            )}
            {!loading && hasMore && (
              <p className='text-slate-500 text-sm'>Desplázate hacia abajo para cargar más</p>
            )}
            {!loading && !hasMore && (
              <p className='text-slate-500 text-sm'>✓ Todos los equipos cargados</p>
            )}
          </div>
        </EditableCellProvider>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowDeleteConfirm(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowDeleteConfirm(null); }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar modal"
          />
          <div className="relative bg-[#131921] border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#D6DDE6] mb-4">Confirmar eliminación</h3>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() =>setShowDeleteConfirm(null)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700">
                Cancelar
              </Button>
              <Button 
                onClick={() =>handleDeleteTeam(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
