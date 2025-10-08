import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { TeamSearchQuerySchema, TeamCreateSchema } from '@/lib/validation/api-schemas'

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

// GET /api/teams - Buscar equipos con filtros
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar parámetros con Zod
    let params;
    try {
      params = TeamSearchQuerySchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder'),
        'filters[team_name]': searchParams.get('filters[team_name]'),
        'filters[team_country]': searchParams.get('filters[team_country]'),
        'filters[competition]': searchParams.get('filters[competition]'),
        'filters[competition_country]': searchParams.get('filters[competition_country]'),
        'filters[min_rating]': searchParams.get('filters[min_rating]'),
        'filters[max_rating]': searchParams.get('filters[max_rating]'),
        'filters[min_value]': searchParams.get('filters[min_value]'),
        'filters[max_value]': searchParams.get('filters[max_value]')
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Parámetros inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }

    const page = params.page;
    const limit = params.limit;
    const sortBy = params.sortBy || 'team_name';
    const sortOrder = params.sortOrder;

    // Construir filtros desde parámetros validados
    const filters: TeamFilters = {}

    if (params['filters[team_name]']) {
      filters.team_name = params['filters[team_name]']
    }
    if (params['filters[team_country]']) {
      filters.team_country = params['filters[team_country]']
    }
    if (params['filters[competition]']) {
      filters.competition = params['filters[competition]']
    }
    if (params['filters[competition_country]']) {
      filters.competition_country = params['filters[competition_country]']
    }
    if (params['filters[min_rating]']) {
      filters.min_rating = parseFloat(params['filters[min_rating]'])
    }
    if (params['filters[max_rating]']) {
      filters.max_rating = parseFloat(params['filters[max_rating]'])
    }
    if (params['filters[min_value]']) {
      filters.min_value = parseFloat(params['filters[min_value]'])
    }
    if (params['filters[max_value]']) {
      filters.max_value = parseFloat(params['filters[max_value]'])
    }

    const skip = (page - 1) * limit

    // Construir filtros WHERE
    const where: unknown = {}
    
    if (filters.team_name) {
      where.team_name = {
        contains: filters.team_name,
        mode: 'insensitive'
      }
    }
    
    if (filters.team_country) {
      where.team_country = {
        contains: filters.team_country,
        mode: 'insensitive'
      }
    }
    
    if (filters.competition) {
      where.competition = {
        contains: filters.competition,
        mode: 'insensitive'
      }
    }
    
    if (filters.competition_country) {
      where.competition_country = {
        contains: filters.competition_country,
        mode: 'insensitive'
      }
    }
    
    if (filters.min_rating || filters.max_rating) {
      where.team_rating = {}
      if (filters.min_rating) where.team_rating.gte = filters.min_rating
      if (filters.max_rating) where.team_rating.lte = filters.max_rating
    }
    
    if (filters.min_value || filters.max_value) {
      where.team_trfm_value = {}
      if (filters.min_value) where.team_trfm_value.gte = filters.min_value
      if (filters.max_value) where.team_trfm_value.lte = filters.max_value
    }

    // Obtener equipos
    const [teams, total] = await Promise.all([
      prisma.equipo.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.equipo.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('❌ Error searching teams:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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