'use client'

import { Search, Filter, Download, Upload, Globe, Plus, Edit, Trash2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage, LoadingCard } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useTeams, Team } from "@/hooks/team/useTeams"

export default function EquiposPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

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
      console.error('Unhandled error:', event.error)
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
  }, [isSignedIn, searchTeams])

  // Funciones para el modal
  const openTeamModal = (team: Team) => {
    setSelectedTeam(team)
    setIsModalOpen(true)
  }

  const closeTeamModal = () => {
    setIsModalOpen(false)
    setSelectedTeam(null)
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
    } catch (error) {
      console.error('Error al eliminar equipo:', error)
    }
  }

  // Filtrar equipos por búsqueda
  const filteredTeams = teams.filter(team =>
    team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.correct_team_name && team.correct_team_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (team.team_country && team.team_country.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (team.competition && team.competition.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <main className="px-6 py-8 max-w-7xl mx-auto">

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

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <Button variant="outline" className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <Button 
              onClick={() => searchTeams()}
              variant="outline" 
              className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Teams Table */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-300">
              <div>Equipo</div>
              <div>País</div>
              <div>Competición</div>
              <div>Valor/Valoración</div>
              <div>ELO/Nivel</div>
              <div>Propietario</div>
              <div>Acciones</div>
            </div>
            
            {loading ? (
              <LoadingCard />
            ) : filteredTeams.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  {searchTerm ? 'No se encontraron equipos con esa búsqueda' : 'No hay equipos registrados'}
                </div>
                {!searchTerm && (
                  <Button 
                    onClick={() => router.push('/admin/equipos/nuevo-equipo')}
                    className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer equipo
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id_team}
                    className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {team.team_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-[#D6DDE6] cursor-pointer hover:text-[#FF5733]"
                             onClick={() => openTeamModal(team)}>
                          {team.team_name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {team.correct_team_name || team.team_name}
                        </div>
                        {team.owner_club && (
                          <div className="text-xs text-slate-500">
                            Propietario: {team.owner_club}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-300">{team.team_country || 'N/A'}</div>
                    <div className="text-slate-300">
                      <div>{team.competition || 'N/A'}</div>
                      {team.competition_country && (
                        <div className="text-xs text-slate-400">
                          {team.competition_country}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-300">
                      {team.team_trfm_value ? 
                        `€${(team.team_trfm_value / 1000000).toFixed(1)}M` : 
                        (team.team_rating || 'N/A')}
                      {team.team_rating_norm && (
                        <div className="text-xs text-slate-400">
                          Norm: {team.team_rating_norm.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-300">
                      <div>{team.team_elo || 'N/A'}</div>
                      {team.team_level && (
                        <div className="text-xs text-slate-400">
                          {team.team_level}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-300">
                      <div>{team.owner_club || 'N/A'}</div>
                      {team.owner_club_country && (
                        <div className="text-xs text-slate-400">
                          {team.owner_club_country}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#FF5733]"
                        onClick={() => router.push(`/admin/equipos/${team.id_team}/editar`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => setShowDeleteConfirm(team.id_team)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => handleDeleteTeam(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
