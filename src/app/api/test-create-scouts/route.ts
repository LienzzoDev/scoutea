import { NextResponse } from 'next/server'
import { createSampleScouts } from '@/scripts/create-sample-scouts'

export async function GET() {
  try {
    console.log('🧪 Test endpoint: Creating sample scouts...')
    
    const result = await createSampleScouts()
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint executed',
      result
    })
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Error en test endpoint',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}