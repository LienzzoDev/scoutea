'use client'

import { ArrowLeft, Save } from "lucide-react"
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CONFEDERATIONS, SEASON_FORMATS, COMPETITION_TIERS } from '@/constants/competition'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

interface Country {
  id: string
  name: string
  code: string
}

export default function EditarCompeticionPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const params = useParams()
  const competitionId = params.id as string

  const [formData, setFormData] = useState({
    // Campos principales
    name: '',
    correct_competition_name: '',
    short_name: '',
    competition_country: '',
    url_trfm: '',
    // Clasificación
    country_id: '',
    tier: 1,
    confederation: '',
    season_format: '',
    competition_level: '',
    // Valores y métricas
    competition_trfm_value: '',
    competition_trfm_value_norm: '',
    competition_rating: '',
    competition_rating_norm: '',
    competition_elo: ''
  })

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countries, setCountries] = useState<Country[]>([])

  // Cargar países
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/countries')
        if (response.ok) {
          const data = await response.json()
          setCountries(data.countries || [])
        }
      } catch (err) {
        console.error('Error loading countries:', err)
      }
    }
    if (isSignedIn) {
      loadCountries()
    }
  }, [isSignedIn])

  // Cargar datos de la competición
  useEffect(() => {
    const loadCompetition = async () => {
      if (!isSignedIn || !competitionId) return

      setLoadingData(true)
      try {
        const response = await fetch(`/api/competitions/${competitionId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (!response.ok) {
          throw new Error('Error al cargar competición')
        }

        const data = await response.json()
        setFormData({
          // Campos principales
          name: data.competition_name || data.name || '',
          correct_competition_name: data.correct_competition_name || '',
          short_name: data.short_name || '',
          competition_country: data.competition_country || '',
          url_trfm: data.url_trfm || '',
          // Clasificación
          country_id: data.country_id || '',
          tier: data.competition_tier || data.tier || 1,
          confederation: data.competition_confederation || data.confederation || '',
          season_format: data.season_format || '',
          competition_level: data.competition_level || '',
          // Valores y métricas
          competition_trfm_value: data.competition_trfm_value?.toString() || '',
          competition_trfm_value_norm: data.competition_trfm_value_norm?.toString() || '',
          competition_rating: data.competition_rating?.toString() || '',
          competition_rating_norm: data.competition_rating_norm?.toString() || '',
          competition_elo: data.competition_elo?.toString() || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoadingData(false)
      }
    }

    loadCompetition()
  }, [isSignedIn, competitionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar competición')
      }

      // Navegar y refrescar datos
      router.push('/admin/competiciones')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isLoaded || loadingData) {
    return <LoadingPage />
  }

  if (!isSignedIn) {
    router.replace('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-[#080F17] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-[#D6DDE6] mb-2">
            Editar Competición
          </h1>
          <p className="text-gray-400">
            Modifica la información de la competición
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Principal */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Información Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <Label htmlFor="name" className="text-gray-300 mb-2 block">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: Premier League"
                    required
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* Nombre Corregido */}
                <div>
                  <Label htmlFor="correct_competition_name" className="text-gray-300 mb-2 block">
                    Nombre Corregido
                  </Label>
                  <Input
                    id="correct_competition_name"
                    value={formData.correct_competition_name}
                    onChange={(e) => handleChange('correct_competition_name', e.target.value)}
                    placeholder="Ej: English Premier League"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* Nombre Corto */}
                <div>
                  <Label htmlFor="short_name" className="text-gray-300 mb-2 block">
                    Nombre Corto
                  </Label>
                  <Input
                    id="short_name"
                    value={formData.short_name}
                    onChange={(e) => handleChange('short_name', e.target.value)}
                    placeholder="Ej: EPL"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* País de la Competición */}
                <div>
                  <Label htmlFor="competition_country" className="text-gray-300 mb-2 block">
                    País de la Competición
                  </Label>
                  <Input
                    id="competition_country"
                    value={formData.competition_country}
                    onChange={(e) => handleChange('competition_country', e.target.value)}
                    placeholder="Ej: England"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* URL Transfermarkt */}
              <div>
                <Label htmlFor="url_trfm" className="text-gray-300 mb-2 block">
                  URL Transfermarkt
                </Label>
                <Input
                  id="url_trfm"
                  value={formData.url_trfm}
                  onChange={(e) => handleChange('url_trfm', e.target.value)}
                  placeholder="Ej: https://www.transfermarkt.com/..."
                  className="bg-[#1F2937] border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* País (relación) */}
                <div>
                  <Label htmlFor="country_id" className="text-gray-300 mb-2 block">
                    País (Relación)
                  </Label>
                  <Select
                    value={formData.country_id}
                    onValueChange={(value) => handleChange('country_id', value)}
                  >
                    <SelectTrigger className="w-full bg-[#1F2937] border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tier */}
                <div>
                  <Label htmlFor="tier" className="text-gray-300 mb-2 block">
                    Tier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tier.toString()}
                    onValueChange={(value) => handleChange('tier', parseInt(value))}
                    required
                  >
                    <SelectTrigger className="w-full bg-[#1F2937] border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona el tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPETITION_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier.toString()}>
                          Tier {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confederación */}
                <div>
                  <Label htmlFor="confederation" className="text-gray-300 mb-2 block">
                    Confederación
                  </Label>
                  <Select
                    value={formData.confederation}
                    onValueChange={(value) => handleChange('confederation', value)}
                  >
                    <SelectTrigger className="w-full bg-[#1F2937] border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona una confederación" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFEDERATIONS.map((conf) => (
                        <SelectItem key={conf.value} value={conf.value}>
                          {conf.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Formato de Temporada */}
                <div>
                  <Label htmlFor="season_format" className="text-gray-300 mb-2 block">
                    Formato de Temporada
                  </Label>
                  <Select
                    value={formData.season_format}
                    onValueChange={(value) => handleChange('season_format', value)}
                  >
                    <SelectTrigger className="w-full bg-[#1F2937] border-slate-600 text-white">
                      <SelectValue placeholder="Selecciona el formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASON_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nivel */}
                <div>
                  <Label htmlFor="competition_level" className="text-gray-300 mb-2 block">
                    Nivel
                  </Label>
                  <Input
                    id="competition_level"
                    value={formData.competition_level}
                    onChange={(e) => handleChange('competition_level', e.target.value)}
                    placeholder="Ej: Elite, Top, Medium"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores y Métricas */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Valores y Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Valor Transfermarkt */}
                <div>
                  <Label htmlFor="competition_trfm_value" className="text-gray-300 mb-2 block">
                    Valor Transfermarkt
                  </Label>
                  <Input
                    id="competition_trfm_value"
                    type="number"
                    step="0.01"
                    value={formData.competition_trfm_value}
                    onChange={(e) => handleChange('competition_trfm_value', e.target.value)}
                    placeholder="Ej: 1000000000"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* Valor TM Normalizado */}
                <div>
                  <Label htmlFor="competition_trfm_value_norm" className="text-gray-300 mb-2 block">
                    Valor TM Normalizado
                  </Label>
                  <Input
                    id="competition_trfm_value_norm"
                    type="number"
                    step="0.01"
                    value={formData.competition_trfm_value_norm}
                    onChange={(e) => handleChange('competition_trfm_value_norm', e.target.value)}
                    placeholder="Ej: 0.95"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label htmlFor="competition_rating" className="text-gray-300 mb-2 block">
                    Rating
                  </Label>
                  <Input
                    id="competition_rating"
                    type="number"
                    step="0.1"
                    value={formData.competition_rating}
                    onChange={(e) => handleChange('competition_rating', e.target.value)}
                    placeholder="Ej: 85.5"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* Rating Normalizado */}
                <div>
                  <Label htmlFor="competition_rating_norm" className="text-gray-300 mb-2 block">
                    Rating Normalizado
                  </Label>
                  <Input
                    id="competition_rating_norm"
                    type="number"
                    step="0.01"
                    value={formData.competition_rating_norm}
                    onChange={(e) => handleChange('competition_rating_norm', e.target.value)}
                    placeholder="Ej: 0.92"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>

                {/* ELO */}
                <div>
                  <Label htmlFor="competition_elo" className="text-gray-300 mb-2 block">
                    ELO
                  </Label>
                  <Input
                    id="competition_elo"
                    type="number"
                    step="1"
                    value={formData.competition_elo}
                    onChange={(e) => handleChange('competition_elo', e.target.value)}
                    placeholder="Ej: 1850"
                    className="bg-[#1F2937] border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#8C1A10] hover:bg-[#7A1610] text-white"
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
