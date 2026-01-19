import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    // Construir query de búsqueda
    let whereClause: Record<string, unknown> = {}

    // Agregar condiciones de búsqueda si existen
    if (search) {
      whereClause = {
        OR: [
          { scout_name: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
          { surname: { contains: search, mode: 'insensitive' as const } },
          { nationality: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    }

    // Obtener scouts
    const scouts = await prisma.scout.findMany({
      where: whereClause,
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        nationality: true,
        url_profile: true,
        total_reports: true,
        scout_level: true,
        scout_ranking: true,
        roi: true,
        net_profits: true,
        total_investment: true,
      },
      orderBy: {
        scout_ranking: 'asc',
      },
      take: limit,
    })

    // Mapear los scouts al formato esperado por el frontend
    const scoutsFormatted = scouts.map((scout) => ({
      id_scout: scout.id_scout,
      name: scout.scout_name || `${scout.name || ''} ${scout.surname || ''}`.trim() || 'Unknown',
      nationality: scout.nationality,
      photo_url: scout.url_profile,
      total_reports: scout.total_reports,
      scout_rating: scout.roi, // Usamos ROI como proxy de rating
      scout_ranking: scout.scout_ranking,
      scout_level: scout.scout_level,
      roi: scout.roi,
    }))

    return NextResponse.json({
      success: true,
      data: scoutsFormatted,
      count: scoutsFormatted.length,
    })
  } catch (error) {
    console.error('Error fetching scouts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener scouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
