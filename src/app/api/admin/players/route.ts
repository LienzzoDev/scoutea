/**
 * 📥 ENDPOINT DE JUGADORES CON PAGINACIÓN (INFINITE SCROLL)
 *
 * ✅ PROPÓSITO: Obtener jugadores con paginación cursor-based
 * ✅ BENEFICIO: Soporta carga infinita de miles de jugadores
 * ✅ RUTA: GET /api/admin/players
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/players - Obtener jugadores con paginación
 *
 * Query params:
 * - cursor: ID del último jugador cargado (para paginación)
 * - limit: Número de jugadores por página (default: 50, max: 100)
 * - search: Término de búsqueda
 * - nationality: Filtro por nacionalidad
 * - position: Filtro por posición
 * - team: Filtro por equipo
 */
export async function GET(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden acceder.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER PARÁMETROS DE QUERY
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const searchTerm = searchParams.get('search')
    const nationality = searchParams.get('nationality')
    const position = searchParams.get('position')
    const team = searchParams.get('team')

    // Validar y parsear limit
    const limit = Math.min(
      parseInt(limitParam || '50', 10),
      100 // Máximo 100 por página
    )

    // 🔍 CONSTRUIR FILTROS
    const where: any = {}

    // Filtro de búsqueda (busca en nombre y wyscout IDs)
    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { player_name: { contains: searchTerm, mode: 'insensitive' } },
        { complete_player_name: { contains: searchTerm, mode: 'insensitive' } },
        { wyscout_id_1: { contains: searchTerm, mode: 'insensitive' } },
        { wyscout_id_2: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Filtros específicos
    if (nationality) {
      where.nationality_1 = nationality
    }
    if (position) {
      where.position_player = position
    }
    if (team) {
      where.team_name = team
    }

    // 📊 EJECUTAR QUERY CON CURSOR-BASED PAGINATION
    const players = await prisma.jugador.findMany({
      where,
      take: limit + 1, // Tomar uno extra para saber si hay más
      ...(cursor ? {
        cursor: {
          id_player: cursor
        },
        skip: 1 // Saltar el cursor actual
      } : {}),
      orderBy: [
        { player_rating: 'desc' },
        { id_player: 'asc' }
      ],
      select: {
        id_player: true,
        player_name: true,
        complete_player_name: true,
        wyscout_id_1: true,
        wyscout_id_2: true,
        wyscout_name_1: true,
        wyscout_name_2: true,
        id_fmi: true,
        date_of_birth: true,
        correct_date_of_birth: true,
        age: true,
        age_value: true,
        age_value_percent: true,
        age_coeff: true,
        height: true,
        correct_height: true,
        foot: true,
        correct_foot: true,
        position_player: true,
        correct_position_player: true,
        position_value: true,
        position_value_percent: true,
        nationality_1: true,
        correct_nationality_1: true,
        nationality_value: true,
        nationality_value_percent: true,
        nationality_2: true,
        correct_nationality_2: true,
        national_tier: true,
        rename_national_tier: true,
        correct_national_tier: true,
        pre_team: true,
        team_name: true,
        correct_team_name: true,
        team_country: true,
        team_elo: true,
        team_level: true,
        team_level_value: true,
        team_level_value_percent: true,
        team_competition: true,
        competition_country: true,
        team_competition_value: true,
        team_competition_value_percent: true,
        competition_tier: true,
        competition_confederation: true,
        competition_elo: true,
        competition_level: true,
        competition_level_value: true,
        competition_level_value_percent: true,
        owner_club: true,
        owner_club_country: true,
        owner_club_value: true,
        owner_club_value_percent: true,
        pre_team_loan_from: true,
        team_loan_from: true,
        correct_team_loan_from: true,
        on_loan: true,
        existing_club: true,
        agency: true,
        correct_agency: true,
        contract_end: true,
        correct_contract_end: true,
        player_rating: true,
        player_rating_norm: true,
        player_trfm_value: true,
        player_trfm_value_norm: true,
        player_elo: true,
        player_level: true,
        player_ranking: true,
        stats_evo_3m: true,
        total_fmi_pts_norm: true,
        community_potential: true,
        photo_coverage: true,
        video: true,
        url_trfm_advisor: true,
        url_trfm: true,
        url_secondary: true,
        url_instagram: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 🔄 DETERMINAR SI HAY MÁS PÁGINAS
    const hasMore = players.length > limit
    const returnPlayers = hasMore ? players.slice(0, limit) : players
    const nextCursor = hasMore ? returnPlayers[returnPlayers.length - 1]?.id_player : null

    // 📊 OBTENER CONTEO TOTAL (solo en la primera página para performance)
    let totalCount = null
    if (!cursor) {
      totalCount = await prisma.jugador.count({ where })
    }

    // 📊 LOG DE AUDITORÍA
    console.log('✅ Players fetch completed:', {
      returned: returnPlayers.length,
      hasMore,
      cursor,
      totalCount,
      userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      players: returnPlayers,
      nextCursor,
      hasMore,
      totalCount
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching players:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener jugadores.' },
      { status: 500 }
    )
  }
}
