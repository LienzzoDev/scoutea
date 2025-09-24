'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface ClerkInitializationState {
  isLoaded: boolean
  isInitialized: boolean
  error: Error | null
  retryCount: number
}

export function useClerkInitialization() {
  const { isLoaded } = useAuth()
  const [state, setState] = useState<ClerkInitializationState>({
    isLoaded: false,
    isInitialized: false,
    error: null,
    retryCount: 0
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkInitialization = () => {
      try {
        if (isLoaded) {
          setState(prev => ({
            ...prev,
            isLoaded: true,
            isInitialized: true,
            error: null
          }))
        } else {
          // Retry after a delay if not loaded
          timeoutId = setTimeout(() => {
            setState(prev => {
              if (prev.retryCount < 5) {
                return {
                  ...prev,
                  retryCount: prev.retryCount + 1
                }
              } else {
                return {
                  ...prev,
                  error: new Error('Clerk failed to initialize after multiple attempts')
                }
              }
            })
          }, 1000)
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as Error
        }))
      }
    }

    checkInitialization()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoaded, state.retryCount])

  const retry = () => {
    setState({
      isLoaded: false,
      isInitialized: false,
      error: null,
      retryCount: 0
    })
  }

  return {
    ...state,
    retry
  }
}