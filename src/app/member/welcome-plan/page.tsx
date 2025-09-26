'use client'

import { useUser } from '@clerk/nextjs'
import { Check, Users, Target, BarChart3, Trophy, Zap, Shield, Headphones, ChevronRight, Crown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WelcomePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [step, setStep] = useState(3)
  const [profileCompleted, setProfileCompleted] = useState(false)

  useEffect(() => {
    const plan = searchParams.get('plan') || localStorage.getItem('selectedPlan') || 'member'
    const currentStep = parseInt(searchParams.get('step') || '3')
    const profile = searchParams.get('profile') === 'completed'
    
    setSelectedPlan(plan)
    setStep(currentStep)
    setProfileCompleted(profile)
  }, [searchParams])

  const handleConfirmRole = async () => {
    setIsLoading(true)
    
    try {
      // Obtener datos del perfil desde localStorage
      const profileStatus = localStorage.getItem('profileStatus') || 'incomplete'
      const profileData = localStorage.getItem('profileData')
      const profileSkippedAt = localStorage.getItem('profileSkippedAt')

      // Preparar metadatos (sin asignar rol hasta que el pago sea exitoso)
      const metadata: any = {
        profile: profileStatus,
        onboardingStep: 'payment', // Marcar que está en el paso de pago
        selectedPlan: selectedPlan
      }

      // Agregar datos del perfil si están disponibles
      if (profileStatus === 'completed' && profileData) {
        metadata.profileData = JSON.parse(profileData)
      } else if (profileStatus === 'incomplete' && profileSkippedAt) {
        metadata.profileSkippedAt = profileSkippedAt
      }

      // Actualizar metadatos del usuario usando la API
      try {
        const metadataResponse = await fetch('/api/update-user-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: {
              ...user?.publicMetadata,
              ...metadata
            }
          })
        })

        if (!metadataResponse.ok) {
          const errorData = await metadataResponse.json()
          console.error('Failed to update user metadata:', errorData)
        }
      } catch (error) {
        console.error('Error updating metadata:', error)
      }

      // Limpiar localStorage después de actualizar metadatos
      localStorage.removeItem('profileStatus')
      localStorage.removeItem('profileData')
      localStorage.removeItem('profileSkippedAt')

      // Crear sesión de checkout
      console.log('🔄 Iniciando creación de sesión de checkout...')
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan, // Usar el plan seleccionado
          billing: 'monthly'
        })
      })

      console.log('📡 Respuesta del checkout:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error en checkout:', errorData)
        alert(`Error al crear la sesión de pago: ${errorData.details || errorData.error}`)
        return
      }

      const responseData = await response.json()
      console.log('✅ Datos de respuesta del checkout:', responseData)
      
      if (responseData.url) {
        console.log('🔗 Redirigiendo a Stripe:', responseData.url)
        window.location.href = responseData.url
      } else {
        console.error('❌ No se recibió URL de checkout')
        alert('Error: No se pudo obtener la URL de pago')
      }
    } catch (error) {
      console.error('❌ Error general en handleConfirmRole:', error)
      alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = () => {
    // Volver a la landing page para seleccionar otro rol
    router.push('/')
  }

  const getPlanFeatures = (plan: string) => {
    const features = {
      member: [
        'Acceso completo a base de datos de jugadores',
        'Búsqueda avanzada y filtros',
        'Perfiles detallados de jugadores',
        'Comparaciones y análisis',
        'Estadísticas avanzadas',
        'Reportes personalizados',
        'Soporte prioritario 24/7',
        'Actualizaciones semanales'
      ],
      scout: [
        'Todo lo de Miembro',
        'Herramientas de scouting avanzadas',
        'Creación de reportes de jugadores',
        'Sistema de seguimiento de talentos',
        'Red de contactos con otros scouts',
        'Acceso a eventos y torneos',
        'Certificación profesional',
        'Mentorías y formación continua'
      ]
    }
    return features[plan as keyof typeof features] || features.member
  }

  const getPlanInfo = (plan: string) => {
    const info = {
      member: {
        name: 'Miembro',
        description: 'Para analistas y profesionales del fútbol',
        icon: BarChart3,
        color: 'from-blue-500 to-blue-600',
        popular: true
      },
      scout: {
        name: 'Scout',
        description: 'Para scouts profesionales',
        icon: Target,
        color: 'from-green-500 to-green-600',
        popular: false
      }
    }
    return info[plan as keyof typeof info] || info.member
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

  const planInfo = getPlanInfo(selectedPlan)
  const features = getPlanFeatures(selectedPlan)
  const IconComponent = planInfo.icon

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="ml-2 text-sm text-green-600 font-medium">Cuenta creada</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                profileCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {profileCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-gray-600 text-sm font-medium">2</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                profileCompleted ? 'text-green-600' : 'text-gray-600'
              }`}>
                {profileCompleted ? 'Perfil completado' : 'Perfil omitido'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">3</span>
              </div>
              <span className="ml-2 text-sm text-[#8c1a10] font-medium">Confirmar rol</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${planInfo.color} rounded-full mb-6`}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#000000] mb-4">
            ¡Casi terminamos!
          </h1>
          <p className="text-xl text-[#6d6d6d] mb-2">
            Confirma tu rol en la plataforma
          </p>
        </div>

        {/* Selected Plan Card */}
        <Card className="mb-8 relative overflow-hidden">
          {planInfo.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full border inline-flex items-center text-xs font-semibold">
                <Crown className="w-4 h-4 mr-1" />
                Más Popular
              </div>
            </div>
          )}
          
          <CardHeader className="text-center pb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${planInfo.color} rounded-full mb-4 mx-auto`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-[#000000] mb-2">
              {planInfo.name}
            </CardTitle>
            <p className="text-[#6d6d6d] text-lg">{planInfo.description}</p>
            <div className="mt-4">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-[#8c1a10]">$20</span>
                <span className="text-[#6d6d6d] ml-1">/mes</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                $17/mes si pagas anualmente (15% descuento)
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#6d6d6d]">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Has seleccionado el rol de {planInfo.name}
              </h3>
              <p className="text-blue-700 text-sm">
                Podrás cambiar tu rol más adelante desde la configuración de tu cuenta si lo necesitas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleChangeRole}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 px-8 py-3"
          >
            Cambiar rol
          </Button>
          
          <Button
            onClick={handleConfirmRole}
            disabled={isLoading}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white px-8 py-3"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                Proceder al pago ($20/mes)
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7]">
            <Headphones className="w-8 h-8 text-[#8c1a10] mx-auto mb-3" />
            <h3 className="font-semibold text-[#000000] mb-2">¿Tienes dudas?</h3>
            <p className="text-[#6d6d6d] text-sm mb-4">
              Nuestro equipo está aquí para ayudarte a elegir el rol que mejor se adapte a tus necesidades
            </p>
            <Button
              variant="outline"
              className="border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
            >
              Contactar Soporte
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}