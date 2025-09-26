'use client'

import { SignUp } from '@clerk/nextjs'
import { ChevronRight, UserPlus, User, Target } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    const plan = searchParams.get('plan') || localStorage.getItem('selectedPlan') || ''
    setSelectedPlan(plan)
  }, [searchParams])

  const getPlanInfo = (plan: string) => {
    const info = {
      member: {
        name: 'Miembro',
        description: 'Para analistas y profesionales del fútbol',
        color: 'from-blue-500 to-blue-600'
      },
      scout: {
        name: 'Scout', 
        description: 'Para scouts profesionales',
        color: 'from-green-500 to-green-600'
      }
    }
    return info[plan as keyof typeof info] || { name: 'Plan', description: '', color: 'from-gray-500 to-gray-600' }
  }

  const planInfo = getPlanInfo(selectedPlan)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-member.svg" 
            alt="Scoutea Logo" 
            className="h-12 mx-auto mb-4"
          />
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#8c1a10] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <span className="ml-3 text-sm text-[#8c1a10] font-semibold">Crear cuenta</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">2</span>
              </div>
              <span className="ml-3 text-sm text-gray-600">Completar perfil</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">3</span>
              </div>
              <span className="ml-3 text-sm text-gray-600">Confirmar rol</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          {/* Registration Form */}
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-2xl border border-[#e7e7e7] overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] text-white text-center">
                <h2 className="text-xl font-bold mb-2">Paso 1 de 3</h2>
                <p className="text-white/90">Crea tu cuenta</p>
              </div>
              
              <div className="p-6">
                <SignUp 
                  path="/register"
                  routing="path"
                  redirectUrl={selectedPlan ? `/member/complete-profile?plan=${selectedPlan}` : "/member/complete-profile"}
                  appearance={{
                    variables: {
                      colorPrimary: '#8c1a10',
                      colorBackground: 'transparent',
                      colorText: '#000000',
                      colorTextSecondary: '#6d6d6d',
                      colorInputBackground: '#ffffff',
                      colorInputText: '#000000',
                      borderRadius: '8px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    },
                    elements: {
                      card: "shadow-none border-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg h-12",
                      socialButtonsBlockButtonText: "font-medium",
                      formButtonPrimary: "bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 h-12",
                      formFieldInput: "border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent h-12",
                      formFieldLabel: "text-gray-700 font-medium mb-2",
                      footerActionLink: "text-[#8c1a10] hover:text-[#6d1410] font-medium",
                      dividerLine: "bg-gray-300",
                      dividerText: "text-gray-500",
                      formFieldErrorText: "text-red-600 text-sm",
                      identityPreviewText: "text-gray-600",
                      formResendCodeLink: "text-[#8c1a10] hover:text-[#6d1410]",
                      footer: "hidden",
                      footerAction: "hidden",
                    }
                  }}
                />
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-[#6d6d6d] text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link 
                  href="/login" 
                  className="text-[#8c1a10] hover:text-[#6d1410] font-medium transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex justify-center space-x-8 text-sm text-[#6d6d6d]">
            <Link href="/privacy" className="hover:text-[#8c1a10] transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/terms" className="hover:text-[#8c1a10] transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/support" className="hover:text-[#8c1a10] transition-colors">
              Soporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}