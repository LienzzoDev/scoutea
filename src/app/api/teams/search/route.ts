import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    // Si no hay query, devolver array vacío
    if (!query || query.trim().length < 1) {
      return NextResponse.json({ teams: [] })
    }

    const equipos = await prisma.equipo.findMany({
      where: {
        OR: [
          {
            team_name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          },
          {
            correct_team_name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          },
          {
            short_name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id_team: true,
        team_name: true,
        correct_team_name: true,
        short_name: true,
        team_country: true,
        competition: true,
        correct_competition: true
      },
      take: limit,
      orderBy: [
        {
          team_name: 'asc'
        }
      ]
    })

    // Mapear los resultados al formato esperado por el frontend
    const teams = equipos.map(equipo => ({
      id: equipo.id_team,
      name: equipo.correct_team_name || equipo.team_name,
      short_name: equipo.short_name,
      country: equipo.team_country ? {
        name: equipo.team_country,
        code: ''
      } : null,
      competition: equipo.correct_competition || equipo.competition ? {
        name: equipo.correct_competition || equipo.competition || '',
        short_name: null
      } : null
    }))

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error searching teams:', error)
    return NextResponse.json(
      { error: 'Error al buscar equipos' },
      { status: 500 }
    )
  }
}
