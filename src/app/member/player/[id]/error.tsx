'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PlayerProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Player profile error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            Error al cargar el perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            No se pudo cargar la información del jugador. Por favor, inténtalo de nuevo.
          </p>
          <div className="flex justify-center">
            <Button onClick={reset}>
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}