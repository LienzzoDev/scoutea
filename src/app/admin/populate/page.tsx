'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react'

export default function PopulatePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const populateData = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/populate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-2xl mx-auto'>
        <div className='bg-white rounded-lg shadow-sm border p-8'>
          <div className='text-center mb-8'>
            <Database className='w-16 h-16 text-[#8B4513] mx-auto mb-4' />
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Poblar Base de Datos
            </h1>
            <p className='text-gray-600'>
              Genera datos de ejemplo para probar el dashboard cualitativo de scouts
            </p>
          </div>

          <div className='space-y-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h3 className='font-semibold text-blue-900 mb-2'>
                ¿Qué se va a crear?
              </h3>
              <ul className='text-blue-800 text-sm space-y-1'>
                <li>• 2 scouts de ejemplo (Carlos Rodriguez y Maria Silva)</li>
                <li>• 6 jugadores de diferentes nacionalidades y posiciones</li>
                <li>• 20-50 reportes con datos realistas para cada scout</li>
                <li>• Datos financieros, ROI y métricas de rendimiento</li>
              </ul>
            </div>

            <Button
              onClick={populateData}
              disabled={loading}
              className='w-full bg-[#8B4513] hover:bg-[#7A3F12] text-white py-3'
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Poblando datos...
                </>
              ) : (
                <>
                  <Database className='w-5 h-5 mr-2' />
                  Poblar Datos de Ejemplo
                </>
              )}
            </Button>

            {result && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  <h3 className='font-semibold text-green-900'>
                    ¡Datos poblados exitosamente!
                  </h3>
                </div>
                <div className='text-green-800 text-sm space-y-1'>
                  <p>• Scouts creados: {result.scouts}</p>
                  <p>• Jugadores creados: {result.players}</p>
                  <p>• Reportes creados: {result.reports}</p>
                </div>
                
                {result.scoutIds && (
                  <div className='mt-4 p-3 bg-white rounded border'>
                    <h4 className='font-medium text-gray-900 mb-2'>
                      IDs de scouts para testing:
                    </h4>
                    <div className='space-y-1'>
                      {result.scoutIds.map((scout: any) => (
                        <div key={scout.id} className='text-sm font-mono'>
                          <span className='text-gray-600'>{scout.name}:</span>{' '}
                          <span className='text-blue-600 font-semibold'>{scout.id}</span>
                        </div>
                      ))}
                    </div>
                    <p className='text-xs text-gray-500 mt-2'>
                      Usa estos IDs para navegar a /member/scout/[id] y ver el dashboard
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-center gap-2'>
                  <XCircle className='w-5 h-5 text-red-600' />
                  <h3 className='font-semibold text-red-900'>Error</h3>
                </div>
                <p className='text-red-800 text-sm mt-1'>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}