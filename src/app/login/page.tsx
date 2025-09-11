import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-6">
            <img 
              src="/logo-member.svg" 
              alt="Scoutea" 
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
        
        {/* Login Form */}
        <SignIn 
          routing="hash"
          redirectUrl="/member/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#2563eb', // blue-600
              colorBackground: 'transparent',
              colorText: '#1e40af', // blue-800
              colorTextSecondary: '#3b82f6', // blue-500
              colorInputBackground: 'rgba(255, 255, 255, 0.9)',
              colorBorder: 'rgba(59, 130, 246, 0.3)',
              colorInputText: '#1e40af',
              borderRadius: '0.75rem',
            },
            elements: {
              // Card principal
              card: "bg-transparent shadow-none border-0",
              
              // Header - personalizar títulos
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              
              // Formulario
              formFieldLabel: "text-blue-800 font-medium text-sm",
              formFieldInput: "bg-white/90 border border-blue-200 text-blue-800 placeholder:text-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg h-12 px-4 transition-all duration-200",
              
              // Botón principal
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
              
              // Botones sociales
              socialButtonsBlockButton: "bg-white/90 border border-blue-200 text-blue-800 hover:bg-blue-50 transition-all duration-200 rounded-lg h-12",
              
              // Enlaces del footer - ocultar enlace predeterminado
              footerActionLink: "hidden",
              
              // Separadores
              dividerLine: "bg-blue-300",
              dividerText: "text-blue-500",
              
              // Mensajes de error
              formFieldError: "text-red-500 text-sm",
              
              // Checkbox
              formFieldInputShowPasswordButton: "text-blue-800 hover:text-blue-600",
              
              // Otros elementos
              formFieldInput__otp: "bg-white/90 border border-blue-200 text-blue-800 text-center text-lg font-mono tracking-widest",
              formFieldInput__phoneNumber: "bg-white/90 border border-blue-200 text-blue-800",
              
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
              "cl-formFieldLabel": "text-blue-800 font-medium text-sm",
              "cl-formFieldInput": "bg-white/90 border border-blue-200 text-blue-800 placeholder:text-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg h-12 px-4 transition-all duration-200",
              "cl-formButtonPrimary": "bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-none",
              
              // Elementos específicos de Clerk que pueden tener sombra
              "cl-signIn-start": "shadow-none",
              "cl-internal-csdyct": "shadow-none",
            }
          }}
        />
        
        {/* Enlaces */}
        <div className="text-center space-y-2">
          <p className="text-blue-600 text-sm">
            ¿No tienes cuenta?{' '}
            <Link 
              href="/register" 
              className="text-blue-700 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Regístrate aquí
            </Link>
          </p>
          <p className="text-blue-600 text-sm">
            ¿Eres administrador?{' '}
            <Link 
              href="/admin-login" 
              className="text-blue-700 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Acceso administrativo
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
