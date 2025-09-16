import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Obtener opciones únicas para los filtros
    const [
      nationalities,
      positions,
      teams,
      competitions,
      agencies
    ] = await Promise.all([
      // Nacionalidades más comunes
      prisma.jugador.findMany({
        select: { nationality_1: true },
        where: { nationality_1: { not: null } },
        distinct: ['nationality_1'],
        orderBy: { nationality_1: 'asc' },
        take: 100
      }),
      
      // Posiciones más comunes
      prisma.jugador.findMany({
        select: { position_player: true },
        where: { position_player: { not: null } },
        distinct: ['position_player'],
        orderBy: { position_player: 'asc' }
      }),
      
      // Equipos más comunes
      prisma.jugador.findMany({
        select: { team_name: true },
        where: { team_name: { not: null } },
        distinct: ['team_name'],
        orderBy: { team_name: 'asc' },
        take: 200
      }),
      
      // Competiciones más comunes
      prisma.jugador.findMany({
        select: { team_competition: true },
        where: { team_competition: { not: null } },
        distinct: ['team_competition'],
        orderBy: { team_competition: 'asc' },
        take: 100
      }),
      
      // Agencias más comunes
      prisma.jugador.findMany({
        select: { agency: true },
        where: { agency: { not: null } },
        distinct: ['agency'],
        orderBy: { agency: 'asc' },
        take: 100
      })
    ])

    const filterOptions = {
      nationalities: nationalities
        .map(n => n.nationality_1)
        .filter(Boolean)
        .sort(),
      positions: positions
        .map(p => p.position_player)
        .filter(Boolean)
        .sort(),
      teams: teams
        .map(t => t.team_name)
        .filter(Boolean)
        .sort(),
      competitions: competitions
        .map(c => c.team_competition)
        .filter(Boolean)
        .sort(),
      agencies: agencies
        .map(a => a.agency)
        .filter(Boolean)
        .sort()
    }

    return NextResponse.json(filterOptions)
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}