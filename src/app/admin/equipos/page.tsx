'use client'

import { Search, Globe, Plus, RefreshCw } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

import ImportTeamsButton from "@/components/admin/ImportTeamsButton"
import TeamTable from "@/components/team/TeamTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useInfiniteTeamsScroll } from '@/hooks/admin/useInfiniteTeamsScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import type { Team } from "@/hooks/team/useTeams"

export default function EquiposPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('team_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Debounce del search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

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
    limit: 50
  })

  // Categorías para mostrar en la tabla
  const categories = useMemo(() => [
    {
      key: 'correct_team_name',
      label: 'Nombre Corregido',
      getValue: (team: Team) => team.correct_team_name,
    },
    {
      key: 'team_country',
      label: 'País del Equipo',
      getValue: (team: Team) => team.team_country,
    },
    {
      key: 'url_trfm_advisor',
      label: 'URL TM Advisor',
      getValue: (team: Team) => team.url_trfm_advisor,
      format: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? value.substring(0, 30) + '...' : value;
      },
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
      key: 'pre_competition',
      label: 'Pre Competición',
      getValue: (team: Team) => team.pre_competition,
    },
    {
      key: 'competition',
      label: 'Competición',
      getValue: (team: Team) => team.competition,
    },
    {
      key: 'correct_competition',
      label: 'Competición Corregida',
      getValue: (team: Team) => team.correct_competition,
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
        searchTeams()
      } else {
        console.error('Error al eliminar equipo')
      }
    } catch (_error) {
      console.error('Error al eliminar equipo:', error)
    }
  }

  // Client-side sorting (los equipos ya están filtrados por el backend)
  const sortedTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    // Ordenar en cliente
    if (sortBy && sortBy !== 'team_name') { // team_name ya viene ordenado del backend
      return [...teams].sort((a, b) => {
        let aValue: any = a[sortBy as keyof typeof a];
        let bValue: any = b[sortBy as keyof typeof b];

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

      {/* Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>
        <div className="text-sm text-slate-400">
          {teams.length} equipos {hasMore ? '(cargando más al hacer scroll)' : 'cargados'}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">Error: {typeof error === 'string' ? error : error?.message || 'Error desconocido'}</p>
          <Button
            onClick={() => refresh()}
            variant="outline" className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20">
            Reintentar
          </Button>
        </div>
      )}

      {/* Team Table */}
      <TeamTable
        teams={sortedTeams}
        selectedCategories={categories}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={false}
        darkMode={true}
        onEdit={(teamId) => router.push(`/admin/equipos/${teamId}/editar`)}
        onDelete={(teamId) => setShowDeleteConfirm(teamId)}
      />

      {/* Infinite Scroll Observer */}
      {teams.length > 0 && (
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
      )}

      {/* Loading inicial */}
      {teams.length === 0 && loading && (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando equipos...</span>
          </div>
        </div>
      )}

      {/* No results */}
      {teams.length === 0 && !loading && (
        <div className='text-center py-12'>
          <p className='text-lg text-slate-400'>No se encontraron equipos</p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
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
