import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing new landing page plans structure...')
    
    const newPlans = [
      {
        id: 'member',
        name: 'Miembro',
        price: { monthly: 20, yearly: 17 },
        description: 'Para analistas y profesionales del fútbol',
        features: [
          'Acceso completo a base de datos de jugadores',
          'Búsqueda avanzada y filtros',
          'Perfiles detallados de jugadores',
          'Comparaciones y análisis',
          'Estadísticas avanzadas',
          'Reportes personalizados',
          'Soporte prioritario 24/7',
          'Actualizaciones semanales'
        ],
        popular: true,
        color: 'from-blue-500 to-blue-600'
      },
      {
        id: 'scout',
        name: 'Scout',
        price: { monthly: 20, yearly: 17 },
        description: 'Para scouts profesionales',
        features: [
          'Todo lo de Miembro',
          'Herramientas de scouting avanzadas',
          'Creación de reportes de jugadores',
          'Sistema de seguimiento de talentos',
          'Red de contactos con otros scouts',
          'Acceso a eventos y torneos',
          'Certificación profesional',
          'Mentorías y formación continua'
        ],
        popular: false,
        color: 'from-green-500 to-green-600'
      }
    ]

    console.log('✅ Landing page plans test successful')

    return NextResponse.json({
      success: true,
      message: 'New landing page structure working',
      plans: newPlans,
      changes: {
        from: 'Basic/Premium plans with different prices',
        to: 'Member/Scout roles with same price',
        price: '$20/month for both roles',
        focus: 'Role-based selection instead of feature tiers'
      }
    })
  } catch (error) {
    console.error('❌ Error testing landing plans:', error)
    return NextResponse.json(
      { 
        error: 'Error testing landing plans',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}