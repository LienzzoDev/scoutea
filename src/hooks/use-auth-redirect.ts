import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn && !hasRedirected) {
      setHasRedirected(true)
      try {
        router.replace('/login')
      } catch (error) {
        console.error('Error durante la redirección:', error)
        // Fallback a window.location si router falla
        window.location.href = '/login'
      }
    }
  }, [isLoaded, isSignedIn, router, hasRedirected])

  return { isSignedIn, isLoaded, hasRedirected }
}

