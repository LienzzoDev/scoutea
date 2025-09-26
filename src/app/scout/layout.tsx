'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getUserRole } from '@/lib/auth/user-role'

interface ScoutGuardProps {
  children: React.ReactNode
}

function ScoutGuard({ children }: ScoutGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        console.log('❌ No autenticado, redirigiendo a login')
        router.push('/login')
        return
      }

      // Verificar el estado del perfil usando metadatos públicos de Clerk
      const publicMetadata = user?.publicMetadata as Record<string, unknown>
      const profileStatus = publicMetadata?.profile as string
      const profileCompleted = profileStatus === 'completed'
      const profileIncomplete = profileStatus === 'incomplete'
      const hasProfileStatus = profileCompleted || profileIncomplete
      const subscriptionData = publicMetadata?.subscription as Record<string, unknown>
      const hasSubscription = subscriptionData?.status === 'active'
      const onboardingStep = publicMetadata?.onboardingStep as string
      const userRole = getUserRole(user)

      console.log('🔍 ScoutGuard - User metadata check:', {
        userId,
        pathname,
        profileStatus,
        hasSubscription,
        userRole,
        onboardingStep,
        rawRole: publicMetadata?.role,
        publicMetadata: JSON.stringify(publicMetadata, null, 2),
      })

      console.log('🔍 ScoutGuard - getUserRole result:', getUserRole(user))
      console.log('🔍 ScoutGuard - User object keys:', Object.keys(user || {}))

      // Si es admin, permitir acceso a todas las áreas
      if (userRole === 'admin') {
        console.log('✅ Usuario admin, permitiendo acceso al área de scout')
        setIsChecking(false)
        return
      }

      // Si es member, redirigir al área de member
      if (userRole === 'member') {
        console.log('✅ Usuario member, redirigiendo a área de member')
        router.replace('/member/dashboard')
        return
      }

      // Si no es scout, denegar acceso
      if (userRole !== 'scout') {
        console.log('❌ Usuario no es scout, redirigiendo a home')
        router.replace('/')
        return
      }

      // Si no tiene suscripción activa, redirigir a planes
      if (!hasSubscription) {
        console.log('🔄 Scout sin suscripción, redirigiendo a planes')
        router.replace('/member/subscription-plans')
        return
      }

      // Si llegamos aquí, es un scout con suscripción activa
      console.log('✅ Acceso permitido - usuario scout')
      setIsChecking(false)
    }
  }, [isLoaded, userId, user, router, pathname])

  if (!isLoaded || isChecking) {
    return (
      <div className='min-h-screen bg-[#f8f7f4] flex items-center justify-center'>
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return <ScoutGuard>{children}</ScoutGuard>
}
