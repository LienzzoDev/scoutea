'use client'

import { SignUp, useUser } from '@clerk/nextjs'
import { ChevronRight, Users, FileText, Eye, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { getUserRoleInfo, getOnboardingRedirectUrl } from '@/lib/auth/role-utils'
import { getUserRole } from '@/lib/auth/user-role'

export default function ScoutRegisterPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (isLoaded && user) {
      const role = getUserRole(user)
      if (role) {
        const roleInfo = getUserRoleInfo(user)

        // Si ya tiene suscripción activa, ir al dashboard
        if (roleInfo.hasActiveSubscription) {
          const redirectUrl = getOnboardingRedirectUrl(roleInfo)
          console.log(`Scout ${role} con suscripción activa, redirigiendo a ${redirectUrl}`)
          router.push(redirectUrl)
        }
      }
    }
  }, [isLoaded, user, router])

  // Guardar que es un registro de scout
  useEffect(() => {
    localStorage.setItem('selectedPlan', 'scout')
    localStorage.setItem('userType', 'scout')
  }, [])

  // Mostrar loading mientras verificamos autenticación
  if (!isLoaded || user) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0] flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]'>
      <div className='max-w-6xl mx-auto px-6 py-8'>
        {/* Header with Logo */}
        <div className='text-center mb-8'>
          <Link href='/'>
            <Image
              src='/logo-member.svg'
              alt='Scoutea Logo'
              width={150}
              height={48}
              className='h-12 w-auto mx-auto mb-4 cursor-pointer'
            />
          </Link>
          <h1 className='text-3xl font-bold text-[#000000] mb-2'>
            Registro de <span className='text-emerald-600'>Scout</span>
          </h1>
          <p className='text-[#6d6d6d]'>Únete a nuestra red de scouts profesionales</p>
        </div>

        {/* Progress Indicator */}
        <div className='flex items-center justify-center mb-12'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center'>
              <div className='w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg'>
                <span className='text-white text-sm font-bold'>1</span>
              </div>
              <span className='ml-3 text-sm text-emerald-600 font-semibold'>Crear cuenta</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-400' />
            <div className='flex items-center'>
              <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center'>
                <span className='text-gray-600 text-sm font-medium'>2</span>
              </div>
              <span className='ml-3 text-sm text-gray-600'>Completar perfil</span>
            </div>
            <ChevronRight className='w-5 h-5 text-gray-400' />
            <div className='flex items-center'>
              <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center'>
                <span className='text-gray-600 text-sm font-medium'>3</span>
              </div>
              <span className='ml-3 text-sm text-gray-600'>Activar cuenta</span>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-8 max-w-5xl mx-auto'>
          {/* Beneficios Scout */}
          <div className='space-y-6'>
            <div className='bg-white rounded-xl shadow-lg border border-emerald-100 p-6'>
              <h2 className='text-xl font-bold text-[#000000] mb-4 flex items-center'>
                <Users className='w-6 h-6 text-emerald-600 mr-2' />
                Beneficios del Plan Scout
              </h2>

              <div className='space-y-4'>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0'>
                    <Eye className='w-4 h-4 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-[#000000]'>Perfil Verificado</h3>
                    <p className='text-sm text-[#6d6d6d]'>
                      Obtén visibilidad como scout profesional en nuestra plataforma
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0'>
                    <FileText className='w-4 h-4 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-[#000000]'>Publica Reportes</h3>
                    <p className='text-sm text-[#6d6d6d]'>
                      Comparte tus análisis y descubrimientos con clubes y agentes
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0'>
                    <TrendingUp className='w-4 h-4 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-[#000000]'>Portfolio de Jugadores</h3>
                    <p className='text-sm text-[#6d6d6d]'>
                      Construye tu historial de jugadores descubiertos y recomendados
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Precio - Eliminado y reemplazado por mensaje de aprobación */}
            <div className='bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white'>
              <div className='text-center'>
                <p className='text-emerald-100 mb-1'>Plan Scout</p>
                <div className='flex items-baseline justify-center'>
                  <span className='text-2xl font-bold'>Acceso por Aprobación</span>
                </div>
                <p className='text-emerald-100 text-sm mt-2'>
                  El acceso a la plataforma se concede tras la revisión de tu perfil por nuestro
                  equipo.
                </p>
              </div>

              <div className='mt-4 pt-4 border-t border-emerald-400'>
                <p className='text-sm text-center text-emerald-100'>
                  Incluye acceso a Wonderkids + Torneos
                  <br />
                  <span className='font-semibold text-white'>Sin coste inicial</span>
                </p>
              </div>
            </div>

            {/* Info adicional */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-800'>
                <strong>¿Ya tienes cuenta?</strong>
                <br />
                Si ya eres miembro de Scoutea, puedes solicitar convertirte en Scout desde tu panel
                de usuario.
              </p>
            </div>
          </div>

          {/* Registration Form */}
          <div className='w-full'>
            <div className='bg-white rounded-xl shadow-2xl border border-emerald-100 overflow-hidden'>
              <div className='p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center'>
                <h2 className='text-xl font-bold mb-2'>Paso 1 de 3</h2>
                <p className='text-white/90'>Crea tu cuenta de Scout</p>
              </div>

              <div className='p-6'>
                <SignUp
                  path='/register/scout'
                  routing='path'
                  signInUrl='/login'
                  afterSignUpUrl='/register/scout/complete-profile'
                  redirectUrl='/register/scout/complete-profile'
                  appearance={{
                    variables: {
                      colorPrimary: '#059669',
                      colorBackground: 'transparent',
                      colorText: '#000000',
                      colorTextSecondary: '#6d6d6d',
                      colorInputBackground: '#ffffff',
                      colorInputText: '#000000',
                      borderRadius: '8px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    },
                    elements: {
                      card: 'shadow-none border-0 bg-transparent',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg h-12',
                      socialButtonsBlockButtonText: 'font-medium',
                      formButtonPrimary:
                        'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 h-12',
                      formFieldInput:
                        'border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-12',
                      formFieldLabel: 'text-gray-700 font-medium mb-2',
                      footerActionLink: 'text-emerald-600 hover:text-emerald-700 font-medium',
                      dividerLine: 'bg-gray-300',
                      dividerText: 'text-gray-500',
                      formFieldErrorText: 'text-red-600 text-sm',
                      identityPreviewText: 'text-gray-600',
                      formResendCodeLink: 'text-emerald-600 hover:text-emerald-700',
                      footer: 'hidden',
                      footerAction: 'hidden',
                    },
                  }}
                />
              </div>
            </div>

            {/* Login Link */}
            <div className='text-center mt-6'>
              <p className='text-[#6d6d6d] text-sm'>
                ¿Ya tienes una cuenta?{' '}
                <Link
                  href='/login'
                  className='text-emerald-600 hover:text-emerald-700 font-medium transition-colors'
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className='mt-12 text-center'>
          <div className='flex justify-center space-x-8 text-sm text-[#6d6d6d]'>
            <Link href='/privacy' className='hover:text-emerald-600 transition-colors'>
              Política de Privacidad
            </Link>
            <Link href='/terms' className='hover:text-emerald-600 transition-colors'>
              Términos de Servicio
            </Link>
            <Link href='/support' className='hover:text-emerald-600 transition-colors'>
              Soporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
