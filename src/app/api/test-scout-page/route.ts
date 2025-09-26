import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing scout page functionality...')
    
    // Simular datos de scout para prueba
    const mockScout = {
      id: "scout-1",
      name: "Carlos Rodríguez",
      country: "Spain",
      rating: "Expert",
      rank: "Rank 15"
    }

    console.log('✅ Scout page test successful')

    return NextResponse.json({
      success: true,
      message: 'Scout page functionality working',
      mockScout
    })
  } catch (error) {
    console.error('❌ Error testing scout page:', error)
    return NextResponse.json(
      { 
        error: 'Error testing scout page',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}