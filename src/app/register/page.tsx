'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignUp, SignUp, useAuth } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Check, 
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building,
  Briefcase,
  Phone,
  Crown
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isSignedIn } = useAuth()
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [registrationStep, setRegistrationStep] = useState(() => {
    const step = searchParams.get('step')
    return step ? parseInt(step) : 1
  })

  // Función para asignar rol member después del registro
  const assignMemberRole = async () => {
    try {
      const updateResponse = await fetch('/api/user/update-clerk-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'member',
          profile: 'incomplete' // Por defecto incompleto hasta el paso 2
        })
      })
      
      if (updateResponse.ok) {
        const responseData = await updateResponse.json()
        setRegistrationStep(2)
      } else {
        const errorData = await updateResponse.json()
        console.error('❌ Error asignando rol member:', errorData)
        setRegistrationStep(2) // Avanzar de todas formas
      }
    } catch (metadataError) {
      console.error('❌ Error asignando rol member:', metadataError)
      setRegistrationStep(2) // Avanzar de todas formas
    }
  }

  // Detectar cuando el usuario se ha registrado exitosamente
  useEffect(() => {
    if (isSignedIn && registrationStep === 1) {
      assignMemberRole()
    }
  }, [isSignedIn, registrationStep])

  // Manejar parámetro de URL para los pasos
  useEffect(() => {
    const step = searchParams.get('step')
    if (step === '2' && isSignedIn) {
      assignMemberRole()
    } else if (step === '3' && isSignedIn) {
      // Cargar plan seleccionado del localStorage si existe
      const savedPlan = localStorage.getItem('selectedPlan')
      if (savedPlan) {
        setSelectedPlan(savedPlan)
      }
    }
  }, [searchParams, isSignedIn])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [registrationData, setRegistrationData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    position: ''
  })

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfecto para empezar',
      price: {
        monthly: 10,
        yearly: 8
      },
      features: [
        'Acceso a base de datos de jugadores',
        'Búsqueda básica y filtros',
        'Perfiles de jugadores detallados',
        'Comparaciones básicas',
        'Soporte por email',
        'Actualizaciones mensuales'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para profesionales serios',
      price: {
        monthly: 20,
        yearly: 17
      },
      popular: true,
      features: [
        'Todo lo de Basic',
        'Análisis avanzados y estadísticas',
        'Reportes personalizados',
        'API access',
        'Soporte prioritario 24/7',
        'Actualizaciones semanales',
        'Exportación de datos',
        'Integración con herramientas externas'
      ]
    }
  ]

  useEffect(() => {
    // Leer plan seleccionado desde URL params o localStorage
    const planFromUrl = searchParams.get('plan')
    const planFromStorage = localStorage.getItem('selectedPlan')
    
    if (planFromUrl) {
      setSelectedPlan(planFromUrl)
      localStorage.setItem('selectedPlan', planFromUrl)
    } else if (planFromStorage) {
      setSelectedPlan(planFromStorage)
    }
  }, [searchParams])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    localStorage.setItem('selectedPlan', planId)
  }

  const handleRegistrationStep = (step: number) => {
    setRegistrationStep(step)
    // Actualizar la URL para reflejar el paso actual
    const url = new URL(window.location.href)
    url.searchParams.set('step', step.toString())
    window.history.replaceState({}, '', url.toString())
  }

  const handleRegistrationData = (field: string, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStep1Submit = async () => {
    if (!isLoaded || !signUp) {
      setError('Clerk no está cargado correctamente. Intenta recargar la página.')
      return
    }

    // Validar campos del paso 1
    if (!registrationData.email || !registrationData.password) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      
      // Crear usuario en Clerk con timeout
      const createPromise = signUp.create({
        emailAddress: registrationData.email,
        password: registrationData.password,
        firstName: registrationData.firstName || '',
        lastName: registrationData.lastName || ''
      } as any)

      // Timeout de 30 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), 30000)
      })

      const result = await Promise.race([createPromise, timeoutPromise]) as any

      if (result.status === 'complete') {
        // Activar la sesión del usuario
        await setActive({ session: result.createdSessionId })
        
        // Asignar rol member inmediatamente después de crear el usuario
        try {
          
          const updateResponse = await fetch('/api/user/update-clerk-metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: 'member',
              profile: 'incomplete' // Por defecto incompleto hasta el paso 2
            })
          })
          
          if (updateResponse.ok) {
            const responseData = await updateResponse.json()
          } else {
            const errorData = await updateResponse.json()
            console.error('❌ Error asignando rol member:', errorData)
          }
        } catch (metadataError) {
          console.error('❌ Error asignando rol member:', metadataError)
        }
        
        // Avanzar al paso 2 para completar el perfil
        setRegistrationStep(2)
      } else if (result.status === 'missing_requirements') {
        setError('Faltan campos requeridos: ' + result.missingFields.join(', '))
      } else if (result.status === 'incomplete') {
        setError('Por favor verifica tu email antes de continuar')
      } else {
        setError('Error inesperado en el registro. Estado: ' + result.status)
      }
    } catch (err: any) {
      console.error('Error detallado en el registro:', err)
      console.error('Errores específicos:', err.errors)
      
      let errorMessage = 'Error al crear la cuenta'
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToPlans = () => {
    router.push('/')
  }


  const handleCompleteProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
        company: registrationData.company,
        position: registrationData.position
      })
      
      const updateResponse = await fetch('/api/user/update-clerk-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'member', // Mantener el rol existente
          profile: 'completed', // ← Marcar como completado
          phone: registrationData.phone,
          company: registrationData.company,
          position: registrationData.position
        })
      })
      
      if (updateResponse.ok) {
        const responseData = await updateResponse.json()
        setProfileCompleted(true)
        handleRegistrationStep(3)
      } else {
        const errorData = await updateResponse.json()
        console.error('❌ Error completando perfil:', errorData)
        setError('Error al completar el perfil. Inténtalo de nuevo.')
      }
    } catch (profileError) {
      console.error('❌ Error completando perfil:', profileError)
      setError('Error al completar el perfil. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      
      const updateResponse = await fetch('/api/user/update-clerk-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'member', // Mantener el rol existente
          profile: 'incomplete' // ← Marcar como incompleto
        })
      })
      
      if (updateResponse.ok) {
        const responseData = await updateResponse.json()
        setProfileCompleted(false)
        handleRegistrationStep(3)
      } else {
        const errorData = await updateResponse.json()
        console.error('❌ Error omitiendo perfil:', errorData)
        setError('Error al omitir el perfil. Inténtalo de nuevo.')
      }
    } catch (profileError) {
      console.error('❌ Error omitiendo perfil:', profileError)
      setError('Error al omitir el perfil. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      
      {/* Header */}
      <div className="bg-[#f2f1ed] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo-member.svg" alt="Scoutea" className="h-12 w-42" />
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToPlans}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Volver a planes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  registrationStep >= step 
                    ? 'bg-[#8c1a10] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-24 h-2 mx-4 rounded-full ${
                    registrationStep > step ? 'bg-[#8c1a10]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Info - Componente oficial de Clerk */}
        {registrationStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center pb-6">
              <h2 className="text-3xl font-bold text-[#000000]">
                Crear tu cuenta
              </h2>
              <p className="text-[#6d6d6d] text-lg">
                Completa tu registro con el formulario oficial
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <SignUp 
                  routing="hash"
                  afterSignUpUrl="/register?step=2"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold h-12 rounded-lg transition-all duration-200 text-lg',
                      card: 'bg-transparent shadow-none border-none',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      formFieldInput: 'bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-12 text-lg',
                      formFieldLabel: 'text-[#000000] font-medium text-lg',
                      footerActionLink: 'hidden',
                      identityPreviewText: 'text-[#6d6d6d]',
                      formResendCodeLink: 'text-[#8c1a10] hover:text-[#6d1410] font-semibold',
                      socialButtonsBlock: 'hidden',
                      divider: 'hidden',
                      // Posicionar el CAPTCHA debajo de los campos
                      formFooter: 'mt-4',
                      captcha: 'mt-4 flex justify-center'
                    },
                    // Configuración específica para el CAPTCHA
                    captcha: {
                      theme: 'light',
                      size: 'normal',
                      language: 'es-ES'
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-[#6d6d6d] text-sm">
                ¿Ya tienes cuenta?{' '}
                <a 
                  href="/login" 
                  className="text-[#8c1a10] hover:text-[#6d1410] font-semibold"
                >
                  Inicia sesión
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Profile Info */}
        {registrationStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center pb-6">
              <h2 className="text-3xl font-bold text-[#000000]">
                Completa tu perfil
              </h2>
              <p className="text-[#6d6d6d] text-lg">
                Cuéntanos más sobre ti para personalizar tu experiencia
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-[#000000] font-medium text-lg">
                    Nombre *
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Tu nombre"
                      value={registrationData.firstName}
                      onChange={(e) => handleRegistrationData('firstName', e.target.value)}
                      className="pl-12 bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-14 text-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-[#000000] font-medium text-lg">
                    Apellido *
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Tu apellido"
                      value={registrationData.lastName}
                      onChange={(e) => handleRegistrationData('lastName', e.target.value)}
                      className="pl-12 bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-14 text-lg"
                      required
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-[#000000] font-medium text-lg">
                  Teléfono (opcional)
                </Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+34 123 456 789"
                    value={registrationData.phone}
                    onChange={(e) => handleRegistrationData('phone', e.target.value)}
                    className="pl-12 bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-14 text-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company" className="text-[#000000] font-medium text-lg">
                  Empresa (opcional)
                </Label>
                <div className="relative mt-2">
                  <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Tu empresa"
                    value={registrationData.company}
                    onChange={(e) => handleRegistrationData('company', e.target.value)}
                    className="pl-12 bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-14 text-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="position" className="text-[#000000] font-medium text-lg">
                  Posición (opcional)
                </Label>
                <div className="relative mt-2">
                  <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="position"
                    type="text"
                    placeholder="Scout, Analista, etc."
                    value={registrationData.position}
                    onChange={(e) => handleRegistrationData('position', e.target.value)}
                    className="pl-12 bg-white border-[#e7e7e7] text-[#000000] placeholder:text-[#6d6d6d] focus:border-[#8c1a10] focus:ring-2 focus:ring-[#8c1a10]/20 rounded-lg h-14 text-lg"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleRegistrationStep(1)}
                    variant="outline"
                    className="flex-1 border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold h-14 rounded-lg transition-all duration-200 text-lg"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Volver
                  </Button>
                  <Button
                    onClick={handleCompleteProfile}
                    disabled={!registrationData.firstName || !registrationData.lastName || isLoading}
                    className="flex-1 bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold h-14 rounded-lg transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Completando...' : 'Completar Perfil'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
                <Button
                  onClick={handleSkipProfile}
                  disabled={isLoading}
                  variant="ghost"
                  className="w-full text-[#6d6d6d] hover:text-[#8c1a10] font-medium h-12 rounded-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Omitiendo...' : 'Omitir por ahora'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Plan Selection */}
        {registrationStep === 3 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#000000] mb-4">
                Selecciona tu plan
              </h2>
              <p className="text-[#6d6d6d] text-lg">
                Elige el plan que mejor se adapte a tus necesidades
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-[#8c1a10] shadow-xl scale-105' 
                      : plan.popular 
                      ? 'border border-[#8c1a10] shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1">
                        <Crown className="w-4 h-4 mr-1" />
                        Más Popular
                      </div>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-[#000000]">
                      {plan.name}
                    </CardTitle>
                    <p className="text-[#6d6d6d] text-lg">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-[#8c1a10]">
                        ${plan.price.monthly}
                      </span>
                      <span className="text-[#6d6d6d] ml-2 text-lg">/mes</span>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      ${plan.price.yearly}/mes si pagas anualmente (20% descuento)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-[#6d6d6d]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full h-12 text-lg ${
                        selectedPlan === plan.id 
                          ? 'bg-[#8c1a10] hover:bg-[#6d1410] text-white' 
                          : plan.popular
                          ? 'bg-[#8c1a10] hover:bg-[#6d1410] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlanSelect(plan.id)
                      }}
                    >
                      {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex gap-4 max-w-2xl mx-auto">
              <Button
                onClick={() => handleRegistrationStep(2)}
                variant="outline"
                className="flex-1 border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold h-14 rounded-lg transition-all duration-200 text-lg"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Volver
              </Button>
              <Button
                onClick={async () => {
                  try {
                    console.log('💳 Iniciando proceso de pago para plan:', selectedPlan)
                    
                    // Crear sesión de checkout de Stripe directamente
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        plan: selectedPlan || 'basic',
                        billing: 'monthly' // Por defecto mensual, se puede cambiar después
                      })
                    })

                    if (!response.ok) {
                      throw new Error('Error al crear sesión de pago')
                    }

                    const { url } = await response.json()
                    
                    if (url) {
                      // Redirigir directamente a Stripe
                      window.location.href = url
                    } else {
                      throw new Error('No se recibió URL de pago')
                    }
                  } catch (error) {
                    console.error('Error al procesar el pago:', error)
                    // Fallback: redirigir a la página de planes
                    router.push(`/member/subscription-plans?plan=${selectedPlan || 'basic'}`)
                  }
                }}
                disabled={!selectedPlan}
                className="flex-1 bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold h-14 rounded-lg transition-all duration-200 text-lg disabled:opacity-50"
              >
                Continuar al pago
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}