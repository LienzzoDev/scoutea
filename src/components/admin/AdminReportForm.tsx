"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import { MediaUpload } from "@/components/scout/media-upload"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id_player: string
  player_name: string
  position_player: string | null
  nationality_1: string | null
  team_name: string | null
  age: number | null
  is_own_player?: boolean
  approval_status?: string
}

interface Scout {
  id_scout: string
  scout_name: string
  name: string | null
  surname: string | null
  nationality: string | null
  total_reports: number | null
}

export function AdminReportForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [potential, setPotential] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Players state
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerSearchTerm, setPlayerSearchTerm] = useState('')

  // Scouts state
  const [scouts, setScouts] = useState<Scout[]>([])
  const [isLoadingScouts, setIsLoadingScouts] = useState(true)
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null)
  const [scoutSearchTerm, setScoutSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    reportText: '',
    urlReport: '',
    urlVideo: '',
    imageUrl: ''
  })

  // Cargar jugadores con búsqueda dinámica
  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoadingPlayers(true)
      try {
        const searchParam = playerSearchTerm ? `&search=${encodeURIComponent(playerSearchTerm)}` : ''
        const response = await fetch(`/api/players/search-simple?limit=100${searchParam}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data && Array.isArray(result.data)) {
          setPlayers(result.data)
        } else {
          console.warn('Unexpected response format:', result)
          setPlayers([])
        }
      } catch (error) {
        console.error('Error loading players:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los jugadores",
          variant: "destructive"
        })
        setPlayers([])
      } finally {
        setIsLoadingPlayers(false)
      }
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(loadPlayers, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast es estable y no cambia entre renders
  }, [playerSearchTerm])

  // Cargar scouts con búsqueda dinámica
  useEffect(() => {
    const loadScouts = async () => {
      setIsLoadingScouts(true)
      try {
        const searchParam = scoutSearchTerm ? `&search=${encodeURIComponent(scoutSearchTerm)}` : ''
        const response = await fetch(`/api/scouts/simple?limit=100${searchParam}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data && Array.isArray(result.data)) {
          setScouts(result.data)
        } else {
          console.warn('Unexpected response format:', result)
          setScouts([])
        }
      } catch (error) {
        console.error('Error loading scouts:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los scouts",
          variant: "destructive"
        })
        setScouts([])
      } finally {
        setIsLoadingScouts(false)
      }
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(loadScouts, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast es estable y no cambia entre renders
  }, [scoutSearchTerm])

  // Convertir players a formato SearchableOption con información adicional
  const playerOptions = players.map(player => ({
    value: player.id_player,
    label: player.player_name,
    description: `${player.position_player || 'N/A'} • ${player.team_name || 'N/A'} • ${player.nationality_1 || 'N/A'}${player.age ? ` • ${player.age} años` : ''}`,
    isOwnPlayer: player.is_own_player,
    approvalStatus: player.approval_status
  }))

  // Convertir scouts a formato SearchableOption
  const scoutOptions = scouts.map(scout => ({
    value: scout.id_scout,
    label: scout.scout_name,
    description: `${scout.name || ''} ${scout.surname || ''} • ${scout.nationality || 'N/A'} • ${scout.total_reports || 0} reportes`.trim()
  }))

  // Renderizar opciones de jugador con etiqueta para jugadores propios
  const renderPlayerOption = (option: typeof playerOptions[0]) => (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-[#D6DDE6]">{option.label}</span>
        {option.isOwnPlayer && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
            {option.approvalStatus === 'pending' ? 'Tu jugador (Pendiente)' : 'Tu jugador'}
          </span>
        )}
      </div>
      {option.description && (
        <div className="text-sm text-gray-400">{option.description}</div>
      )}
    </div>
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlayerChange = (option: { value: string; label: string; description?: string } | null) => {
    if (option) {
      const player = players.find(p => p.id_player === option.value)
      setSelectedPlayer(player || null)
    } else {
      setSelectedPlayer(null)
    }
  }

  const handleScoutChange = (option: { value: string; label: string; description?: string } | null) => {
    if (option) {
      const scout = scouts.find(s => s.id_scout === option.value)
      setSelectedScout(scout || null)
    } else {
      setSelectedScout(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos requeridos
    if (!selectedScout) {
      toast({
        title: "Error",
        description: "Debes seleccionar un scout",
        variant: "destructive"
      })
      return
    }

    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Debes seleccionar un jugador",
        variant: "destructive"
      })
      return
    }

    if (potential === 0) {
      toast({
        title: "Error",
        description: "El potencial es requerido",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/reports/create-on-behalf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoutId: selectedScout.id_scout,
          playerId: selectedPlayer.id_player,
          reportText: formData.reportText || null,
          urlReport: formData.urlReport || null,
          urlVideo: formData.urlVideo || null,
          imageUrl: formData.imageUrl || null,
          potential
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: `Reporte creado correctamente para el scout ${selectedScout.scout_name}`,
        })

        // Resetear formulario
        setSelectedScout(null)
        setSelectedPlayer(null)
        setPotential(0)
        setFormData({
          reportText: '',
          urlReport: '',
          urlVideo: '',
          imageUrl: ''
        })
      } else {
        throw new Error(result.error || 'Error al crear el reporte')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el reporte",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPlayerOption = selectedPlayer ? {
    value: selectedPlayer.id_player,
    label: selectedPlayer.player_name,
    description: `${selectedPlayer.position_player || 'N/A'} • ${selectedPlayer.team_name || 'N/A'} • ${selectedPlayer.nationality_1 || 'N/A'}${selectedPlayer.age ? ` • ${selectedPlayer.age} años` : ''}`,
    isOwnPlayer: selectedPlayer.is_own_player,
    approvalStatus: selectedPlayer.approval_status
  } : null

  const selectedScoutOption = selectedScout ? {
    value: selectedScout.id_scout,
    label: selectedScout.scout_name,
    description: `${selectedScout.name || ''} ${selectedScout.surname || ''} • ${selectedScout.nationality || 'N/A'} • ${selectedScout.total_reports || 0} reportes`.trim()
  } : null

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-slate-700 bg-[#131921] p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left Column - Scout & Player Selection */}
        <div className="space-y-5">
          {/* Scout Search */}
          <div className="space-y-2">
            <Label htmlFor="scout-search" className="text-sm font-medium text-[#D6DDE6]">
              *Seleccionar Scout
            </Label>
            <SearchableSelect
              options={scoutOptions}
              value={selectedScoutOption}
              onValueChange={handleScoutChange}
              onSearchChange={setScoutSearchTerm}
              placeholder="Buscar scout por nombre..."
              searchPlaceholder="Buscar scout..."
              emptyMessage="No se encontraron scouts"
              disabled={isLoadingScouts}
              darkMode={true}
            />
            {isLoadingScouts && (
              <p className="text-xs text-muted-foreground">Cargando scouts...</p>
            )}
          </div>

          {/* Selected Scout Info */}
          {selectedScout && (
            <div className="p-4 bg-[#1a2332] rounded-lg border border-slate-700">
              <h3 className="text-sm font-medium text-[#D6DDE6] mb-2">Scout Seleccionado</h3>
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#D6DDE6]">{selectedScout.scout_name}</p>
                <p className="text-sm text-gray-400">
                  {selectedScout.name} {selectedScout.surname}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedScout.nationality || 'N/A'} • {selectedScout.total_reports || 0} reportes
                </p>
              </div>
            </div>
          )}

          {/* Player Search */}
          <div className="space-y-2">
            <Label htmlFor="player-search" className="text-sm font-medium text-[#D6DDE6]">
              *Buscar Jugador
            </Label>
            <SearchableSelect
              options={playerOptions}
              value={selectedPlayerOption}
              onValueChange={handlePlayerChange}
              onSearchChange={setPlayerSearchTerm}
              placeholder="Buscar por nombre, equipo, nacionalidad..."
              searchPlaceholder="Buscar jugador..."
              emptyMessage="No se encontraron jugadores"
              disabled={isLoadingPlayers}
              renderOption={renderPlayerOption}
              darkMode={true}
            />
            {isLoadingPlayers && (
              <p className="text-xs text-muted-foreground">Cargando jugadores...</p>
            )}
          </div>

          {/* Selected Player Info */}
          {selectedPlayer && (
            <div className="p-4 bg-[#1a2332] rounded-lg border border-slate-700">
              <h3 className="text-sm font-medium text-[#D6DDE6] mb-2">Jugador Seleccionado</h3>
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#D6DDE6]">{selectedPlayer.player_name}</p>
                <p className="text-sm text-gray-400">
                  {selectedPlayer.position_player || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedPlayer.team_name || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedPlayer.nationality_1 || 'N/A'}
                  {selectedPlayer.age && ` • ${selectedPlayer.age} años`}
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Este reporte se creará en nombre del scout seleccionado y aparecerá en su feed de reportes.
            </p>
          </div>
        </div>

        {/* Right Column - Report Details */}
        <div className="space-y-5">
          {/* Report Text */}
          <div className="space-y-2">
            <Label htmlFor="report-text" className="text-sm font-medium text-[#D6DDE6]">
              Report Text
            </Label>
            <Textarea
              id="report-text"
              placeholder="Enter your report details here..."
              value={formData.reportText}
              onChange={(e) => handleInputChange('reportText', e.target.value)}
              className="min-h-[320px] resize-none rounded-lg border border-slate-600 bg-[#1a2332] p-4 text-[#D6DDE6] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
          </div>

          {/* URL Report */}
          <div className="space-y-2">
            <Label htmlFor="url-report" className="text-sm font-medium text-[#D6DDE6]">
              URL report
            </Label>
            <input
              id="url-report"
              type="url"
              placeholder="https://example.com/report"
              value={formData.urlReport}
              onChange={(e) => handleInputChange('urlReport', e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-600 bg-[#1a2332] px-4 text-[#D6DDE6] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:outline-none"
            />
          </div>

          {/* Media Upload (Image or Video) */}
          <MediaUpload
            imageValue={formData.imageUrl}
            videoValue={formData.urlVideo}
            onImageChange={(url) => handleInputChange('imageUrl', url)}
            onVideoChange={(url) => handleInputChange('urlVideo', url)}
            darkMode={true}
          />

          {/* Potential Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#D6DDE6]">*Potential</Label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPotential(value)}
                  className="group relative h-12 w-12 rounded-full transition-all hover:scale-110"
                  aria-label={`Set potential to ${value}`}
                >
                  <div
                    className={`h-full w-full rounded-full border-2 transition-all ${
                      value <= potential
                        ? "border-[#8B0000] bg-[#8B0000]"
                        : "border-muted-foreground/30 bg-muted/30 group-hover:border-muted-foreground/50"
                    }`}
                  />
                  {value <= potential && (
                    <svg
                      className="absolute inset-0 m-auto h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !selectedPlayer || !selectedScout}
              className="h-14 w-full rounded-lg bg-[#8B0000] text-base font-semibold text-white hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'CREANDO REPORTE...' : 'CREAR REPORTE'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
