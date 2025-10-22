'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { canAccessMemberArea, isAdmin } from '@/lib/auth/user-role'
import { isOnboardingRoute } from '@/lib/auth/role-utils'

interface MemberGuardProps {
  children: React.ReactNode
}

function MemberGuard({ children }: MemberGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      // Si no está autenticado, redirigir a login
      if (!userId) {
        console.log('❌ MemberGuard: Usuario no autenticado, redirigiendo a login')
        router.push('/login')
        return
      }

      // ✅ CRÍTICO: Permitir acceso a rutas de onboarding sin verificar rol
      // Esto permite que usuarios recién registrados accedan a complete-profile
      // incluso antes de que el webhook de Clerk asigne un rol
      if (isOnboardingRoute(pathname)) {
        console.log('✅ MemberGuard: Permitiendo acceso a ruta de onboarding:', pathname)
        setIsChecking(false)
        return
      }

      // Si es admin, permitir acceso total
      if (isAdmin(user)) {
        setIsChecking(false)
        return
      }

      // Si puede acceder al área de members, permitir acceso
      if (canAccessMemberArea(user)) {
        setIsChecking(false)
        return
      }

      // Si no tiene acceso, redirigir a home
      console.log('❌ MemberGuard: Usuario sin acceso al área de miembros, redirigiendo a home')
      router.replace('/')
    }
  }, [isLoaded, userId, user, router, pathname])

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
    <ErrorBoundary>
      <MemberGuard>
        {children}
      </MemberGuard>
    </ErrorBoundary>
  )
}
