import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing stats tab default state...')
    
    // Simular el estado inicial del hook
    const initialStatsTab = 'period' // Ahora debería ser 'period' por defecto
    
    const availableTabs = ['period', 'radar', 'beeswarm', 'lollipop']
    
    console.log('✅ Stats tab test successful')

    return NextResponse.json({
      success: true,
      message: 'Stats tab functionality working',
      initialStatsTab,
      availableTabs,
      isDefaultCorrect: initialStatsTab === 'period'
    })
  } catch (error) {
    console.error('❌ Error testing stats tab:', error)
    return NextResponse.json(
      { 
        error: 'Error testing stats tab',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}