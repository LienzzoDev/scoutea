'use client'

import { Search, Download, Upload, Globe, Plus, Edit, Trash2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import AdminPlayerFilters from "@/components/player/AdminPlayerFilters"
import PlayerProfileModal from "@/components/player/player-profile-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage, LoadingCard } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useAdminPlayerFilters } from "@/hooks/player/useAdminPlayerFilters"
import { usePlayers } from "@/hooks/player/usePlayers"
import type { Player } from "@/types/player"

export default function JugadoresPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Hook para manejar jugadores
  const { 
    players, 
    loading, 
    error, 
    searchPlayers
  } = usePlayers()

  // Hook para manejar filtros
  const {
    showFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedAgencies,
    filterOptions,
    toggleFilters,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedAgencies,
    applyFilters,
    clearFilters,
    filteredPlayers: playersFilteredByFilters
  } = useAdminPlayerFilters(players)

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

  // Cargar jugadores al montar el componente
  useEffect(() => {
    if (isSignedIn) {
      searchPlayers()
    }
  }, [isSignedIn, searchPlayers])

  // Funciones para el modal
  const openPlayerModal = (player: Player) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const closePlayerModal = () => {
    setIsModalOpen(false)
    setSelectedPlayer(null)
  }

  // Función para eliminar jugador
  const handleDeletePlayer = async (playerId: string) => {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setShowDeleteConfirm(null)
        // Recargar la lista de jugadores
        searchPlayers()
      } else {
        console.error('Error al eliminar jugador')
      }
    } catch (error) {
      console.error('Error al eliminar jugador:', error)
    }
  }

  // Filtrar jugadores por búsqueda (aplicar sobre los ya filtrados por filtros)
  const filteredPlayers = playersFilteredByFilters.filter(player =>
    player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.complete_player_name && player.complete_player_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.team_name && player.team_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.position_player && player.position_player.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold text-[#D6DDE6]">Jugadores</h1>
          <div className="flex items-center space-x-3">
            <Button 
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              onClick={() => router.push('/admin/jugadores/nuevo-jugador')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Jugador
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
              placeholder="Buscar jugadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <AdminPlayerFilters
            showFilters={showFilters}
            onToggleFilters={toggleFilters}
            filterOptions={filterOptions}
            selectedNationalities={selectedNationalities}
            selectedPositions={selectedPositions}
            selectedTeams={selectedTeams}
            selectedAgencies={selectedAgencies}
            onNationalitiesChange={setSelectedNationalities}
            onPositionsChange={setSelectedPositions}
            onTeamsChange={setSelectedTeams}
            onAgenciesChange={setSelectedAgencies}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
            <Button 
              onClick={() => searchPlayers()}
              variant="outline" 
              className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Players Table */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-300">
              <div>Jugador</div>
              <div>Posición</div>
              <div>Edad</div>
              <div>Equipo</div>
              <div>Valor/Valoración</div>
              <div>Nacionalidad</div>
              <div>Acciones</div>
            </div>
            
            {loading ? (
              <LoadingCard />
            ) : filteredPlayers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  {searchTerm ? 'No se encontraron jugadores con esa búsqueda' : 'No hay jugadores registrados'}
                </div>
                {!searchTerm && (
                  <Button 
                    onClick={() => router.push('/admin/jugadores/nuevo-jugador')}
                    className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer jugador
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id_player}
                    className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {player.player_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-[#D6DDE6] cursor-pointer hover:text-[#FF5733]"
                             onClick={() => openPlayerModal(player)}>
                          {player.player_name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {player.complete_player_name || player.player_name}
                        </div>
                        {player.agency && (
                          <div className="text-xs text-slate-500">
                            Agente: {player.agency}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-300">{player.position_player || 'N/A'}</div>
                    <div className="text-slate-300">
                      {player.age || (player.date_of_birth ? 
                        new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : 'N/A')}
                    </div>
                    <div className="text-slate-300">{player.team_name || 'N/A'}</div>
                    <div className="text-slate-300">
                      {player.player_trfm_value ? 
                        `€${(player.player_trfm_value / 1000000).toFixed(1)}M` : 
                        (player.player_rating || 'N/A')}
                      {player.contract_end && (
                        <div className="text-xs text-slate-400">
                          Contrato: {new Date(player.contract_end).getFullYear()}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-300">
                      <div>{player.nationality_1 || 'Sin nacionalidad'}</div>
                      {player.height && (
                        <div className="text-xs text-slate-400">
                          {player.height}cm
                        </div>
                      )}
                      {player.foot && (
                        <div className="text-xs text-slate-400">
                          {player.foot}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#FF5733]"
                        onClick={() => router.push(`/admin/jugadores/${player.id_player}/editar`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => setShowDeleteConfirm(player.id_player)}
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
      {/* Modal del perfil del jugador */}
      <PlayerProfileModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={closePlayerModal}
      />

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-[#131921] border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#D6DDE6] mb-4">Confirmar eliminación</h3>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que quieres eliminar este jugador? Esta acción no se puede deshacer.
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
                onClick={() => handleDeletePlayer(showDeleteConfirm)}
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
