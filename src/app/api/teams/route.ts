import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { TeamCreateSchema } from '@/lib/validation/api-schemas'

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
      orderBy: {
        team_name: 'asc'
      },
      select: {
        id_team: true,
        team_name: true,
        team_country: true,
        competition: true
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

    return NextResponse.json({
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
        return NextResponse.json({
          error: 'Datos inválidos',
          details: error.errors.map((err) => ({
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
        correct_team_name: body.correct_team_name?.trim(),
        team_country: validatedData.country,
        url_trfm_advisor: body.url_trfm_advisor?.trim(),
        url_trfm: body.url_trfm?.trim(),
        owner_club: body.owner_club?.trim(),
        owner_club_country: body.owner_club_country?.trim(),
        pre_competition: body.pre_competition?.trim(),
        competition: validatedData.competition,
        correct_competition: body.correct_competition?.trim(),
        competition_country: body.competition_country?.trim(),
        team_trfm_value: body.team_trfm_value ? parseFloat(body.team_trfm_value) : null,
        team_trfm_value_norm: body.team_trfm_value_norm ? parseFloat(body.team_trfm_value_norm) : null,
        team_rating: body.team_rating ? parseFloat(body.team_rating) : null,
        team_rating_norm: body.team_rating_norm ? parseFloat(body.team_rating_norm) : null,
        team_elo: body.team_elo ? parseFloat(body.team_elo) : null,
        team_level: body.team_level?.trim(),
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