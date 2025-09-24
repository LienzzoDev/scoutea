'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

interface ClerkLoadingStateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClerkLoadingState({ children, fallback }: ClerkLoadingStateProps) {
  const { isLoaded } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    // Show fallback after 2 seconds if Clerk hasn't loaded
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowFallback(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isLoaded])

  // If Clerk is loaded, render children
  if (isLoaded) {
    return <>{children}</>
  }

  // Show custom fallback or default loading state
  if (showFallback && fallback) {
    return <>{fallback}</>
  }

  // Default loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Cargando autenticación...
        </h2>
        <p className="text-sm text-gray-500">
          Inicializando sistema de seguridad
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-400">
            <p>Modo desarrollo - Usando claves de prueba</p>
          </div>
        )}
      </div>
    </div>
  )
}