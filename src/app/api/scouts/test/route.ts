import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 Testing scouts in database...')
    
    // Contar scouts
    const count = await prisma.scout.count()
    console.log('📊 Total scouts in database:', count)

    // Obtener algunos scouts de ejemplo
    const scouts = await prisma.scout.findMany({
      take: 5,
      select: {
        id_scout: true,
        scout_name: true,
        nationality: true,
        scout_level: true,
        scout_elo: true,
        open_to_work: true
      },
      orderBy: { scout_elo: 'desc' }
    })

    console.log('✅ Sample scouts:', scouts)

    return NextResponse.json({
      success: true,
      totalScouts: count,
      sampleScouts: scouts
    })
  } catch (error) {
    console.error('❌ Error testing scouts:', error)
    return NextResponse.json(
      { 
        error: 'Error testing scouts',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}