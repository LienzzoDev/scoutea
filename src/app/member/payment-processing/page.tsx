'use client'

import { useUser } from '@clerk/nextjs'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<'verifying' | 'activating' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!isLoaded || !user || !sessionId) return

    const verifyAndActivate = async () => {
      try {
        console.log('🔍 Verificando pago en Stripe...', { sessionId })
        setStatus('verifying')
        setMessage('Verificando tu pago con Stripe...')

        // 1. Verificar el estado del pago en Stripe
        const verifyResponse = await fetch(`/api/verify-payment?session_id=${sessionId}`)
        const verifyData = await verifyResponse.json()

        console.log('📊 Resultado de verificación:', verifyData)

        if (!verifyResponse.ok) {
          const errorMsg = verifyData.details || verifyData.error || 'Error al verificar el pago'
          console.error('❌ Error en verificación:', verifyData)
          throw new Error(errorMsg)
        }

        // 2. Si el pago no está completado, mostrar error
        if (!verifyData.success || verifyData.status !== 'paid') {
          console.error('❌ Pago no completado:', verifyData)
          setStatus('error')
          setMessage(verifyData.message || 'El pago no se completó correctamente. Por favor, intenta de nuevo.')
          return
        }

        console.log('✅ Pago confirmado en Stripe')

        // 3. Si el webhook ya procesó, redirigir inmediatamente
        if (verifyData.webhookProcessed && verifyData.hasActiveSubscription) {
          console.log('✅ Webhook ya procesó el pago, redirigiendo...')
          setStatus('success')
          setMessage('¡Pago confirmado! Redirigiendo a tu dashboard...')

          setTimeout(() => {
            const dashboardUrl = verifyData.role === 'scout' ? '/scout/dashboard' : '/member/dashboard'
            router.push(dashboardUrl)
          }, 1500)
          return
        }

        // 4. Si fue procesado manualmente, esperar un momento y verificar
        if (verifyData.manuallyProcessed) {
          console.log('✅ Pago procesado manualmente, verificando rol...')
          setStatus('activating')
          setMessage('Activando tu suscripción...')

          // Forzar reload de la sesión de Clerk para obtener metadata actualizada
          console.log('🔄 Refrescando sesión de Clerk...')
          await user?.reload()

          // Esperar 2 segundos adicionales para asegurar sincronización
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Verificar el rol
          const roleResponse = await fetch('/api/check-role')
          const roleData = await roleResponse.json()

          console.log('📊 Role check después de reload:', roleData)

          if (roleData.success && roleData.hasActiveSubscription) {
            console.log('✅ Rol verificado, cuenta activada')
            setStatus('success')
            setMessage('¡Cuenta activada! Redirigiendo...')

            setTimeout(() => {
              const dashboardUrl = roleData.role === 'scout' ? '/scout/dashboard' : '/member/dashboard'
              console.log('🔄 Redirigiendo a:', dashboardUrl)
              // Usar window.location para forzar recarga completa y evitar cache
              window.location.href = dashboardUrl
            }, 1500)
            return
          } else {
            console.warn('⚠️ Usuario aún no tiene suscripción activa después de procesamiento manual')
          }
        }

        // 5. El pago está confirmado pero aún no procesado - esperar el webhook
        console.log('⏳ Esperando procesamiento del webhook...')
        setStatus('activating')
        setMessage('Tu pago fue confirmado. Activando tu cuenta...')

        // Esperar 3 segundos para dar tiempo al webhook
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Refrescar sesión de Clerk
        console.log('🔄 Refrescando sesión de Clerk...')
        await user?.reload()

        // Verificar el rol nuevamente
        const roleResponse = await fetch('/api/check-role')
        const roleData = await roleResponse.json()

        console.log('📊 Role check después de esperar webhook:', roleData)

        if (roleData.success && roleData.hasActiveSubscription) {
          console.log('✅ Webhook procesó el pago exitosamente')
          setStatus('success')
          setMessage('¡Tu cuenta está activa! Redirigiendo...')

          setTimeout(() => {
            const dashboardUrl = roleData.role === 'scout' ? '/scout/dashboard' : '/member/dashboard'
            console.log('🔄 Redirigiendo a:', dashboardUrl)
            // Usar window.location para forzar recarga completa
            window.location.href = dashboardUrl
          }, 1500)
        } else {
          // Después de 3 segundos aún no está procesado - reintentar una vez
          if (retryCount < 2) {
            console.log('⚠️ Webhook aún no procesó, reintentando...', { retryCount })
            setRetryCount(prev => prev + 1)
            setMessage('Procesando... esto puede tomar unos momentos más.')

            // Reintentar después de 3 segundos
            setTimeout(() => {
              verifyAndActivate()
            }, 3000)
          } else {
            // Después de 2 reintentos, permitir continuar
            console.log('⚠️ Webhook tardó más de lo esperado, pero el pago está confirmado')
            setStatus('success')
            setMessage('Tu pago fue procesado exitosamente. Continuando al dashboard...')

            setTimeout(() => {
              console.log('🔄 Redirigiendo a dashboard después de timeout')
              // Usar window.location para forzar recarga completa
              window.location.href = '/member/dashboard'
            }, 2000)
          }
        }

      } catch (error) {
        console.error('❌ Error en verificación de pago:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Error al procesar el pago')
      }
    }

    verifyAndActivate()
  }, [isLoaded, user, sessionId, router, retryCount])

  const getStatusContent = () => {
    switch (status) {
      case 'verifying':
        return {
          icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
          title: 'Verificando pago...',
          color: 'text-blue-600'
        }

      case 'activating':
        return {
          icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
          title: 'Activando tu cuenta...',
          color: 'text-blue-600'
        }

      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: '¡Pago confirmado!',
          color: 'text-green-600'
        }

      case 'error':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Error en el procesamiento',
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
            {message || 'Procesando tu solicitud...'}
          </p>

          {/* Progress Info */}
          {(status === 'verifying' || status === 'activating') && (
            <div className="mb-6">
              <div className="text-sm text-gray-500">
                {status === 'verifying' ? 'Verificando con Stripe...' : 'Activando suscripción...'}
                {retryCount > 0 && ` (Intento ${retryCount + 1}/3)`}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Reintentar
              </button>

              <button
                onClick={() => router.push('/member/dashboard')}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Ir al Dashboard
              </button>
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