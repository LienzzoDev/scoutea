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
    <div className="min-h-screen bg-[#f8f7f4] py-6 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000] mb-2">
            Desbloquea Todo el Potencial de Scoutea
          </h1>
          <p className="text-lg text-[#6d6d6d] max-w-2xl mx-auto">
            Esta función requiere el Plan Premium
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Plan Básico - Current */}
          <Card className="relative overflow-hidden border-2 border-gray-200">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Plan Básico</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Tu plan actual
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold text-gray-900">Gratis</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Acceso a Wonderkids</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Torneos y competiciones</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Perfiles básicos</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-through">Búsqueda avanzada</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 line-through">Wonderscouts</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Plan Premium - Recommended */}
          <Card className="relative overflow-hidden border-2 border-[#8c1a10] shadow-xl">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMENDADO
            </div>
            <div className="bg-gradient-to-r from-[#8c1a10] to-[#a01e12] px-4 py-3 border-b border-[#6d1410]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-300" />
                <h3 className="text-lg font-bold text-white">Plan Premium</h3>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-baseline mb-1">
                <span className="text-3xl font-bold text-[#000000]">€30</span>
                <span className="text-[#6d6d6d] ml-2 text-sm">/mes</span>
              </div>
              <p className="text-xs text-[#6d6d6d] mb-4">
                o €25/mes anualmente (ahorra €60/año)
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Todo del plan básico</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Búsqueda avanzada</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Wonderscouts Network</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Comparadores avanzados</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Reportes On-Demand</span>
                </li>
              </ul>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-[#8c1a10] to-[#a01e12] hover:from-[#6d1410] hover:to-[#8c1a10] text-white font-semibold py-5 shadow-lg"
              >
                <Link href="/member/complete-profile?plan=premium&upgrade=true">
                  Actualizar a Premium
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
