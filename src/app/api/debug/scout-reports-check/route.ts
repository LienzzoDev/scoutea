import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: {
        id_scout: true,
        scout_name: true,
        clerkId: true,
      },
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Obtener todos los reportes del scout
    const allReports = await prisma.reporte.findMany({
      where: {
        scout_id: scout.id_scout,
      },
      select: {
        id_report: true,
        scout_id: true,
        id_player: true,
        report_date: true,
        report_type: true,
      },
      include: {
        player: {
          select: {
            player_name: true,
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Obtener reportes con id_player no nulo
    const reportsWithPlayer = await prisma.reporte.findMany({
      where: {
        scout_id: scout.id_scout,
        id_player: { not: null },
      },
      select: {
        id_report: true,
        scout_id: true,
        id_player: true,
        report_date: true,
        report_type: true,
      },
      include: {
        player: {
          select: {
            player_name: true,
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Obtener jugadores únicos
    const uniquePlayerIds = new Set(
      reportsWithPlayer
        .map(r => r.id_player)
        .filter(Boolean)
    )

    // Verificar si los jugadores existen en la tabla jugadores
    const playersInDb = await prisma.jugador.findMany({
      where: {
        id_player: {
          in: Array.from(uniquePlayerIds) as string[],
        },
      },
      select: {
        id_player: true,
        player_name: true,
      },
    })

    return NextResponse.json({
      success: true,
      debug: {
        scout: {
          id: scout.id_scout,
          name: scout.scout_name,
          clerkId: scout.clerkId,
        },
        totalReports: allReports.length,
        reportsWithPlayer: reportsWithPlayer.length,
        uniquePlayerIds: Array.from(uniquePlayerIds),
        playersFoundInDb: playersInDb.length,
        allReports: allReports.map(r => ({
          id: r.id_report,
          playerId: r.id_player,
          playerName: r.player?.player_name || 'Unknown',
          date: r.report_date,
        })),
        reportsWithPlayerData: reportsWithPlayer.map(r => ({
          id: r.id_report,
          playerId: r.id_player,
          playerName: r.player?.player_name || 'Unknown',
          date: r.report_date,
        })),
        playersInDb: playersInDb,
      },
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
