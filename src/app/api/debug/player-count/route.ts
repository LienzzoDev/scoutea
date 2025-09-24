import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Checking player count discrepancy...')
    
    // Contar directamente en la base de datos
    const totalPlayersDB = await prisma.jugador.count()
    
    // Obtener algunos jugadores para verificar
    const samplePlayers = await prisma.jugador.findMany({
      take: 5,
      select: {
        id_player: true,
        player_name: true,
        createdAt: true,
        player_rating: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Contar jugadores con rating
    const playersWithRating = await prisma.jugador.count({
      where: {
        player_rating: {
          not: null,
          gt: 0
        }
      }
    })
    
    // Obtener estadísticas por posición
    const playersByPosition = await prisma.jugador.groupBy({
      by: ['position_player'],
      _count: {
        id_player: true
      },
      orderBy: {
        _count: {
          id_player: 'desc'
        }
      },
      take: 5
    })
    
    const result = {
      totalPlayersInDB: totalPlayersDB,
      playersWithRating,
      percentageWithRating: totalPlayersDB > 0 ? Math.round((playersWithRating / totalPlayersDB) * 100) : 0,
      samplePlayers: samplePlayers.map(p => ({
        id: p.id_player,
        name: p.player_name,
        rating: p.player_rating,
        createdAt: p.createdAt
      })),
      topPositions: playersByPosition.map(p => ({
        position: p.position_player || 'Sin posición',
        count: p._count.id_player
      })),
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Player count diagnostic:', result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Error in player count diagnostic:', error)
    return NextResponse.json(
      { 
        error: 'Error checking player count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}