import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * GET /api/players-cursor
 * Endpoint con paginación basada en cursor para infinite scroll
 * Mucho más eficiente que offset-based para datasets grandes
 */
export async function GET(request: NextRequest) {
  try {
    // 🔐 Verificar autenticación
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parámetros de paginación
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Filtros de búsqueda
    const search = searchParams.get('search')
    const nationality = searchParams.get('nationality')
    const position = searchParams.get('position')
    const team = searchParams.get('team')
    const competition = searchParams.get('competition')
    const minAge = searchParams.get('min_age') ? parseInt(searchParams.get('min_age')!) : undefined
    const maxAge = searchParams.get('max_age') ? parseInt(searchParams.get('max_age')!) : undefined
    const minRating = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined
    const maxRating = searchParams.get('max_rating') ? parseFloat(searchParams.get('max_rating')!) : undefined
    const minValue = searchParams.get('min_value') ? parseFloat(searchParams.get('min_value')!) : undefined
    const maxValue = searchParams.get('max_value') ? parseFloat(searchParams.get('max_value')!) : undefined

    // Construir where clause
    const where: any = {
      // IMPORTANTE: Solo mostrar jugadores aprobados y visibles para miembros
      approval_status: 'approved',
      is_visible: true
    }

    // Construir array de condiciones AND para combinar con búsqueda OR
    const andConditions: any[] = []

    if (search) {
      // La búsqueda usa OR entre campos, pero debe combinarse con AND de las otras condiciones
      andConditions.push({
        OR: [
          { player_name: { contains: search, mode: 'insensitive' } },
          { nationality_1: { contains: search, mode: 'insensitive' } },
          { team_name: { contains: search, mode: 'insensitive' } },
          { position_player: { contains: search, mode: 'insensitive' } },
        ]
      })
    }

    if (nationality) {
      andConditions.push({ nationality_1: { contains: nationality, mode: 'insensitive' } })
    }

    if (position) {
      andConditions.push({ position_player: { contains: position, mode: 'insensitive' } })
    }

    if (team) {
      andConditions.push({ team_name: { contains: team, mode: 'insensitive' } })
    }

    if (competition) {
      andConditions.push({ team_competition: { contains: competition, mode: 'insensitive' } })
    }

    if (minAge !== undefined || maxAge !== undefined) {
      const ageCondition: any = {}
      if (minAge !== undefined) ageCondition.gte = minAge
      if (maxAge !== undefined) ageCondition.lte = maxAge
      andConditions.push({ age: ageCondition })
    }

    if (minRating !== undefined || maxRating !== undefined) {
      const ratingCondition: any = {}
      if (minRating !== undefined) ratingCondition.gte = minRating
      if (maxRating !== undefined) ratingCondition.lte = maxRating
      andConditions.push({ player_rating: ratingCondition })
    }

    if (minValue !== undefined || maxValue !== undefined) {
      const valueCondition: any = {}
      if (minValue !== undefined) valueCondition.gte = minValue
      if (maxValue !== undefined) valueCondition.lte = maxValue
      andConditions.push({ player_trfm_value: valueCondition })
    }

    // Combinar condiciones con AND si hay alguna
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // Obtener total solo en la primera carga (sin cursor)
    const totalPromise = !cursor ? prisma.jugador.count({ where }) : Promise.resolve(0)

    // Parsear cursor a número si existe
    const cursorId = cursor ? parseInt(cursor, 10) : null

    // Fetch jugadores con cursor
    const players = await prisma.jugador.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursorId ? { cursor: { id_player: cursorId }, skip: 1 } : {}),
      orderBy: [
        { player_rating: 'desc' },
        { id_player: 'asc' } // Segundo criterio para desempatar
      ],
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        team_name: true,
        nationality_1: true,
        age: true,
        player_rating: true,
        photo_coverage: true,
        player_trfm_value: true,
        team_competition: true,
        height: true,
        foot: true,
        contract_end: true,
        date_of_birth: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    const total = await totalPromise

    // Check if there are more results
    const hasMore = players.length > limit
    const returnPlayers = hasMore ? players.slice(0, limit) : players

    // Next cursor is the id of the last player
    const nextCursor = hasMore ? returnPlayers[returnPlayers.length - 1]?.id_player : null

    // Map to Player type (mapeo directo ya que solo seleccionamos campos específicos)
    const mappedPlayers = returnPlayers.map(player => ({
      id: String(player.id_player),
      id_player: player.id_player,
      player_name: player.player_name,
      position_player: player.position_player,
      team_name: player.team_name,
      nationality_1: player.nationality_1,
      age: player.age,
      player_rating: player.player_rating,
      photo_coverage: player.photo_coverage,
      player_trfm_value: player.player_trfm_value,
      team_competition: player.team_competition,
      height: player.height,
      foot: player.foot,
      contract_end: player.contract_end,
      date_of_birth: player.date_of_birth,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    }))

    return NextResponse.json({
      players: mappedPlayers,
      nextCursor,
      hasMore,
      total: cursor ? undefined : total // Solo incluir total en primera carga
    })

  } catch (error) {
    console.error('❌ Players cursor API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
