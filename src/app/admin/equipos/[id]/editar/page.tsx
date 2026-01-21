'use client'

import { ChevronLeft, Settings, Save, ArrowLeft, Globe } from "lucide-react"
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useTeams, Team } from '@/hooks/team/useTeams'
import { useToast } from '@/hooks/use-toast'

export default function EditarEquipoPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const params = useParams()
  const { getTeam, loading } = useTeams()
  const { toast } = useToast()

  const [team, setTeam] = useState<Team | null>(null)
  const [isScraping, setIsScraping] = useState(false)
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

  // Cargar datos del equipo
  useEffect(() => {
    const loadTeam = async () => {
      if (params.id && typeof params.id === 'string') {
        const teamData = await getTeam(params.id)
        if (teamData) {
          setTeam(teamData)
          setFormData({
            // Información Básica
            team_name: teamData.team_name || '',
            correct_team_name: teamData.correct_team_name || '',
            team_country: teamData.team_country || '',

            // URLs
            url_trfm_advisor: teamData.url_trfm_advisor || '',
            url_trfm: teamData.url_trfm || '',

            // Propietario
            owner_club: teamData.owner_club || '',
            owner_club_country: teamData.owner_club_country || '',

            // Competición
            competition: teamData.competition || '',
            correct_competition: teamData.correct_competition || '',
            competition_country: teamData.competition_country || '',

            // Valores y Rating
            team_trfm_value: teamData.team_trfm_value?.toString() || '',
            team_rating: teamData.team_rating?.toString() || '',
            team_elo: teamData.team_elo?.toString() || '',
            team_level: teamData.team_level || ''
          })
        }
      }
    }
    loadTeam()
  }, [params.id, getTeam])

  // Función para hacer scraping
  const handleScraping = async () => {
    if (!team) return
    try {
      setIsScraping(true)
      const response = await fetch(`/api/teams/${team.id_team}/scrape`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const scrapedData = result.data
          setFormData(prev => ({
            ...prev,
            url_trfm_advisor: scrapedData.url_trfm_advisor || prev.url_trfm_advisor,
            team_name: scrapedData.team_name || prev.team_name,
            correct_team_name: scrapedData.correct_team_name || prev.correct_team_name,
            team_country: scrapedData.team_country || prev.team_country,
            competition: scrapedData.competition || prev.competition,
            competition_country: scrapedData.competition_country || prev.competition_country,
            team_trfm_value: scrapedData.team_trfm_value ? scrapedData.team_trfm_value.toString() : prev.team_trfm_value,
            team_rating: scrapedData.team_rating ? scrapedData.team_rating.toString() : prev.team_rating,
            team_elo: scrapedData.team_elo ? scrapedData.team_elo.toString() : prev.team_elo,
            team_level: scrapedData.team_level || prev.team_level
          }))
          toast({ title: 'Scraping completado', description: 'Los datos se han cargado en el formulario.' })
        } else {
          toast({ title: 'Error en scraping', description: result.error, variant: 'destructive' })
        }
      } else {
        toast({ title: 'Error al realizar scraping', variant: 'destructive' })
      }
    } catch (_error) {
      toast({ title: 'Error al realizar scraping', variant: 'destructive' })
    } finally {
      setIsScraping(false)
    }
  }

  // Función para guardar cambios
  const handleSave = async () => {
    if (!team) return
    
    try {
      const updateData = {
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

      const response = await fetch(`/api/teams/${team.id_team}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast({ title: 'Equipo actualizado', description: 'Los cambios se han guardado correctamente.' })
        router.push('/admin/equipos')
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({ title: 'Error al actualizar', description: errorData.error || 'Error desconocido', variant: 'destructive' })
      }
    } catch (_error) {
      console.error('Error al guardar:', _error)
      toast({ title: 'Error al guardar', description: 'No se pudieron guardar los cambios', variant: 'destructive' })
    }
  }

  // Si no está cargado, mostrar loading
  if (!isLoaded || loading) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  // Si no hay equipo, mostrar error
  if (!team) {
    return (
      <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#D6DDE6] mb-4">Equipo no encontrado</h1>
          <Button onClick={() => router.push('/admin/equipos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a equipos
          </Button>
        </div>
      </div>
    )
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
                onClick={() =>router.push('/admin/equipos')}
                className="text-slate-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={team.logo_url || "/placeholder.svg"} />
                  <AvatarFallback>{team.team_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-semibold text-[#D6DDE6]">{team.team_name}</h1>
                  <p className="text-sm text-slate-400">Editar equipo</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleScraping}
                disabled={isScraping}
                className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isScraping ? 'Scraping...' : 'Hacer Scraping'}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
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
            <h2 className="text-lg font-semibold text-[#D6DDE6] mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team_name" className="text-slate-300">Nombre del Equipo *</Label>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Real Madrid CF"/>
              </div>
              <div>
                <Label htmlFor="correct_team_name" className="text-slate-300">Nombre Correcto</Label>
                <Input
                  id="correct_team_name"
                  value={formData.correct_team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_team_name: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Real Madrid Club de Fútbol"/>
              </div>
              <div>
                <Label htmlFor="team_country" className="text-slate-300">País</Label>
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
                <Label htmlFor="url_trfm_advisor" className="text-slate-300">URL Transfermarkt Advisor</Label>
                <Input
                  id="url_trfm_advisor"
                  value={formData.url_trfm_advisor}
                  onChange={(e) => setFormData(prev => ({ ...prev, url_trfm_advisor: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="https://www.transfermarkt.es/real-madrid/startseite/verein/418"/>
              </div>
              <div>
                <Label htmlFor="url_trfm" className="text-slate-300">URL Transfermarkt</Label>
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
                <Label htmlFor="owner_club" className="text-slate-300">Club Propietario</Label>
                <Input
                  id="owner_club"
                  value={formData.owner_club}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_club: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Real Madrid CF"/>
              </div>
              <div>
                <Label htmlFor="owner_club_country" className="text-slate-300">País del Propietario</Label>
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
                <Label htmlFor="competition" className="text-slate-300">Competición</Label>
                <Input
                  id="competition"
                  value={formData.competition}
                  onChange={(e) => setFormData(prev => ({ ...prev, competition: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="LaLiga"/>
              </div>
              <div>
                <Label htmlFor="correct_competition" className="text-slate-300">Competición Correcta</Label>
                <Input
                  id="correct_competition"
                  value={formData.correct_competition}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_competition: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="Primera División de España"/>
              </div>
              <div>
                <Label htmlFor="competition_country" className="text-slate-300">País de Competición</Label>
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
                <Label htmlFor="team_trfm_value" className="text-slate-300">Valor Transfermarkt (€)</Label>
                <Input
                  id="team_trfm_value"
                  type="number"
                  value={formData.team_trfm_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_trfm_value: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="1000000000"/>
              </div>
              <div>
                <Label htmlFor="team_rating" className="text-slate-300">Rating del Equipo</Label>
                <Input
                  id="team_rating"
                  type="number"
                  step="0.1"
                  value={formData.team_rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_rating: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="8.5"/>
              </div>
              <div>
                <Label htmlFor="team_elo" className="text-slate-300">ELO del Equipo</Label>
                <Input
                  id="team_elo"
                  type="number"
                  value={formData.team_elo}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_elo: e.target.value }))}
                  className="bg-[#080F17] border-slate-700 text-white" placeholder="1850"/>
              </div>
              <div>
                <Label htmlFor="team_level" className="text-slate-300">Nivel del Equipo</Label>
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
