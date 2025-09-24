import type { Metadata } from 'next'
import { 
  BarChart3, 
  Target, 
  TrendingUp
} from 'lucide-react'

import PlanSelector from '@/components/homepage/PlanSelector'

export const metadata: Metadata = {
  title: 'Scoutea - Plataforma de Scouting de Fútbol',
  description: 'La plataforma más avanzada para scouts, analistas y profesionales del fútbol. Accede a datos detallados de miles de jugadores y toma decisiones informadas.',
  keywords: 'scouting, fútbol, análisis, jugadores, estadísticas',
  openGraph: {
    title: 'Scoutea - Plataforma de Scouting de Fútbol',
    description: 'La plataforma más avanzada para scouts, analistas y profesionales del fútbol.',
    type: 'website',
  },
}

export default function HomePage() {
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
          
          <PlanSelector plans={plans} />
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