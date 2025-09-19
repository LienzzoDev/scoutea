import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#080F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-6">
            <img src="/logo.png" alt="Scoutea" className="h-16 w-auto object-contain" />
          </div>
        </div>

        {/* Título personalizado */}
        <div className="text-center mb-3">
          <h1 className="text-white text-lg font-semibold">Admin Login</h1>
        </div>
        
        {/* Login Form */}
        <SignIn 
          routing="hash"
          redirectUrl="/admin/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#f97316', // orange-500
              colorBackground: 'transparent',
              colorText: '#ffffff',
              colorTextSecondary: '#cbd5e1', // slate-300
              colorInputBackground: 'rgba(255, 255, 255, 0.1)',
              colorBorder: 'rgba(255, 255, 255, 0.2)',
              colorInputText: '#ffffff',
              borderRadius: '0.75rem',
            },
            elements: {
              // Card principal
              card: "bg-transparent shadow-none border-0",
              
              // Header - personalizar títulos
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              
              // Formulario
              formFieldLabel: "text-white font-medium text-sm",
              formFieldInput: "bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg h-12 px-4 transition-all duration-200",
              
              // Botón principal
              formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
              
              // Botones sociales
              socialButtonsBlockButton: "bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 rounded-lg h-12",
              
              // Enlaces del footer - ocultar enlace predeterminado
              footerActionLink: "hidden",
              
              // Separadores
              dividerLine: "bg-white/20",
              dividerText: "text-slate-400",
              
              // Mensajes de error
              formFieldError: "text-red-400 text-sm",
              
              // Checkbox
              formFieldInputShowPasswordButton: "text-white hover:text-orange-400",
              
              // Otros elementos
              formFieldInput__otp: "bg-white/10 border border-white text-white text-center text-lg font-mono tracking-widest",
              formFieldInput__phoneNumber: "bg-white/10 border border-white/20 text-white",
              
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
              "cl-formFieldLabel": "text-white font-medium text-sm",
              "cl-formFieldInput": "bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg h-12 px-4 transition-all duration-200",
              "cl-formButtonPrimary": "bg-orange-500 hover:bg-orange-600 text-white font-semibold h-12 rounded-lg transition-all duration-200 shadow-none",
              
              // Elementos específicos de Clerk que pueden tener sombra
              "cl-signIn-start": "shadow-none",
              "cl-internal-csdyct": "shadow-none",
            }
          }}
        />
        
        {/* Enlace al registro */}
        <div className="text-center">
          <p className="text-slate-300 text-sm">
            ¿No tienes cuenta?{' '}
            <Link 
              href="/register" 
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
