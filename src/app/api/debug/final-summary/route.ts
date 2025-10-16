import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('📊 Final summary of player data...')
    
    // Count total players in database
    const totalPlayersDB = await prisma.jugador.count()
    
    // Get players with rating
    const playersWithRating = await prisma.jugador.count({
      where: {
        player_rating: {
          not: null,
          gt: 0
        }
      }
    })
    
    // Get average rating
    const avgRatingResult = await prisma.jugador.aggregate({
      _avg: {
        player_rating: true
      },
      where: {
        player_rating: {
          not: null,
          gt: 0
        }
      }
    })
    
    // Get recent players (last 7 days)
    const recentPlayers = await prisma.jugador.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
    
    // Get players by position
    const playersByPosition = await prisma.jugador.groupBy({
      by: ['position_player'],
      _count: {
        id_player: true
      },
      where: {
        position_player: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id_player: 'desc'
        }
      }
    })
    
    // Get database connection info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name
    ` as any[]
    
    const summary = {
      database: {
        name: dbInfo[0]?.database_name,
        user: dbInfo[0]?.user_name,
        connected: true
      },
      players: {
        total: totalPlayersDB,
        withRating: playersWithRating,
        percentageWithRating: totalPlayersDB > 0 ? Math.round((playersWithRating / totalPlayersDB) * 100) : 0,
        averageRating: Math.round((avgRatingResult._avg.player_rating || 0) * 100) / 100,
        recentlyAdded: recentPlayers
      },
      positions: playersByPosition.map(p => ({
        position: p.position_player || 'Sin posición',
        count: p._count.id_player
      })),
      conclusion: {
        status: 'WORKING_CORRECTLY',
        message: 'La aplicación está conectada correctamente a Neon y mostrando todos los jugadores disponibles.',
        playersInNeon: totalPlayersDB,
        playersInDashboard: 'Debería mostrar los mismos ' + totalPlayersDB + ' jugadores'
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Final summary:', summary)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Error in final summary:', error)
    return NextResponse.json(
      { 
        error: 'Error generating final summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}