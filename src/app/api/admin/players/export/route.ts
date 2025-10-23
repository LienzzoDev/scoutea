/**
 * 📤 ENDPOINT DE EXPORTACIÓN DE JUGADORES A CSV
 *
 * ✅ PROPÓSITO: Exportar todos los jugadores a formato CSV
 * ✅ BENEFICIO: Permite análisis de datos fuera de la plataforma
 * ✅ RUTA: GET /api/admin/players/export
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Permitir hasta 60 segundos para exportaciones grandes

/**
 * Convierte un valor a formato CSV seguro (escapa comillas y maneja nulos)
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Si contiene comillas, comas o saltos de línea, escapar con comillas dobles
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * GET /api/admin/players/export - Exportar todos los jugadores a CSV
 *
 * Query params:
 * - search: Término de búsqueda (opcional)
 * - nationality: Filtro por nacionalidad (opcional)
 * - position: Filtro por posición (opcional)
 * - team: Filtro por equipo (opcional)
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

    // 📝 OBTENER PARÁMETROS DE QUERY PARA FILTROS
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('search')
    const nationality = searchParams.get('nationality')
    const position = searchParams.get('position')
    const team = searchParams.get('team')

    // 🔍 CONSTRUIR FILTROS (misma lógica que el endpoint de listado)
    const where: any = {}

    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { player_name: { contains: searchTerm, mode: 'insensitive' } },
        { complete_player_name: { contains: searchTerm, mode: 'insensitive' } },
        { wyscout_id_1: { contains: searchTerm, mode: 'insensitive' } },
        { wyscout_id_2: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    if (nationality) {
      where.nationality_1 = nationality
    }
    if (position) {
      where.position_player = position
    }
    if (team) {
      where.team_name = team
    }

    // 📊 OBTENER TODOS LOS JUGADORES
    console.log('🔄 Starting CSV export for user:', userId)
    const startTime = Date.now()

    const players = await prisma.jugador.findMany({
      where,
      orderBy: [
        { player_rating: 'desc' },
        { id_player: 'asc' }
      ]
    })

    const duration = Date.now() - startTime
    console.log(`✅ CSV export query completed in ${duration}ms. Found ${players.length} players.`)

    // 📋 DEFINIR COLUMNAS PARA EL CSV
    const columns = [
      'id_player',
      'wyscout_id_1',
      'wyscout_id_2',
      'wyscout_name_1',
      'wyscout_name_2',
      'id_fmi',
      'player_name',
      'complete_player_name',
      'date_of_birth',
      'correct_date_of_birth',
      'age',
      'age_value',
      'age_value_percent',
      'age_coeff',
      'height',
      'correct_height',
      'foot',
      'correct_foot',
      'position_player',
      'correct_position_player',
      'position_value',
      'position_value_percent',
      'nationality_1',
      'correct_nationality_1',
      'nationality_value',
      'nationality_value_percent',
      'nationality_2',
      'correct_nationality_2',
      'national_tier',
      'rename_national_tier',
      'correct_national_tier',
      'pre_team',
      'team_name',
      'correct_team_name',
      'team_country',
      'team_elo',
      'team_level',
      'team_level_value',
      'team_level_value_percent',
      'team_competition',
      'competition_country',
      'team_competition_value',
      'team_competition_value_percent',
      'competition_tier',
      'competition_confederation',
      'competition_elo',
      'competition_level',
      'competition_level_value',
      'competition_level_value_percent',
      'owner_club',
      'owner_club_country',
      'owner_club_value',
      'owner_club_value_percent',
      'pre_team_loan_from',
      'team_loan_from',
      'correct_team_loan_from',
      'on_loan',
      'existing_club',
      'agency',
      'correct_agency',
      'contract_end',
      'correct_contract_end',
      'player_rating',
      'player_rating_norm',
      'player_trfm_value',
      'player_trfm_value_norm',
      'player_elo',
      'player_level',
      'player_ranking',
      'stats_evo_3m',
      'total_fmi_pts_norm',
      'community_potential',
      'photo_coverage',
      'video',
      'url_trfm_advisor',
      'url_trfm',
      'url_secondary',
      'url_instagram',
      'createdAt',
      'updatedAt'
    ]

    // 🔨 CONSTRUIR CSV
    const csvRows = []

    // Añadir header
    csvRows.push(columns.join(','))

    // Añadir filas de datos
    for (const player of players) {
      const row = columns.map(column => {
        const value = (player as any)[column]
        return escapeCsvValue(value)
      })
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // 📤 DEVOLVER CSV COMO DESCARGA
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `jugadores_scoutea_${timestamp}.csv`

    console.log(`✅ CSV export completed for user ${userId}. File: ${filename}, Size: ${csvContent.length} bytes`)

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ Error exporting players to CSV:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al exportar jugadores.' },
      { status: 500 }
    )
  }
}