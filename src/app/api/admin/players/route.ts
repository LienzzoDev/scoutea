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

    // 🎯 DETERMINAR SI SE NECESITAN TODOS LOS CAMPOS O SOLO LOS BÁSICOS
    const fullFields = searchParams.get('full') === 'true'

    // 📋 SELECT OPTIMIZADO PARA LISTA (solo 16 campos esenciales para mostrar)
    const listSelect = {
      id_player: true,
      player_name: true,
      wyscout_id_1: true,
      wyscout_id_2: true,
      age: true,
      position_player: true,
      nationality_1: true,
      team_name: true,
      team_competition: true,
      player_rating: true,
      player_trfm_value: true,
      photo_coverage: true,
      contract_end: true,
      agency: true,
      createdAt: true,
      updatedAt: true
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
      // Usar select optimizado por defecto (16 campos vs 80 campos)
      // Para obtener todos los campos, usar ?full=true
      select: fullFields ? undefined : listSelect
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
