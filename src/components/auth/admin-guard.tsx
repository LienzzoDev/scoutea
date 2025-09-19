'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getUserRole } from '@/lib/auth/user-role'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const _router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        _router.push('/login')
        return
      }

      const userRole = getUserRole(user)
      
      if (userRole === 'admin') {
        setIsChecking(false)
      } else if (userRole === 'member') {
        _router.replace('/member/dashboard')
        return
      } else {
        _router.replace('/login')
        return
      }
    }
  }, [isLoaded, userId, user, _router])

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}
