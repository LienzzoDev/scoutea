import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || ''
    
    console.log('🧪 Testing direct scouts search for term:', term)
    
    if (!term.trim()) {
      return NextResponse.json({
        success: true,
        scouts: [],
        message: 'No search term provided'
      })
    }
    
    // Búsqueda directa en la base de datos
    const scouts = await prisma.scout.findMany({
      where: {
        OR: [
          {
            scout_name: {
              contains: term,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: term,
              mode: 'insensitive'
            }
          }
        ]
      },
      take: 5,
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        nationality: true,
        total_reports: true,
        scout_elo: true
      },
      orderBy: {
        scout_ranking: 'asc'
      }
    })

    console.log('✅ Direct scouts search completed:', {
      searchTerm: term,
      scoutsFound: scouts.length
    })

    return NextResponse.json({
      success: true,
      searchTerm: term,
      scouts: scouts,
      count: scouts.length
    })
  } catch (error) {
    console.error('❌ Error in direct scouts search:', error)
    return NextResponse.json(
      { 
        error: 'Error searching scouts',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}