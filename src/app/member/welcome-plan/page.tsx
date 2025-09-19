'use client'

import { CheckCircle, ArrowRight, Star, Crown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
export default function WelcomePlan() {
  const _router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  
  // Obtener plan de los parámetros de URL
  useEffect(() => {
    const planParam = searchParams.get('plan')
    setPlan(planParam)
  }, [searchParams])

  // Función para ir al dashboard
  const handleGoToDashboard = async () => {
    setIsLoading(true)
    
    try {
      // Primero, actualizar metadatos de suscripción (simular webhook)
      console.log('🔄 Actualizando metadatos de suscripción...')
      await updateSubscriptionMetadata()
      
      // Verificar el estado del perfil del usuario
      const response = await fetch('/api/user/profile-status')
      const data = await response.json()
      
      if (data.profileCompleted) {
        // Perfil completo, ir directamente al dashboard
        console.log('✅ Perfil completo, redirigiendo al dashboard')
        _router.push('/member/dashboard')
      } else {
        // Perfil incompleto, ir a completar perfil
        console.log('🔄 Perfil incompleto, redirigiendo a completar perfil')
        _router.push('/member/complete-profile-after-payment')
      }
    } catch (_error) {
      console.error('❌ Error verificando estado del perfil:', error)
      // En caso de error, ir a completar perfil por seguridad
      _router.push('/member/complete-profile-after-payment')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar metadatos de suscripción
  const updateSubscriptionMetadata = async () => {
    try {
      const response = await fetch('/api/user/update-clerk-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'member',
          profile: 'incomplete', // Mantener como está
          subscription: {
            plan: plan || 'premium',
            billing: 'monthly',
            status: 'active',
            customerId: 'cus_temp_' + Date.now(),
            subscriptionId: 'sub_temp_' + Date.now(),
            startDate: new Date().toISOString(),
            sessionId: 'cs_temp_' + Date.now(),
            manualUpdate: new Date().toISOString()
          }
        })
      })
      
      if (response.ok) {
        console.log('✅ Metadatos de suscripción actualizados correctamente')
      } else {
        console.error('❌ Error actualizando metadatos de suscripción:', await response.text())
      }
    } catch (_error) {
      console.error('❌ Error actualizando metadatos de suscripción:', error)
    }
  }

  // Obtener información del plan
  const getPlanInfo = (planType: string | null) => {
    switch (planType) {
      case 'premium':
        return {
          name: 'Premium',
          icon: Crown,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          features: [
            'Acceso completo a la base de datos de jugadores',
            'Análisis avanzado y estadísticas detalladas',
            'Herramientas de scouting profesionales',
            'Reportes personalizados',
            'Soporte prioritario 24/7'
          ]
        }
      case 'basic':
        return {
          name: 'Basic',
          icon: Star,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          features: [
            'Acceso a jugadores destacados',
            'Estadísticas básicas',
            'Herramientas de búsqueda',
            'Reportes estándar',
            'Soporte por email'
          ]
        }
      default:
        return {
          name: 'Plan',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          features: [
            'Acceso a la plataforma',
            'Herramientas de scouting',
            'Base de datos de jugadores'
          ]
        }
    }
  }

  const planInfo = getPlanInfo(plan)
  const IconComponent = planInfo.icon

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header de bienvenida */}
        <div className="text-center mb-12">
          <div className={`${planInfo.bgColor} ${planInfo.borderColor} rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2`}>
            <IconComponent className={`h-12 w-12 ${planInfo.color}`} />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido al Plan {planInfo.name}!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Tu suscripción ha sido activada exitosamente
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Pago procesado correctamente
              </span>
            </div>
          </div>
        </div>

        {/* Información del plan */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ¿Qué incluye tu Plan {planInfo.name}?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planInfo.features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos pasos */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Próximos pasos
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 rounded-full p-2 mr-4">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Completa tu perfil</h3>
                <p className="text-gray-600 text-sm">Añade tu información profesional para personalizar tu experiencia</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 rounded-full p-2 mr-4">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Explora la plataforma</h3>
                <p className="text-gray-600 text-sm">Descubre jugadores, crea reportes y utiliza las herramientas de scouting</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 rounded-full p-2 mr-4">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Comienza a scoutear</h3>
                <p className="text-gray-600 text-sm">Utiliza las herramientas avanzadas para encontrar el próximo talento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="text-center">
          <Button
            onClick={handleGoToDashboard}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando perfil...
              </div>
            ) : (
              <div className="flex items-center">
                Ir al Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Te redirigiremos automáticamente según el estado de tu perfil
          </p>
        </div>
      </div>
    </div>
  )
}
