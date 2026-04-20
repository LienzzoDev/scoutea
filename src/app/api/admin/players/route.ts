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
    const competition = searchParams.get('competition')
    const foot = searchParams.get('foot')
    const onLoan = searchParams.get('onLoan')
    const isVisible = searchParams.get('isVisible')
    const ageMin = searchParams.get('ageMin')
    const ageMax = searchParams.get('ageMax')
    const valueMin = searchParams.get('valueMin')
    const valueMax = searchParams.get('valueMax')
    const ratingMin = searchParams.get('ratingMin')
    const ratingMax = searchParams.get('ratingMax')
    const heightMin = searchParams.get('heightMin')
    const heightMax = searchParams.get('heightMax')

    // Nuevos filtros de datos vacíos/llenos
    const playerColor = searchParams.get('playerColor')
    const playerName = searchParams.get('playerName')
    const teamName = searchParams.get('teamName')
    const wyscoutName1 = searchParams.get('wyscoutName1')
    const wyscoutId1 = searchParams.get('wyscoutId1')
    const wyscoutId2 = searchParams.get('wyscoutId2')
    const idFmi = searchParams.get('idFmi')
    const photoCoverage = searchParams.get('photoCoverage')
    const urlTrfmAdvisor = searchParams.get('urlTrfmAdvisor')
    const urlTrfm = searchParams.get('urlTrfm')
    const urlInstagram = searchParams.get('urlInstagram')

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

    // Filtros específicos de texto
    if (nationality) {
      where.nationality_1 = nationality
    }
    if (position) {
      where.position_player = position
    }
    if (team) {
      where.team_name = team
    }
    if (competition) {
      where.team_competition = competition
    }
    if (foot) {
      where.foot = { equals: foot, mode: 'insensitive' }
    }

    // Filtros booleanos
    if (onLoan && onLoan !== 'all') {
      where.on_loan = onLoan === 'yes'
    }
    if (isVisible && isVisible !== 'all') {
      where.is_visible = isVisible === 'yes'
    }

    // Filtros de rango numérico - Edad
    if (ageMin || ageMax) {
      where.age = {}
      if (ageMin) {
        where.age.gte = parseInt(ageMin, 10)
      }
      if (ageMax) {
        where.age.lte = parseInt(ageMax, 10)
      }
    }

    // Filtros de rango numérico - Valor de mercado
    if (valueMin || valueMax) {
      where.player_trfm_value = {}
      if (valueMin) {
        where.player_trfm_value.gte = parseFloat(valueMin)
      }
      if (valueMax) {
        where.player_trfm_value.lte = parseFloat(valueMax)
      }
    }

    // Filtros de rango numérico - Rating
    if (ratingMin || ratingMax) {
      where.player_rating = {}
      if (ratingMin) {
        where.player_rating.gte = parseFloat(ratingMin)
      }
      if (ratingMax) {
        where.player_rating.lte = parseFloat(ratingMax)
      }
    }

    // Filtros de rango numérico - Altura
    if (heightMin || heightMax) {
      where.height = {}
      if (heightMin) {
        where.height.gte = parseInt(heightMin, 10)
      }
      if (heightMax) {
        where.height.lte = parseInt(heightMax, 10)
      }
    }

    // 🎨 FILTROS DE DATOS VACÍOS/LLENOS (N/A)
    // Helper para crear condición de vacío/lleno
    const createEmptyFilter = (field: string, value: string | null) => {
      if (!value || value === 'all') return null
      if (value === 'has') {
        return { [field]: { not: null } }
      }
      if (value === 'empty') {
        return { [field]: null }
      }
      return null
    }

    // Aplicar filtros de vacío/lleno
    const emptyFilters = [
      createEmptyFilter('player_color', playerColor),
      createEmptyFilter('player_name', playerName),
      createEmptyFilter('team_name', teamName),
      createEmptyFilter('wyscout_name_1', wyscoutName1),
      createEmptyFilter('wyscout_id_1', wyscoutId1),
      createEmptyFilter('wyscout_id_2', wyscoutId2),
      createEmptyFilter('id_fmi', idFmi),
      createEmptyFilter('photo_coverage', photoCoverage),
      createEmptyFilter('url_trfm_advisor', urlTrfmAdvisor),
      createEmptyFilter('url_trfm', urlTrfm),
      createEmptyFilter('url_instagram', urlInstagram)
    ].filter(Boolean)

    // Añadir filtros de vacío/lleno al where
    if (emptyFilters.length > 0) {
      if (!where.AND) {
        where.AND = []
      }
      where.AND.push(...emptyFilters)
    }

    // 🎯 DETERMINAR SI SE NECESITAN TODOS LOS CAMPOS O SOLO LOS BÁSICOS
    const fullFields = searchParams.get('full') === 'true'

    // 📋 SELECT OPTIMIZADO PARA LISTA (solo campos esenciales para mostrar)
    const listSelect = {
      id_player: true,
      old_id: true,
      player_name: true,
      wyscout_id_1: true,
      wyscout_id_2: true,
      wyscout_name_1: true,
      wyscout_name_2: true,
      wyscout_notes: true,
      fmi_notes: true,
      id_fmi: true,
      complete_player_name: true,

      // Información personal
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

      // Posición
      position_player: true,
      correct_position_player: true,
      position_value: true,
      position_value_percent: true,

      // Nacionalidad
      nationality_1: true,
      correct_nationality_1: true,
      nationality_value: true,
      nationality_value_percent: true,
      nationality_2: true,
      correct_nationality_2: true,
      national_tier: true,
      rename_national_tier: true,
      correct_national_tier: true,

      // Equipo
      pre_team: true,
      team_name: true,
      correct_team_name: true,
      team_country: true,
      team_elo: true,
      team_level: true,
      team_level_value: true,
      team_level_value_percent: true,

      // Competición
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

      // Club propietario y préstamo
      owner_club: true,
      owner_club_country: true,
      owner_club_value: true,
      owner_club_value_percent: true,
      pre_team_loan_from: true,
      team_loan_from: true,
      correct_team_loan_from: true,
      on_loan: true,
      existing_club: true,

      // Agencia y contrato
      agency: true,
      correct_agency: true,
      contract_end: true,
      correct_contract_end: true,

      // Valor de mercado y estadísticas
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

      // URLs y referencias
      photo_coverage: true,
      video: true,
      video_report_1: true,
      video_report_2: true,
      video_report_3: true,
      video_report_4: true,
      video_report_5: true,
      url_trfm_advisor: true,
      url_trfm: true,
      url_trfm_broken: true,
      url_secondary: true,
      url_instagram: true,

      // Scouting report
      text_report: true,
      development: true,
      team_status: true,
      initial_team_name: true,
      initial_team_elo: true,
      initial_team_level: true,
      transfer_team_pts: true,
      initial_competition: true,
      initial_competition_elo: true,
      initial_competition_level: true,
      transfer_competition_pts: true,
      initial_player_trfm_value: true,
      roi: true,
      profit: true,

      // Notas administrativas
      admin_notes: true,
      player_color: true,

      // Visibilidad para members
      is_visible: true,

      // Timestamps
      createdAt: true,
      updatedAt: true
    }

    // 📊 EJECUTAR QUERY CON CURSOR-BASED PAGINATION
    const queryConfig: any = {
      where,
      take: limit + 1, // Tomar uno extra para saber si hay más
      ...(cursor ? {
        cursor: {
          id_player: parseInt(cursor, 10) // Convertir cursor a número
        },
        skip: 1 // Saltar el cursor actual
      } : {}),
      orderBy: {
        id_player: 'asc'
      }
    }

    // Agregar select solo si no se piden todos los campos
    if (!fullFields) {
      queryConfig.select = listSelect
    }

    const players = await prisma.jugador.findMany(queryConfig)

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

    // Log más detallado del error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Devolver error más descriptivo en desarrollo
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment && error instanceof Error
      ? error.message
      : 'Error interno del servidor al obtener jugadores.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
