import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    // Construir query de búsqueda
    const whereClause = search
      ? {
          OR: [
            { player_name: { contains: search, mode: 'insensitive' as const } },
            { team_name: { contains: search, mode: 'insensitive' as const } },
            { nationality_1: { contains: search, mode: 'insensitive' as const } },
            { position_player: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Obtener jugadores
    const players = await prisma.jugador.findMany({
      where: whereClause,
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        nationality_1: true,
        team_name: true,
        date_of_birth: true
      },
      orderBy: {
        player_name: 'asc'
      },
      take: limit
    })

    // Calcular edad para cada jugador
    const playersWithAge = players.map(player => {
      let age = null
      if (player.date_of_birth) {
        const today = new Date()
        const birthDate = new Date(player.date_of_birth)
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }

      return {
        id_player: player.id_player,
        player_name: player.player_name,
        position_player: player.position_player,
        nationality_1: player.nationality_1,
        team_name: player.team_name,
        age
      }
    })

    return NextResponse.json({
      success: true,
      data: playersWithAge,
      count: playersWithAge.length
    })

  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener jugadores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
