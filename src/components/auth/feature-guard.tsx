'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { FeatureAccessService, type MemberFeature } from '@/lib/auth/feature-access'
import type { UserMetadata } from '@/lib/services/role-service'

interface FeatureGuardProps {
  feature: MemberFeature
  children: React.ReactNode
  fallbackUrl?: string
  showLoading?: boolean
}

/**
 * Guard que protege componentes basándose en el acceso a features por plan
 *
 * Uso:
 * ```tsx
 * <FeatureGuard feature="dashboard">
 *   <DashboardContent />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({
  feature,
  children,
  fallbackUrl = '/member/upgrade-required',
  showLoading = true
}: FeatureGuardProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as UserMetadata | undefined
      const plan = metadata?.subscription?.plan

      const access = FeatureAccessService.hasFeatureAccess(plan, feature)
      setHasAccess(access)

      if (!access) {
        router.push(fallbackUrl)
      }
    }
  }, [isLoaded, user, feature, router, fallbackUrl])

  // Mientras carga
  if (!isLoaded || hasAccess === null) {
    if (showLoading) {
      return (
        <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )
    }
    return null
  }

  // Si no tiene acceso, no renderizar nada (ya redirigió)
  if (!hasAccess) {
    return null
  }

  // Si tiene acceso, renderizar children
  return <>{children}</>
}

/**
 * Hook para verificar acceso a features
 *
 * Uso:
 * ```tsx
 * const { hasAccess, loading } = useFeatureAccess('dashboard')
 * ```
 */
export function useFeatureAccess(feature: MemberFeature) {
  const { user, isLoaded } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean>(false)

  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as UserMetadata | undefined
      const plan = metadata?.subscription?.plan

      const access = FeatureAccessService.hasFeatureAccess(plan, feature)
      setHasAccess(access)
    }
  }, [isLoaded, user, feature])

  return {
    hasAccess,
    loading: !isLoaded
  }
}

/**
 * Hook para obtener plan actual del usuario
 */
export function useSubscriptionPlan() {
  const { user, isLoaded } = useUser()

  if (!isLoaded || !user) {
    return {
      plan: null,
      loading: !isLoaded
    }
  }

  const metadata = user.publicMetadata as UserMetadata | undefined
  const plan = metadata?.subscription?.plan || null

  return {
    plan,
    loading: false
  }
}
