'use client'

import { 
  Check, 
  BarChart3, 
  Target, 
  TrendingUp,
  ArrowRight,
  Crown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando...</p>
        </div>
      </div>
    )
  }
  const _router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 10, yearly: 8 },
      description: 'Perfecto para empezar',
      features: [
        'Acceso a base de datos de jugadores',
        'Búsqueda básica y filtros',
        'Perfiles de jugadores detallados',
        'Comparaciones básicas',
        'Soporte por email',
        'Actualizaciones mensuales'
      ],
      popular: false,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: { monthly: 20, yearly: 17 },
      description: 'Para profesionales serios',
      features: [
        'Todo lo de Basic',
        'Análisis avanzados y estadísticas',
        'Reportes personalizados',
        'API access',
        'Soporte prioritario 24/7',
        'Actualizaciones semanales',
        'Exportación de datos',
        'Integración con herramientas externas'
      ],
      popular: true,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    // Almacenar en localStorage
    localStorage.setItem('selectedPlan', planId)
  }

  const handleSubscribe = () => {
    if (selectedPlan) {
      // Redirigir al registro con plan seleccionado
      _router.push('/register?plan=' + selectedPlan)
    } else {
      // Redirigir al registro sin plan
      _router.push('/register')
    }
  }

  const handleSubscribeLater = () => {
    // Limpiar plan seleccionado y redirigir
    localStorage.removeItem('selectedPlan')
    _router.push('/register')
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e0]">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#000000] mb-6">
            Descubre el Futuro del
            <span className="text-[#8c1a10]"> Scouting</span>
          </h1>
          <p className="text-xl text-[#6d6d6d] mb-8 max-w-3xl mx-auto">
            La plataforma más avanzada para scouts, analistas y profesionales del fútbol. 
            Accede a datos detallados de miles de jugadores y toma decisiones informadas.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button 
              onClick={handleSubscribe}
              disabled={!selectedPlan}
              className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
            >
              {selectedPlan ? `Suscribirse - Plan ${plans.find(p => p.id === selectedPlan)?.name}` : 'Selecciona un Plan'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button 
              onClick={handleSubscribeLater}
              className="border border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
            >
              Suscribirse más tarde
            </button>
            <button 
              onClick={() =>_router.push('/login')}
              className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center">
              Iniciar Sesión
            </button>
          </div>
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
                  {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#000000] mb-8">
            ¿Por qué elegir Scoutea?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Datos Precisos</h3>
              <p className="text-[#6d6d6d]">
                Información actualizada y verificada de miles de jugadores profesionales
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Análisis Avanzado</h3>
              <p className="text-[#6d6d6d]">
                Herramientas de análisis que te ayudan a tomar mejores decisiones
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8c1a10] to-[#a01e12] rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] mb-2">Actualizaciones Constantes</h3>
              <p className="text-[#6d6d6d]">
                Base de datos que se actualiza regularmente con nueva información
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-[#000000] mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-[#6d6d6d] mb-6">
            Únete a cientos de scouts y analistas que ya confían en Scoutea
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleSubscribe}
              disabled={!selectedPlan}
              className="bg-[#8c1a10] hover:bg-[#6d1410] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
            >
              {selectedPlan ? `Comenzar con ${plans.find(p => p.id === selectedPlan)?.name}` : 'Selecciona un Plan'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button 
              onClick={handleSubscribeLater}
              className="border border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center"
            >
              Explorar primero
            </button>
            <button 
              onClick={() =>_router.push('/login')}
              className="text-[#6d6d6d] hover:text-[#8c1a10] font-semibold px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-[#6d6d6d]">
            <p>&copy; 2024 Scoutea. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}