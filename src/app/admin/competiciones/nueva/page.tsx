'use client'

import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Country {
  id: string
  name: string
  code: string
}

export default function NuevaCompeticionPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    country_id: '',
    tier: 1,
    confederation: '',
    season_format: ''
  })

  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear competición')
      }

      router.push('/admin/competiciones')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isLoaded) {
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
            Nueva Competición
          </h1>
          <p className="text-gray-400">
            Añade una nueva competición a la base de datos
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Información de la Competición</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="name" className="text-gray-300">
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

              {/* Nombre Corto */}
              <div>
                <Label htmlFor="short_name" className="text-gray-300">
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

              {/* País */}
              <div>
                <Label htmlFor="country_id" className="text-gray-300">
                  País <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country_id}
                  onValueChange={(value) => handleChange('country_id', value)}
                  required
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
                <Label htmlFor="tier" className="text-gray-300">
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
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <SelectItem key={tier} value={tier.toString()}>
                        Tier {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Confederación */}
              <div>
                <Label htmlFor="confederation" className="text-gray-300">
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
                    <SelectItem value="UEFA">UEFA</SelectItem>
                    <SelectItem value="CONMEBOL">CONMEBOL</SelectItem>
                    <SelectItem value="CONCACAF">CONCACAF</SelectItem>
                    <SelectItem value="AFC">AFC</SelectItem>
                    <SelectItem value="CAF">CAF</SelectItem>
                    <SelectItem value="OFC">OFC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Temporada */}
              <div>
                <Label htmlFor="season_format" className="text-gray-300">
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
                    <SelectItem value="League">Liga</SelectItem>
                    <SelectItem value="Cup">Copa</SelectItem>
                    <SelectItem value="Playoff">Playoff</SelectItem>
                  </SelectContent>
                </Select>
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
                  Guardar Competición
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
