import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { playerId } = params

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID requerido' }, { status: 400 })
    }

    // Get player with all their reports
    const player = await prisma.player.findUnique({
      where: { id_player: playerId },
      include: {
        reporte: {
          include: {
            scout: {
              select: {
                id_scout: true,
                scout_name: true
              }
            }
          },
          orderBy: {
            report_date: 'desc'
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        player: {
          id_player: player.id_player,
          player_name: player.player_name,
          position_player: player.position_player,
          nationality_1: player.nationality_1,
          team_name: player.team_name,
          date_of_birth: player.date_of_birth
        },
        reports: player.reporte.map(r => ({
          id_report: r.id_report,
          report_date: r.report_date,
          report_type: r.report_type,
          roi: r.roi,
          profit: r.profit,
          potential: r.potential,
          scout: r.scout,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching player details:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}