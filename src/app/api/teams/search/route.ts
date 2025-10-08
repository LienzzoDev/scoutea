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

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {
            name: {
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
        id: true,
        name: true,
        short_name: true,
        country: {
          select: {
            name: true,
            code: true
          }
        },
        competition: {
          select: {
            name: true,
            short_name: true
          }
        }
      },
      take: limit,
      orderBy: [
        {
          name: 'asc'
        }
      ]
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error searching teams:', error)
    return NextResponse.json(
      { error: 'Error al buscar equipos' },
      { status: 500 }
    )
  }
}
