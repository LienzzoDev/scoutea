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

      // Verificar si el perfil está completo usando metadatos públicos de Clerk (seguro)
      const profileCompleted = (user?.publicMetadata as any)?.profile === 'completed'
      const hasSubscription = (user?.publicMetadata as any)?.subscription?.status === 'active'
      const userRole = getUserRole(user)
      
      // Si es admin, permitir acceso sin verificar perfil o suscripción
      if (userRole === 'admin') {
        console.log('✅ Usuario admin, permitiendo acceso sin verificar perfil/suscripción')
        setIsChecking(false)
        return
      }
      
      // Si el perfil no está completo, permitir acceso a planes de suscripción o welcome-plan
      if (!profileCompleted && pathname !== '/member/subscription-plans' && pathname !== '/member/welcome-plan' && pathname !== '/member/complete-profile-after-payment') {
        console.log('🔄 Perfil incompleto, redirigiendo a planes de suscripción')
        router.replace('/member/subscription-plans')
        return
      }

      // Permitir acceso a la página de bienvenida sin verificar rol
      if (pathname === '/member/welcome') {
        console.log('✅ Acceso permitido - página de bienvenida')
        setIsChecking(false)
        return
      }

      // Permitir acceso a la página de bienvenida del plan si tiene suscripción
      if (pathname === '/member/welcome-plan') {
        if (hasSubscription) {
          console.log('✅ Acceso permitido - página de bienvenida del plan con suscripción activa')
          setIsChecking(false)
          return
        } else {
          console.log('🔄 Sin suscripción, redirigiendo a planes de suscripción')
          router.replace('/member/subscription-plans')
          return
        }
      }

      // Si el perfil está completo, redirigir según el estado de suscripción
      if (profileCompleted) {
        if (hasSubscription) {
          // Si tiene suscripción y no está en el dashboard, redirigir al dashboard
          if (pathname !== '/member/dashboard' && !pathname.startsWith('/member/player/') && !pathname.startsWith('/member/scout/') && pathname !== '/member/torneos') {
            console.log('✅ Perfil completo con suscripción, redirigiendo a dashboard')
            router.replace('/member/dashboard')
            return
          }
        } else {
          // Si no tiene suscripción y no está en planes de suscripción, redirigir a planes
          if (pathname !== '/member/subscription-plans' && pathname !== '/member/torneos') {
            console.log('✅ Perfil completo sin suscripción, redirigiendo a planes de suscripción')
            router.replace('/member/subscription-plans')
            return
          }
        }
      }

      // Permitir acceso a la página de planes de suscripción sin verificar rol
      if (pathname === '/member/subscription-plans') {
        console.log('✅ Acceso permitido - página de planes de suscripción')
        setIsChecking(false)
        return
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
    <MemberGuard>
      {children}
    </MemberGuard>
  )
}
