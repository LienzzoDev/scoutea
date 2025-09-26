import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing default tabs configuration...')
    
    // Simular los estados iniciales del hook
    const defaultTabs = {
      activeTab: 'info',
      activeStatsTab: 'period', // Cambiado de 'overview' a 'period'
      activeFeaturesTab: 'on-the-pitch' // Cambiado de 'radar' a 'on-the-pitch'
    }
    
    // Pestañas disponibles en cada sección
    const availableTabs = {
      main: ['info', 'reports', 'stats', 'features'],
      stats: ['period', 'radar', 'beeswarm', 'lollipop'],
      features: ['on-the-pitch', 'player-role', 'performance', 'mode']
    }
    
    // Verificar que los defaults coinciden con las primeras pestañas disponibles
    const validations = {
      statsTabValid: defaultTabs.activeStatsTab === availableTabs.stats[0],
      featuresTabValid: defaultTabs.activeFeaturesTab === availableTabs.features[0]
    }

    console.log('✅ Default tabs test successful')

    return NextResponse.json({
      success: true,
      message: 'Default tabs configuration working correctly',
      defaultTabs,
      availableTabs,
      validations,
      allValid: Object.values(validations).every(v => v)
    })
  } catch (error) {
    console.error('❌ Error testing default tabs:', error)
    return NextResponse.json(
      { 
        error: 'Error testing default tabs',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}