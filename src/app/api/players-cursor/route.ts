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

    // Stats period
    const periodParam = searchParams.get('period') || '3m'
    const validPeriods = ['3m', '6m', '1y', '2y'] as const
    const period = validPeriods.includes(periodParam as typeof validPeriods[number])
      ? (periodParam as typeof validPeriods[number])
      : '3m'

    // Map period to Prisma relation name
    const periodRelationMap = {
      '3m': 'playerStats3m',
      '6m': 'playerStats6m',
      '1y': 'playerStats1y',
      '2y': 'playerStats2y',
    } as const
    const statsRelation = periodRelationMap[period]

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
    const hasMarketValue = searchParams.get('has_market_value') === 'true'
    const hasAttributes = searchParams.get('has_attributes') === 'true'
    const hasStats = searchParams.get('has_stats') === 'true'
    const hasTextReport = searchParams.get('has_text_report') === 'true'
    const hasVideoReport = searchParams.get('has_video_report') === 'true'
    const isYouthDiscovery = searchParams.get('is_youth_discovery') === 'true'
    const isEmergingTalent = searchParams.get('is_emerging_talent') === 'true'
    const isProfessional = searchParams.get('is_professional') === 'true'
    const isTopLeagues = searchParams.get('is_top_leagues') === 'true'
    const isBigFive = searchParams.get('is_big_five') === 'true'

    // Optional: restrict to a specific set of player ids (used by the favourites tab)
    const playerIdsParam = searchParams.get('player_ids')
    const playerIds = playerIdsParam
      ? playerIdsParam
          .split(',')
          .map(s => parseInt(s, 10))
          .filter(n => !Number.isNaN(n))
      : null

    // Construir where clause. Si el cliente pide por ids explícitos (favoritos),
    // omitimos las restricciones de aprobación/visibilidad: son jugadores que el
    // usuario ya favoriteó explícitamente, así que siempre se deben devolver.
    const where: any = playerIds !== null
      ? {}
      : {
          approval_status: 'approved',
          is_visible: true,
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

    // Boolean filters - ensure fields have actual data (not null AND not empty string)
    if (hasMarketValue) {
      andConditions.push({ player_trfm_value: { not: null, gt: 0 } })
    }

    if (hasAttributes) {
      andConditions.push({ atributos: { isNot: null } })
    }

    if (hasStats) {
      andConditions.push({ [statsRelation]: { isNot: null } })
    }

    if (hasTextReport) {
      andConditions.push({
        AND: [
          { wyscout_notes: { not: null } },
          { wyscout_notes: { not: '' } },
        ]
      })
    }

    if (hasVideoReport) {
      andConditions.push({
        AND: [
          { video: { not: null } },
          { video: { not: '' } },
        ]
      })
    }

    if (isYouthDiscovery) andConditions.push({ is_youth_discovery: true })
    if (isEmergingTalent) andConditions.push({ is_emerging_talent: true })
    if (isProfessional) andConditions.push({ is_professional: true })
    if (isTopLeagues) andConditions.push({ is_top_leagues: true })
    if (isBigFive) andConditions.push({ is_big_five: true })

    // Restrict by a specific list of player ids (favourites tab). If provided
    // but empty (user has no favourites), return nothing.
    if (playerIds !== null) {
      if (playerIds.length === 0) {
        return NextResponse.json({
          players: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
        })
      }
      andConditions.push({ id_player: { in: playerIds } })
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
        nationality_2: true,
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
        owner_club: true,
        owner_club_country: true,
        team_country: true,
        team_level: true,
        on_loan: true,
        competition_country: true,
        competition_tier: true,
        competition_confederation: true,
        competition_level: true,
        agency: true,
        national_tier: true,
        player_elo: true,
        player_ranking: true,
        player_level: true,
        community_potential: true,
        correct_date_of_birth: true,
        correct_foot: true,
        // Evolution fields
        transfer_team_pts: true,
        transfer_competition_pts: true,
        roi: true,
        profit: true,
        // Include stats for the requested period
        [statsRelation]: true,
      }
    })

    const total = await totalPromise

    // Check if there are more results
    const hasMore = players.length > limit
    const returnPlayers = hasMore ? players.slice(0, limit) : players

    // Next cursor is the id of the last player
    const nextCursor = hasMore ? returnPlayers[returnPlayers.length - 1]?.id_player : null

    // Convert Prisma Decimal/BigInt values to plain numbers for JSON serialization
    const toSerializable = (val: unknown): unknown => {
      if (val === null || val === undefined) return val
      if (typeof val === 'bigint') return Number(val)
      if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as { toNumber: () => number }).toNumber === 'function') {
        return (val as { toNumber: () => number }).toNumber()
      }
      return val
    }

    const serializeObj = (obj: Record<string, unknown>): Record<string, unknown> =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toSerializable(v)]))

    // Map to Player type - flatten stats onto the player object
    const mappedPlayers = returnPlayers.map(player => {
      const stats = (player as Record<string, unknown>)[statsRelation] as Record<string, unknown> | null
      const { [statsRelation]: _statsRel, ...playerWithoutStats } = player as Record<string, unknown>

      return {
        id: String(player.id_player),
        ...serializeObj(playerWithoutStats),
        // Flatten stats fields directly onto the player object
        ...(stats ? serializeObj(
          Object.fromEntries(Object.entries(stats).filter(([key]) => key !== 'id_player' && key !== 'id'))
        ) : {}),
      }
    })

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
