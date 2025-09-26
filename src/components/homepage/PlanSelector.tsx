'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crown, ArrowRight } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: { monthly: number; yearly: number }
  description: string
  features: string[]
  popular: boolean
  color: string
}

interface PlanSelectorProps {
  plans: Plan[]
}

export default function PlanSelector({ plans }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Load selected plan from localStorage if available
    const savedPlan = localStorage.getItem('selectedPlan')
    if (savedPlan) {
      setSelectedPlan(savedPlan)
    }
  }, [])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    localStorage.setItem('selectedPlan', planId)
  }

  const handleSubscribe = () => {
    if (selectedPlan) {
      router.push('/register?plan=' + selectedPlan)
    } else {
      router.push('/register')
    }
  }

  const handleSubscribeLater = () => {
    localStorage.removeItem('selectedPlan')
    router.push('/register')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* CTA Buttons */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <button 
          onClick={handleSubscribe}
          disabled={!selectedPlan}
          className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedPlan ? `Registrarse como ${plans.find(p => p.id === selectedPlan)?.name}` : 'Selecciona tu Rol'}
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
        <button 
          onClick={handleSubscribeLater}
          className="border border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
        >
          Decidir más tarde
        </button>
        <button 
          onClick={handleLogin}
          className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
        >
          Iniciar Sesión
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-300 hover:shadow-2xl rounded-lg border bg-white shadow-sm ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-[#8c1a10] shadow-xl scale-105' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full border inline-flex items-center text-xs font-semibold">
                  <Crown className="w-4 h-4 mr-1" />
                  Más Popular
                </div>
              </div>
            )}
            
            <div className="text-center pb-4 flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-bold text-[#000000] mb-2">
                {plan.name}
              </h3>
              <p className="text-[#6d6d6d] mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-[#8c1a10]">
                    ${plan.price.monthly}
                  </span>
                  <span className="text-[#6d6d6d] ml-1">/mes</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  ${plan.price.yearly}/mes si pagas anualmente (20% descuento)
                </p>
              </div>
            </div>
            
            <div className="p-6 pt-0">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-[#6d6d6d]">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 ${
                  selectedPlan === plan.id 
                    ? 'bg-[#8c1a10] hover:bg-[#6d1410] text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlanSelect(plan.id)
                }}
              >
                {selectedPlan === plan.id ? `✓ ${plan.name} Seleccionado` : `Elegir ${plan.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-[#000000] mb-4">
          ¿Listo para unirte?
        </h2>
        <p className="text-[#6d6d6d] mb-6">
          Únete a cientos de profesionales del fútbol que ya forman parte de nuestra comunidad
        </p>
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={handleSubscribe}
            disabled={!selectedPlan}
            className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedPlan ? `Comenzar como ${plans.find(p => p.id === selectedPlan)?.name}` : 'Selecciona tu Rol'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <button 
            onClick={handleSubscribeLater}
            className="border border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
          >
            Explorar primero
          </button>
          <button 
            onClick={handleLogin}
            className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </>
  )
}