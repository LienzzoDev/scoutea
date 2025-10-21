import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Obtener el scout ID del usuario actual (si es scout)
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    // Construir query de búsqueda
    // Incluir: jugadores aprobados + jugadores creados por el scout (independientemente del estado)
    let whereClause: any = {}

    if (scout) {
      // Para scouts: mostrar jugadores aprobados + sus propios jugadores
      whereClause.OR = [
        { approval_status: 'approved' },
        { created_by_scout_id: scout.id_scout }
      ]
    } else {
      // Para no-scouts: solo jugadores aprobados
      whereClause.approval_status = 'approved'
    }

    // Agregar condiciones de búsqueda si existen
    if (search) {
      const searchCondition = {
        OR: [
          { player_name: { contains: search, mode: 'insensitive' as const } },
          { team_name: { contains: search, mode: 'insensitive' as const } },
          { nationality_1: { contains: search, mode: 'insensitive' as const } },
          { position_player: { contains: search, mode: 'insensitive' as const } }
        ]
      }

      // Combinar con la condición de aprobación
      whereClause = {
        AND: [
          whereClause,
          searchCondition
        ]
      }
    }

    // Obtener jugadores
    const players = await prisma.jugador.findMany({
      where: whereClause,
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        nationality_1: true,
        team_name: true,
        date_of_birth: true,
        created_by_scout_id: true,
        approval_status: true
      },
      orderBy: {
        player_name: 'asc'
      },
      take: limit
    })

    // Calcular edad para cada jugador e incluir información de creación
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
        age,
        created_by_scout_id: player.created_by_scout_id,
        approval_status: player.approval_status,
        is_own_player: scout ? player.created_by_scout_id === scout.id_scout : false
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
  }
}
