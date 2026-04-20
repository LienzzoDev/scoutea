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
    console.error('Player profile error: ', error)
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
            Player information could not be loaded. Please try again.
          </p>
          <div className="flex justify-center">
            <Button onClick={reset}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}