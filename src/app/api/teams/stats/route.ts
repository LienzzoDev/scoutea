import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET /api/teams/stats - Obtener estadísticas de equipos
export async function GET(__request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'No autorizado' }, { status: 401 })
    }

    const [
      totalTeams,
      teamsByCountry,
      teamsByCompetition,
      avgRating,
      avgValue,
      topRatedTeams
    ] = await Promise.all([
      prisma.equipo.count(),
      prisma.equipo.groupBy({
        by: ['team_country'],
        _count: true,
        orderBy: { _count: { team_country: 'desc' } },
        take: 10,
        where: {
          team_country: {
            not: null
          }
        }
      }),
      prisma.equipo.groupBy({
        by: ['competition'],
        _count: true,
        orderBy: { _count: { competition: 'desc' } },
        take: 10,
        where: {
          competition: {
            not: null
          }
        }
      }),
      prisma.equipo.aggregate({
        _avg: { team_rating: true }
      }),
      prisma.equipo.aggregate({
        _avg: { team_trfm_value: true }
      }),
      prisma.equipo.findMany({
        select: {
          id_team: true,
          team_name: true,
          team_rating: true,
          team_country: true,
          competition: true
        },
        where: {
          team_rating: {
            not: null
          }
        },
        orderBy: {
          team_rating: 'desc'
        },
        take: 10
      })
    ])

    return NextResponse.json({
      totalTeams,
      teamsByCountry: teamsByCountry.map(item => ({
        team_country: item.team_country,
        _count: { team_country: item._count }
      })),
      teamsByCompetition: teamsByCompetition.map(item => ({
        competition: item.competition,
        _count: { competition: item._count }
      })),
      avgRating: avgRating._avg.team_rating,
      avgValue: avgValue._avg.team_trfm_value,
      topRatedTeams
    })

  } catch (_error) {
    console.error('❌ Error getting team stats:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}