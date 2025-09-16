'use client'

import { CheckCircle, User, Phone, Briefcase, Star, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CompleteProfileAfterPayment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    dateOfBirth: '',
    location: '',
    bio: '',
    experience: '',
    specialization: '',
    languages: '',
    phone: '',
    company: '',
    position: ''
  })

  // Obtener plan del pago
  const plan = searchParams.get('plan')

  // Manejar cambios en los inputs
  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!profileData.firstName || !profileData.lastName || !profileData.nationality || 
          !profileData.bio || !profileData.experience || !profileData.specialization) {
        setError('Por favor, completa todos los campos requeridos')
        return
      }

      // Preparar datos para envío, convirtiendo languages a array
      const dataToSend = {
        ...profileData,
        languages: profileData.languages 
          ? profileData.languages.split(',').map(lang => lang.trim()).filter(lang => lang.length > 0)
          : []
      }

      // Actualizar perfil en la base de datos
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        setSuccess(true)
        console.log('✅ Perfil completado exitosamente')
        
        // Esperar un poco más para que los metadatos de Clerk se actualicen
        setTimeout(async () => {
          console.log('🔄 Redirigiendo al dashboard...')
          
          // Forzar una recarga de la página para asegurar que los metadatos se actualicen
          window.location.href = '/member/dashboard'
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al completar el perfil')
      }
    } catch (error) {
      console.error('Error completando perfil:', error)
      setError('Error al completar el perfil. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Omitir perfil (marcar como completado sin datos)
  const handleSkip = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Solo actualizar metadatos para marcar perfil como completado
      const response = await fetch('/api/user/update-clerk-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'member',
          profile: 'completed'
        })
      })

      if (response.ok) {
        setSuccess(true)
        console.log('✅ Perfil marcado como completado (omitido)')
        
        // Esperar un poco más para que los metadatos de Clerk se actualicen
        setTimeout(() => {
          console.log('🔄 Redirigiendo al dashboard...')
          
          // Forzar una recarga de la página para asegurar que los metadatos se actualicen
          window.location.href = '/member/dashboard'
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar el perfil')
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      setError('Error al actualizar el perfil. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-50">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="relative">
              <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center animate-pulse">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Perfil completado exitosamente!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tu perfil ha sido actualizado. Redirigiendo al dashboard...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              <span className="text-green-600 font-medium">Procesando...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header mejorado */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
                <div className="bg-gradient-to-r from-red-200 to-red-300 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ¡Pago completado exitosamente!
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-900">
                Plan {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Premium'} activado
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Tu suscripción está activa y lista para usar
            </p>
          </div>
          
          <p className="text-xl text-gray-600 mb-8">
            Ahora completa tu perfil para acceder a todas las funcionalidades
          </p>
        </div>

        {/* Formulario mejorado */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información personal */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Información Personal
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Tu nombre"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Tu apellido"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-sm font-medium text-gray-700">Nacionalidad *</Label>
                  <Input
                    id="nationality"
                    value={profileData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    placeholder="Ej: Española"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Fecha de nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Ubicación</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ciudad, País"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Información profesional */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className="bg-green-100 rounded-full p-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Información Profesional
                </h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Biografía *</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Cuéntanos sobre ti y tu experiencia en el fútbol"
                  rows={3}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium text-gray-700">Años de experiencia *</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profileData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="5"
                    min="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">Especialización *</Label>
                  <Input
                    id="specialization"
                    value={profileData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    placeholder="Ej: Scouting, Análisis de datos"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages" className="text-sm font-medium text-gray-700">Idiomas</Label>
                <Input
                  id="languages"
                  value={profileData.languages}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  placeholder="Español, Inglés, Francés"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className="bg-purple-100 rounded-full p-2">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Información de Contacto
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+34 123 456 789"
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">Empresa/Club</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Nombre de tu empresa o club"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-gray-700">Posición/Cargo</Label>
                <Input
                  id="position"
                  value={profileData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Ej: Scout, Analista, Director deportivo"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Error message mejorado */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <div className="bg-red-100 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Botones mejorados */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Completando perfil...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Completar perfil</span>
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Omitir por ahora</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
