import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'

const ScoutPlayersQuerySchema = z.object({
  scoutId: z.string().min(1, 'Scout ID requerido')
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar parámetros
    let params;
    try {
      params = ScoutPlayersQuerySchema.parse({
        scoutId: searchParams.get('scoutId')
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

    console.log('🔍 Fetching players for scoutId:', params.scoutId)

    // Get all players reported by this scout with their report data
    const players = await prisma.jugador.findMany({
      where: {
        reportes: {
          some: {
            scout_id: params.scoutId
          }
        }
      },
      include: {
        reportes: {
          where: {
            scout_id: params.scoutId
          },
          orderBy: {
            report_date: 'desc'
          },
          take: 1
        }
      }
    })

    console.log('✅ Players found:', players.length)
    if (players.length > 0) {
      console.log('📊 Sample player:', {
        id: players[0].id_player,
        name: players[0].player_name,
        reports: players[0].reportes.length
      })
    }

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
    })
  } catch (error) {
    console.error('Error fetching scout players:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}