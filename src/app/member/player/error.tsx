'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Player page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      <div className="max-w-md w-full mx-auto text-center p-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2e3138] mb-2">
            Error al Cargar Jugador
          </h1>
          <p className="text-[#6d6d6d] mb-6">
            No se pudo cargar la información del jugador. Puede que el jugador no exista o haya un problema temporal.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white"
          >
            Intentar de nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/member/search'}
            className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
          >
            Buscar Jugadores
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-[#6d6d6d] hover:text-[#8c1a10]">
              Detalles del error (desarrollo)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}