'use client'
import { useSubscription } from '@/hooks/use-subscription'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan?: 'basic' | 'premium'
  fallbackUrl?: string
}

export function SubscriptionGuard({ 
  children, 
  requiredPlan = 'basic',
  fallbackUrl = '/member/subscription-plans'
}: SubscriptionGuardProps) {
  const { subscription, loading, hasActiveSubscription, isPremium, isBasic } = useSubscription()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!hasActiveSubscription) {
        router.push(fallbackUrl)
        return
      }

      if (requiredPlan === 'premium' && !isPremium) {
        router.push(fallbackUrl)
        return
      }
    }
  }, [loading, hasActiveSubscription, isPremium, isBasic, requiredPlan, router, fallbackUrl])

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
