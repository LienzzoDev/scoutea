import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface ProfileStatus {
  isProfileCompleted: boolean
  hasSubscription: boolean
  shouldRedirect: boolean
  redirectPath: string | null
}

export function useProfileStatus(): ProfileStatus {
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<ProfileStatus>({
    isProfileCompleted: false,
    hasSubscription: false,
    shouldRedirect: false,
    redirectPath: null
  })

  useEffect(() => {
    if (!isLoaded || !user) {
      setStatus({
        isProfileCompleted: false,
        hasSubscription: false,
        shouldRedirect: false,
        redirectPath: null
      })
      return
    }

    const isProfileCompleted = (user.publicMetadata as any)?.profile === 'completed'
    const hasSubscription = (user.publicMetadata as any)?.subscription?.status === 'active'

    let shouldRedirect = false
    let redirectPath: string | null = null

    if (isProfileCompleted) {
      if (hasSubscription) {
        // Usuario con perfil completo y suscripción activa
        shouldRedirect = false // Puede acceder a todas las páginas
        redirectPath = null
      } else {
        // Usuario con perfil completo pero sin suscripción
        shouldRedirect = true
        redirectPath = '/member/subscription-plans'
      }
    } else {
      // Usuario sin perfil completo
      shouldRedirect = true
      redirectPath = '/member/subscription-plans'
    }

    setStatus({
      isProfileCompleted,
      hasSubscription,
      shouldRedirect,
      redirectPath
    })
  }, [user, isLoaded])

  return status
}
