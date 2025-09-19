import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-6">
            <img src="/logo-member.svg" alt="Scoutea" className="h-16 w-auto object-contain" />
          </div>
        </div>
        
        {/* Login Form */}
        <SignIn 
          routing="hash"
          redirectUrl="/member/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#8c1a10', // Scoutea red
              colorBackground: 'transparent',
              colorText: '#2e3138', // Dark gray
              colorTextSecondary: '#6d6d6d', // Medium gray
              colorInputBackground: 'rgba(255, 255, 255, 0.95)',
              colorBorder: 'rgba(140, 26, 16, 0.2)',
              colorInputText: '#2e3138',
              borderRadius: '0.75rem',
            },
            elements: {
              // Card principal
              card: "bg-transparent shadow-none border-0",
              
              // Header - personalizar títulos
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              
              // Formulario
              formFieldLabel: "text-[#2e3138] font-medium text-sm",
              formFieldInput: "bg-white/95 border border-[#e7e7e7] text-[#2e3138] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-12 px-4 transition-all duration-200",
              
              // Botón principal
              formButtonPrimary: "bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
              
              // Botones sociales
              socialButtonsBlockButton: "bg-white/95 border border-[#e7e7e7] text-[#2e3138] hover:bg-[#f8f7f4] transition-all duration-200 rounded-lg h-12",
              
              // Enlaces del footer - ocultar enlace predeterminado
              footerActionLink: "hidden",
              
              // Separadores
              dividerLine: "bg-[#e7e7e7]",
              dividerText: "text-[#6d6d6d]",
              
              // Mensajes de error
              formFieldError: "text-red-500 text-sm",
              
              // Checkbox
              formFieldInputShowPasswordButton: "text-[#2e3138] hover:text-[#8c1a10]",
              
              // Otros elementos
              formFieldInput__otp: "bg-white/95 border border-[#e7e7e7] text-[#2e3138] text-center text-lg font-mono tracking-widest",
              formFieldInput__phoneNumber: "bg-white/95 border border-[#e7e7e7] text-[#2e3138]",
              
              // Footer y elementos internos - ocultar footer predeterminado
              footer: "hidden",
              footerAction: "hidden",
              
              // Elementos internos de Clerk - ocultar elementos predeterminados
              "cl-footer": "hidden",
              "cl-internal-k20cy": "hidden",
              
              // Otros elementos que puedan aparecer
              "cl-card": "bg-transparent shadow-none",
              "cl-header": "bg-transparent shadow-none",
              "cl-form": "bg-transparent shadow-none",
              "cl-formField": "bg-transparent shadow-none",
              "cl-formFieldLabel": "text-[#2e3138] font-medium text-sm",
              "cl-formFieldInput": "bg-white/95 border border-[#e7e7e7] text-[#2e3138] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-12 px-4 transition-all duration-200",
              "cl-formButtonPrimary": "bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-none",
              
              // Elementos específicos de Clerk que pueden tener sombra
              "cl-signIn-start": "shadow-none",
              "cl-internal-csdyct": "shadow-none",
            }
          }}
        />
        
        {/* Enlaces */}
        <div className="text-center space-y-2">
          <p className="text-[#6d6d6d] text-sm">
            ¿No tienes cuenta?{' '}
            <Link 
              href="/register" 
              className="text-[#8c1a10] hover:text-[#8c1a10]/80 font-medium transition-colors duration-200"
            >
              Regístrate aquí
            </Link>
          </p>
          <p className="text-[#6d6d6d] text-sm">
            ¿Eres administrador?{' '}
            <Link 
              href="/admin-login" 
              className="text-[#8c1a10] hover:text-[#8c1a10]/80 font-medium transition-colors duration-200"
            >
              Acceso administrativo
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
