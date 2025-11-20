import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const fieldName = searchParams.get('fieldName')
    const playerId = searchParams.get('playerId')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: {
      field_name?: string
      player_id?: string
    } = {}
    if (fieldName) {
      where.field_name = fieldName
    }
    if (playerId) {
      where.player_id = playerId
    }

    // Obtener correcciones con información del jugador
    const [corrections, totalCount] = await Promise.all([
      prisma.playerCorrection.findMany({
        where,
        include: {
          player: {
            select: {
              id_player: true,
              player_name: true,
              team_name: true,
              position_player: true
            }
          }
        },
        orderBy: {
          correction_date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.playerCorrection.count({ where })
    ])

    return NextResponse.json({
      corrections,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + corrections.length < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching corrections:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las correcciones' },
      { status: 500 }
    )
  }
}
