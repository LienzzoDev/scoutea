'use client'

import { Search, Download, Upload, Globe, Plus, Filter } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

import TeamTable from "@/components/team/TeamTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useTeams, Team } from "@/hooks/team/useTeams"

export default function EquiposPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('team_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Hook para manejar equipos
  const { 
    teams, 
    loading, 
    error, 
    searchTeams
  } = useTeams()

  // Manejador global de errores no capturados
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled __error: ', event.error)
      event.preventDefault()
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  // Cargar equipos al montar el componente
  useEffect(() => {
    if (isSignedIn) {
      searchTeams()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  // Categorías para mostrar en la tabla
  const categories = useMemo(() => [
    {
      key: 'team_country',
      label: 'País',
      getValue: (team: Team) => team.team_country,
    },
    {
      key: 'competition',
      label: 'Competición',
      getValue: (team: Team) => team.competition,
    },
    {
      key: 'team_trfm_value',
      label: 'Valor',
      getValue: (team: Team) => team.team_trfm_value,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return `€${(value / 1000000).toFixed(1)}M`;
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

  // Filtrar y ordenar equipos
  const filteredTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    // Primero filtrar
    let filtered = teams.filter(team =>
      team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.correct_team_name && team.correct_team_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.team_country && team.team_country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.competition && team.competition.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Luego ordenar
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
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

    return filtered;
  }, [teams, searchTerm, sortBy, sortOrder])

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
        <h1 className="text-3xl font-bold text-[#D6DDE6]">Equipos</h1>
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
          <Button variant="outline" className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700">
            <Upload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
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
          {filteredTeams.length} equipos encontrados
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">Error: {typeof error === 'string' ? error : error?.message || 'Error desconocido'}</p>
          <Button
            onClick={() => searchTeams()}
            variant="outline" className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20">
            Reintentar
          </Button>
        </div>
      )}

      {/* Team Table */}
      <TeamTable
        teams={filteredTeams}
        selectedCategories={categories}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={loading}
        darkMode={true}
        onEdit={(teamId) => router.push(`/admin/equipos/${teamId}/editar`)}
        onDelete={(teamId) => setShowDeleteConfirm(teamId)}
      />

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
