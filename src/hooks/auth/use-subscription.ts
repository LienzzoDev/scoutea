import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface Subscription {
  plan: string
  billing: string
  status: string
  customerId?: string
  subscriptionId?: string
}

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const userSubscription = user.publicMetadata?.subscription as Subscription
      setSubscription(userSubscription || null)
      setLoading(false)
    }
  }, [user])

  const hasActiveSubscription = subscription?.status === 'active'
  const isPremium = subscription?.plan === 'premium'
  const isBasic = subscription?.plan === 'basic'

  return {
    subscription,
    loading,
    hasActiveSubscription,
    isPremium,
    isBasic,
  }
}
