import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 Getting sample scouts from database...')
    
    // Obtener algunos scouts de ejemplo
    const scouts = await prisma.scout.findMany({
      take: 10,
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        country: true,
        nationality: true,
        scout_level: true,
        scout_ranking: true,
        total_reports: true
      },
      orderBy: { scout_ranking: 'asc' }
    })

    const totalScouts = await prisma.scout.count()

    console.log('✅ Found scouts:', scouts.length, 'of', totalScouts)

    return NextResponse.json({
      success: true,
      totalScouts,
      sampleScouts: scouts
    })
  } catch (error) {
    console.error('❌ Error getting scouts:', error)
    return NextResponse.json(
      { 
        error: 'Error getting scouts',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}