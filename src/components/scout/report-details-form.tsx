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

export function ReportDetailsForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [potential, setPotential] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Convertir players a formato SearchableOption con información adicional
  const playerOptions = players.map(player => ({
    value: player.id_player,
    label: player.player_name,
    description: `${player.position_player || 'N/A'} • ${player.team_name || 'N/A'} • ${player.nationality_1 || 'N/A'}${player.age ? ` • ${player.age} años` : ''}`,
    isOwnPlayer: player.is_own_player,
    approvalStatus: player.approval_status
  }))

  // Renderizar opciones con etiqueta para jugadores propios
  const renderPlayerOption = (option: typeof playerOptions[0]) => (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{option.label}</span>
        {option.isOwnPlayer && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            {option.approvalStatus === 'pending' ? 'Tu jugador (Pendiente)' : 'Tu jugador'}
          </span>
        )}
      </div>
      {option.description && (
        <div className="text-sm text-muted-foreground">{option.description}</div>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos requeridos
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
      const response = await fetch('/api/reports/create-for-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          description: "Reporte creado correctamente",
        })

        // Redirigir a la página de reportes
        router.push('/scout/reports')
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

  const selectedOption = selectedPlayer ? {
    value: selectedPlayer.id_player,
    label: selectedPlayer.player_name,
    description: `${selectedPlayer.position_player || 'N/A'} • ${selectedPlayer.team_name || 'N/A'} • ${selectedPlayer.nationality_1 || 'N/A'}${selectedPlayer.age ? ` • ${selectedPlayer.age} años` : ''}`,
    isOwnPlayer: selectedPlayer.is_own_player,
    approvalStatus: selectedPlayer.approval_status
  } : null

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-border bg-card p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left Column - Player Selection */}
        <div className="space-y-5">
          {/* Player Search */}
          <div className="space-y-2">
            <Label htmlFor="player-search" className="text-sm font-medium text-foreground">
              *Buscar Jugador
            </Label>
            <SearchableSelect
              options={playerOptions}
              value={selectedOption}
              onValueChange={handlePlayerChange}
              onSearchChange={setSearchTerm}
              placeholder="Buscar por nombre, equipo, nacionalidad..."
              searchPlaceholder="Buscar jugador..."
              emptyMessage="No se encontraron jugadores"
              disabled={isLoadingPlayers}
              renderOption={renderPlayerOption}
            />
            {isLoadingPlayers && (
              <p className="text-xs text-muted-foreground">Cargando jugadores...</p>
            )}
          </div>

          {/* Selected Player Info */}
          {selectedPlayer && (
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">Jugador Seleccionado</h3>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">{selectedPlayer.player_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlayer.position_player || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlayer.team_name || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPlayer.nationality_1 || 'N/A'}
                  {selectedPlayer.age && ` • ${selectedPlayer.age} años`}
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Busca y selecciona un jugador existente de la base de datos para crear un nuevo reporte sobre él.
            </p>
          </div>
        </div>

        {/* Right Column - Report Details */}
        <div className="space-y-5">
          {/* Report Text */}
          <div className="space-y-2">
            <Label htmlFor="report-text" className="text-sm font-medium text-foreground">
              Report Text
            </Label>
            <Textarea
              id="report-text"
              placeholder="Enter your report details here..."
              value={formData.reportText}
              onChange={(e) => handleInputChange('reportText', e.target.value)}
              className="min-h-[320px] resize-none rounded-lg border-0 bg-muted/50 p-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* URL Report */}
          <div className="space-y-2">
            <Label htmlFor="url-report" className="text-sm font-medium text-foreground">
              URL report
            </Label>
            <input
              id="url-report"
              type="url"
              placeholder="https://example.com/report"
              value={formData.urlReport}
              onChange={(e) => handleInputChange('urlReport', e.target.value)}
              className="h-12 w-full rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>

          {/* Media Upload (Image or Video) */}
          <MediaUpload
            imageValue={formData.imageUrl}
            videoValue={formData.urlVideo}
            onImageChange={(url) => handleInputChange('imageUrl', url)}
            onVideoChange={(url) => handleInputChange('urlVideo', url)}
          />

          {/* Potential Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">*Potential</Label>
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
              disabled={isSubmitting || !selectedPlayer}
              className="h-14 w-full rounded-lg bg-[#8B0000] text-base font-semibold text-white hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'SENDING...' : 'SEND REPORT'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
