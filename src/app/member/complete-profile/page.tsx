'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowRight, User, Calendar, Globe, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    city: '',
    country: ''
  })

  // Timeout para detectar cuando Clerk se queda cargando indefinidamente
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    // Debug: Log estado de carga
    console.log('🔍 Complete Profile - isLoaded:', isLoaded, 'user:', user ? 'presente' : 'null')

    // Si después de 8 segundos aún no carga, mostrar opción de recarga
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.error('❌ Clerk tardó más de 8 segundos en cargar')
        setLoadingTimeout(true)
      }
    }, 8000)

    return () => clearTimeout(timeout)
  }, [isLoaded])

  useEffect(() => {
    // ✅ FALLBACK: Verificar si el usuario ya tiene suscripción activa
    // Esto previene loops de redirección después del pago
    if (user?.publicMetadata) {
      const metadata = user.publicMetadata as any
      if (metadata?.subscription?.status === 'active') {
        console.log('✅ Usuario ya tiene suscripción activa, redirigiendo al dashboard')
        const role = metadata.role || 'member'
        const dashboardUrl = role === 'scout' ? '/scout/dashboard' : '/member/dashboard'
        router.push(dashboardUrl)
        return
      }
    }

    // Obtener el plan seleccionado desde la URL
    const plan = searchParams.get('plan') || localStorage.getItem('selectedPlan') || ''
    console.log('🔍 Plan detectado:', plan || 'NINGUNO')
    setSelectedPlan(plan)

    // Pre-llenar con datos de Clerk si están disponibles
    if (user) {
      console.log('✅ Usuario cargado:', user.id, user.primaryEmailAddress?.emailAddress)
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      }))
    }
  }, [user, searchParams, isLoaded, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkip = async () => {
    console.log('🔄 handleSkip - Plan seleccionado:', selectedPlan)

    if (!selectedPlan) {
      alert('Por favor, selecciona un plan primero.')
      router.push('/')
      return
    }

    setIsLoading(true)

    try {
      // Guardar en localStorage que el perfil fue omitido
      localStorage.setItem('profileStatus', 'incomplete')

      console.log('📤 Enviando solicitud a create-checkout-session con plan:', selectedPlan)

      // Crear sesión de checkout directamente
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: 'monthly'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error creating checkout session:', errorData)
        alert(`Error al crear la sesión de pago: ${errorData.details || errorData.error}`)
        return
      }

      const responseData = await response.json()

      if (responseData.url) {
        window.location.href = responseData.url
      } else {
        alert('Error: No se pudo obtener la URL de pago')
      }
    } catch (error) {
      console.error('Error in handleSkip:', error)
      alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)

    try {
      // Guardar el perfil en la base de datos a través de la API
      if (user) {
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
            city: formData.city,
            country: formData.country
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error saving profile to database:', errorData)
          // No lanzar error, continuar con el flujo de pago
          console.warn('Continuando sin guardar perfil en base de datos')
        } else {
          const result = await response.json()
          console.log('Profile saved successfully:', result)
        }

        // Guardar estado en localStorage como respaldo
        localStorage.setItem('profileStatus', 'completed')
      }

      // Crear sesión de checkout directamente
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: 'monthly'
        })
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        console.error('Error creating checkout session:', errorData)
        alert(`Error al crear la sesión de pago: ${errorData.details || errorData.error}`)
        return
      }

      const checkoutData = await checkoutResponse.json()

      if (checkoutData.url) {
        window.location.href = checkoutData.url
      } else {
        alert('Error: No se pudo obtener la URL de pago')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Hubo un error al guardar tu perfil. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    console.log('⏳ Esperando a que Clerk cargue...')
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d] mb-2">Cargando tu perfil...</p>
          {loadingTimeout ? (
            <div className="mt-4">
              <p className="text-sm text-red-600 mb-2">
                La carga está tomando más tiempo del esperado.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
              >
                Recargar página
              </Button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Si esta pantalla permanece por más de 10 segundos, por favor recarga la página.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar, redirigir a registro
  if (!user) {
    console.log('❌ No hay usuario autenticado, redirigiendo a registro')
    router.push('/register')
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Redirigiendo a registro...</p>
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
              <span className="ml-2 text-sm text-gray-600">Realizar Pago</span>
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