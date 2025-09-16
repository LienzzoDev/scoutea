'use client'

import { ChevronLeft, Edit, Settings, Save, ArrowLeft } from "lucide-react"
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { usePlayers } from '@/hooks/player/usePlayers'
import type { Player } from '@/types/player'

export default function EditarJugadorPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const params = useParams()
  const { getPlayer, loading, error } = usePlayers()
  
  const [player, setPlayer] = useState<Player | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [formData, setFormData] = useState({
    // Información Personal - Campos principales de la base de datos
    player_name: '',                    // → player_name (String, requerido)
    complete_player_name: '',           // → complete_player_name (String?)
    position_player: '',                // → position_player (String?)
    team_name: '',                      // → team_name (String?)
    jersey_number: '',                  // → No existe en BD, campo personalizado
    biografia: '',                      // → No existe en BD, campo personalizado
    
    // Scraping - URL de Transfermarkt
    url_trfm_advisor: '',               // → url_trfm_advisor (String?)
    
    // Atributos - Campos adicionales de la base de datos
    attr1: '',                          // → height (Float?) - Altura
    attr2: '',                          // → foot (String?) - Pie preferido
    attr3: '',                          // → nationality_1 (String?) - Nacionalidad
    attr4: ''                           // → agency (String?) - Agencia
  })

  // Cargar datos del jugador
  useEffect(() => {
    const loadPlayer = async () => {
      if (params.id && typeof params.id === 'string') {
        const playerData = await getPlayer(params.id)
        if (playerData) {
          setPlayer(playerData)
          setFormData({
            // Información Personal - Mapeo directo de la BD
            player_name: playerData.player_name || '',
            complete_player_name: playerData.complete_player_name || '',
            position_player: playerData.position_player || '',
            team_name: playerData.team_name || '',
            jersey_number: '', // Campo personalizado, no existe en BD
            biografia: '', // Campo personalizado, no existe en BD
            
            // Scraping - URL de Transfermarkt
            url_trfm_advisor: playerData.url_trfm_advisor || '',
            
            // Atributos - Mapeo de campos específicos de la BD
            attr1: playerData.height?.toString() || '', // height (Float?) → Altura
            attr2: playerData.foot || '', // foot (String?) → Pie preferido
            attr3: playerData.nationality_1 || '', // nationality_1 (String?) → Nacionalidad
            attr4: playerData.agency || '' // agency (String?) → Agencia
          })
        }
      }
    }
    
    if (isSignedIn) {
      loadPlayer()
    }
  }, [params.id, isSignedIn]) // Removed getPlayer from dependencies to prevent infinite loop

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!player) return
    
    try {
      // Mapear los datos del formulario a los campos de la base de datos
      const updateData = {
        // Información Personal - Mapeo directo
        player_name: formData.player_name,
        complete_player_name: formData.complete_player_name,
        position_player: formData.position_player,
        team_name: formData.team_name,
        
        // Scraping - URL de Transfermarkt
        url_trfm_advisor: formData.url_trfm_advisor,
        
        // Atributos - Mapeo de campos específicos
        height: formData.attr1 ? parseFloat(formData.attr1) : null, // attr1 → height (Float?)
        foot: formData.attr2 || null, // attr2 → foot (String?)
        nationality_1: formData.attr3 || null, // attr3 → nationality_1 (String?)
        agency: formData.attr4 || null, // attr4 → agency (String?)
        
        // Campos personalizados (no se guardan en BD por ahora)
        // jersey_number: formData.jersey_number, // No existe en BD
        // biografia: formData.biografia, // No existe en BD
      }
      
      console.log('Guardando cambios:', updateData)
      
      // Llamar a la API para actualizar el jugador
      const response = await fetch(`/api/players/${player.id_player}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        alert('Jugador actualizado correctamente!')
        router.push('/admin/jugadores')
      } else {
        const error = await response.json()
        console.error('Error al guardar:', error)
        alert(`Error al guardar: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar los cambios')
    }
  }

  const handleScraping = async () => {
    if (!player) return
    
    try {
      setIsScraping(true)
      console.log('Iniciando scraping para:', player.player_name)
      
      const response = await fetch(`/api/players/${player.id_player}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Mapear los datos scrapeados a los campos del formulario
        const scrapedData = result.data
        setFormData(prev => ({
          ...prev,
          // Mapear campos específicos
          url_trfm_advisor: scrapedData.url_trfm_advisor || prev.url_trfm_advisor,
          attr1: scrapedData.height ? scrapedData.height.toString() : prev.attr1, // height → Altura
          attr2: scrapedData.foot || prev.attr2, // foot → Pie preferido
          attr4: scrapedData.agency || prev.attr4, // agency → Agencia
        }))
        
        // Mostrar mensaje de éxito
        alert('Scraping completado! Los datos se han cargado en el formulario.')
        console.log('Datos cargados en formulario:', result.data)
      } else {
        console.error('Error en scraping:', result.error)
        alert(`Error en scraping: ${result.error}`)
      }
    } catch (error) {
      console.error('Error al realizar scraping:', error)
      alert('Error al realizar scraping')
    } finally {
      setIsScraping(false)
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

  // Si está cargando el jugador
  if (loading) {
    return <LoadingPage />
  }

  // Si hay error o no se encontró el jugador
  if (error || !player) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: '#131921' }}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Jugador no encontrado</h1>
          <Button onClick={() => router.push('/admin/jugadores')} className="bg-orange-500 hover:bg-orange-600 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Jugadores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#131921' }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/admin/jugadores')}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  {player.player_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "J"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Edit className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold">{player.player_name}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button 
              onClick={handleScraping}
              disabled={isScraping}
              variant="outline" 
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              {isScraping ? 'Scraping...' : 'Hacer Scraping'}
            </Button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Información Personal */}
          <section>
            <h2 className="text-xl font-semibold mb-6">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player_name" className="text-sm text-gray-300 mb-2 block">
                  Nombre de Usuario
                </Label>
                <Input
                  id="player_name"
                  name="player_name"
                  value={formData.player_name}
                  onChange={handleInputChange}
                  placeholder="Nombre del jugador"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complete_player_name" className="text-sm text-gray-300 mb-2 block">
                    Nombre Completo
                  </Label>
                  <Input
                    id="complete_player_name"
                    name="complete_player_name"
                    value={formData.complete_player_name}
                    onChange={handleInputChange}
                    placeholder="Nombre Completo"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="position_player" className="text-sm text-gray-300 mb-2 block">
                    Posición
                  </Label>
                  <Input
                    id="position_player"
                    name="position_player"
                    value={formData.position_player}
                    onChange={handleInputChange}
                    placeholder="Posición en el campo"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team_name" className="text-sm text-gray-300 mb-2 block">
                    Equipo
                  </Label>
                  <Input
                    id="team_name"
                    name="team_name"
                    value={formData.team_name}
                    onChange={handleInputChange}
                    placeholder="Nombre del equipo"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="jersey_number" className="text-sm text-gray-300 mb-2 block">
                    Número de Camiseta
                  </Label>
                  <Input
                    id="jersey_number"
                    name="jersey_number"
                    type="number"
                    value={formData.jersey_number || ''}
                    onChange={handleInputChange}
                    placeholder="Número"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="biografia" className="text-sm text-gray-300 mb-2 block">
                  Biografía
                </Label>
                <Textarea
                  id="biografia"
                  name="biografia"
                  value={formData.biografia}
                  onChange={handleInputChange}
                  placeholder="Escribe una breve biografía"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 min-h-[100px]"
                />
              </div>
            </div>
          </section>

          {/* Scraping */}
          <section>
            <h2 className="text-xl font-semibold mb-6">Scraping</h2>
            <div>
              <Label htmlFor="url_trfm_advisor" className="text-sm text-gray-300 mb-2 block">
                URL
              </Label>
              <Input
                id="url_trfm_advisor"
                name="url_trfm_advisor"
                value={formData.url_trfm_advisor}
                onChange={handleInputChange}
                placeholder="URL"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>
          </section>

          {/* Atributos */}
          <section>
            <h2 className="text-xl font-semibold mb-6">Atributos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attr1" className="text-sm text-gray-300 mb-2 block">
                  Altura (cm)
                </Label>
                <Input 
                  id="attr1" 
                  name="attr1"
                  type="number"
                  value={formData.attr1 || ''}
                  onChange={handleInputChange}
                  placeholder="Altura en centímetros"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500" 
                />
              </div>
              <div>
                <Label htmlFor="attr2" className="text-sm text-gray-300 mb-2 block">
                  Pie Preferido
                </Label>
                <Input 
                  id="attr2" 
                  name="attr2"
                  value={formData.attr2 || ''}
                  onChange={handleInputChange}
                  placeholder="Izquierdo, Derecho, Ambidiestro"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500" 
                />
              </div>
              <div>
                <Label htmlFor="attr3" className="text-sm text-gray-300 mb-2 block">
                  Nacionalidad
                </Label>
                <Input 
                  id="attr3" 
                  name="attr3"
                  value={formData.attr3 || ''}
                  onChange={handleInputChange}
                  placeholder="País de origen"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500" 
                />
              </div>
              <div>
                <Label htmlFor="attr4" className="text-sm text-gray-300 mb-2 block">
                  Agencia
                </Label>
                <Input 
                  id="attr4" 
                  name="attr4"
                  value={formData.attr4 || ''}
                  onChange={handleInputChange}
                  placeholder="Representante o agencia"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500" 
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
