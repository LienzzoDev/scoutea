import { auth } from '@clerk/nextjs/server'
import { Check, Lock, Crown } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserMetadata } from '@/lib/services/role-service'

export const metadata = {
  title: 'Upgrade your Plan - Scoutea',
  description: 'Unlock every feature of Scoutea with the Member plan'
}

export default async function UpgradeRequiredPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const userMetadata = sessionClaims?.public_metadata as UserMetadata | undefined
  const hasActiveSubscription = userMetadata?.subscription?.status === 'active'

  // Si ya tiene suscripción activa, redirigir al dashboard
  if (hasActiveSubscription) {
    redirect('/member/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] py-8 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-3">
            Unlock the Full Potential of Scoutea
          </h1>
          <p className="text-lg text-[#6d6d6d] max-w-2xl mx-auto">
            A single plan gives you access to all the platform's features.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="relative overflow-hidden border-2 border-[#8c1a10] shadow-2xl">
            <div className="bg-gradient-to-r from-[#8c1a10] to-[#a01e12] px-5 py-4 border-b border-[#6d1410]">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-6 h-6 text-yellow-300" />
                <h3 className="text-xl font-bold text-white">Member Plan</h3>
              </div>
              <p className="text-white/90 text-sm">
                Full access to all features
              </p>
            </div>
            <div className="p-6 bg-white">
              <div className="flex items-baseline mb-5">
                <span className="text-5xl font-bold text-[#000000]">€9.90</span>
                <span className="text-[#6d6d6d] ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Wonderkids</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Tournaments</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-[#8c1a10] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">On Demand</span>
                </li>
              </ul>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-[#8c1a10] to-[#a01e12] hover:from-[#6d1410] hover:to-[#8c1a10] text-white font-semibold py-6 text-base shadow-lg"
              >
                <Link href="/member/complete-profile?plan=member">
                  Subscribe now
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
              Back to Dashboard
            </Link>
          </Button>
          <p className="text-sm text-[#6d6d6d]">
            Have questions? <Link href="/support" className="text-[#8c1a10] hover:underline font-medium">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
