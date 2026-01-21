import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/teams/filters - Obtener valores únicos para filtros
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener valores únicos de cada campo en paralelo
    const [
      ownerClubs,
      teamCountries,
      competitions,
      competitionCountries,
      teamLevels
    ] = await Promise.all([
      // Owner clubs únicos (no null)
      prisma.equipo.findMany({
        where: { owner_club: { not: null } },
        select: { owner_club: true },
        distinct: ['owner_club'],
        orderBy: { owner_club: 'asc' }
      }),
      // Países de equipos únicos (no null)
      prisma.equipo.findMany({
        where: { team_country: { not: null } },
        select: { team_country: true },
        distinct: ['team_country'],
        orderBy: { team_country: 'asc' }
      }),
      // Competiciones únicas (no null)
      prisma.equipo.findMany({
        where: { competition: { not: null } },
        select: { competition: true },
        distinct: ['competition'],
        orderBy: { competition: 'asc' }
      }),
      // Países de competición únicos (no null)
      prisma.equipo.findMany({
        where: { competition_country: { not: null } },
        select: { competition_country: true },
        distinct: ['competition_country'],
        orderBy: { competition_country: 'asc' }
      }),
      // Niveles de equipo únicos (no null)
      prisma.equipo.findMany({
        where: { team_level: { not: null } },
        select: { team_level: true },
        distinct: ['team_level'],
        orderBy: { team_level: 'asc' }
      })
    ])

    // Extraer valores y filtrar nulls
    const filters = {
      ownerClubs: ownerClubs
        .map(t => t.owner_club)
        .filter((v): v is string => v !== null && v.trim() !== ''),
      teamCountries: teamCountries
        .map(t => t.team_country)
        .filter((v): v is string => v !== null && v.trim() !== ''),
      competitions: competitions
        .map(t => t.competition)
        .filter((v): v is string => v !== null && v.trim() !== ''),
      competitionCountries: competitionCountries
        .map(t => t.competition_country)
        .filter((v): v is string => v !== null && v.trim() !== ''),
      teamLevels: teamLevels
        .map(t => t.team_level)
        .filter((v): v is string => v !== null && v.trim() !== '')
    }

    return NextResponse.json(filters)
  } catch (error) {
    console.error('Error fetching team filters:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
