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
      const metadata = user.publicMetadata as Record<string, unknown>
      const subscription = metadata?.subscription as Record<string, unknown>
      const planFromUrl = searchParams.get('plan')
      
      console.log('🔍 Metadata del usuario:', metadata)
      console.log('🔍 Subscription:', subscription)
      console.log('🔍 Plan desde URL:', planFromUrl)
      
      // Priorizar plan desde URL (más reciente), luego desde metadatos
      if (planFromUrl) {
        setSubscriptionPlan(planFromUrl)
        console.log('✅ Plan obtenido desde URL:', planFromUrl)
      } else if (subscription && subscription.plan) {
        setSubscriptionPlan(subscription.plan as string)
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
        { icon: Globe, text: "Soporte por email" }
      ],
      premium: [
        { icon: Users, text: "Acceso completo a base de datos" },
        { icon: BarChart3, text: "Reportes avanzados y comparaciones" },
        { icon: Trophy, text: "Análisis ilimitado de jugadores" },
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

        {/* Features Section - Simplified */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#000000] text-center">
              Tu plan {planName} incluye
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                const uniqueKey = `welcome-${Date.now()}-${index}-${feature.text.replace(/\s+/g, '-').toLowerCase()}`
                return (
                  <div key={uniqueKey} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[#000000] font-medium">{feature.text}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={() =>_router.push('/member/dashboard')}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-12 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            Comenzar a explorar
          </Button>
        </div>
      </main>
    </div>
  )
}
