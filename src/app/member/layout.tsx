'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getUserRole } from '@/lib/auth/user-role'

interface MemberGuardProps {
  children: React.ReactNode
}

function MemberGuard({ children }: MemberGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const _router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        console.log('❌ No autenticado, redirigiendo a login')
        _router.push('/login')
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
      
      console.log('🔍 MemberGuard - User metadata check:', {
        userId,
        pathname,
        profileStatus,
        hasSubscription,
        userRole,
        onboardingStep,
        publicMetadata: JSON.stringify(publicMetadata, null, 2)
      })
      
      // Si es admin, redirigir al dashboard de admin
      if (userRole === 'admin') {
        console.log('✅ Usuario admin, redirigiendo a dashboard de admin')
        _router.replace('/admin/dashboard')
        return
      }

      // Si es scout, redirigir al área de scout
      if (userRole === 'scout') {
        console.log('✅ Usuario scout, redirigiendo a área de scout')
        _router.replace('/scout/dashboard')
        return
      }

      // Si no es member, denegar acceso
      if (userRole !== 'member') {
        console.log('❌ Usuario no es member, redirigiendo a home')
        _router.replace('/')
        return
      }
      
      // Si no tiene ningún estado de perfil (nunca ha pasado por el flujo), permitir acceso solo a páginas del flujo de registro
      if (!hasProfileStatus && pathname !== '/member/welcome-plan' && pathname !== '/member/complete-profile-after-payment' && pathname !== '/member/complete-profile') {
        console.log('🔄 Sin estado de perfil, redirigiendo al dashboard')
        _router.replace('/member/dashboard')
        return
      }

      // Permitir acceso a la página de bienvenida sin verificar rol
      if (pathname === '/member/welcome') {
        console.log('✅ Acceso permitido - página de bienvenida')
        setIsChecking(false)
        return
      }

      // Permitir acceso a la página de completar perfil durante el flujo de registro
      if (pathname === '/member/complete-profile') {
        console.log('✅ Acceso permitido - página de completar perfil')
        setIsChecking(false)
        return
      }

      // Permitir acceso a la página de bienvenida del plan durante el flujo de registro
      if (pathname === '/member/welcome-plan') {
        console.log('✅ Acceso permitido - página de bienvenida del plan (flujo de registro)')
        setIsChecking(false)
        return
      }

      // Si el perfil está completo o incompleto, permitir acceso al dashboard y otras páginas
      if (hasProfileStatus) {
        // Permitir acceso a todas las páginas principales
        if (pathname === '/member/dashboard' || pathname.startsWith('/member/player/') || pathname.startsWith('/member/scout/') || pathname === '/member/torneos' || pathname === '/member/comparison' || pathname === '/member/scouts' || pathname === '/member/scout-comparison') {
          console.log('✅ Acceso permitido - página principal')
          setIsChecking(false)
          return
        }
      }

      // Permitir acceso a la página de torneos sin verificar rol (solo consulta)
      if (pathname === '/member/torneos') {
        console.log('✅ Acceso permitido - página de torneos')
        setIsChecking(false)
        return
      }

      // Si llegamos aquí, es un usuario member normal
      console.log('✅ Acceso permitido - usuario member')
      setIsChecking(false)
    }
  }, [isLoaded, userId, user, _router, pathname])

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MemberGuard>
      {children}
    </MemberGuard>
  )
}
