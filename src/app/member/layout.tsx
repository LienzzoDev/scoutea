'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { canAccessMemberArea, isAdmin } from '@/lib/auth/user-role'

interface MemberGuardProps {
  children: React.ReactNode
}

function MemberGuard({ children }: MemberGuardProps) {
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
      router.replace('/')
    }
  }, [isLoaded, userId, user, router])

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
