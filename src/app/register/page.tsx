import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8c1a10] to-[#6d1410] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-white.svg" 
            alt="Scoutea Logo" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            Únete a Scoutea
          </h1>
          <p className="text-white/80">
            Crea tu cuenta y descubre el futuro del fútbol
          </p>
        </div>
        
        {/* Register Form */}
        <SignUp 
          path="/register"
          routing="hash"
          redirectUrl="/member/welcome"
          appearance={{
            variables: {
              colorPrimary: '#8c1a10', // Scoutea red
              colorBackground: '#ffffff',
              colorText: '#000000',
              colorTextSecondary: '#6d6d6d',
              colorInputBackground: '#ffffff',
              colorInputText: '#000000',
              borderRadius: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            elements: {
              card: "shadow-2xl border-0 bg-white rounded-xl",
              headerTitle: "text-xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700",
              socialButtonsBlockButtonText: "font-medium",
              formButtonPrimary: "bg-[#8c1a10] hover:bg-[#6d1410] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200",
              formFieldInput: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent",
              formFieldLabel: "text-gray-700 font-medium",
              footerActionLink: "text-[#8c1a10] hover:text-[#6d1410] font-medium",
              dividerLine: "bg-gray-300",
              dividerText: "text-gray-500",
              formFieldErrorText: "text-red-600",
              identityPreviewText: "text-gray-600",
              formResendCodeLink: "text-[#8c1a10] hover:text-[#6d1410]",
              
              // Elementos específicos de Clerk que pueden tener sombra
              "cl-signUp-start": "shadow-none",
              "cl-internal-csdyct": "shadow-none",
            }
          }}
        />
        
        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              href="/login" 
              className="text-white font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
          
          <div className="mt-4 flex justify-center space-x-6 text-xs text-white/60">
            <Link href="/privacy" className="hover:text-white/80">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-white/80">
              Términos
            </Link>
            <Link href="/support" className="hover:text-white/80">
              Soporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}