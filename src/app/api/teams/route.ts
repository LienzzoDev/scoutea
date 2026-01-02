import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { TeamCreateSchema } from '@/lib/validation/api-schemas'

// Forzar renderizado dinámico para evitar caché de Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface TeamFilters {
  team_name?: string
  team_country?: string
  competition?: string
  competition_country?: string
  min_rating?: number
  max_rating?: number
  min_value?: number
  max_value?: number
}

export interface TeamSearchOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: TeamFilters
}

// GET /api/teams - Buscar equipos con filtros y cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parámetros de cursor-based pagination
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const competition = searchParams.get('competition') || ''

    console.log('📊 Teams API - Cursor pagination:', { cursor, limit, search, country, competition })

    // Construir filtros WHERE
    const where: any = {}

    // Búsqueda general
    if (search) {
      where.team_name = { contains: search, mode: 'insensitive' }
    }

    // Filtros específicos
    if (country) {
      where.team_country = { contains: country, mode: 'insensitive' }
    }

    if (competition) {
      where.competition = { contains: competition, mode: 'insensitive' }
    }

    console.log('🔍 Teams API - WHERE filters:', JSON.stringify(where, null, 2))

    // Query con cursor
    const teams = await prisma.equipo.findMany({
      where,
      take: limit + 1, // Tomar uno extra para saber si hay más
      ...(cursor ? {
        skip: 1, // Saltar el cursor
        cursor: {
          id_team: cursor
        }
      } : {}),
      orderBy: [
        { team_name: 'asc' },
        { id_team: 'asc' } // Secondary sort for deterministic pagination
      ],
      select: {
        id_team: true,
        displayId: true,
        team_name: true,
        correct_team_name: true,
        team_country: true,
        url_trfm_advisor: true,
        url_trfm: true,
        owner_club: true,
        owner_club_country: true,
        pre_competition: true,
        competition: true,
        correct_competition: true,
        competition_country: true,
        team_trfm_value: true,
        team_trfm_value_norm: true,
        team_rating: true,
        team_rating_norm: true,
        team_elo: true,
        team_level: true,
        short_name: true,
        founded_year: true,
        stadium: true,
        website_url: true,
        logo_url: true,
        admin_notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Determinar si hay más resultados
    const hasMore = teams.length > limit
    const teamsToReturn = hasMore ? teams.slice(0, limit) : teams
    const nextCursor = hasMore ? teams[limit - 1]?.id_team : null

    // Obtener total solo en la primera carga (sin cursor)
    let total: number | undefined
    if (!cursor) {
      total = await prisma.equipo.count({ where })
    }

    console.log('✅ Teams API - Results:', {
      teamsCount: teamsToReturn.length,
      hasMore,
      nextCursor,
      total
    })

    // Crear respuesta con headers de no-cache para evitar datos stale
    const response = NextResponse.json({
      teams: teamsToReturn,
      hasMore,
      nextCursor,
      total,
      // Mantener compatibilidad con código anterior
      pagination: {
        limit,
        total,
        hasNext: hasMore
      }
    })

    // Deshabilitar caché para siempre obtener datos frescos
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('❌ Error searching teams:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/teams - Crear un nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos con Zod
    let validatedData;
    try {
      validatedData = TeamCreateSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error);
        return NextResponse.json({
          error: 'Datos inválidos',
          details: (error.errors || []).map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }

    // Crear el equipo
    const team = await prisma.equipo.create({
      data: {
        team_name: validatedData.team_name,
        correct_team_name: body.correct_team_name?.trim() || null,
        team_country: validatedData.team_country || validatedData.country || null,
        url_trfm_advisor: body.url_trfm_advisor?.trim() || null,
        url_trfm: body.url_trfm?.trim() || null,
        owner_club: body.owner_club?.trim() || null,
        owner_club_country: body.owner_club_country?.trim() || null,
        pre_competition: body.pre_competition?.trim() || null,
        competition: validatedData.competition || null,
        correct_competition: body.correct_competition?.trim() || null,
        competition_country: body.competition_country?.trim() || null,
        team_trfm_value: body.team_trfm_value ? parseFloat(body.team_trfm_value) : null,
        team_trfm_value_norm: body.team_trfm_value_norm ? parseFloat(body.team_trfm_value_norm) : null,
        team_rating: body.team_rating ? parseFloat(body.team_rating) : null,
        team_rating_norm: body.team_rating_norm ? parseFloat(body.team_rating_norm) : null,
        team_elo: body.team_elo ? parseFloat(body.team_elo) : null,
        team_level: body.team_level?.trim() || null,
      }
    })

    console.log('✅ Equipo creado exitosamente:', team.team_name)
    return NextResponse.json(team, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating team:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error específico: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}