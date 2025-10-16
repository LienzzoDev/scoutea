'use client'

import { useUser } from '@clerk/nextjs'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'timeout'>('processing')
  const [attempts, setAttempts] = useState(0)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!isLoaded || !user || !sessionId) return

    let pollCount = 0
    const maxPolls = 30 // 30 intentos = 1 minuto
    
    const checkPaymentStatus = async () => {
      try {
        pollCount++
        setAttempts(pollCount)

        // Verificar el rol del usuario
        const response = await fetch('/api/check-role')
        const data = await response.json()

        if (data.success && data.hasActiveSubscription) {
          setStatus('success')
          
          // Redirigir al dashboard apropiado después de un breve delay
          setTimeout(() => {
            const dashboardUrl = data.role === 'scout' ? '/scout/dashboard' : '/member/dashboard'
            router.push(dashboardUrl)
          }, 2000)
          
          return true // Detener polling
        }

        // Si llegamos al máximo de intentos
        if (pollCount >= maxPolls) {
          setStatus('timeout')
          return true // Detener polling
        }

        return false // Continuar polling
      } catch (error) {
        console.error('Error checking payment status:', error)
        
        if (pollCount >= maxPolls) {
          setStatus('error')
          return true // Detener polling
        }
        
        return false // Continuar polling
      }
    }

    // Polling cada 2 segundos
    const pollInterval = setInterval(async () => {
      const shouldStop = await checkPaymentStatus()
      if (shouldStop) {
        clearInterval(pollInterval)
      }
    }, 2000)

    // Cleanup
    return () => clearInterval(pollInterval)
  }, [isLoaded, user, sessionId, router])

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
          title: 'Procesando tu pago...',
          description: 'Estamos confirmando tu suscripción. Esto puede tomar unos momentos.',
          color: 'text-blue-600'
        }
      
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: '¡Pago confirmado!',
          description: 'Tu suscripción está activa. Redirigiendo a tu dashboard...',
          color: 'text-green-600'
        }
      
      case 'timeout':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Procesamiento en curso',
          description: 'Tu pago está siendo procesado. Puedes continuar y verificar tu estado más tarde.',
          color: 'text-yellow-600'
        }
      
      case 'error':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Error en el procesamiento',
          description: 'Hubo un problema al procesar tu pago. Por favor, contacta soporte.',
          color: 'text-red-600'
        }
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl border border-[#e7e7e7] p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/logo-member.svg" 
              alt="Scoutea Logo" 
              className="h-12 mx-auto"
            />
          </div>

          {/* Status Icon */}
          <div className="mb-6 flex justify-center">
            {statusContent.icon}
          </div>

          {/* Status Text */}
          <h1 className={`text-2xl font-bold mb-4 ${statusContent.color}`}>
            {statusContent.title}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {statusContent.description}
          </p>

          {/* Progress Info */}
          {status === 'processing' && (
            <div className="mb-6">
              <div className="text-sm text-gray-500">
                Verificando estado... ({attempts}/30)
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(attempts / 30) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(status === 'timeout' || status === 'error') && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/member/dashboard')}
                className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Ir al Dashboard
              </button>
              
              {status === 'error' && (
                <button
                  onClick={() => router.push('/support')}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Contactar Soporte
                </button>
              )}
            </div>
          )}

          {/* Session ID for debugging */}
          {sessionId && (
            <div className="mt-6 text-xs text-gray-400">
              ID de sesión: {sessionId.slice(-8)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}