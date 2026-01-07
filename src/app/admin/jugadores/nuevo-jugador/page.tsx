"use client"

import { useAuth } from "@clerk/nextjs"
import { ChevronLeft, Edit, Settings, Save, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, FormEvent, useRef, useCallback, useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePlayers } from "@/hooks/player/usePlayers"
import { CrearJugadorData } from "@/types/player"

// Posiciones disponibles
const POSITIONS = [
  'GK',
  'CB', 'LB', 'RB', 'LWB', 'RWB',
  'DM', 'CM', 'LM', 'RM', 'AM',
  'LW', 'RW', 'CF', 'ST'
]

export default function NuevoJugadorPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const _router = useRouter()
  const { crearJugador } = usePlayers()

  // Estado del formulario
  const [formData, setFormData] = useState<CrearJugadorData>({
    nombre: '',
    posicion: undefined,
    equipo: '',
    fecha_nacimiento: ''
  })

  // Estado de búsqueda
  const [searchingPlayer, setSearchingPlayer] = useState(false)
  const [searchingTeam, setSearchingTeam] = useState(false)
  const [playerSearchResults, setPlayerSearchResults] = useState<any[]>([])
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([])
  const [showPlayerResults, setShowPlayerResults] = useState(false)

  // Estado de la UI
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estado para scraping
  const [urlTrfm, setUrlTrfm] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapingResult, setScrapingResult] = useState<any>(null)

  // Refs para debounce
  const teamSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playerSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (teamSearchTimeoutRef.current) clearTimeout(teamSearchTimeoutRef.current)
      if (playerSearchTimeoutRef.current) clearTimeout(playerSearchTimeoutRef.current)
    }
  }, [])

  // Buscar jugadores con debounce
  const searchPlayersDebounced = useCallback((query: string) => {
    if (playerSearchTimeoutRef.current) {
      clearTimeout(playerSearchTimeoutRef.current)
    }

    if (!query || query.length < 2) {
      setPlayerSearchResults([])
      setShowPlayerResults(false)
      setSearchingPlayer(false)
      return
    }

    setSearchingPlayer(true)
    setShowPlayerResults(true)

    playerSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/players?search=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        setPlayerSearchResults(data.players || [])
      } catch (error) {
        console.error('Error searching players:', error)
        setPlayerSearchResults([])
      } finally {
        setSearchingPlayer(false)
      }
    }, 300)
  }, [])

  // Buscar equipos con debounce (usando endpoint optimizado)
  const searchTeamsDebounced = useCallback((query: string) => {
    if (teamSearchTimeoutRef.current) {
      clearTimeout(teamSearchTimeoutRef.current)
    }

    if (!query || query.length < 2) {
      setTeamSearchResults([])
      setSearchingTeam(false)
      return
    }

    setSearchingTeam(true)

    teamSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/teams/simple?search=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        setTeamSearchResults(data.teams || [])
      } catch (error) {
        console.error('Error searching teams:', error)
        setTeamSearchResults([])
      } finally {
        setSearchingTeam(false)
      }
    }, 300)
  }, [])

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida'
    }
    if (!formData.equipo.trim()) {
      newErrors.equipo = 'El equipo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof CrearJugadorData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Hacer scraping de URL individual
  const handleScraping = async () => {
    if (!urlTrfm.trim()) {
      alert('Por favor ingresa una URL de Transfermarkt')
      return
    }

    // Validar que sea una URL de Transfermarkt
    if (!urlTrfm.includes('transfermarkt')) {
      alert('La URL debe ser de Transfermarkt')
      return
    }

    setScraping(true)
    setScrapingResult(null)

    try {
      const response = await fetch('/api/admin/scraping/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlTrfm })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al hacer scraping')
      }

      setScrapingResult(data)

      // Auto-rellenar formulario con datos scrapeados
      if (data.data) {
        const scraped = data.data

        // Solo rellenar campos que estén vacíos
        if (scraped.player_name && !formData.nombre) {
          handleInputChange('nombre', scraped.player_name)
        }
        if (scraped.position_player && !formData.posicion) {
          handleInputChange('posicion', scraped.position_player)
        }
        if (scraped.team_name && !formData.equipo) {
          handleInputChange('equipo', scraped.team_name)
        }
        if (scraped.date_of_birth && !formData.fecha_nacimiento) {
          handleInputChange('fecha_nacimiento', scraped.date_of_birth)
        }
        if (scraped.nationality_1 && !formData.nationality) {
          handleInputChange('nationality', scraped.nationality_1)
        }
        if (scraped.nationality_2 && !formData.nationality_2) {
          handleInputChange('nationality_2', scraped.nationality_2)
        }
        if (scraped.player_trfm_value && !formData.player_trfm_value) {
          handleInputChange('player_trfm_value', scraped.player_trfm_value)
        }
        if (scraped.owner_club && !formData.owner_club) {
          handleInputChange('owner_club', scraped.owner_club)
        }
        if (scraped.national_tier && !formData.national_tier) {
          handleInputChange('national_tier', scraped.national_tier)
        }
        if (scraped.contract_end && !formData.contract_end) {
          handleInputChange('contract_end', scraped.contract_end)
        }
        if (scraped.height && !formData.height) {
          handleInputChange('height', scraped.height)
        }
      }

      alert('Scraping completado exitosamente! Los datos han sido cargados en el formulario.')

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al hacer scraping: ${errorMsg}`)
    } finally {
      setScraping(false)
    }
  }

  // Enviar formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const resultado = await crearJugador(formData)
      if (resultado) {
        // Redirigir a la lista de jugadores
        _router.push('/admin/jugadores')
      } else {
        console.error('❌ No se pudo crear el jugador - resultado null')
      }
    } catch (_error) {
      console.error('❌ Error al crear jugador:', _error)
    } finally {
      setLoading(false)
    }
  }

  // Si no está cargado o autenticado, mostrar nada
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <main className="mx-[306px] py-8">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={() => _router.back()}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/dynamic-soccer-player.png" />
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF5733] rounded-full flex items-center justify-center">
                <Edit className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#D6DDE6]">Nuevo Jugador</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="submit"
              form="jugador-form"
              disabled={loading}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white px-6"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleScraping}
              disabled={scraping || !urlTrfm}
              variant="outline"
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {scraping ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scrapeando...</span>
                </div>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Hacer Scraping
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form */}
        <form id="jugador-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Scraping Section */}
          <section className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6] flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-400" />
              Scraping de Transfermarkt
            </h2>
            <div className="space-y-2">
              <Label htmlFor="urlTrfm" className="text-sm text-slate-300 block">
                URL de Transfermarkt
              </Label>
              <Input
                id="urlTrfm"
                value={urlTrfm}
                onChange={(e) => setUrlTrfm(e.target.value)}
                placeholder="https://www.transfermarkt.es/jugador/profil/spieler/..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                Ingresa la URL del perfil del jugador en Transfermarkt y haz clic en "Hacer Scraping" para cargar automáticamente sus datos.
              </p>
              {scrapingResult && (
                <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded text-sm text-green-300">
                  ✅ Datos cargados exitosamente desde Transfermarkt
                </div>
              )}
            </div>
          </section>

          {/* Información Personal */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Información Personal</h2>
            <div className="space-y-4">
              {/* Nombre - Buscador */}
              <div>
                <Label htmlFor="nombre" className="text-sm text-slate-300 mb-2 block">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => {
                      handleInputChange('nombre', e.target.value)
                      searchPlayersDebounced(e.target.value)
                    }}
                    onFocus={() => {
                      if (formData.nombre && formData.nombre.length >= 2 && playerSearchResults.length > 0) {
                        setShowPlayerResults(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clicks en los resultados si fuera necesario
                      setTimeout(() => setShowPlayerResults(false), 200)
                    }}
                    placeholder="Buscar o escribir nombre del jugador"
                    className={`pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                      errors.nombre ? 'border-red-500' : ''
                    }`}
                  />
                  {searchingPlayer && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {errors.nombre && (
                  <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>
                )}
                {/* Resultados de búsqueda de jugadores - Solo para mostrar, no clickables */}
                {showPlayerResults && playerSearchResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-yellow-600 rounded-lg max-h-48 overflow-y-auto">
                    <div className="p-2 bg-yellow-900/20 border-b border-yellow-600">
                      <p className="text-xs text-yellow-400">⚠️ Jugadores existentes con nombre similar:</p>
                    </div>
                    {playerSearchResults.map((player) => (
                      <div
                        key={player.id_player}
                        className="p-3 border-b border-slate-700 last:border-b-0"
                      >
                        <p className="text-white font-medium">{player.player_name}</p>
                        <p className="text-sm text-slate-400">{player.team_name} • {player.position_player}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Posición - Desplegable (Opcional) */}
                <div>
                  <Label htmlFor="posicion" className="text-sm text-slate-300 mb-2 block">
                    Posición
                  </Label>
                  <Select
                    value={formData.posicion || ''}
                    onValueChange={(value) => handleInputChange('posicion', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Seleccionar posición" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos} className="text-white hover:bg-slate-700">
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <Label htmlFor="fecha_nacimiento" className="text-sm text-slate-300 mb-2 block">
                    Fecha de Nacimiento *
                  </Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                    className={`bg-slate-800 border-slate-700 text-white ${
                      errors.fecha_nacimiento ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.fecha_nacimiento && (
                    <p className="text-red-400 text-sm mt-1">{errors.fecha_nacimiento}</p>
                  )}
                </div>
              </div>

              {/* Equipo - Buscador */}
              <div>
                <Label htmlFor="equipo" className="text-sm text-slate-300 mb-2 block">
                  Equipo *
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="equipo"
                    value={formData.equipo}
                    onChange={(e) => {
                      handleInputChange('equipo', e.target.value)
                      searchTeamsDebounced(e.target.value)
                    }}
                    placeholder="Buscar o escribir nombre del equipo"
                    className={`pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                      errors.equipo ? 'border-red-500' : ''
                    }`}
                  />
                  {searchingTeam && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {errors.equipo && (
                  <p className="text-red-400 text-sm mt-1">{errors.equipo}</p>
                )}
                {/* Resultados de búsqueda de equipos */}
                {teamSearchResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-y-auto">
                    {teamSearchResults.map((team) => (
                      <div
                        key={team.id_team}
                        onClick={() => {
                          handleInputChange('equipo', team.team_name)
                          setTeamSearchResults([])
                        }}
                        className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                      >
                        <p className="text-white font-medium">{team.team_name}</p>
                        <p className="text-sm text-slate-400">{team.competition} • {team.team_country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nacionalidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality" className="text-sm text-slate-300 mb-2 block">
                    Nacionalidad Principal
                  </Label>
                  <Input
                    id="nationality"
                    value={formData.nationality ?? ''}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    placeholder="Ej: España"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality_2" className="text-sm text-slate-300 mb-2 block">
                    Segunda Nacionalidad
                  </Label>
                  <Input
                    id="nationality_2"
                    value={formData.nationality_2 ?? ''}
                    onChange={(e) => handleInputChange('nationality_2', e.target.value)}
                    placeholder="Ej: Argentina"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Altura y Peso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height" className="text-sm text-slate-300 mb-2 block">
                    Altura (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="150"
                    max="220"
                    value={formData.height ?? ''}
                    onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ej: 180"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-sm text-slate-300 mb-2 block">
                    Peso (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min="50"
                    max="120"
                    value={formData.weight ?? ''}
                    onChange={(e) => handleInputChange('weight', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ej: 75"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Información Contractual y de Mercado */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Información Contractual y de Mercado</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="player_trfm_value" className="text-sm text-slate-300 mb-2 block">
                    Valor de Mercado (€)
                  </Label>
                  <Input
                    id="player_trfm_value"
                    type="number"
                    min="0"
                    value={formData.player_trfm_value ?? ''}
                    onChange={(e) => handleInputChange('player_trfm_value', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Ej: 5000000"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="contract_end" className="text-sm text-slate-300 mb-2 block">
                    Fin de Contrato
                  </Label>
                  <Input
                    id="contract_end"
                    type="date"
                    value={formData.contract_end ?? ''}
                    onChange={(e) => handleInputChange('contract_end', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_club" className="text-sm text-slate-300 mb-2 block">
                    Club Propietario
                  </Label>
                  <Input
                    id="owner_club"
                    value={formData.owner_club ?? ''}
                    onChange={(e) => handleInputChange('owner_club', e.target.value)}
                    placeholder="Ej: Real Madrid CF"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="national_tier" className="text-sm text-slate-300 mb-2 block">
                    National Tier
                  </Label>
                  <Input
                    id="national_tier"
                    value={formData.national_tier ?? ''}
                    onChange={(e) => handleInputChange('national_tier', e.target.value)}
                    placeholder="Ej: A-Nationalmannschaft"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Cedido */}
              <div className="flex items-center space-x-2">
                <input
                  id="on_loan"
                  type="checkbox"
                  checked={formData.on_loan ?? false}
                  onChange={(e) => handleInputChange('on_loan', e.target.checked)}
                  className="w-4 h-4 bg-slate-800 border border-slate-700 rounded text-[#FF5733] focus:ring-[#FF5733]"
                />
                <Label htmlFor="on_loan" className="text-sm text-slate-300">
                  Jugador Cedido
                </Label>
              </div>
            </div>
          </section>

          {/* URLs */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Enlaces y Redes Sociales</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url_instagram" className="text-sm text-slate-300 mb-2 block">
                  URL de Instagram
                </Label>
                <Input
                  id="url_instagram"
                  value={formData.url_instagram ?? ''}
                  onChange={(e) => handleInputChange('url_instagram', e.target.value)}
                  placeholder="https://instagram.com/jugador"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="url_secondary" className="text-sm text-slate-300 mb-2 block">
                  URL Secundaria
                </Label>
                <Input
                  id="url_secondary"
                  value={formData.url_secondary ?? ''}
                  onChange={(e) => handleInputChange('url_secondary', e.target.value)}
                  placeholder="URL adicional del jugador"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </section>
        </form>
      </main>
  )
}
