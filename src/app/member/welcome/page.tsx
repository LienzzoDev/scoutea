'use client'

import { useUser } from '@clerk/nextjs'
import { Check, Star, Zap, Users, BarChart3, Shield, Globe, Headphones, Trophy, Target, TrendingUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


export default function WelcomePage() {
  const _router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Obtener el plan de suscripción desde los metadatos del usuario o URL params
    if (user) {
      const metadata = user.publicMetadata as any
      const _subscription = metadata?.subscription
      const planFromUrl = searchParams.get('plan')
      
      console.log('🔍 Metadata del usuario:', metadata)
      console.log('🔍 Subscription:', subscription)
      console.log('🔍 Plan desde URL:', planFromUrl)
      
      // Priorizar plan desde URL (más reciente), luego desde metadatos
      if (planFromUrl) {
        setSubscriptionPlan(planFromUrl)
        console.log('✅ Plan obtenido desde URL:', planFromUrl)
      } else if (subscription && subscription.plan) {
        setSubscriptionPlan(subscription.plan)
        console.log('✅ Plan detectado desde metadatos:', subscription.plan)
      } else {
        console.log('❌ No se encontró plan en metadatos ni URL')
        setSubscriptionPlan('basic') // Fallback
      }
      setIsLoading(false)
    }
  }, [user, searchParams])

  const getPlanFeatures = (plan: string) => {
    const features = {
      basic: [
        { icon: Users, text: "Acceso a base de datos de jugadores" },
        { icon: BarChart3, text: "Reportes básicos de rendimiento" },
        { icon: Target, text: "Análisis de 50 jugadores por mes" },
        { icon: TrendingUp, text: "Estadísticas básicas" },
        { icon: Globe, text: "Soporte por email" }
      ],
      premium: [
        { icon: Users, text: "Acceso completo a base de datos de jugadores" },
        { icon: BarChart3, text: "Reportes avanzados y personalizados" },
        { icon: Target, text: "Análisis ilimitado de jugadores" },
        { icon: TrendingUp, text: "Estadísticas avanzadas y predicciones" },
        { icon: Trophy, text: "Comparaciones entre jugadores" },
        { icon: Zap, text: "Alertas en tiempo real"},
        { icon: Shield, text: "Datos exclusivos de ligas premium"},
        { icon: Headphones, text: "Soporte prioritario 24/7"}
      ]
    }
    return features[plan as keyof typeof features] || features.basic
  }

  const getPlanName = (plan: string) => {
    return plan === 'premium' ? 'Premium' : 'Basic'
  }

  const getPlanColor = (plan: string) => {
    return plan === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando tu bienvenida...</p>
        </div>
      </div>
    )
  }

  const features = getPlanFeatures(subscriptionPlan)
  const planName = getPlanName(subscriptionPlan)
  const planColor = getPlanColor(subscriptionPlan)

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#000000] mb-4">
            ¡Bienvenido a Scoutea!
          </h1>
          <div className="mb-4">
            <Badge className={`${planColor} text-white px-4 py-2 text-lg`}>
              <Star className="w-5 h-5 mr-2" />
              Plan {planName}
            </Badge>
          </div>
          <p className="text-xl text-[#6d6d6d] mb-2">
            Tu suscripción ha sido activada exitosamente
          </p>
          <p className="text-lg text-[#6d6d6d]">
            Ya puedes disfrutar de todas las características incluidas en tu plan
          </p>
        </div>

        {/* Features Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#000000] text-center">
              Características incluidas en tu plan {planName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#8c1a10] rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[#000000] font-medium">{feature.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#000000] text-center">
              ¿Qué puedes hacer ahora?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-lg border border-[#e7e7e7]">
                <Users className="w-12 h-12 text-[#8c1a10] mx-auto mb-4" />
                <h3 className="font-semibold text-[#000000] mb-2">Explorar Jugadores</h3>
                <p className="text-[#6d6d6d] text-sm">Descubre talentos en nuestra base de datos</p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg border border-[#e7e7e7]">
                <BarChart3 className="w-12 h-12 text-[#8c1a10] mx-auto mb-4" />
                <h3 className="font-semibold text-[#000000] mb-2">Crear Reportes</h3>
                <p className="text-[#6d6d6d] text-sm">Genera análisis detallados de rendimiento</p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg border border-[#e7e7e7]">
                <Target className="w-12 h-12 text-[#8c1a10] mx-auto mb-4" />
                <h3 className="font-semibold text-[#000000] mb-2">Comparar Talentos</h3>
                <p className="text-[#6d6d6d] text-sm">Analiza y compara diferentes jugadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center">
          <Button
            onClick={() =>_router.push('/member/dashboard')}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mr-4">
            Ir al Dashboard
          </Button>
          <Button
            onClick={() =>_router.push('/member/subscription-plans')}
            variant="outline" className="border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200">
            Completar Perfil
          </Button>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7]">
            <Headphones className="w-8 h-8 text-[#8c1a10] mx-auto mb-3" />
            <h3 className="font-semibold text-[#000000] mb-2">¿Necesitas ayuda?</h3>
            <p className="text-[#6d6d6d] text-sm mb-4">
              Nuestro equipo de soporte está aquí para ayudarte a aprovechar al máximo tu suscripción
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
