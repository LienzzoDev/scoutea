'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error: ', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md bg-white rounded-lg border shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-center text-red-600">
                Error de aplicación
              </h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <p className="text-center text-gray-600">
                Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={reset}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-10 px-4 py-2"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}