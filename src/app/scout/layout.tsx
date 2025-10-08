'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { canAccessScoutArea, isAdmin, getUserRole } from '@/lib/auth/user-role'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

interface ScoutGuardProps {
  children: React.ReactNode
}

function ScoutGuard({ children }: ScoutGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      // Si no está autenticado, redirigir a login
      if (!userId) {
        router.push('/login')
        return
      }

      const userRole = getUserRole(user)

      // Si es admin, permitir acceso total
      if (isAdmin(user)) {
        setIsChecking(false)
        return
      }

      // Si es member, redirigir al área de member
      if (userRole === 'member') {
        router.replace('/member/dashboard')
        return
      }

      // Si puede acceder al área de scouts, permitir acceso
      if (canAccessScoutArea(user)) {
        setIsChecking(false)
        return
      }

      // Si no tiene acceso, redirigir a home
      router.replace('/')
    }
  }, [isLoaded, userId, user, router])

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
  return (
    <ErrorBoundary>
      <ScoutGuard>
        {children}
      </ScoutGuard>
    </ErrorBoundary>
  )
}
