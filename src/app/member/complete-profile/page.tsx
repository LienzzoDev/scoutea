'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowRight, User, MapPin, Calendar, Globe, Briefcase, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompleteProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    location: '',
    bio: '',
    experience: '',
    specialization: '',
    languages: '',
    website: '',
    linkedin: '',
    twitter: ''
  })

  useEffect(() => {
    // Obtener el plan seleccionado desde la URL
    const plan = searchParams.get('plan') || localStorage.getItem('selectedPlan') || ''
    setSelectedPlan(plan)

    // Pre-llenar con datos de Clerk si están disponibles
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }))
    }
  }, [user, searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkip = () => {
    // Guardar en localStorage que el perfil fue omitido
    localStorage.setItem('profileStatus', 'incomplete')
    localStorage.setItem('profileSkippedAt', new Date().toISOString())
    
    // Ir directamente al paso 3 (confirmar rol)
    router.push(`/member/welcome-plan?plan=${selectedPlan}&step=3&profile=skipped`)
  }

  const handleContinue = async () => {
    setIsLoading(true)
    
    try {
      // Actualizar metadatos del usuario en Clerk
      if (user) {
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        })

        // Guardar datos del perfil en localStorage temporalmente
        localStorage.setItem('profileStatus', 'completed')
        localStorage.setItem('profileData', JSON.stringify({
          dateOfBirth: formData.dateOfBirth,
          nationality: formData.nationality,
          location: formData.location,
          bio: formData.bio,
          experience: formData.experience,
          specialization: formData.specialization,
          languages: formData.languages.split(',').map(lang => lang.trim()),
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          completedAt: new Date().toISOString()
        }))
      }

      // Ir al paso 3 (confirmar rol)
      router.push(`/member/welcome-plan?plan=${selectedPlan}&step=3&profile=completed`)
    } catch (error) {
      console.error('Error updating profile:', error)
      // Continuar al siguiente paso aunque haya error
      router.push(`/member/welcome-plan?plan=${selectedPlan}&step=3`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">1</span>
              </div>
              <span className="ml-2 text-sm text-green-600 font-medium">Cuenta creada</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">2</span>
              </div>
              <span className="ml-2 text-sm text-[#8c1a10] font-medium">Completar perfil</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">3</span>
              </div>
              <span className="ml-2 text-sm text-gray-600">Confirmar rol</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-2">
            Completa tu perfil
          </h1>
          <p className="text-lg text-[#6d6d6d]">
            Ayúdanos a personalizar tu experiencia (opcional)
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#000000]">
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#2e3138] font-medium">
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#2e3138] font-medium">
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Tu apellido"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth" className="text-[#2e3138] font-medium">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de nacimiento
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nationality" className="text-[#2e3138] font-medium">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Nacionalidad
                </Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Ej: España, México, Argentina"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-[#2e3138] font-medium">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ciudad, País"
                className="mt-1"
              />
            </div>

            {/* Professional Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#000000] mb-4">
                <Briefcase className="w-5 h-5 inline mr-2" />
                Información profesional
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="experience" className="text-[#2e3138] font-medium">
                    Años de experiencia
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="Ej: 5"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="specialization" className="text-[#2e3138] font-medium">
                    Especialización
                  </Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    placeholder="Ej: Análisis táctico, Scouting juvenil, Datos estadísticos"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="languages" className="text-[#2e3138] font-medium">
                    Idiomas (separados por comas)
                  </Label>
                  <Input
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    placeholder="Ej: Español, Inglés, Francés"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-[#2e3138] font-medium">
                    Biografía breve
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Cuéntanos un poco sobre ti y tu experiencia en el fútbol..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#000000] mb-4">
                Enlaces sociales (opcional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website" className="text-[#2e3138] font-medium">
                    Sitio web
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://tu-sitio-web.com"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin" className="text-[#2e3138] font-medium">
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="tu-perfil-linkedin"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter" className="text-[#2e3138] font-medium">
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="@tu_usuario"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handleSkip}
            disabled={isLoading}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Omitir por ahora'
            )}
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}