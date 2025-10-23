import { auth } from '@clerk/nextjs/server'
import { Check, Lock, Sparkles, Zap, Crown, X } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserMetadata } from '@/lib/services/role-service'

export const metadata = {
  title: 'Actualiza tu Plan - Scoutea',
  description: 'Desbloquea todas las funcionalidades de Scoutea con el plan Premium'
}

export default async function UpgradeRequiredPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const metadata = sessionClaims?.public_metadata as UserMetadata | undefined
  const currentPlan = metadata?.subscription?.plan || 'basic'

  // Si ya tiene plan premium, redirigir al dashboard
  if (currentPlan === 'premium') {
    redirect('/member/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] py-8 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-3">
            Desbloquea Todo el Potencial de Scoutea
          </h1>
          <p className="text-lg text-[#6d6d6d] max-w-2xl mx-auto">
            Esta función requiere el Plan Premium. Actualiza ahora y accede a todas las herramientas profesionales.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          {/* Plan Básico - Current */}
          <Card className="relative overflow-hidden border-2 border-gray-200">
            <div className="bg-gray-100 px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Plan Básico</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Tu plan actual
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-sm">
                Acceso fundamental a wonderkids
              </p>
            </div>
            <div className="p-5">
              <div className="flex items-baseline mb-5">
                <span className="text-4xl font-bold text-gray-900">Gratis</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Acceso a Wonderkids</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Torneos y competiciones</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Perfiles básicos de jugadores</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-through">Búsqueda avanzada</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-through">Wonderscouts Network</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-through">Comparadores avanzados</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Plan Premium - Recommended */}
          <Card className="relative overflow-hidden border-2 border-[#8c1a10] shadow-2xl transform md:scale-105">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              RECOMENDADO
            </div>
            <div className="bg-gradient-to-r from-[#8c1a10] to-[#a01e12] px-5 py-4 border-b border-[#6d1410]">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl font-bold text-white">Plan Premium</h3>
              </div>
              <p className="text-white/90 text-sm">
                Acceso completo a todas las funcionalidades
              </p>
            </div>
            <div className="p-5 bg-white">
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold text-[#000000]">€30</span>
                <span className="text-[#6d6d6d] ml-2">/mes</span>
              </div>
              <p className="text-sm text-[#6d6d6d] mb-5">
                o €25/mes facturado anualmente (ahorra €60/año)
              </p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Todo del plan básico</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Búsqueda avanzada de jugadores</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Wonderscouts Network</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Comparadores de jugadores y scouts</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Reportes On-Demand personalizados</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Soporte prioritario 24/7</span>
                </li>
              </ul>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-[#8c1a10] to-[#a01e12] hover:from-[#6d1410] hover:to-[#8c1a10] text-white font-semibold py-6 text-base shadow-lg"
              >
                <Link href="/member/complete-profile?plan=premium&upgrade=true">
                  Actualizar a Premium
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-gray-300 hover:bg-gray-50 px-8"
          >
            <Link href="/member/dashboard">
              Volver al Dashboard
            </Link>
          </Button>
          <p className="text-sm text-[#6d6d6d]">
            ¿Tienes preguntas? <Link href="/support" className="text-[#8c1a10] hover:underline font-medium">Contacta con soporte</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
