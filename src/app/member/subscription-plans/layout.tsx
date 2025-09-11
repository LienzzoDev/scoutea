'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getUserRole } from '@/lib/auth/user-role'

interface SubscriptionPlansGuardProps {
  children: React.ReactNode
}

function SubscriptionPlansGuard({ children }: SubscriptionPlansGuardProps) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        console.log('❌ No autenticado, redirigiendo a login')
        router.push('/login')
        return
      }

      // Permitir acceso a usuarios con rol member para seleccionar plan
      console.log('✅ Acceso permitido - seleccionando plan de suscripción')
      setIsChecking(false)
    }
  }, [isLoaded, userId, router])

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}

export default function SubscriptionPlansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SubscriptionPlansGuard>
      {children}
    </SubscriptionPlansGuard>
  )
}
