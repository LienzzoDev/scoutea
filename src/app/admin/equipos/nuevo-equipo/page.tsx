'use client'

import { ChevronLeft, Save, Search } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

export default function NuevoEquipoPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Información Básica
    team_name: '',                    // → team_name (String, requerido)
    correct_team_name: '',            // → correct_team_name (String?)
    team_country: '',                 // → team_country (String?)

    // URLs
    url_trfm_advisor: '',             // → url_trfm_advisor (String?)
    url_trfm: '',                     // → url_trfm (String?)

    // Propietario
    owner_club: '',                   // → owner_club (String?)
    owner_club_country: '',           // → owner_club_country (String?)

    // Competición
    competition: '',                  // → competition (String?)
    correct_competition: '',          // → correct_competition (String?)
    competition_country: '',          // → competition_country (String?)

    // Valores y Rating
    team_trfm_value: '',              // → team_trfm_value (Float?)
    team_rating: '',                  // → team_rating (Float?)
    team_elo: '',                     // → team_elo (Float?)
    team_level: ''                    // → team_level (String?)
  })

  // Estado de búsqueda
  const [searchingTeam, setSearchingTeam] = useState(false)
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([])
  const [showTeamResults, setShowTeamResults] = useState(false)

  // Buscar equipos
  const searchTeams = async (query: string) => {
    if (!query || query.length < 2) {
      setTeamSearchResults([])
      setShowTeamResults(false)
      return
    }

    setSearchingTeam(true)
    setShowTeamResults(true)
    try {
      const response = await fetch(`/api/teams?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      setTeamSearchResults(data.teams || [])
    } catch (error) {
      console.error('Error searching teams:', error)
      setTeamSearchResults([])
    } finally {
      setSearchingTeam(false)
    }
  }

  // Función para crear equipo
  const handleCreate = async () => {
    if (!formData.team_name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }

    try {
      setLoading(true)

      const teamData = {
        team_name: formData.team_name,
        correct_team_name: formData.correct_team_name || null,
        team_country: formData.team_country || null,
        url_trfm_advisor: formData.url_trfm_advisor || null,
        url_trfm: formData.url_trfm || null,
        owner_club: formData.owner_club || null,
        owner_club_country: formData.owner_club_country || null,
        competition: formData.competition || null,
        correct_competition: formData.correct_competition || null,
        competition_country: formData.competition_country || null,
        team_trfm_value: formData.team_trfm_value ? parseFloat(formData.team_trfm_value) : null,
        team_rating: formData.team_rating ? parseFloat(formData.team_rating) : null,
        team_elo: formData.team_elo ? parseFloat(formData.team_elo) : null,
        team_level: formData.team_level || null
      }

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teamData)
      })

      if (response.ok) {
        alert('Equipo creado correctamente')
        _router.push('/admin/equipos')
      } else {
        const _error = await response.json()
        alert(`Error al crear el equipo: ${_error.error || 'Error desconocido'}`)
      }
    } catch (_error) {
      console.error('Error al crear equipo:', _error)
      alert('Error al crear el equipo')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-[#080F17]">
      {/* Header */}
      <div className="bg-[#131921] border-b border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>_router.push('/admin/equipos')}
                className="text-slate-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-[#D6DDE6]">Nuevo Equipo</h1>
                <p className="text-sm text-slate-400">Crear un nuevo equipo</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creando...' : 'Crear Equipo'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Información Básica */}
          <div className="bg-[#131921] rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4">Información Básica <span className="text-xs font-normal text-slate-400 ml-2">(<span className="text-red-500">*</span> obligatorio)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre del Equipo - Buscador */}
              <div className="md:col-span-2">
                <Label htmlFor="team_name" className="text-slate-300 mb-2 block">Nombre del Equipo <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="team_name"
                    value={formData.team_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, team_name: e.target.value }))
                      searchTeams(e.target.value)
                    }}
                    onFocus={() => {
                      if (formData.team_name && formData.team_name.length >= 2 && teamSearchResults.length > 0) {
                        setShowTeamResults(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clicks si fuera necesario
                      setTimeout(() => setShowTeamResults(false), 200)
                    }}
                    className="pl-10 bg-[#080F17] border-slate-700 text-white"
                    placeholder="Buscar o escribir nombre del equipo"
                  />
                  {searchingTeam && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Resultados de búsqueda de equipos - Solo para mostrar, no clickables */}
                {showTeamResults && teamSearchResults.length > 0 && (
                  <div className="mt-2 bg-slate-800 border border-yellow-600 rounded-lg max-h-48 overflow-y-auto">
                    <div className="p-2 bg-yellow-900/20 border-b border-yellow-600">
                      <p className="text-xs text-yellow-400">⚠️ Equipos existentes con nombre similar:</p>
                    </div>
                    {teamSearchResults.map((team) => (
                      <div
                        key={team.id_team}
                        className="p-3 border-b border-slate-700 last:border-b-0"
                      >
                        <p className="text-white font-medium">{team.team_name}</p>
                        <p className="text-sm text-slate-400">{team.competition} • {team.team_country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="correct_team_name" className="text-slate-300 mb-2 block">Nombre Correcto</Label>
                <Input
                  id="correct_team_name"
                  value={formData.correct_team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_team_name: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Real Madrid Club de Fútbol"/>
              </div>
              <div>
                <Label htmlFor="team_country" className="text-slate-300 mb-2 block">País</Label>
                <Input
                  id="team_country"
                  value={formData.team_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_country: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="España"/>
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="bg-[#131921] rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4">URLs</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="url_trfm_advisor" className="text-slate-300 mb-2 block">URL Transfermarkt Advisor</Label>
                <Input
                  id="url_trfm_advisor"
                  value={formData.url_trfm_advisor}
                  onChange={(e) => setFormData(prev => ({ ...prev, url_trfm_advisor: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="https://www.transfermarkt.es/real-madrid/startseite/verein/418"/>
              </div>
              <div>
                <Label htmlFor="url_trfm" className="text-slate-300 mb-2 block">URL Transfermarkt</Label>
                <Input
                  id="url_trfm"
                  value={formData.url_trfm}
                  onChange={(e) => setFormData(prev => ({ ...prev, url_trfm: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="https://www.transfermarkt.es/real-madrid/startseite/verein/418"/>
              </div>
            </div>
          </div>

          {/* Propietario */}
          <div className="bg-[#131921] rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4">Propietario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner_club" className="text-slate-300 mb-2 block">Club Propietario</Label>
                <Input
                  id="owner_club"
                  value={formData.owner_club}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_club: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Real Madrid CF"/>
              </div>
              <div>
                <Label htmlFor="owner_club_country" className="text-slate-300 mb-2 block">País del Propietario</Label>
                <Input
                  id="owner_club_country"
                  value={formData.owner_club_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_club_country: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="España"/>
              </div>
            </div>
          </div>

          {/* Competición */}
          <div className="bg-[#131921] rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4">Competición</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="competition" className="text-slate-300 mb-2 block">Competición</Label>
                <Input
                  id="competition"
                  value={formData.competition}
                  onChange={(e) => setFormData(prev => ({ ...prev, competition: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="LaLiga"/>
              </div>
              <div>
                <Label htmlFor="correct_competition" className="text-slate-300 mb-2 block">Competición Correcta</Label>
                <Input
                  id="correct_competition"
                  value={formData.correct_competition}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_competition: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Primera División de España"/>
              </div>
              <div>
                <Label htmlFor="competition_country" className="text-slate-300 mb-2 block">País de Competición</Label>
                <Input
                  id="competition_country"
                  value={formData.competition_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, competition_country: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="España"/>
              </div>
            </div>
          </div>

          {/* Valores y Rating */}
          <div className="bg-[#131921] rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4">Valores y Rating</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team_trfm_value" className="text-slate-300 mb-2 block">Valor Transfermarkt (€)</Label>
                <Input
                  id="team_trfm_value"
                  type="number"
                  value={formData.team_trfm_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_trfm_value: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="1000000000"/>
              </div>
              <div>
                <Label htmlFor="team_rating" className="text-slate-300 mb-2 block">Rating del Equipo</Label>
                <Input
                  id="team_rating"
                  type="number"
                  step="0.1"
                  value={formData.team_rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_rating: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="8.5"/>
              </div>
              <div>
                <Label htmlFor="team_elo" className="text-slate-300 mb-2 block">ELO del Equipo</Label>
                <Input
                  id="team_elo"
                  type="number"
                  value={formData.team_elo}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_elo: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="1850"/>
              </div>
              <div>
                <Label htmlFor="team_level" className="text-slate-300 mb-2 block">Nivel del Equipo</Label>
                <Input
                  id="team_level"
                  value={formData.team_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_level: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Elite"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
