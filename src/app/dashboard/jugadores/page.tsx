'use client'

import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, Filter, Download, Upload, Globe, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingPage, LoadingCard } from "@/components/ui/loading-spinner"
import PlayerProfileModal from "@/components/player-profile-modal"
import { useJugadores } from "@/hooks/usePlayers"
import { Jugador } from "@/types/player"

export default function JugadoresPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [selectedPlayer, setSelectedPlayer] = useState<Jugador | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Hook para manejar jugadores
  const { 
    jugadores, 
    loading, 
    error, 
    obtenerJugadores, 
    eliminarJugador 
  } = useJugadores()

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
      obtenerJugadores()
    }
  }, [isSignedIn, obtenerJugadores])

  // Funciones para el modal
  const openPlayerModal = (player: Jugador) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const closePlayerModal = () => {
    setIsModalOpen(false)
    setSelectedPlayer(null)
  }

  // Función para eliminar jugador
  const handleDeletePlayer = async (jugadorId: string) => {
    const success = await eliminarJugador(jugadorId)
    if (success) {
      setShowDeleteConfirm(null)
      // Los jugadores se actualizan automáticamente en el hook
    }
  }

  // Filtrar jugadores por búsqueda
  const filteredJugadores = jugadores.filter(jugador =>
    jugador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jugador.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jugador.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jugador.posicion.toLowerCase().includes(searchTerm.toLowerCase())
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
    <main className="p-6">

      {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#D6DDE6]">Jugadores</h1>
          <div className="flex items-center space-x-3">
            <Button 
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              onClick={() => router.push('/dashboard/jugadores/nuevo-jugador')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Jugador
            </Button>
            <Button variant="outline" className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700">
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
              onClick={obtenerJugadores}
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
              <div>Valoración</div>
              <div>Atributos</div>
              <div></div>
            </div>
            
            {loading ? (
              <LoadingCard />
            ) : filteredJugadores.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  {searchTerm ? 'No se encontraron jugadores con esa búsqueda' : 'No hay jugadores registrados'}
                </div>
                {!searchTerm && (
                  <Button 
                    onClick={() => router.push('/dashboard/jugadores/nuevo-jugador')}
                    className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer jugador
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredJugadores.map((jugador) => (
                  <div
                    key={jugador.id}
                    className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={jugador.urlAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {jugador.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-[#D6DDE6] cursor-pointer hover:text-[#FF5733]"
                             onClick={() => openPlayerModal(jugador)}>
                          {jugador.nombre}
                        </div>
                        <div className="text-sm text-slate-400">@{jugador.nombreUsuario}</div>
                      </div>
                    </div>
                    <div className="text-slate-300">{jugador.posicion}</div>
                    <div className="text-slate-300">{jugador.edad}</div>
                    <div className="text-slate-300">{jugador.equipo}</div>
                    <div className="text-slate-300">{jugador.valoracion || 'N/A'}</div>
                    <div className="text-slate-300">
                      {jugador.atributos && jugador.atributos.length > 0 
                        ? `${jugador.atributos.length} atributos`
                        : 'Sin atributos'
                      }
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-[#FF5733]"
                        onClick={() => router.push(`/dashboard/jugadores/${jugador.id}/editar`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => setShowDeleteConfirm(jugador.id)}
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
