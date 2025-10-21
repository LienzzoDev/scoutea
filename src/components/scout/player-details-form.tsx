"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { TeamSearch } from "@/components/scout/team-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function PlayerDetailsForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (field: 'day' | 'month' | 'year', value: string) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: {
        ...prev.dateOfBirth,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos requeridos
    if (!formData.playerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del jugador es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year) {
      toast({
        title: "Error",
        description: "La fecha de nacimiento es requerida",
        variant: "destructive"
      })
      return
    }

    if (!formData.team.trim()) {
      toast({
        title: "Error",
        description: "El equipo es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.nationality1) {
      toast({
        title: "Error",
        description: "La nacionalidad es requerida",
        variant: "destructive"
      })
      return
    }

    if (!formData.urlReference.trim()) {
      toast({
        title: "Error",
        description: "La URL de referencia es requerida",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Construir fecha de nacimiento
      const dateOfBirth = `${formData.dateOfBirth.year}-${formData.dateOfBirth.month.padStart(2, '0')}-${formData.dateOfBirth.day.padStart(2, '0')}`

      const payload = {
        playerName: formData.playerName,
        dateOfBirth,
        position: formData.position || null,
        height: formData.height || null,
        foot: formData.foot || null,
        team: formData.team,
        teamCountry: formData.teamCountry || null,
        nationality1: formData.nationality1,
        nationality2: formData.nationality2 || null,
        nationalTier: formData.nationalTier || null,
        agency: formData.agency || null,
        urlReference: formData.urlReference
      }

      console.log('Sending payload:', payload)

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
          description: result.message || "Jugador añadido correctamente. Pendiente de aprobación del administrador.",
        })

        // Redirigir a la página de jugadores del scout
        router.push('/scout/players')
      } else {
        console.error('API Error:', result)
        throw new Error(result.details || result.error || 'Error al añadir el jugador')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al añadir el jugador",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-border bg-card p-8">
      <div className="max-w-2xl mx-auto">
        {/* Player Information */}
        <div className="space-y-5">
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="player-name" className="text-sm font-medium text-foreground">
              *Player name
            </Label>
            <Input
              id="player-name"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter player name"
              required
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
                value={formData.dateOfBirth.day}
                onChange={(e) => handleDateChange('day', e.target.value)}
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                min="1"
                max="31"
                required
              />
              <span className="flex items-center text-muted-foreground">/</span>
              <Input
                id="date-of-birth-month"
                type="number"
                placeholder="MM"
                value={formData.dateOfBirth.month}
                onChange={(e) => handleDateChange('month', e.target.value)}
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                min="1"
                max="12"
                required
              />
              <span className="flex items-center text-muted-foreground">/</span>
              <Input
                id="date-of-birth-year"
                type="number"
                placeholder="YYYY"
                value={formData.dateOfBirth.year}
                onChange={(e) => handleDateChange('year', e.target.value)}
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-center text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                min="1950"
                max="2020"
                required
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium text-foreground">
              Position
            </Label>
            <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
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

          {/* Height */}
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium text-foreground">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="Enter height (cm)"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Foot */}
          <div className="space-y-2">
            <Label htmlFor="foot" className="text-sm font-medium text-foreground">
              Foot
            </Label>
            <Select value={formData.foot} onValueChange={(value) => handleInputChange('foot', value)}>
              <SelectTrigger
                id="foot"
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground focus:ring-2 focus:ring-ring"
              >
                <SelectValue placeholder="Select preferred foot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label htmlFor="team" className="text-sm font-medium text-foreground">
              *Team
            </Label>
            <TeamSearch
              value={formData.team}
              onChange={(teamName, teamCountry) => {
                handleInputChange('team', teamName)
                if (teamCountry) {
                  handleInputChange('teamCountry', teamCountry)
                }
              }}
              placeholder="Search team..."
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Team Country */}
          <div className="space-y-2">
            <Label htmlFor="team-country" className="text-sm font-medium text-foreground">
              Team country
            </Label>
            <Input
              id="team-country"
              placeholder="Auto-filled from team"
              value={formData.teamCountry}
              onChange={(e) => handleInputChange('teamCountry', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Nationality 1 */}
          <div className="space-y-2">
            <Label htmlFor="nationality-1" className="text-sm font-medium text-foreground">
              *Nationality 1
            </Label>
            <Select value={formData.nationality1} onValueChange={(value) => handleInputChange('nationality1', value)}>
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

          {/* Nationality 2 */}
          <div className="space-y-2">
            <Label htmlFor="nationality-2" className="text-sm font-medium text-foreground">
              Nationality 2
            </Label>
            <Select value={formData.nationality2 || undefined} onValueChange={(value) => handleInputChange('nationality2', value)}>
              <SelectTrigger
                id="nationality-2"
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

          {/* National Tier */}
          <div className="space-y-2">
            <Label htmlFor="national-tier" className="text-sm font-medium text-foreground">
              National tier
            </Label>
            <Select value={formData.nationalTier} onValueChange={(value) => handleInputChange('nationalTier', value)}>
              <SelectTrigger
                id="national-tier"
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground focus:ring-2 focus:ring-ring"
              >
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="senior">Senior Team</SelectItem>
                <SelectItem value="u21">U21</SelectItem>
                <SelectItem value="u19">U19</SelectItem>
                <SelectItem value="u17">U17</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agency */}
          <div className="space-y-2">
            <Label htmlFor="agency" className="text-sm font-medium text-foreground">
              Agency
            </Label>
            <Input
              id="agency"
              placeholder="Enter agency name"
              value={formData.agency}
              onChange={(e) => handleInputChange('agency', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
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
              value={formData.urlReference}
              onChange={(e) => handleInputChange('urlReference', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-14 w-full rounded-lg bg-[#8B0000] text-base font-semibold text-white hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'AÑADIENDO...' : 'AÑADIR JUGADOR'}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            El jugador será enviado para aprobación del administrador
          </p>
        </div>
      </div>
    </form>
  )
}