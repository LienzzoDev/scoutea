import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || ''
    
    console.log('🧪 Testing direct players search for term:', term)
    
    if (!term.trim()) {
      return NextResponse.json({
        success: true,
        players: [],
        message: 'No search term provided'
      })
    }
    
    // Búsqueda directa en la base de datos
    const players = await prisma.jugador.findMany({
      where: {
        player_name: {
          contains: term,
          mode: 'insensitive'
        }
      },
      take: 5,
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        team_name: true,
        nationality_1: true,
        player_rating: true,
        photo_coverage: true
      },
      orderBy: {
        player_rating: 'desc'
      }
    })

    console.log('✅ Direct players search completed:', {
      searchTerm: term,
      playersFound: players.length
    })

    return NextResponse.json({
      success: true,
      searchTerm: term,
      players: players,
      count: players.length
    })
  } catch (error) {
    console.error('❌ Error in direct players search:', error)
    return NextResponse.json(
      { 
        error: 'Error searching players',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}