import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET /api/teams/simple - Búsqueda rápida de equipos para autocompletar
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (!search || search.length < 2) {
      return NextResponse.json({ teams: [] })
    }

    // Query optimizada: solo campos necesarios, sin count, sin cursor
    const teams = await prisma.equipo.findMany({
      where: {
        team_name: { contains: search, mode: 'insensitive' }
      },
      take: limit,
      orderBy: { team_name: 'asc' },
      select: {
        id_team: true,
        team_name: true,
        competition: true,
        team_country: true
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error searching teams:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
