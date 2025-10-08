'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowRight, User, MapPin, Calendar, Globe, ChevronRight } from 'lucide-react'
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
    email: '',
    address: '',
    city: '',
    country: ''
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
        email: user.primaryEmailAddress?.emailAddress || '',
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

        // Guardar el perfil en la base de datos a través de la API
        const response = await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            country: formData.country
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error saving profile to database:', errorData)
          throw new Error(errorData.error || 'Failed to save profile')
        }

        const result = await response.json()
        console.log('Profile saved successfully:', result)

        // Guardar estado en localStorage como respaldo
        localStorage.setItem('profileStatus', 'completed')
      }

      // Ir al paso 3 (confirmar rol)
      router.push(`/member/welcome-plan?plan=${selectedPlan}&step=3&profile=completed`)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Hubo un error al guardar tu perfil. Por favor, inténtalo de nuevo.')
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
          <CardContent className="space-y-4">
            {/* Name and Surname */}
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

            {/* Date of Birth */}
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

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-[#2e3138] font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                className="mt-1"
                disabled
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-[#2e3138] font-medium">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Calle, número, piso, etc."
                className="mt-1"
              />
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-[#2e3138] font-medium">
                  Ciudad
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Tu ciudad"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-[#2e3138] font-medium">
                  <Globe className="w-4 h-4 inline mr-1" />
                  País
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Tu país"
                  className="mt-1"
                />
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