'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useSubscription } from '@/hooks/auth/use-subscription'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan?: 'basic' | 'premium'
  fallbackUrl?: string
}

export function SubscriptionGuard({
  children,
  requiredPlan = 'basic',
  fallbackUrl = '/member/complete-profile'
}: SubscriptionGuardProps) {
  const { subscription: _subscription, loading, hasActiveSubscription, isPremium, isBasic } = useSubscription()
  const _router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!hasActiveSubscription) {
        _router.push(fallbackUrl)
        return
      }

      if (requiredPlan === 'premium' && !isPremium) {
        _router.push(fallbackUrl)
        return
      }
    }
  }, [loading, hasActiveSubscription, isPremium, isBasic, requiredPlan, _router, fallbackUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!hasActiveSubscription || (requiredPlan === 'premium' && !isPremium)) {
    return null
  }

  return <>{children}</>
}
