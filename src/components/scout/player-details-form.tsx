"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MediaUpload } from "@/components/scout/media-upload"

export function PlayerDetailsForm() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [potential, setPotential] = useState(0)
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
    urlReference: '',
    reportText: '',
    urlReport: '',
    urlVideo: '',
    imageUrl: ''
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
      // Construir fecha de nacimiento
      const dateOfBirth = `${formData.dateOfBirth.year}-${formData.dateOfBirth.month.padStart(2, '0')}-${formData.dateOfBirth.day.padStart(2, '0')}`

      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          urlReference: formData.urlReference,
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
        
        // Redirigir a la página de jugadores
        router.push('/scout/players')
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

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-border bg-card p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Left Column - Player Information */}
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
            <Input
              id="team"
              placeholder="Enter team name"
              value={formData.team}
              onChange={(e) => handleInputChange('team', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          {/* Team Country */}
          <div className="space-y-2">
            <Label htmlFor="team-country" className="text-sm font-medium text-foreground">
              Team country
            </Label>
            <Select value={formData.teamCountry} onValueChange={(value) => handleInputChange('teamCountry', value)}>
              <SelectTrigger
                id="team-country"
                className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground focus:ring-2 focus:ring-ring"
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spain">Spain</SelectItem>
                <SelectItem value="england">England</SelectItem>
                <SelectItem value="germany">Germany</SelectItem>
                <SelectItem value="italy">Italy</SelectItem>
                <SelectItem value="france">France</SelectItem>
              </SelectContent>
            </Select>
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
            <Input
              id="url-report"
              type="url"
              placeholder="https://example.com/report"
              value={formData.urlReport}
              onChange={(e) => handleInputChange('urlReport', e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
              disabled={isSubmitting}
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