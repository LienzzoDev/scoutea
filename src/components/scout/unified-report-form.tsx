"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import { MediaUpload } from "@/components/scout/media-upload"
import { TeamSearch } from "@/components/scout/team-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function UnifiedReportForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()

  const [potential, setPotential] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreatingNewPlayer, setIsCreatingNewPlayer] = useState(false)

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin'

  // Form state for report
  const [reportData, setReportData] = useState({
    reportText: '',
    urlReport: '',
    urlVideo: '',
    imageUrl: ''
  })

  // Form state for new player
  const [newPlayerData, setNewPlayerData] = useState({
    playerName: '',
    dateOfBirth: { day: '', month: '', year: '' },
    position: '',
    height: '',
    foot: '',
    team: '',
    teamCountry: '',
    nationality1: '',
    nationality2: '',
    nationalTier: '',
    agency: '',
    urlReference: ''
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
  const renderPlayerOption = (option: { value: string; label: string; description?: string; isOwnPlayer?: boolean; approvalStatus?: string }) => (
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

  const handleReportInputChange = (field: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewPlayerInputChange = (field: string, value: string) => {
    setNewPlayerData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (field: 'day' | 'month' | 'year', value: string) => {
    setNewPlayerData(prev => ({
      ...prev,
      dateOfBirth: {
        ...prev.dateOfBirth,
        [field]: value
      }
    }))
  }

  const handlePlayerChange = (option: { value: string; label: string; description?: string } | null) => {
    if (option) {
      const player = players.find(p => p.id_player === option.value)
      setSelectedPlayer(player || null)
      setIsCreatingNewPlayer(false)
    } else {
      setSelectedPlayer(null)
    }
  }

  // Auto-fill form with test data (Admin only)
  const handleAutoFillTestData = () => {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000)

    // Switch to "Create New Player" mode
    setIsCreatingNewPlayer(true)
    setSelectedPlayer(null)

    // Fill new player data
    setNewPlayerData({
      playerName: `Test Player ${randomNum}`,
      dateOfBirth: {
        day: String(Math.floor(Math.random() * 28) + 1),
        month: String(Math.floor(Math.random() * 12) + 1),
        year: String(1995 + Math.floor(Math.random() * 10))
      },
      position: ['goalkeeper', 'defender', 'midfielder', 'forward'][Math.floor(Math.random() * 4)],
      height: String(170 + Math.floor(Math.random() * 20)),
      foot: ['Left', 'Right', 'Both'][Math.floor(Math.random() * 3)],
      team: ['Real Madrid', 'Barcelona', 'Manchester United', 'Bayern Munich', 'PSG'][Math.floor(Math.random() * 5)],
      teamCountry: ['Spain', 'England', 'Germany', 'France'][Math.floor(Math.random() * 4)],
      nationality1: ['spanish', 'english', 'german', 'italian', 'french'][Math.floor(Math.random() * 5)],
      nationality2: '',
      nationalTier: '',
      agency: 'Test Agency',
      urlReference: `https://transfermarkt.com/test-player-${randomNum}`
    })

    // Fill report data
    setReportData({
      reportText: `This is an automated test report for Player ${randomNum}. The player shows great potential and technical skills. Physical attributes are strong and tactical awareness is developing well. Recommended for further scouting.`,
      urlReport: `https://example.com/reports/test-${randomNum}`,
      urlVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      imageUrl: 'https://placehold.co/600x400/png?text=Test+Player'
    })

    // Set potential
    setPotential(Math.floor(Math.random() * 3) + 3) // Random between 3-5

    toast({
      title: "✅ Formulario auto-rellenado",
      description: "Todos los campos se han completado con datos de prueba",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar potencial (requerido siempre)
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
      if (isCreatingNewPlayer) {
        // Validar campos requeridos para nuevo jugador
        if (!newPlayerData.playerName.trim()) {
          throw new Error("El nombre del jugador es requerido")
        }

        if (!newPlayerData.dateOfBirth.day || !newPlayerData.dateOfBirth.month || !newPlayerData.dateOfBirth.year) {
          throw new Error("La fecha de nacimiento es requerida")
        }

        if (!newPlayerData.team.trim()) {
          throw new Error("El equipo es requerido")
        }

        if (!newPlayerData.nationality1) {
          throw new Error("La nacionalidad es requerida")
        }

        if (!newPlayerData.urlReference.trim()) {
          throw new Error("La URL de referencia es requerida")
        }

        // Construir fecha de nacimiento
        const dateOfBirth = `${newPlayerData.dateOfBirth.year}-${newPlayerData.dateOfBirth.month.padStart(2, '0')}-${newPlayerData.dateOfBirth.day.padStart(2, '0')}`

        const payload = {
          playerName: newPlayerData.playerName,
          dateOfBirth,
          position: newPlayerData.position || null,
          height: newPlayerData.height || null,
          foot: newPlayerData.foot || null,
          team: newPlayerData.team,
          teamCountry: newPlayerData.teamCountry || null,
          nationality1: newPlayerData.nationality1,
          nationality2: newPlayerData.nationality2 || null,
          nationalTier: newPlayerData.nationalTier || null,
          agency: newPlayerData.agency || null,
          urlReference: newPlayerData.urlReference,
          reportText: reportData.reportText || null,
          urlReport: reportData.urlReport || null,
          urlVideo: reportData.urlVideo || null,
          imageUrl: reportData.imageUrl || null,
          potential
        }

        console.log('Sending new player + report payload:', payload)

        const response = await fetch('/api/scout/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "¡Éxito!",
            description: result.message || "Jugador y reporte añadidos correctamente. Pendiente de aprobación del administrador.",
          })

          router.push('/scout/portfolio')
        } else {
          console.error('API Error:', result)
          throw new Error(result.details || result.error || 'Error al añadir el jugador y reporte')
        }
      } else {
        // Crear reporte para jugador existente
        if (!selectedPlayer) {
          throw new Error("Debes seleccionar un jugador o crear uno nuevo")
        }

        const response = await fetch('/api/reports/create-for-existing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: selectedPlayer.id_player,
            reportText: reportData.reportText || null,
            urlReport: reportData.urlReport || null,
            urlVideo: reportData.urlVideo || null,
            imageUrl: reportData.imageUrl || null,
            potential
          })
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "¡Éxito!",
            description: "Reporte creado correctamente",
          })

          router.push('/scout/portfolio')
        } else {
          throw new Error(result.error || 'Error al crear el reporte')
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el formulario",
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
      <div className="space-y-8">
        {/* Admin Test Button */}
        {isAdmin && (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              onClick={handleAutoFillTestData}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              🧪 Auto-rellenar (Test)
            </Button>
          </div>
        )}

        {/* Player Selection or Creation Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setIsCreatingNewPlayer(false)
              setSelectedPlayer(null)
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !isCreatingNewPlayer
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Seleccionar Jugador Existente
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNewPlayer(true)
              setSelectedPlayer(null)
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isCreatingNewPlayer
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Crear Nuevo Jugador
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Left Column - Player Selection or Creation */}
          <div className="space-y-5">
            {!isCreatingNewPlayer ? (
              <>
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
              </>
            ) : (
              <>
                {/* New Player Form */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Datos del Nuevo Jugador</h3>

                  {/* Player Name */}
                  <div className="space-y-2">
                    <Label htmlFor="player-name" className="text-sm font-medium text-foreground">
                      *Player name
                    </Label>
                    <Input
                      id="player-name"
                      value={newPlayerData.playerName}
                      onChange={(e) => handleNewPlayerInputChange('playerName', e.target.value)}
                      className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Enter player name"
                      required={isCreatingNewPlayer}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="date-of-birth" className="text-sm font-medium text-foreground">
                      *Date of birth
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="date-of-birth-day"
                        type="number"
                        placeholder="DD"
                        value={newPlayerData.dateOfBirth.day}
                        onChange={(e) => handleDateChange('day', e.target.value)}
                        className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        min="1"
                        max="31"
                        required={isCreatingNewPlayer}
                      />
                      <span className="flex items-center text-muted-foreground">/</span>
                      <Input
                        id="date-of-birth-month"
                        type="number"
                        placeholder="MM"
                        value={newPlayerData.dateOfBirth.month}
                        onChange={(e) => handleDateChange('month', e.target.value)}
                        className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        min="1"
                        max="12"
                        required={isCreatingNewPlayer}
                      />
                      <span className="flex items-center text-muted-foreground">/</span>
                      <Input
                        id="date-of-birth-year"
                        type="number"
                        placeholder="YYYY"
                        value={newPlayerData.dateOfBirth.year}
                        onChange={(e) => handleDateChange('year', e.target.value)}
                        className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        min="1950"
                        max="2020"
                        required={isCreatingNewPlayer}
                      />
                    </div>
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium text-foreground">
                      Position
                    </Label>
                    <Select value={newPlayerData.position} onValueChange={(value) => handleNewPlayerInputChange('position', value)}>
                      <SelectTrigger
                        id="position"
                        className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground focus:ring-2 focus:ring-ring"
                      >
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                        <SelectItem value="defender">Defender</SelectItem>
                        <SelectItem value="midfielder">Midfielder</SelectItem>
                        <SelectItem value="forward">Forward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team */}
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-sm font-medium text-foreground">
                      *Team
                    </Label>
                    <TeamSearch
                      value={newPlayerData.team}
                      onChange={(teamName, teamCountry) => {
                        handleNewPlayerInputChange('team', teamName)
                        if (teamCountry) {
                          handleNewPlayerInputChange('teamCountry', teamCountry)
                        }
                      }}
                      placeholder="Search team..."
                      className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Nationality 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="nationality-1" className="text-sm font-medium text-foreground">
                      *Nationality
                    </Label>
                    <Select value={newPlayerData.nationality1} onValueChange={(value) => handleNewPlayerInputChange('nationality1', value)}>
                      <SelectTrigger
                        id="nationality-1"
                        className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground focus:ring-2 focus:ring-ring"
                      >
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                        <SelectItem value="italian">Italian</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* URL Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="url-reference" className="text-sm font-medium text-foreground">
                      *URL reference
                    </Label>
                    <Input
                      id="url-reference"
                      type="url"
                      placeholder="https://example.com"
                      value={newPlayerData.urlReference}
                      onChange={(e) => handleNewPlayerInputChange('urlReference', e.target.value)}
                      className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      required={isCreatingNewPlayer}
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      ⚠️ <strong>Nota:</strong> El jugador será enviado para aprobación del administrador antes de aparecer en la base de datos principal.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Report Details */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Detalles del Reporte</h3>

            {/* Report Text */}
            <div className="space-y-2">
              <Label htmlFor="report-text" className="text-sm font-medium text-foreground">
                Report Text
              </Label>
              <Textarea
                id="report-text"
                placeholder="Enter your report details here..."
                value={reportData.reportText}
                onChange={(e) => handleReportInputChange('reportText', e.target.value)}
                className="min-h-[200px] resize-none rounded-lg border-0 bg-muted/50 p-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                value={reportData.urlReport}
                onChange={(e) => handleReportInputChange('urlReport', e.target.value)}
                className="h-12 w-full rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>

            {/* Media Upload (Image or Video) */}
            <MediaUpload
              imageValue={reportData.imageUrl}
              videoValue={reportData.urlVideo}
              onImageChange={(url) => handleReportInputChange('imageUrl', url)}
              onVideoChange={(url) => handleReportInputChange('urlVideo', url)}
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
                disabled={isSubmitting || (!isCreatingNewPlayer && !selectedPlayer)}
                className="h-14 w-full rounded-lg bg-[#8B0000] text-base font-semibold text-white hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'ENVIANDO...' : isCreatingNewPlayer ? 'CREAR JUGADOR Y REPORTE' : 'CREAR REPORTE'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
